// ============================================================
// /api/admin/dedupe-intelligence — 历史情报一次性清洗工具
//
// 作用：聚类 malaysia_intelligence 表中的同事件重复报道
// （多家媒体转载同一事件但 source_url 不同导致重复入库），
// 每组仅保留价值最高的 1 条（importance_score 最高 → 最新 created_at），
// 其余物理删除。
//
// 鉴权：admin_token cookie（与 middleware 一致）或 CRON_SECRET
// 触发：POST /api/admin/dedupe-intelligence
//        或 GET /api/admin/dedupe-intelligence?secret=<CRON_SECRET>
//        可选参数 ?dry=1 仅预览不删除
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------- 相似度工具（与 fetch-intelligence 管道同一套算法） ----------
function bigramsOf(text: string): Set<string> {
  const clean = (text || "").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
  const set = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) {
    set.add(clean.slice(i, i + 2));
  }
  return set;
}

function jaccardSim(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function isSameEvent(
  a: { titleZh: string; titleEn: string; summary: string },
  b: { titleZh: string; titleEn: string; summary: string }
): boolean {
  if (jaccardSim(bigramsOf(a.titleZh), bigramsOf(b.titleZh)) > 0.5) return true;
  if (jaccardSim(bigramsOf(a.titleEn), bigramsOf(b.titleEn)) > 0.6) return true;
  if (jaccardSim(bigramsOf(a.summary.slice(0, 120)), bigramsOf(b.summary.slice(0, 120))) > 0.55) return true;
  return false;
}

// ---------- 鉴权：admin_token cookie 或 CRON_SECRET ----------
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const q = req.nextUrl.searchParams.get("secret") || "";
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (q === cronSecret || token === cronSecret) return true;
  }
  const adminToken = req.cookies.get("admin_token")?.value;
  if (adminToken) {
    try {
      const payload = JSON.parse(Buffer.from(adminToken, "base64").toString("utf-8"));
      if (payload.role === "admin" && payload.exp > Date.now()) return true;
    } catch {}
  }
  return false;
}

type Row = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  summary_zh: string | null;
  importance_score: number | null;
  is_featured: boolean | null;
  created_at: string;
};

async function handleDedupe(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: "Supabase Service Role 未配置" }, { status: 500 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";

  // 1. 拉取全表（字段精简，上限 500 条）
  const { data, error } = await supabaseAdmin
    .from("malaysia_intelligence")
    .select("id, title_zh, title_en, summary_zh, importance_score, is_featured, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ success: false, error: `读取失败：${error.message}` }, { status: 500 });
  }

  const rows = (data || []) as Row[];
  if (rows.length === 0) {
    return NextResponse.json({ success: true, message: "表内无数据", stats: { total: 0, clusters: 0, deleted: 0 } });
  }

  // 2. 同事件聚类（贪心：按时间倒序遍历，命中已有簇则并入，否则开新簇）
  const clusters: Row[][] = [];
  for (const row of rows) {
    const sig = {
      titleZh: row.title_zh || "",
      titleEn: row.title_en || "",
      summary: row.summary_zh || "",
    };
    const hit = clusters.find((cluster) =>
      isSameEvent(sig, {
        titleZh: cluster[0].title_zh || "",
        titleEn: cluster[0].title_en || "",
        summary: cluster[0].summary_zh || "",
      })
    );
    if (hit) hit.push(row);
    else clusters.push([row]);
  }

  // 3. 每簇保留最优 1 条：is_featured 优先 → importance_score 最高 → created_at 最新
  const toDelete: string[] = [];
  const keptSample: string[] = [];
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      keptSample.push(cluster[0].title_zh || cluster[0].title_en || "");
      continue;
    }
    const sorted = [...cluster].sort((a, b) => {
      if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
      if ((b.importance_score || 3) !== (a.importance_score || 3)) {
        return (b.importance_score || 3) - (a.importance_score || 3);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const keeper = sorted[0];
    keptSample.push(keeper.title_zh || keeper.title_en || "");
    for (const loser of sorted.slice(1)) {
      toDelete.push(loser.id);
    }
  }

  const duplicateClusters = clusters.filter((c) => c.length > 1).length;

  // 4. 删除（dry 模式仅预览）
  let deleted = 0;
  if (!dryRun && toDelete.length > 0) {
    // 分批删除，避免单条 SQL 过大
    const BATCH = 100;
    for (let i = 0; i < toDelete.length; i += BATCH) {
      const batch = toDelete.slice(i, i + BATCH);
      const { error: delErr } = await supabaseAdmin
        .from("malaysia_intelligence")
        .delete()
        .in("id", batch);
      if (delErr) {
        return NextResponse.json({
          success: false,
          error: `删除失败：${delErr.message}`,
          stats: { total: rows.length, clusters: duplicateClusters, deleted },
        }, { status: 500 });
      }
      deleted += batch.length;
    }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    message: dryRun
      ? `预览：共 ${rows.length} 条，发现 ${duplicateClusters} 组同事件重复，可删除 ${toDelete.length} 条`
      : `清洗完成：共 ${rows.length} 条，合并 ${duplicateClusters} 组同事件，删除 ${deleted} 条重复`,
    stats: {
      total: rows.length,
      duplicateClusters,
      deleted: dryRun ? 0 : deleted,
      willDelete: dryRun ? toDelete.length : 0,
      kept: rows.length - toDelete.length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    return await handleDedupe(req);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).slice(0, 300) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleDedupe(req);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).slice(0, 300) }, { status: 500 });
  }
}
