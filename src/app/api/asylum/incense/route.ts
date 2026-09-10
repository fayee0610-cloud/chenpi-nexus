// ============================================================
// 庇护所上香：原子递增 incense_count
// - 走服务端：使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
// - 支持两类存储：
//   1) 全网总能量（asylum_stats.incense_count，row_id=main）—— 兼容旧逻辑
//   2) 单柱持久化（sanctuary_incense 表，incense_id 区分香柱）—— 新增
// - 并发安全：优先调用 PostgreSQL 原子函数；降级为读-改-写
// - 防刷：每 IP 60s 最多 10 次
// ============================================================

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ASYLUM_STATS_ROW_ID = "main";

// -------- IP 限流（内存）--------
const IP_RATE_WINDOW_MS = 60_000;
const IP_RATE_MAX_PER_WINDOW = 10;
const ipBucket = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { ok: boolean; retryMs?: number } {
  const now = Date.now();
  const bucket = ipBucket.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBucket.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= IP_RATE_MAX_PER_WINDOW) {
    return { ok: false, retryMs: Math.max(1, bucket.resetAt - now) };
  }
  bucket.count += 1;
  return { ok: true };
}

function extractIp(req: Request): string {
  const cf = req.headers.get("x-forwarded-for");
  if (cf) return cf.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anon";
}

async function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "缺少 Supabase 环境变量：请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceKey);
}

/**
 * 全网总能量原子递增（asylum_stats.incense_count）
 */
async function atomicIncenseIncrement(): Promise<number> {
  const supabase = await getServerClient();

  // Step 1: 优先调用 RPC 原子函数
  try {
    const { data, error } = await (supabase as any).rpc("asylum_incense_increment", {
      row_id: ASYLUM_STATS_ROW_ID,
    });
    if (error) {
      console.error("[api/asylum/incense] RPC asylum_incense_increment 错误:", error.code, error.message);
    }
    if (!error && data != null) return Number(data);
  } catch (rpcErr: any) {
    console.error("[api/asylum/incense] RPC asylum_incense_increment 异常:", rpcErr?.message || rpcErr);
  }

  // Step 2: 降级：UPSERT（确保行存在， incense_count 默认 0）
  try {
    await (supabase as any)
      .from("asylum_stats")
      .upsert([{ id: ASYLUM_STATS_ROW_ID, incense_count: 0 }], {
        onConflict: "id",
        ignoreDuplicates: true,
      });
  } catch (upsertErr: any) {
    const msg: string = upsertErr?.message || String(upsertErr);
    const missingTable =
      /does not exist/i.test(msg) ||
      /relation/i.test(msg) ||
      upsertErr?.code === "42P01";
    if (missingTable) {
      throw new Error(
        "TABLE_MISSING: asylum_stats 表不存在。请在 Supabase SQL Editor 中运行 src/lib/supabase.ts 顶部注释里包含 asylum_stats 建表 + 原子函数 SQL 脚本。"
      );
    }
    throw upsertErr;
  }

  // Step 3: 再次尝试 RPC
  try {
    const { data: rpc2, error: rpcErr2 } = await (supabase as any).rpc(
      "asylum_incense_increment",
      { row_id: ASYLUM_STATS_ROW_ID }
    );
    if (!rpcErr2 && rpc2 != null) return Number(rpc2);
  } catch {
    // 走降级
  }

  // Step 4: 读 → 写 → 读 降级逻辑
  const { data: currentRow, error: selErr } = await (supabase as any)
    .from("asylum_stats")
    .select("incense_count")
    .eq("id", ASYLUM_STATS_ROW_ID)
    .single();
  if (selErr || !currentRow) {
    throw new Error("asylum_stats 读取失败：" + (selErr?.message || "empty"));
  }
  const next = Number(currentRow.incense_count || 0) + 1;
  const { error: updErr } = await (supabase as any)
    .from("asylum_stats")
    .update({ incense_count: next })
    .eq("id", ASYLUM_STATS_ROW_ID);
  if (updErr) throw new Error("asylum_stats 写入失败：" + updErr.message);
  return next;
}

/**
 * 单柱持久化递增（sanctuary_incense 表）
 * 优先调用 RPC increment_incense(incense_id)，降级为 UPSERT + 读-改-写
 */
async function incensePillarIncrement(incenseId: string): Promise<number> {
  const supabase = await getServerClient();

  // Step 1: 优先 RPC（返回递增后的最新 count）
  try {
    const { data, error } = await (supabase as any).rpc("increment_incense", {
      incense_id: incenseId,
    });
    if (error) {
      console.error("[api/asylum/incense] RPC increment_incense 错误:", error.code, error.message);
    }
    if (!error && data != null) {
      return Number(data);
    }
  } catch (rpcErr: any) {
    console.error("[api/asylum/incense] RPC increment_incense 异常:", rpcErr?.message || rpcErr);
  }

  // Step 2: 降级 UPSERT + 读-改-写 到 incense_stats 表（新表）
  try {
    const { data: statsRow, error: statsErr } = await (supabase as any)
      .from("incense_stats")
      .select("count")
      .eq("id", incenseId)
      .single();
    if (!statsErr && statsRow) {
      const next = Number(statsRow.count || 0) + 1;
      const { error: updErr } = await (supabase as any)
        .from("incense_stats")
        .update({ count: next })
        .eq("id", incenseId);
      if (!updErr) return next;
    }
    // 行不存在 → INSERT
    if (statsErr && statsErr.code === "PGRST116") {
      const { error: insErr } = await (supabase as any)
        .from("incense_stats")
        .insert([{ id: incenseId, name: incenseId, count: 1 }]);
      if (!insErr) return 1;
    }
  } catch (statsErr: any) {
    console.error("[api/asylum/incense] incense_stats 降级失败:", statsErr?.message || statsErr);
  }

  // Step 3: 最终降级到 sanctuary_incense 表（旧表）
  try {
    await (supabase as any)
      .from("sanctuary_incense")
      .upsert([{ incense_id: incenseId, count: 0 }], {
        onConflict: "incense_id",
        ignoreDuplicates: true,
      });
    const { data: row, error: selErr } = await (supabase as any)
      .from("sanctuary_incense")
      .select("count")
      .eq("incense_id", incenseId)
      .single();
    if (selErr || !row) return 0;
    const next = Number(row.count || 0) + 1;
    const { error: updErr } = await (supabase as any)
      .from("sanctuary_incense")
      .update({ count: next })
      .eq("incense_id", incenseId);
    if (updErr) return 0;
    return next;
  } catch (upsertErr: any) {
    console.error("[api/asylum/incense] sanctuary_incense 降级失败:", upsertErr?.message || upsertErr);
    return 0;
  }
}

export async function POST(req: Request) {
  try {
    const ip = extractIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "上香太快啦，喝口茶稍后再来（每分最多 10 次）",
          retryMs: rl.retryMs,
        },
        { status: 429 }
      );
    }

    // 解析可选 incense_id（单柱持久化）
    let incenseId: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.incense_id === "string") {
        incenseId = body.incense_id;
      }
    } catch {
      // 无 body 也允许（兼容旧调用）
    }

    // 总能量递增（主流程）
    const count = await atomicIncenseIncrement();

    // 单柱递增（失败不影响主流程）
    let pillarCount: number | null = null;
    if (incenseId) {
      try {
        pillarCount = await incensePillarIncrement(incenseId);
      } catch (err: any) {
        console.warn("[api/asylum/incense] 单柱递增失败（不阻断）:", err?.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      incenseCount: count,
      pillarCount,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[api/asylum/incense] 原子递增失败:", msg);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        hint:
          "1) 确认 .env.local 含 SUPABASE_SERVICE_ROLE_KEY；2) 在 Supabase SQL Editor 运行 src/lib/supabase.ts 顶部 asylum_stats 建表 + 函数 SQL。",
      },
      { status: 500 }
    );
  }
}

/**
 * GET：批量读取所有香柱的累计 count（供前端初始化）
 */
export async function GET() {
  try {
    const supabase = await getServerClient();
    // 优先：读 incense_stats 表（新表，id + count）
    const { data: statsData, error: statsErr } = await (supabase as any)
      .from("incense_stats")
      .select("id, count");
    if (!statsErr && statsData && statsData.length > 0) {
      const pillars = statsData.map((r: any) => ({
        incenseId: r.id,
        count: Number(r.count || 0),
      }));
      return NextResponse.json({ success: true, pillars });
    }
    if (statsErr && !statsErr.message?.includes("does not exist") && !statsErr.message?.includes("relation")) {
      console.error("[api/asylum/incense GET] incense_stats 错误:", statsErr.code, statsErr.message);
    }
    // 降级：读 sanctuary_incense 表（旧表）
    const { data, error } = await (supabase as any)
      .from("sanctuary_incense")
      .select("incense_id, count");
    if (error) {
      console.error("[api/asylum/incense GET] sanctuary_incense 错误:", error.code, error.message);
      return NextResponse.json({ success: true, pillars: [] });
    }
    const pillars = (data || []).map((r: any) => ({
      incenseId: r.incense_id,
      count: Number(r.count || 0),
    }));
    return NextResponse.json({ success: true, pillars });
  } catch (err: any) {
    console.error("[api/asylum/incense GET] 异常:", err?.message || err);
    return NextResponse.json({ success: true, pillars: [], error: err?.message });
  }
}

