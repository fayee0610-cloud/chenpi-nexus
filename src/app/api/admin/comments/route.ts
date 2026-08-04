// ============================================================
// /api/admin/comments — 后台评论管理（全量读取）
//
// GET：跨文章读取全部评论（含所有状态），按 created_at DESC 排序，
//      尽可能 JOIN insights 表带出文章标题（用于后台展示）。
//
// 返回结构：
//   { success: true, comments: Array<{
//     id, article_id, article_title?, nickname, content,
//     status, has_links, created_at
//   }> }
//
// 使用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS，确保可读取待审核/隐藏的评论。
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY", comments: [] },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 优先尝试带 JOIN 的查询（article_comments !fk article_id → insights.id）
    // 失败时降级为单表查询
    let data: any[] | null = null;
    let queryError: any = null;
    try {
      const res = await supabase
        .from("article_comments")
        .select(
          "id,article_id,nickname,content,status,has_links,created_at,insights!article_comments_article_id_fkey(title)"
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
        "[api/admin/comments] JOIN 查询失败，降级单表查询:",
        queryError?.message || queryError
      );
      const fallback = await supabase
        .from("article_comments")
        .select("id,article_id,nickname,content,status,has_links,created_at")
        .order("created_at", { ascending: false });

      if (fallback.error || !fallback.data) {
        console.warn(
          "[api/admin/comments] 单表查询失败:",
          fallback.error?.message || fallback.error
        );
        return NextResponse.json({
          success: true,
          comments: [],
        });
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
      } catch (e) {
        // ignore：标题映射为可选字段
      }
    }

    const comments = (data || []).map((r: any) => {
      // 优先使用 JOIN 带出的标题，否则用映射
      const joinedTitle =
        r?.insights && Array.isArray(r.insights)
          ? r.insights[0]?.title
          : r?.insights?.title;
      return {
        id: r.id,
        article_id: r.article_id,
        article_title: joinedTitle || titleMap[String(r.article_id)] || null,
        nickname: r.nickname || "",
        content: r.content || "",
        status: r.status || "pending_review",
        has_links: !!r.has_links,
        created_at: r.created_at || null,
      };
    });

    return NextResponse.json({ success: true, comments });
  } catch (err: any) {
    console.error("[api/admin/comments] 异常:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "服务器内部错误", comments: [] },
      { status: 500 }
    );
  }
}
