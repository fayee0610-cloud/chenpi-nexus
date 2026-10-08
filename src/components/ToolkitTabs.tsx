"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, BookOpen } from "lucide-react";
import ResourceHub from "@/components/ResourceHub";
import MalayDailyCard from "@/components/MalayDailyCard";

type TabKey = "toolkit" | "malay";

export default function ToolkitTabs({
  showResources = true,
  showCanvasLimit,
}: {
  showResources?: boolean;
  showCanvasLimit?: number;
}) {
  const [tab, setTab] = useState<TabKey>(showResources ? "toolkit" : "malay");

  // 监听 Hero 头像点击事件 → 切换到马来语 Tab 并滚动
  useEffect(() => {
    const handler = () => {
      setTab("malay");
      setTimeout(() => {
        document.getElementById("toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    };
    window.addEventListener("switch-to-malay", handler);
    return () => window.removeEventListener("switch-to-malay", handler);
  }, []);

  return (
    <section id="toolkit" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 + Tab 切换器 */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          出海工具箱
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500">
          实战 SOP · 东南亚渠道指南 · AI 营销 Prompt 库 · 每日马来语轻打卡
        </p>

        {/* Tab 切换器 */}
        <div className="mt-6 inline-flex rounded-xl border border-zinc-800 bg-zinc-900/40 p-1">
          <button
            onClick={() => setTab("toolkit")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              tab === "toolkit"
                ? "bg-blue-500/15 text-blue-200 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Wrench className="h-4 w-4" />
            策略工具包
          </button>
          <button
            onClick={() => setTab("malay")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              tab === "malay"
                ? "bg-purple-500/15 text-purple-200 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            马来语轻打卡
          </button>
        </div>
      </div>

      {/* Tab 内容区 */}
      <AnimatePresence mode="wait">
        {tab === "toolkit" ? (
          <motion.div
            key="toolkit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {showResources ? (
              <ResourceHub showLimit={showCanvasLimit} noSection />
            ) : (
              <div className="py-20 text-center">
                <Wrench className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
                <p className="text-sm text-zinc-500">资源包正在准备中，敬请期待</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="malay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="mx-auto max-w-2xl">
              <MalayDailyCard />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
