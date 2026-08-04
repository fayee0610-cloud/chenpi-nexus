"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCircle2,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ArticleComment {
  id: string;
  articleId: string;
  nickname: string;
  content: string;
  status: "approved" | "pending_review" | "rejected";
  hasLinks: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface Props {
  articleId: string;
}

// 客户端也再做一次显示层 escape（后端写入时已 escape，这里再加一层显示安全网，
// 避免未来接入别的数据源时内容被直接 innerHTML 渲染）
function safeText(raw: string): string {
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

  // 评论区默认折叠，减少首屏噪声
  const [sectionOpen, setSectionOpen] = useState(true);

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

  // 层级分组：顶层评论按时间倒序展示，回复紧跟其后（时间正序）
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
        setContent("");
        cancelReply();
        if (json.status === "approved") {
          await load();
        }
        setTimeout(() => setPostState({ type: "idle" }), 4200);
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
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
            <ShieldCheck className="h-3 w-3" />
            已开启防垃圾防护
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
              收起评论
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              展开评论
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
                    ? "写下你的战术回应…（XSS 转义 / IP 60s 防刷 / 外链自动待审核）"
                    : "留下你对这篇战术稿的思考、质疑或补充案例…（≤2000 字）"
                }
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-600">
                <span>
                  内容中若包含 http(s) 外链会自动进入待审核状态，审核通过后才会展出。
                </span>
                <span>{content.length} / 2000</span>
              </div>
            </div>

            {/* 状态提示 */}
            <div className="mt-3 min-h-[38px]">
              {postState.type === "success" ? (
                <div
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    postState.pending
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{postState.message}</span>
                </div>
              ) : postState.type === "error" ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <span>{postState.message}</span>
                    {postState.code === "RATE_LIMIT" && (
                      <span className="ml-1 text-red-400">
                        （60 秒内仅能发一条，喝口水再继续）
                      </span>
                    )}
                  </div>
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
                {displayList.map(({ comment, depth }) => (
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
                      <button
                        type="button"
                        onClick={() => {
                          setReplyToId(comment.id);
                          setReplyToNick(comment.nickname);
                          // 滚动到评论框
                          requestAnimationFrame(() => {
                            const el = document.getElementById(
                              `article-comments-form-${articleId}`
                            );
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          });
                        }}
                        className="flex-shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-purple-500/40 hover:text-purple-300"
                      >
                        回复
                      </button>
                    </div>
                    <div
                      id={`article-comments-form-${articleId}-anchor`}
                      className="pointer-events-none h-0"
                    />
                    <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
                      {safeText(comment.content)}
                    </div>
                    {comment.hasLinks && (
                      <div className="mt-2 text-[11px] text-amber-400/80">
                        * 本条评论包含外链，已经过安全审核才展示。
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div id={`article-comments-form-${articleId}`} className="h-0 w-0" />
    </section>
  );
}
