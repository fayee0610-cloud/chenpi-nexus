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
import { clusterAndPickLosers } from "@/lib/intelDedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // 2-3. 同事件聚类 + 每簇保留最优 1 条（共享算法库，与抓取管道同一套判定）
  const { loserIds: toDelete, duplicateClusters } = clusterAndPickLosers(rows);

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
