// ============================================================
// GET /api/english-lessons — 跨境商务英文特训课程数据
//
// 返回 english_daily_lessons 表中全部已发布课程，按 day_number 升序
// 前台 EnglishDailyCard 组件消费
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("english_daily_lessons")
    .select("*")
    .eq("is_published", true)
    .order("day_number", { ascending: true });

  if (error) {
    console.error("[english-lessons] 查询失败:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }

  return NextResponse.json({ lessons: data || [] });
}
