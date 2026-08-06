"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { siteData } from "@/data/siteData";

const { bubbles, quickPrompts, name, tagline } = siteData.mascot;
const avatarUrl = siteData.profile.avatarUrl;

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function Mascot() {
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 浮动气泡轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbleIndex((prev) => (prev + 1) % bubbles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 发送消息（SSE 流式响应 + 打字机效果）
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // 先插入一条空的 AI 消息，用于流式填充
    const aiMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      // 频次限制：429 响应
      if (res.status === 429) {
        // 移除空 AI 消息
        setMessages((prev) => prev.slice(0, -1));
        setShowRateLimit(true);
        return;
      }

      if (!res.ok) throw new Error("REQUEST_FAILED");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("NO_READER");

      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // 实时更新 AI 消息内容
        setMessages((prev) => {
          const next = [...prev];
          if (next[aiMsgIndex]) {
            next[aiMsgIndex] = { ...next[aiMsgIndex], content: fullText };
          }
          return next;
        });
      }

      // 流结束后，如果内容为空，显示兜底提示
      if (!fullText.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          if (next[aiMsgIndex]) {
            next[aiMsgIndex] = {
              ...next[aiMsgIndex],
              content: "陈皮 AI 正在充电中，请稍后再试或通过【联系我】直接与陈皮本人沟通。",
            };
          }
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        if (next[aiMsgIndex]) {
          next[aiMsgIndex] = {
            ...next[aiMsgIndex],
            content: "网络开小差了，稍后再试一次？",
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [loading, messages.length]);

  // Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* 浮动气泡 */}
      <AnimatePresence mode="wait">
        {!showDialog && (
          <motion.div
            key={bubbleIndex}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-24 right-6 z-40 max-w-[200px] rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-300 shadow-xl backdrop-blur-sm"
          >
            {bubbles[bubbleIndex]}
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-zinc-800 bg-zinc-900/95" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对话面板 */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 right-4 z-50 flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:right-6"
          >
            {/* Hero 头部 */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-blue-950/30 to-purple-950/30 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-purple-500/40 bg-gradient-to-br from-blue-500 to-purple-500"
                    style={{
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "saturate(0.8) brightness(0.9)",
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-green-500">
                    <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-60" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-100">{name}</span>
                    <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[9px] font-medium text-green-400">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 快捷提问气泡 */}
            {messages.length === 0 && (
              <div className="border-b border-zinc-800/60 px-5 py-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
                  快捷提问
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium leading-relaxed text-zinc-400 transition-all hover:border-purple-500/40 hover:bg-purple-950/20 hover:text-purple-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 对话流 */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <Bot className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-sm text-zinc-400">你好，我是陈皮 AI</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    问我任何关于品牌、AI、创作的问题
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "border border-cyan-500/30 bg-cyan-950/20 text-zinc-200"
                        : "border border-purple-500/30 bg-purple-950/15 text-zinc-200"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <div className="max-w-none text-sm leading-relaxed [&_a]:text-blue-400 [&_a]:underline [&_li]:my-0.5 [&_ol]:my-1 [&_p]:my-1 [&_strong]:font-semibold [&_strong]:text-purple-300 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-purple-500/40 [&_blockquote]:pl-2 [&_blockquote]:text-zinc-400 [&_code]:rounded [&_code]:bg-zinc-800/60 [&_code]:px-1 [&_code]:text-xs [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mt-1.5 [&_h3]:text-sm [&_h3]:font-semibold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* 等待呼吸灯（仅在 AI 消息内容为空且 loading 时显示，流式输出中不显示） */}
              {loading && messages[messages.length - 1]?.role === "ai" && !messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-950/15 px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div className="border-t border-zinc-800 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                  rows={1}
                  className="max-h-24 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white transition-all hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 频次限制弹窗 */}
      <AnimatePresence>
        {showRateLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRateLimit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Lock className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="mb-2 text-base font-bold text-zinc-100">
                今日对话次数已达上限
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-zinc-400">
                未登录用户每天限 3 次对话。注册解锁无限次
                <span className="font-medium text-purple-400">【陈皮 AI 商业策略深度诊断】</span>。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRateLimit(false)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  知道了
                </button>
                <a
                  href="/admin"
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
                >
                  注册解锁
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar 按钮 */}
      <motion.button
        onClick={() => setShowDialog(!showDialog)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-50 animate-pulse-glow" />
        <Bot className="relative h-7 w-7 text-white" />
      </motion.button>
    </>
  );
}
