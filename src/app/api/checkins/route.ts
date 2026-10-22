// ============================================================
// /api/checkins — 每日打卡记录（马来语 / 商务英文共用）
//
// GET  ?module=english|malay
//      → { dates, today, available, progressDay, streak, checkedInToday }
// POST { module, deviceId? }
//      → 打卡当日（幂等，unique 索引去重），返回更新后的同结构数据
//
// 身份识别：
//   - Authorization: Bearer <supabase_jwt> → 登录用户（user_id，跨设备）
//   - 否则 x-device-id header / body.deviceId → 匿名设备（device_id）
//   - 查询取 OR：登录前的匿名打卡记录登录后依然可见
//
// available=false 表示数据库不可用（表未创建等），前端据此显示降级提示
// 进度派生逻辑见 src/lib/checkinProgress.ts（前后端单一事实源）
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUTC8DateKey, deriveProgress } from "@/lib/checkinProgress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODULES = new Set(["english", "malay"]);

/** 从请求中解析打卡身份（登录用户优先，其次匿名设备） */
async function resolveIdentity(
  req: NextRequest,
  bodyDeviceId?: string
): Promise<{ userId: string | null; deviceId: string | null }> {
  // 1. 尝试登录身份
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey && token) {
      try {
        const client = createClient(url, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data } = await client.auth.getUser(token);
        if (data?.user?.id) return { userId: data.user.id, deviceId: bodyDeviceId || null };
      } catch {
        /* token 无效 → 落入匿名 */
      }
    }
  }
  // 2. 匿名设备
  const deviceId =
    bodyDeviceId || req.headers.get("x-device-id") || req.nextUrl.searchParams.get("deviceId") || null;
  return { userId: null, deviceId: deviceId ? String(deviceId).slice(0, 64) : null };
}

/** 查询该身份在某模块下的全部打卡日期；null = 数据库不可用 */
async function fetchDates(
  module: string,
  userId: string | null,
  deviceId: string | null
): Promise<string[] | null> {
  if (!supabaseAdmin || (!userId && !deviceId)) return [];
  let query = supabaseAdmin
    .from("daily_checkins")
    .select("date_key")
    .eq("module", module);
  query = userId
    ? deviceId
      ? query.or(`user_id.eq.${userId},and(device_id.eq.${deviceId},user_id.is.null)`)
      : query.eq("user_id", userId)
    : query.eq("device_id", deviceId!);
  const { data, error } = await query;
  if (error) {
    // 表未创建（站长尚未执行 migration）等数据库异常
    console.warn("[checkins] 查询失败（表可能尚未创建）:", error.message);
    return null;
  }
  return (data || []).map((r: { date_key: string }) => r.date_key);
}

function buildResponse(dates: string[] | null, today: string) {
  const safeDates = dates || [];
  return NextResponse.json({
    dates: safeDates,
    today,
    available: dates !== null,
    ...deriveProgress(safeDates, today),
  });
}

export async function GET(req: NextRequest) {
  const module = req.nextUrl.searchParams.get("module") || "";
  if (!MODULES.has(module)) {
    return NextResponse.json({ error: "invalid module" }, { status: 400 });
  }
  const { userId, deviceId } = await resolveIdentity(req);
  const dates = await fetchDates(module, userId, deviceId);
  return buildResponse(dates, getUTC8DateKey());
}

export async function POST(req: NextRequest) {
  let body: { module?: string; deviceId?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* 无 body 亦可，deviceId 可从 header 取 */
  }
  const module = body.module || "";
  if (!MODULES.has(module)) {
    return NextResponse.json({ error: "invalid module" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const { userId, deviceId } = await resolveIdentity(req, body.deviceId);
  if (!userId && !deviceId) {
    return NextResponse.json({ error: "missing identity" }, { status: 400 });
  }

  const today = getUTC8DateKey();

  // 幂等写入：unique 索引 (user_id|device_id, module, date_key) 冲突时 DO NOTHING
  const { error } = await supabaseAdmin.from("daily_checkins").upsert(
    {
      user_id: userId,
      device_id: userId ? null : deviceId,
      module,
      date_key: today,
    },
    {
      onConflict: userId ? "user_id,module,date_key" : "device_id,module,date_key",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    console.error("[checkins] 打卡写入失败:", error.message);
    return NextResponse.json({ error: "checkin failed", available: false }, { status: 500 });
  }

  const dates = await fetchDates(module, userId, deviceId);
  return buildResponse(dates, today);
}
