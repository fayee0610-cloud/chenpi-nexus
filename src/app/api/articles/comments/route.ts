/*
 * 灵感文章评论 API
 *
 * GET    /api/articles/comments?article_id=xxx          → 读取某文章已批准的评论
 * GET    /api/articles/comments?article_id=xxx&all=true → Admin 读取全部评论（含待审核）
 * POST   /api/articles/comments                          → 提交新评论（XSS 过滤 + IP 60s 防刷 + 外链待审核）
 * DELETE /api/articles/comments                          → 用户自主删除（需 delete_token 校验）
 * PATCH  /api/articles/comments                          → Admin 审核/隐藏/批准评论
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SERVICE_ROLE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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

// -------------- 生成删除凭证（随机 32 字节十六进制） --------------
function genDeleteToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// 简易 Admin 校验（通过 service_role 即认为是 Admin 操作）
function isAdminRequest(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  // 如果带了 service_role key 或者通过 admin secret
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && token === adminSecret) return true;
  // 没配 admin secret 时，PATCH/DELETE-all 走 service_role 客户端即可（前端 admin 页有 session）
  return false;
}

// ============================================================
// GET：读取评论
// ============================================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("article_id");
  const fetchAll = searchParams.get("all") === "true";

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
    let query = supabase
      .from("article_comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    // 前台只读 approved；Admin 读取全部
    if (!fetchAll) {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      articleId,
      comments: (data || []).map((r: any) => ({
        id: r.id,
        articleId: r.article_id,
        nickname: r.nickname,
        email: r.email || null,
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
// POST：提交评论（不传 id，让 Supabase 自动生成 UUID）
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

    // 安全 1：XSS 转义
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

    // 安全 3：单 IP 60s 内不可连续发帖
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
      console.warn("[comments POST] rate-limit check skip:", rateErr);
    }

    const ua = req.headers.get("user-agent")?.slice(0, 400) || null;
    const status: "approved" | "pending_review" = hasLinks ? "pending_review" : "approved";

    // 生成删除凭证：前端 localStorage 保存，用户可凭此删除自己的评论
    const deleteToken = genDeleteToken();

    // 构建插入数据（不传 id，让 Supabase 用 gen_random_uuid() 自动生成 UUID）
    const baseInsert: Record<string, any> = {
      article_id: articleId,
      nickname: safeNickname,
      email: safeEmail || null,
      content: safeContent,
      ip_hash: ipHash,
      user_agent: ua,
      has_links: hasLinks,
      status,
      parent_id: parentId ? String(parentId) : null,
    };

    // 优先尝试带 delete_token 写入；若表缺少该列则降级重试（兼容旧表结构）
    let data: any = null;
    let error: any = null;
    let tokenSaved = true;

    const firstTry = await supabase
      .from("article_comments")
      .insert([{ ...baseInsert, delete_token: deleteToken }])
      .select();

    if (firstTry.error && /delete_token/i.test(String(firstTry.error.message || ""))) {
      // delete_token 列不存在 → 降级：不带该列重新写入
      console.warn("[comments POST] delete_token 列缺失，降级重试:", firstTry.error.message);
      tokenSaved = false;
      const retry = await supabase
        .from("article_comments")
        .insert([baseInsert])
        .select();
      data = retry.data;
      error = retry.error;
    } else {
      data = firstTry.data;
      error = firstTry.error;
    }

    if (error) throw error;

    const row: any = (data as any)?.[0];
    return NextResponse.json({
      success: true,
      status,
      message: status === "approved" ? "评论发布成功" : "评论已提交，审核后展示",
      deleteToken: tokenSaved ? deleteToken : null, // 列缺失时返回 null，前端不启用删除按钮
      tokenSaved,
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
        .from("article_comments")
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

    // 先查 token 是否匹配（用 select("*") 兼容旧表无 delete_token 列的情况）
    const { data: row, error: queryErr } = await supabase
      .from("article_comments")
      .select("*")
      .eq("id", id)
      .single();

    if (queryErr || !row) {
      return NextResponse.json(
        { success: false, error: "评论不存在或已被删除" },
        { status: 404 }
      );
    }

    // delete_token 列不存在时 row.delete_token 为 undefined → 凭证不匹配，安全拒绝
    if (row.delete_token !== deleteToken) {
      return NextResponse.json(
        { success: false, error: "删除凭证不匹配，无权删除" },
        { status: 403 }
      );
    }

    const { error: delErr } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    console.error("[comments DELETE] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "删除失败" },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH：Admin 审核/隐藏/批准评论
// ============================================================
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, admin } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "缺少 id 或 status 参数" },
        { status: 400 }
      );
    }

    const validStatuses = ["approved", "pending_review", "rejected", "hidden"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `status 必须为 ${validStatuses.join("|")}` },
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
      .from("article_comments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `评论状态已更新为 ${status}`,
    });
  } catch (err: any) {
    console.error("[comments PATCH] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "操作失败" },
      { status: 500 }
    );
  }
}
