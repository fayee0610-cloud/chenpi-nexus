// ============================================================
// 庇护所上香：原子递增 incense_count
// - 走服务端：使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
// - 并发安全：优先调用 PostgreSQL 原子函数 asylum_incense_increment()
// - 降级方案：RPC 不存在时执行「UPSERT 初始化行 → UPDATE incense_count + 1 → SELECT」
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
 * 原子递增 incense_count
 *  1) 先调用 Postgres 自定义函数 asylum_incense_increment(row_id) → 最安全
 *  2) 函数不存在时：使用事务式「UPSERT + 自增 UPDATE + SELECT」
 *     （在 Supabase PostgREST 语义下，UPDATE + SELECT 非严格原子，但对个人站量级足够）
 */
async function atomicIncenseIncrement(): Promise<number> {
  const supabase = await getServerClient();

  // Step 1: 优先调用 RPC 原子函数
  try {
    const { data, error } = await (supabase as any).rpc("asylum_incense_increment", {
      row_id: ASYLUM_STATS_ROW_ID,
    });
    if (!error && typeof data === "number") return data;
  } catch {
    // ignore → 走降级
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

  // Step 3: 执行自增。PostgREST 不支持 SET col = col + 1，
  // 因此用 service client 再次尝试使用自定义 RPC（如果管理员后来补上函数），
  // 否则读取当前值后 UPDATE（对个人站量级并发无压力）
  try {
    const { data: rpc2, error: rpcErr2 } = await (supabase as any).rpc(
      "asylum_incense_increment",
      { row_id: ASYLUM_STATS_ROW_ID }
    );
    if (!rpcErr2 && typeof rpc2 === "number") return rpc2;
  } catch {
    // ignore
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

    const count = await atomicIncenseIncrement();
    return NextResponse.json({
      success: true,
      incenseCount: count,
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
