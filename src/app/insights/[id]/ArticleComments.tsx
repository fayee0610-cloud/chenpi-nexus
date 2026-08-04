"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  UserCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  X,
} from "lucide-react";

export interface ArticleComment {
  id: string;
  articleId: string;
  nickname: string;
  content: string;
  status: "approved" | "pending_review" | "rejected" | "hidden";
  createdAt: string;
}

interface Props {
  articleId: string;
}

// localStorage key：存储用户可删除的评论凭证 { commentId: deleteToken }
const DELETE_TOKENS_KEY = "cp_comment_delete_tokens";

function getDeleteTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DELETE_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDeleteToken(commentId: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeleteTokens();
    existing[commentId] = token;
    localStorage.setItem(DELETE_TOKENS_KEY, JSON.stringify(existing));
  } catch {}
}

function removeDeleteToken(commentId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeleteTokens();
    delete existing[commentId];
    localStorage.setItem(DELETE_TOKENS_KEY, JSON.stringify(existing));
  } catch {}
}

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

type PostState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; pending: boolean; message: string }
  | { type: "error"; message: string; code?: string };

export default function ArticleComments({ articleId }: Props) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [postState, setPostState] = useState<PostState>({ type: "idle" });
  const [sectionOpen, setSectionOpen] = useState(true);
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // -------- 15 秒频控 + 倒计时 --------
  const COOLDOWN_MS = 15_000;
  const COOLDOWN_KEY = "cp_comment_last_submit";
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // 初始化：从 localStorage 读取上次提交时间，恢复倒计时（防刷新绕过）
  useEffect(() => {
    setDeleteTokens(getDeleteTokens());
    if (typeof window === "undefined") return;
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

  const canSubmit =
    nickname.trim().length > 0 &&
    content.trim().length > 0 &&
    postState.type !== "loading" &&
    cooldownLeft === 0;

  const submit = async () => {
    if (nickname.trim().length === 0 || content.trim().length === 0) return;
    if (postState.type === "loading") return;
    if (cooldownLeft > 0) return; // 频控中
    setPostState({ type: "loading" });

    // 乐观插入：立即把新评论插入列表顶部（临时 id，DB 返回后替换）
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: ArticleComment = {
      id: tempId,
      articleId,
      nickname: nickname.trim().slice(0, 40) || "匿名战术家",
      content: content.trim().slice(0, 2000),
      status: "approved",
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimisticComment, ...prev]);

    // 立即清空输入框，体验毫无卡顿
    const submittedNickname = nickname.trim().slice(0, 40) || "匿名战术家";
    const submittedContent = content.trim().slice(0, 2000);
    setContent("");

    // 开启 15 秒倒计时 + 存入 localStorage 防刷新绕过
    setCooldownLeft(15);
    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch {}

    try {
      const res = await fetch("/api/articles/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          nickname: submittedNickname,
          content: submittedContent,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setPostState({
          type: "success",
          pending: json.status === "pending_review",
          message: json.message || "评论发布成功",
        });
        // 保存删除凭证到 localStorage
        if (json.deleteToken && json.comment?.id) {
          saveDeleteToken(json.comment.id, json.deleteToken);
          setDeleteTokens(getDeleteTokens());
        }
        // 用 DB 返回的真实评论替换临时乐观评论
        if (json.comment?.id) {
          const realComment: ArticleComment = {
            id: json.comment.id,
            articleId,
            nickname: submittedNickname,
            content: submittedContent,
            status: json.status || "approved",
            createdAt: json.comment.createdAt || new Date().toISOString(),
          };
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? realComment : c))
          );
        } else {
          // 无返回评论对象时移除临时项，重新拉取
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

  // 用户自主删除评论
  const handleDelete = useCallback(async (commentId: string) => {
    const token = deleteTokens[commentId];
    if (!token) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/articles/comments?id=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: token }),
      });
      const json = await res.json();
      if (json?.success) {
        removeDeleteToken(commentId);
        setDeleteTokens(getDeleteTokens());
        setConfirmDeleteId(null);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(json?.error || "删除失败");
      }
    } catch (err: any) {
      alert(err?.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTokens]);

  return (
    <section className="mt-14 border-t border-zinc-800 pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            读者战术讨论区
          </h2>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
            {comments.length} 条
          </span>
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
          {/* 评论发布表单（极简：仅昵称 + 内容） */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <label className="block">
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
            <div className="mt-3">
              <textarea
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

            {/* 状态提示（柔和 zinc/amber 色调，无生硬红色报错框） */}
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

          {/* 单层评论流（按 created_at DESC 降序平铺） */}
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
                  const canDelete = !!deleteTokens[comment.id];
                  return (
                    <li
                      key={comment.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-xs font-semibold text-zinc-100">
                            {comment.nickname?.slice(0, 1) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-zinc-100">
                              {safeText(comment.nickname)}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {formatTime(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(comment.id)}
                            title="删除我的评论"
                            className="flex-shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300">
                        {safeText(comment.content)}
                      </div>

                      {/* 删除确认 */}
                      {confirmDeleteId === comment.id && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs">
                          <span className="text-red-300">确定删除这条评论？</span>
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
