// ============================================================
// /api/admin/article-comments — 后台文章评论管理（服务端代理）
//
// GET    /api/admin/article-comments              → 读取全量 article_comments（含所有状态）
// DELETE /api/admin/article-comments?id=xxx       → Admin 强制删除评论
//
// 设计动机：避免后台前端直连 Supabase 触发 CORS / RLS / Chrome 插件 fetch 劫持
// 鉴权：双通道（Cookie admin_token + Authorization Bearer），与 /api/admin/ai-format 一致
// 数据：服务端使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS，可读取待审核/隐藏评论
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================
// GET：跨文章读取全部评论（含所有状态），按 created_at DESC 排序
// 尽可能 JOIN insights 表带出文章标题（用于后台展示）
// ============================================================
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { success: false, error: "未授权 (仅管理员可用)", comments: [] },
      { status: 401 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY", comments: [] },
      { status: 500 }
    );
  }

  try {
    // 优先尝试带 JOIN 的查询（article_comments !fk article_id → insights.id）
    // 失败时降级为单表查询
    let data: any[] | null = null;
    let queryError: any = null;
    try {
      const res = await supabase
        .from("article_comments")
        .select(
          "id,article_id,nickname,email,content,status,has_links,reply_to_nickname,created_at,insights!article_comments_article_id_fkey(title)"
        )
        .order("created_at", { ascending: false });
      data = res.data;
      queryError = res.error;
    } catch (e) {
      queryError = e;
    }

    // JOIN 查询失败（如外键名不匹配 / schema 未刷新）→ 降级单表查询
    if (queryError || !data) {
      console.warn(
        "[api/admin/article-comments] JOIN 查询失败，降级单表查询:",
        queryError?.message || queryError
      );
      const fallback = await supabase
        .from("article_comments")
        .select("id,article_id,nickname,email,content,status,has_links,reply_to_nickname,created_at")
        .order("created_at", { ascending: false });

      if (fallback.error || !fallback.data) {
        console.warn(
          "[api/admin/article-comments] 单表查询失败:",
          fallback.error?.message || fallback.error
        );
        return NextResponse.json({ success: true, comments: [] });
      }
      data = fallback.data;
    }

    // 单独拉取文章标题映射（避免 JOIN 缺失时拿不到 title）
    const articleIds = Array.from(
      new Set(
        (data || [])
          .map((r: any) => r?.article_id)
          .filter((v: any) => v !== null && v !== undefined && v !== "")
      )
    ) as string[];

    let titleMap: Record<string, string> = {};
    if (articleIds.length > 0) {
      try {
        const insightRes = await supabase
          .from("insights")
          .select("id,title")
          .in("id", articleIds);
        if (insightRes.data) {
          for (const row of insightRes.data as any[]) {
            if (row?.id && row?.title) titleMap[String(row.id)] = row.title;
          }
        }
      } catch {
        // ignore：标题映射为可选字段
      }
    }

    const comments = (data || []).map((r: any) => {
      const joinedTitle =
        r?.insights && Array.isArray(r.insights)
          ? r.insights[0]?.title
          : r?.insights?.title;
      return {
        id: r.id,
        article_id: r.article_id,
        article_title: joinedTitle || titleMap[String(r.article_id)] || null,
        nickname: r.nickname || "",
        email: r.email || null,
        content: r.content || "",
        status: r.status || "pending_review",
        has_links: !!r.has_links,
        reply_to_nickname: r.reply_to_nickname || null,
        created_at: r.created_at || null,
      };
    });

    return NextResponse.json({ success: true, comments });
  } catch (err: any) {
    console.error("[api/admin/article-comments] 异常:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "服务器内部错误", comments: [] },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE：Admin 强制删除评论
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

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "服务未配置" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    console.error("[api/admin/article-comments DELETE] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "删除失败" },
      { status: 500 }
    );
  }
}
