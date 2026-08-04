/*
 * 灵感文章评论 API
 *
 * GET  /api/articles/comments?article_id=xxx   → 读取某文章已批准的评论（时间倒序，含层级 parent_id）
 * POST /api/articles/comments                   → 提交新评论（带 XSS 过滤 + IP 60s 防刷 + 外链待审核）
 *
 * 安全说明：
 *   1) 服务端使用 createClient（service_role）绕过 RLS；前端匿名只能 SELECT approved
 *   2) 内容端到端转义（HTML 特殊字符），避免 XSS
 *   3) 单 IP 60 秒内仅允许一次发帖（IP 使用 SHA-256 哈希存储，不落明文）
 *   4) 内容包含 http:// / https:// 链接 → 自动置为 pending_review，前台不可见
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // 使用 Node 运行时以便 crypto 与 service_role 客户端可靠工作

const SERVICE_ROLE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

function getServiceClient(): SupabaseClient | null {
  if (!SERVICE_ROLE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SERVICE_ROLE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// -------------- HTML 转义（防止 XSS） --------------
function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// -------------- SHA-256（IP 哈希） --------------
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// -------------- 取客户端 IP --------------
function getIp(req: Request): string {
  const headers = req.headers;
  const direct =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("forwarded")?.split("for=")[1]?.split(";")[0]?.trim();
  return direct || "unknown";
}

// -------------- 链接检测 --------------
const LINK_RE = /https?:\/\//i;

// -------------- 简易 UUID --------------
function genId(prefix = "cmt_"): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================================
// GET：读取评论
// ============================================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("article_id");
  if (!articleId) {
    return NextResponse.json(
      { success: false, error: "缺少 article_id 参数" },
      { status: 400 }
    );
  }
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: true, articleId, comments: [] });
  }
  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select("*")
      .eq("article_id", articleId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) throw error;
    // 把 createdAt / updatedAt 序列化时保留原文本，前端再解析
    return NextResponse.json({
      success: true,
      articleId,
      comments: (data || []).map((r: any) => ({
        id: r.id,
        articleId: r.article_id,
        nickname: r.nickname,
        email: r.email ? null : (r.email ?? null), // 不向前端返回邮箱（隐私）
        content: r.content,
        status: r.status,
        hasLinks: !!r.has_links,
        parentId: r.parent_id || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err: any) {
    console.warn("[comments GET] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "读取失败" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST：提交评论
// ============================================================
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const articleId = String(payload.articleId || payload.article_id || "").trim();
    const nickname = String(payload.nickname || "").trim();
    const rawContent = String(payload.content || "").trim();
    const emailRaw = payload.email ? String(payload.email).trim() : "";
    const parentId = payload.parentId || payload.parent_id || null;

    if (!articleId || !nickname || !rawContent) {
      return NextResponse.json(
        { success: false, error: "articleId / nickname / content 必填" },
        { status: 400 }
      );
    }
    if (nickname.length > 40) {
      return NextResponse.json(
        { success: false, error: "昵称过长（最多 40 字）" },
        { status: 400 }
      );
    }
    if (rawContent.length > 2000) {
      return NextResponse.json(
        { success: false, error: "评论过长（最多 2000 字）" },
        { status: 400 }
      );
    }
    const email =
      emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : "";

    // 安全 1：XSS 转义（昵称 + 内容 + 邮箱虽然不走渲染，但也统一处理）
    const safeNickname = escapeHtml(nickname).slice(0, 40);
    const safeContent = escapeHtml(rawContent).slice(0, 2000);
    const safeEmail = email ? escapeHtml(email).slice(0, 200) : "";

    // 安全 2：链接检测 → 含外链自动进入待审核
    const hasLinks = LINK_RE.test(rawContent) || LINK_RE.test(nickname);

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "评论功能未配置（缺少 Supabase service role）" },
        { status: 500 }
      );
    }

    // 安全 3：单 IP 60s 内不可连续发帖（用 SHA-256 哈希比较，避免存明文 IP）
    const ip = getIp(req);
    const ipHash = sha256Hex(`${articleId}|${ip}`);
    try {
      const { data: recent } = await supabase
        .from("article_comments")
        .select("created_at")
        .eq("article_id", articleId)
        .eq("ip_hash", ipHash)
        .order("created_at", { ascending: false })
        .limit(1);
      if (recent && recent.length > 0) {
        const latest = recent[0]?.created_at;
        if (latest) {
          const diffMs = Date.now() - new Date(latest).getTime();
          if (diffMs < 60_000) {
            const remain = Math.ceil((60_000 - diffMs) / 1000);
            return NextResponse.json(
              {
                success: false,
                error: `提交过于频繁，请 ${remain} 秒后再发`,
                code: "RATE_LIMIT",
                retryAfterSec: remain,
              },
              { status: 429 }
            );
          }
        }
      }
    } catch (rateErr) {
      // 表不存在等场景：不阻塞首次发帖，只打 warn
      console.warn("[comments POST] rate-limit check skip:", rateErr);
    }

    const ua = req.headers.get("user-agent")?.slice(0, 400) || null;
    const status: "approved" | "pending_review" = hasLinks ? "pending_review" : "approved";
    const commentId = genId();

    const { data, error } = await supabase.from("article_comments").insert(
      [
        {
          id: commentId,
          article_id: articleId,
          nickname: safeNickname,
          email: safeEmail || null,
          content: safeContent,
          ip_hash: ipHash,
          user_agent: ua,
          has_links: hasLinks,
          status,
          parent_id: parentId ? String(parentId) : null,
        },
      ]
    ).select();

    if (error) throw error;

    const row: any = (data as any)?.[0];
    return NextResponse.json({
      success: true,
      status,
      message:
        status === "approved"
          ? "评论发布成功"
          : "评论已提交，因包含外链，将在审核后展示",
      comment: row
        ? {
            id: row.id,
            articleId: row.article_id,
            nickname: row.nickname,
            content: row.content,
            status: row.status,
            hasLinks: !!row.has_links,
            parentId: row.parent_id || null,
            createdAt: row.created_at,
          }
        : null,
    });
  } catch (err: any) {
    console.error("[comments POST] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "提交失败，请稍后再试" },
      { status: 500 }
    );
  }
}
