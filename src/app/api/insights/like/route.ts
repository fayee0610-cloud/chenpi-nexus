// ============================================================
// 文章【激发灵感】：原子递增 insights.likes
// - 走服务端：使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
// - 优先调用 RPC increment_insight_likes(insight_id)，降级为读-改-写
// - 防刷：每 IP 60s 最多 20 次
// ============================================================

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * GET：读取单篇文章的最新 likes（供弹窗打开时拉取真实数值）
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const insightId = searchParams.get("insight_id");
    if (!insightId) {
      return NextResponse.json({ success: false, error: "缺少 insight_id 参数" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ success: false, error: "Supabase 未配置", likes: null });
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, serviceKey);

    const { data, error } = await (supabase as any)
      .from("insights")
      .select("likes")
      .eq("id", insightId)
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, likes: null, error: error?.message });
    }
    return NextResponse.json({ success: true, likes: Number(data.likes || 0) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, likes: null }, { status: 500 });
  }
}

const IP_RATE_WINDOW_MS = 60_000;
const IP_RATE_MAX_PER_WINDOW = 20;
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

export async function POST(req: Request) {
  try {
    const ip = extractIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "操作太快啦，稍后再试", retryMs: rl.retryMs },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const insightId = body?.insight_id;
    if (!insightId || typeof insightId !== "string") {
      return NextResponse.json({ success: false, error: "缺少 insight_id 参数" }, { status: 400 });
    }

    const supabase = await getServerClient();

    // Step 1: 优先 RPC
    try {
      const { data, error } = await (supabase as any).rpc("increment_insight_likes", {
        insight_id: insightId,
      });
      if (!error && typeof data === "number") {
        return NextResponse.json({ success: true, likes: data });
      }
    } catch {
      // ignore → 降级
    }

    // Step 2: 读-改-写降级
    const { data: row, error: selErr } = await (supabase as any)
      .from("insights")
      .select("likes")
      .eq("id", insightId)
      .single();
    if (selErr || !row) {
      return NextResponse.json({ success: false, likes: null, error: "文章不存在或表未创建" });
    }
    const next = Number(row.likes || 0) + 1;
    const { error: updErr } = await (supabase as any)
      .from("insights")
      .update({ likes: next })
      .eq("id", insightId);
    if (updErr) {
      return NextResponse.json({ success: false, likes: null, error: updErr.message });
    }
    return NextResponse.json({ success: true, likes: next });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[api/insights/like] 激发灵感失败:", msg);
    return NextResponse.json({ success: false, error: msg, likes: null }, { status: 500 });
  }
}
