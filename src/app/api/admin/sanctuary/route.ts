// ============================================================
// /api/admin/sanctuary — 后台庇护所互动管理（服务端代理）
//
// GET    /api/admin/sanctuary              → 读取全量 sanctuary_posts（含未发布）
// DELETE /api/admin/sanctuary?id=xxx       → Admin 强制删除（需 Admin Session）
//
// 设计动机：避免后台前端直连 Supabase 触发 CORS / RLS / Chrome 插件 fetch 劫持
// 鉴权：双通道（Cookie admin_token + Authorization Bearer），与 /api/admin/ai-format 一致
// 数据：服务端使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_ROLE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

function getServiceClient(): SupabaseClient | null {
  if (!SERVICE_ROLE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SERVICE_ROLE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------- 管理员鉴权（双通道：Cookie + Authorization Header） ----------
function isAdmin(req: NextRequest): boolean {
  let token = req.cookies.get("admin_token")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return payload?.role === "admin" && typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ============================================================
// GET：读取全量庇护所帖子（Admin 用途，含未发布）
// ============================================================
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { success: false, error: "未授权 (仅管理员可用)" },
      { status: 401 }
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: true, posts: [] });
  }

  try {
    const { data, error } = await supabase
      .from("sanctuary_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      posts: (data || []).map((r: any) => ({
        id: r.id,
        content: r.content || "",
        tag: r.tag || "",
        author: r.author || "赛博访客",
        avatar: r.avatar || null,
        likes: r.likes || 0,
        isPublished: r.is_published ?? true,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    console.warn("[api/admin/sanctuary GET] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "读取失败", posts: [] },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE：Admin 强制删除（无需 delete_token）
// ============================================================
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { success: false, error: "未授权 (仅管理员可用)" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少 id 参数" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "服务未配置" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("sanctuary_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    console.error("[api/admin/sanctuary DELETE] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "删除失败" },
      { status: 500 }
    );
  }
}
