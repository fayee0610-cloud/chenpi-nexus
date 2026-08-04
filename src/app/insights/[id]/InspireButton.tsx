"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { incrementInsightLikes } from "@/lib/dataApi";

/**
 * 文章【激发灵感】按钮：点击后乐观 +1，异步持久化到 insights.likes
 * localStorage 记录已激发的文章 id，避免重复刷量（每篇文章每设备仅 +1 一次）
 */
const INSPIRED_KEY = "cp_inspired_insights";

function getInspiredSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(INSPIRED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function markInspired(id: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getInspiredSet();
    set.add(id);
    window.localStorage.setItem(INSPIRED_KEY, JSON.stringify([...set]));
  } catch {
    // 静默忽略
  }
}

export default function InspireButton({
  insightId,
  initialLikes,
}: {
  insightId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const handleInspire = async () => {
    // 已激发过：仅做视觉反馈，不重复递增
    if (getInspiredSet().has(insightId)) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 800);
      return;
    }
    setLoading(true);
    // 乐观 +1
    setLikes((prev) => prev + 1);
    setPulsing(true);
    try {
      const dbLikes = await incrementInsightLikes(insightId);
      if (typeof dbLikes === "number") {
        setLikes(dbLikes);
      }
      markInspired(insightId);
    } catch (err) {
      // 持久化失败：回滚乐观更新
      setLikes((prev) => Math.max(0, prev - 1));
      console.warn("[InspireButton] 激发灵感持久化失败:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setPulsing(false), 800);
    }
  };

  return (
    <motion.button
      onClick={handleInspire}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
        pulsing
          ? "border-purple-400 bg-purple-500/20 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          : "border-purple-500/30 bg-purple-950/20 text-purple-300 hover:border-purple-500/50 hover:bg-purple-950/40"
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className={`h-4 w-4 ${pulsing ? "animate-pulse" : ""}`} />
      )}
      激发灵感 ({likes})
    </motion.button>
  );
}
