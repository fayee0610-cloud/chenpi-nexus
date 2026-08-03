// ============================================================
// supabaseAdmin — 服务端专用 Supabase Admin 客户端
//
// 使用 SUPABASE_SERVICE_ROLE_KEY 初始化，绕过 RLS 策略，
// 适用于 API Routes / Cron Jobs / 服务端写入场景。
//
// 若 SUPABASE_SERVICE_ROLE_KEY 未配置，则返回 null，
// 调用方需降级到 anon key 或提示用户配置。
//
// 【获取 Service Role Key】：
//   Supabase Dashboard → Settings → API → service_role secret
//   添加到 .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminClient: SupabaseClient<any, "public", any> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    adminClient = createClient(supabaseUrl, supabaseServiceKey);
  } catch (err) {
    console.warn("[supabaseAdmin] Admin 客户端初始化失败:", err);
  }
}

export const supabaseAdmin = adminClient;

/** 检查 Service Role Key 是否已配置 */
export const hasServiceRoleKey = !!supabaseServiceKey;
