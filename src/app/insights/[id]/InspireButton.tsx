"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { incrementInsightLikes } from "@/lib/dataApi";
import { isInspired, markInspired, unmarkInspired } from "@/lib/inspireState";

/**
 * 文章【激发灵感】按钮（独立详情页）
 * - mount 时从 localStorage 初始化已点赞高亮态（解决刷新后状态丢失）
 * - 已点赞：维持高亮 + 提示「已收到你的灵感共鸣！」，不重复递增
 * - 首次点赞：乐观 +1 + 高亮 + +1 飘字动画，异步持久化，失败回滚
 */
export default function InspireButton({
  insightId,
  initialLikes,
}: {
  insightId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const [echoMsg, setEchoMsg] = useState<string | null>(null);

  // mount：初始化已点赞高亮态（读取共享 localStorage）
  useEffect(() => {
    setIsLiked(isInspired(insightId));
  }, [insightId]);

  // 飘字动画自动隐藏
  useEffect(() => {
    if (!showFloat) return;
    const t = setTimeout(() => setShowFloat(false), 1500);
    return () => clearTimeout(t);
  }, [showFloat]);

  // 回声提示自动隐藏
  useEffect(() => {
    if (!echoMsg) return;
    const t = setTimeout(() => setEchoMsg(null), 2000);
    return () => clearTimeout(t);
  }, [echoMsg]);

  const handleInspire = useCallback(async () => {
    // 已激发过：维持高亮 + 友好提示，不重复递增（本地防刷）
    if (isInspired(insightId)) {
      setIsLiked(true);
      setEchoMsg("已收到你的灵感共鸣！");
      return;
    }
    setLoading(true);
    // 乐观 +1 + 高亮 + 飘字
    setLikes((prev) => prev + 1);
    setIsLiked(true);
    setShowFloat(true);
    markInspired(insightId);
    try {
      const dbLikes = await incrementInsightLikes(insightId);
      if (typeof dbLikes === "number") {
        setLikes(dbLikes);
      }
    } catch (err) {
      // 持久化失败：回滚乐观 +1 + 取消高亮标记
      setLikes((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
      unmarkInspired(insightId);
      setEchoMsg("网络开小差了，稍后再试");
      console.warn("[InspireButton] 激发灵感持久化失败:", err);
    } finally {
      setLoading(false);
    }
  }, [insightId]);

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleInspire}
        disabled={loading}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
          isLiked
            ? "border-purple-400 bg-purple-500/20 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            : "border-purple-500/30 bg-purple-950/20 text-purple-300 hover:border-purple-500/50 hover:bg-purple-950/40"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className={`h-4 w-4 ${isLiked ? "animate-pulse" : ""}`} />
        )}
        {isLiked ? "已激发" : "激发灵感"} ({likes})
      </motion.button>

      {/* +1 飘字动画 */}
      <AnimatePresence>
        {showFloat && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -40, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-lg font-bold text-purple-400"
          >
            +1 ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* 回声提示（已点赞 / 失败回滚） */}
      <AnimatePresence>
        {echoMsg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-purple-500/30 bg-zinc-900/95 px-3 py-1.5 text-xs text-purple-200 shadow-xl backdrop-blur-md"
          >
            {echoMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
