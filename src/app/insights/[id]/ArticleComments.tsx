"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  UserCircle2,
  Mail,
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
  hasLinks: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt?: string;
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
  } catch {
    // localStorage 可能被禁用
  }
}

function removeDeleteToken(commentId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeleteTokens();
    delete existing[commentId];
    localStorage.setItem(DELETE_TOKENS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
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
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToNick, setReplyToNick] = useState<string | null>(null);
  const [postState, setPostState] = useState<PostState>({ type: "idle" });
  const [sectionOpen, setSectionOpen] = useState(true);
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 初始化加载 localStorage 中的凭证
  useEffect(() => {
    setDeleteTokens(getDeleteTokens());
  }, []);

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

  // 层级分组
  const displayList = useMemo(() => {
    const byParent = new Map<string | null, ArticleComment[]>();
    comments.forEach((c) => {
      const key = c.parentId ?? null;
      const arr = byParent.get(key) ?? [];
      arr.push(c);
      byParent.set(key, arr);
    });
    const rootList = (byParent.get(null) ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const out: { comment: ArticleComment; depth: number }[] = [];
    const walk = (list: ArticleComment[], depth: number) => {
      list.forEach((c) => {
        out.push({ comment: c, depth });
        const children = (byParent.get(c.id) ?? []).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        walk(children, depth + 1);
      });
    };
    walk(rootList, 0);
    return out;
  }, [comments]);

  const approvedCount = useMemo(() => comments.length, [comments]);

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToNick(null);
  };

  const canSubmit =
    nickname.trim().length > 0 &&
    content.trim().length > 0 &&
    postState.type !== "loading";

  const submit = async () => {
    if (nickname.trim().length === 0 || content.trim().length === 0) return;
    if (postState.type === "loading") return;
    setPostState({ type: "loading" });
    try {
      const res = await fetch("/api/articles/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          nickname: nickname.trim().slice(0, 40),
          email: email.trim().slice(0, 200),
          content: content.trim().slice(0, 2000),
          parentId: replyToId,
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
        setContent("");
        cancelReply();
        if (json.status === "approved") {
          await load();
        }
        setTimeout(() => setPostState({ type: "idle" }), 3000);
      } else {
        setPostState({
          type: "error",
          message: json?.error || "提交失败",
          code: json?.code,
        });
      }
    } catch (err: any) {
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
        await load();
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
            {approvedCount} 条
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
          {/* 评论发布表单 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            {replyToId && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-200">
                <span>
                  回复 <span className="font-medium">@{replyToNick || "评论"}</span>
                </span>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-purple-300 hover:text-purple-100"
                >
                  取消
                </button>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  昵称 <span className="text-red-400">*</span>
                </span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你在评论区的代号（≤40字）"
                  maxLength={40}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
                />
              </label>
              <label className="block">
                <span className="mb-1 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                  邮箱（选填）
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="方便后续回复联系（可选，不会公开）"
                  maxLength={200}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
                />
              </label>
            </div>
            <div className="mt-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder={
                  replyToId
                    ? "写下你的战术回应…"
                    : "留下你对这篇战术稿的思考、质疑或补充案例…"
                }
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-600">
                <span />
                <span>{content.length} / 2000</span>
              </div>
            </div>

            {/* 状态提示 */}
            <div className="mt-3 min-h-[32px]">
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
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
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
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {replyToId ? "发送回复" : "发布评论"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 评论列表 */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : displayList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 py-10 text-center text-sm text-zinc-500">
                暂时还没有战术讨论，你可以来做第一个敲下战书的人。
              </div>
            ) : (
              <ul className="space-y-3">
                {displayList.map(({ comment, depth }) => {
                  const canDelete = !!deleteTokens[comment.id];
                  return (
                    <li
                      key={comment.id}
                      className={`rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700 ${
                        depth === 0 ? "" : "ml-4 sm:ml-8 md:ml-12"
                      }`}
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
                              {comment.parentId && (
                                <span className="ml-2 text-purple-400/80">回复</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={() => {
                              setReplyToId(comment.id);
                              setReplyToNick(comment.nickname);
                            }}
                            className="flex-shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-purple-500/40 hover:text-purple-300"
                          >
                            回复
                          </button>
                        </div>
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
