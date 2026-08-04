// ============================================================
// 庇护所帖子 API
//
// GET    /api/sanctuary/posts                → 获取全部帖子（Admin 用途）
// DELETE /api/sanctuary/posts?id=xxx         → 用户自主删除（需 deleteToken 校验）或 Admin 删除
//
// - 走服务端：使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
// - 用户模式：校验 delete_token 匹配后才删除
// - Admin 模式：直接删除
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// ============================================================
// GET：获取全部庇护所帖子（Admin 用途）
// ============================================================
export async function GET() {
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
    console.warn("[sanctuary/posts GET] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "读取失败" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE：用户自主删除（需 delete_token 校验）或 Admin 删除
// ============================================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少 id 参数" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const deleteToken = body.deleteToken || body.delete_token;
    const adminMode = body.admin === true;

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "服务未配置" },
        { status: 500 }
      );
    }

    // Admin 模式：直接删除
    if (adminMode) {
      const { error } = await supabase
        .from("sanctuary_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "已删除" });
    }

    // 用户模式：需要 delete_token 校验
    if (!deleteToken) {
      return NextResponse.json(
        { success: false, error: "缺少删除凭证" },
        { status: 403 }
      );
    }

    // 先查 token 是否匹配
    const { data: row, error: queryErr } = await supabase
      .from("sanctuary_posts")
      .select("id, delete_token")
      .eq("id", id)
      .single();

    if (queryErr || !row) {
      return NextResponse.json(
        { success: false, error: "帖子不存在或已被删除" },
        { status: 404 }
      );
    }

    if (row.delete_token !== deleteToken) {
      return NextResponse.json(
        { success: false, error: "删除凭证不匹配，无权删除" },
        { status: 403 }
      );
    }

    const { error: delErr } = await supabase
      .from("sanctuary_posts")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    console.error("[sanctuary/posts DELETE] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "删除失败" },
      { status: 500 }
    );
  }
}
