"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  UserCircle2,
  Mail,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  X,
  CornerUpLeft,
  BadgeCheck,
  Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface ArticleComment {
  id: string;
  articleId: string;
  nickname: string;
  content: string;
  email?: string | null;
  replyToNickname?: string | null;
  status: "approved" | "pending_review" | "rejected" | "hidden";
  createdAt: string;
}

interface Props {
  articleId: string;
}

// 作者/官方昵称白名单（匹配时渲染紫金色【陈皮·作者】勋章）
const AUTHOR_NAMES = ["陈述", "陈皮", "陈皮同学", "admin"];

function isAuthor(nickname?: string | null): boolean {
  if (!nickname) return false;
  const n = nickname.trim().toLowerCase();
  return AUTHOR_NAMES.some((a) => a.toLowerCase() === n);
}

// ---------- 管理员登录态校验 ----------
const ADMIN_TOKEN_KEY = "admin_token";

function validateAdminToken(token: string | null): boolean {
  if (!token) return false;
  try {
    // 浏览器端 atob 解码 Base64（与服务端 Buffer 生成对称，纯 ASCII 负载可安全解码）
    const payload = JSON.parse(atob(token));
    return payload?.role === "admin" && typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- Leads 行 id 生成（TEXT 主键，前端 upsert 时填充） ----------
function genLeadId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- 轻量 Toast（替代 window.alert，全站统一柔和提示） ----------
type ToastItem = { id: number; type: "success" | "error" | "info"; message: string };

// 显示层 escape 安全网
function safeText(raw: string): string {
  if (typeof document === "undefined") return raw;
  const span = document.createElement("span");
  span.textContent = raw;
  return span.textContent ?? raw;
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return "刚刚";
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} 分钟前`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} 小时前`;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${da} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// 从评论 id 生成短编号（#8831 风格）
function shortId(id: string): string {
  if (!id) return "";
  // 取后 4 位字符（兼容 UUID 和 TEXT 主键）
  const tail = id.replace(/-/g, "").slice(-4);
  return `#${tail.toUpperCase()}`;
}

type PostState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; pending: boolean; message: string }
  | { type: "error"; message: string; code?: string };

export default function ArticleComments({ articleId }: Props) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyToNickname, setReplyToNickname] = useState<string | null>(null);
  const [postState, setPostState] = useState<PostState>({ type: "idle" });
  const [sectionOpen, setSectionOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // -------- 管理员登录态 --------
  const [isAdmin, setIsAdmin] = useState(false);

  // -------- 轻量 Toast --------
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((type: ToastItem["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    // 3.5s 后自动消失
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // -------- 15 秒频控 + 倒计时 --------
  const COOLDOWN_MS = 15_000;
  const COOLDOWN_KEY = "cp_comment_last_submit";
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // 初始化：读取管理员登录态 + 恢复频控倒计时（防刷新绕过）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(validateAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY)));
      try {
        const raw = localStorage.getItem(COOLDOWN_KEY);
        if (raw) {
          const lastTs = Number(raw);
          const elapsed = Date.now() - lastTs;
          if (elapsed < COOLDOWN_MS) {
            setCooldownLeft(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
          }
        }
      } catch {}
    }
  }, []);

  // 倒计时定时器（组件 unmount 时自动清理，防内存泄漏）
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/articles/comments?article_id=${encodeURIComponent(articleId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json?.success && Array.isArray(json.comments)) {
        setComments(json.comments as ArticleComment[]);
      }
    } catch (err) {
      console.warn("[ArticleComments] load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [articleId]);

  // 邮箱必填校验：合规邮箱才允许提交
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canSubmit =
    nickname.trim().length > 0 &&
    content.trim().length > 0 &&
    emailValid &&
    postState.type !== "loading" &&
    cooldownLeft === 0;

  // 点击【回复】按钮：设置回复目标昵称（纯文本引用，非外键关联）
  const handleReply = useCallback((targetNickname: string) => {
    setReplyToNickname(targetNickname);
    // 聚焦到输入框
    const ta = document.getElementById("cp-comment-textarea");
    if (ta) ta.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyToNickname(null);
  }, []);

  const submit = async () => {
    if (nickname.trim().length === 0 || content.trim().length === 0 || !emailValid) return;
    if (postState.type === "loading") return;
    if (cooldownLeft > 0) return; // 频控中
    setPostState({ type: "loading" });

    const submittedNickname = nickname.trim().slice(0, 40) || "匿名战术家";
    const submittedContent = content.trim().slice(0, 2000);
    const submittedEmail = email.trim().slice(0, 200);

    // 乐观插入：立即把新评论插入列表顶部（临时 id，DB 返回后替换）
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: ArticleComment = {
      id: tempId,
      articleId,
      nickname: submittedNickname,
      content: submittedContent,
      email: submittedEmail,
      replyToNickname: replyToNickname || null,
      status: "approved",
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimisticComment, ...prev]);

    // 立即清空输入框 + 重置 @引用 状态，体验毫无卡顿
    setContent("");
    setReplyToNickname(null);

    // 开启 15 秒倒计时 + 存入 localStorage 防刷新绕过
    setCooldownLeft(15);
    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch {}

    // ===== 异步任务 2：静默同步至 Leads 表（与评论插入并行，独立 try/catch 防阻断） =====
    // 哪怕因 RLS 权限拦截导致 Leads 写入失败，也绝不阻断评论发布
    if (submittedEmail && supabase) {
      // async IIFE：不 await，独立异常隔离，绝不阻塞评论主流程
      (async () => {
        try {
          const { error } = await supabase
            .from("leads")
            .upsert(
              [
                {
                  id: genLeadId(),
                  email: submittedEmail,
                  name: submittedNickname,
                  source: "文章讨论区",
                  notes: submittedContent,
                },
              ],
              { onConflict: "email" }
            );
          if (error) {
            console.warn("[Leads] 静默沉淀失败（不影响评论）:", error.message);
          }
        } catch (e: any) {
          console.warn("[Leads] 静默沉淀异常（不影响评论）:", e?.message || e);
        }
      })();
    }

    // ===== 异步任务 1：向 article_comments 插入评论 =====
    try {
      const res = await fetch("/api/articles/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          nickname: submittedNickname,
          email: submittedEmail,
          content: submittedContent,
          replyToNickname: replyToNickname || null,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setPostState({
          type: "success",
          pending: json.status === "pending_review",
          message: json.message || "评论发布成功",
        });
        // 用 DB 返回的真实评论替换临时乐观评论
        if (json.comment?.id) {
          const realComment: ArticleComment = {
            id: json.comment.id,
            articleId,
            nickname: submittedNickname,
            content: submittedContent,
            email: submittedEmail,
            replyToNickname: replyToNickname || null,
            status: json.status || "approved",
            createdAt: json.comment.createdAt || new Date().toISOString(),
          };
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? realComment : c))
          );
        } else {
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          if (json.status === "approved") {
            await load();
          }
        }
        setTimeout(() => setPostState({ type: "idle" }), 3000);
      } else {
        // 提交失败：移除乐观评论
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setPostState({
          type: "error",
          message: json?.error || "提交失败",
          code: json?.code,
        });
      }
    } catch (err: any) {
      // 网络错误：移除乐观评论
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setPostState({
        type: "error",
        message: err?.message || "提交失败，请稍后再试",
      });
    }
  };

  // 管理员删除评论（仅管理员可执行，走 admin 模式直删）
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!isAdmin) return;
      setDeletingId(commentId);
      try {
        const res = await fetch(`/api/articles/comments?id=${encodeURIComponent(commentId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin: true }),
        });
        const json = await res.json();
        if (json?.success) {
          setConfirmDeleteId(null);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          showToast("success", "评论已删除");
        } else {
          showToast("error", json?.error || "删除失败");
        }
      } catch (err: any) {
        showToast("error", err?.message || "删除失败");
      } finally {
        setDeletingId(null);
      }
    },
    [isAdmin, showToast]
  );

  return (
    <section className="mt-14 border-t border-zinc-800 pt-8">
      {/* ===== Toast 提示层（替代 window.alert，柔和浮层） ===== */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-md ${
              t.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : t.type === "error"
                ? "border-red-500/30 bg-red-500/15 text-red-300"
                : "border-zinc-700/50 bg-zinc-800/80 text-zinc-200"
            }`}
          >
            {t.type === "success" ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : t.type === "error" ? (
              <X className="h-4 w-4 flex-shrink-0" />
            ) : (
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            读者战术讨论区
          </h2>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
            {comments.length} 条
          </span>
          {/* 管理员标识（仅管理员可见） */}
          {isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <Shield className="h-3 w-3" />
              管理员模式
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          {sectionOpen ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              展开
            </>
          )}
        </button>
      </div>

      {sectionOpen && (
        <div className="space-y-6">
          {/* 评论发布表单（昵称 + 邮箱 + 内容） */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            {/* 回复引用提示条 */}
            {replyToNickname && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-300">
                <CornerUpLeft className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  正在回复 <span className="font-semibold">@{safeText(replyToNickname)}</span>
                </span>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="ml-auto inline-flex items-center gap-1 rounded-md bg-zinc-800/60 px-2 py-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                  取消
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="block flex-1">
                <span className="mb-1 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  昵称 <span className="text-red-400">*</span>
                </span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你在评论区的代号（≤40字，留空则显示「匿名战术家」）"
                  maxLength={40}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
                />
              </label>
              <label className="block flex-1">
                <span className="mb-1 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                  邮箱 <span className="text-red-400">*</span>
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="邮箱（必填，用于接收陈皮点评与回复提醒）"
                  maxLength={200}
                  className={`w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50 ${
                    email && !emailValid ? "border-amber-500/40" : "border-zinc-800"
                  }`}
                />
              </label>
            </div>
            <div className="mt-3">
              <textarea
                id="cp-comment-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="留下你对这篇战术稿的思考、质疑或补充案例…"
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-600">
                <span />
                <span>{content.length} / 2000</span>
              </div>
            </div>

            {/* 状态提示（柔和 zinc/amber/emerald 色调，无生硬红色报错框） */}
            <div className="mt-3 min-h-[28px]">
              {postState.type === "success" ? (
                <div
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    postState.pending
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{postState.message}</span>
                </div>
              ) : postState.type === "error" ? (
                <div className="flex items-start gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-3 py-2 text-xs text-zinc-400">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{postState.message}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {postState.type === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : cooldownLeft > 0 ? (
                  <>
                    <Send className="h-4 w-4" />
                    {`发送回复 (${cooldownLeft}s)`}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    发送回复
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 单层评论流（按 created_at DESC 降序平铺，纯文本引用） */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 py-10 text-center text-sm text-zinc-500">
                暂时还没有战术讨论，你可以来做第一个敲下战书的人。
              </div>
            ) : (
              <ul className="space-y-3">
                {comments.map((comment) => {
                  const author = isAuthor(comment.nickname);
                  return (
                    <li
                      key={comment.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700"
                    >
                      {/* 引用回复微标 */}
                      {comment.replyToNickname && (
                        <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-zinc-700/50 bg-zinc-800/40 px-2 py-0.5 text-[10px] text-zinc-500">
                          <CornerUpLeft className="h-3 w-3" />
                          回复 <span className="text-zinc-400">@{safeText(comment.replyToNickname)}</span>
                          <span className="text-zinc-600">{shortId(comment.id)}</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-xs font-semibold text-zinc-100">
                            {comment.nickname?.slice(0, 1) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-zinc-100">
                                {safeText(comment.nickname)}
                              </span>
                              {/* 作者/官方专属身份勋章（紫金色【陈皮·作者】） */}
                              {author && (
                                <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                  <BadgeCheck className="h-2.5 w-2.5" />
                                  陈皮·作者
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {formatTime(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* 回复按钮（纯文本引用） */}
                          <button
                            type="button"
                            onClick={() => handleReply(comment.nickname)}
                            title="回复"
                            className="flex-shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-purple-500/40 hover:text-purple-300"
                          >
                            <CornerUpLeft className="h-3 w-3" />
                          </button>
                          {/* 删除按钮：仅管理员登录后渲染（普通访客绝对不渲染） */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(comment.id)}
                              title="管理员删除"
                              className="flex-shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300">
                        {safeText(comment.content)}
                      </div>

                      {/* 删除确认（仅管理员触发） */}
                      {confirmDeleteId === comment.id && isAdmin && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs">
                          <span className="text-red-300">确定删除这条评论？（管理员操作）</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="ml-auto inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                          >
                            {deletingId === comment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            确认
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-400 hover:bg-zinc-700"
                          >
                            <X className="h-3 w-3" />
                            取消
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
