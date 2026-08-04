// ============================================================
// /api/admin/toggle-status — 后台切换发布状态
//
// 客户端 Supabase（anon key）通常缺少 UPDATE RLS 权限，
// 直接调用会触发 "切换失败"。本路由使用 SUPABASE_SERVICE_ROLE_KEY
// 绕过 RLS，统一处理 insights / projects(portfolio) / resources 表的 is_published 切换。
//
// POST 请求体：{ table: "insights" | "projects" | "resources", id: string, isPublished: boolean }
// 返回：{ success: true } | { success: false, error: string }
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TABLES = new Set(["insights", "projects", "resources"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table, id, isPublished } = body || {};

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { success: false, error: "非法的 table 参数，仅允许 insights | projects" },
        { status: 400 }
      );
    }
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少 id 参数" },
        { status: 400 }
      );
    }
    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isPublished 必须为布尔值" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase
      .from(table)
      .update({ is_published: isPublished })
      .eq("id", id);

    if (error) {
      console.warn(`[api/admin/toggle-status] ${table} 更新失败:`, error.message);
      // 表不存在时给出友好提示
      const msg = String(error.message || "");
      if (msg.includes("Could not find the table") || msg.includes("schema cache") || msg.includes("does not exist")) {
        return NextResponse.json(
          { success: false, error: `${table} 表尚未创建，请先在 Supabase SQL Editor 执行建表 SQL` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { success: false, error: msg || "更新失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      table,
      id,
      isPublished,
    });
  } catch (err: any) {
    console.error("[api/admin/toggle-status] 异常:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
