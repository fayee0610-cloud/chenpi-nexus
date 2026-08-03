"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Radar, Sparkles, TrendingUp, Bot, Loader2 } from "lucide-react";
import { fetchInsightsHub, createInsightHub } from "@/lib/dataApi";
import { type InsightHubItem, type InsightHubCategory } from "@/data/siteData";

const CATEGORY_TABS = [
  { key: "all", label: "全部分类", icon: Radar },
  { key: "🤖 机器人/具身智能", label: "机器人/具身智能", icon: Bot },
  { key: "💡 AI技术/大厂策略", label: "AI技术/大厂策略", icon: Sparkles },
  { key: "📈 品牌策略/GTM干货", label: "品牌策略/GTM干货", icon: TrendingUp },
] as const;

const CATEGORY_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  "🤖 机器人/具身智能": { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-cyan-500/5" },
  "💡 AI技术/大厂策略": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-purple-500/5" },
  "📈 品牌策略/GTM干货": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/5" },
};

export default function InformationHub() {
  const [items, setItems] = useState<InsightHubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const loadData = () => {
    fetchInsightsHub().then((data) => {
      setItems(data.filter((i) => i.isPublished));
      setLoading(false);
    });
  };

  useEffect(() => {
    let mounted = true;
    fetchInsightsHub().then((data) => {
      if (mounted) {
        setItems(data.filter((i) => i.isPublished));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  // AI 实时感知：调用 AI 接口生成最新情报并写入数据库
  const handleAiRefresh = async () => {
    setAiRefreshing(true);
    setAiMessage(null);
    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (!result.success || !result.items?.length) {
        setAiMessage(result.error || "AI 暂时没有生成新情报，请稍后再试");
        return;
      }
      // 将 AI 生成的情报写入数据库
      let savedCount = 0;
      for (const item of result.items) {
        try {
          await createInsightHub({
            title: item.title,
            category: item.category,
            summary: item.summary,
            sourceName: item.source_name,
            originalUrl: item.original_url,
            publishedAt: item.published_at,
            isPublished: true,
            isFeatured: false,
            apiSource: "ai_generated",
            tags: item.tags || [],
          });
          savedCount++;
        } catch (e) {
          // 单条写入失败不影响整体
        }
      }
      setAiMessage(savedCount > 0 ? `AI 已生成 ${savedCount} 条新情报` : "AI 情报写入失败，请检查后台");
      // 重新加载前台数据
      loadData();
    } catch (err: any) {
      setAiMessage(err.message || "AI 感知请求失败");
    } finally {
      setAiRefreshing(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  // 置顶卡片排前
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [filteredItems]);

  return (
    <section id="hub" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-400">
          <Radar className="h-3.5 w-3.5" />
          Information Hub
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          赛博情报站
        </h2>
        <p className="mt-3 text-sm text-zinc-500">
          AI · 机器人 · 出海营销 — 第一手硬核商业情报提炼
        </p>

        {/* AI 实时感知按钮 */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleAiRefresh}
            disabled={aiRefreshing}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50"
          >
            {aiRefreshing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                AI 感知中...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI 实时感知
              </>
            )}
          </button>
          {aiMessage && (
            <span className={`text-xs ${aiMessage.includes("失败") || aiMessage.includes("没有") ? "text-amber-400" : "text-emerald-400"}`}>
              {aiMessage}
            </span>
          )}
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 瀑布流卡片 */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40"
              />
            ))
          : sortedItems.map((item, i) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES["💡 AI技术/大厂"];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                  className={`break-inside-avoid rounded-2xl border bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:bg-zinc-900/60 ${
                    item.isFeatured
                      ? `${style.border} ${style.bg} shadow-lg ${style.glow}`
                      : "border-zinc-800"
                  }`}
                >
                  {/* 顶部：分类标签 + 置顶标记 */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.border} ${style.bg} ${style.text}`}>
                      {item.category}
                    </span>
                    {item.isFeatured && (
                      <span className="text-[10px] font-bold text-amber-400">★ 置顶</span>
                    )}
                  </div>

                  {/* 标题 */}
                  <h3 className="mb-2 text-sm font-bold leading-snug text-zinc-100">
                    {item.title}
                  </h3>

                  {/* 陈皮提炼标签 + 看点 */}
                  <div className="mb-3">
                    <span className="mb-1.5 inline-block rounded bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-400">
                      【陈皮提炼】
                    </span>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {item.summary}
                    </p>
                  </div>

                  {/* 标签 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 底部：来源 + 日期 + 查看原文 */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-500">{item.sourceName}</span>
                      <span className="text-[10px] text-zinc-600">{item.publishedAt}</span>
                    </div>
                    <a
                      href={/^https?:\/\//.test(item.originalUrl) ? item.originalUrl : `https://${item.originalUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800"
                    >
                      查看原文
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
      </div>

      {/* 空状态 */}
      <AnimatePresence>
        {!loading && sortedItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 text-center"
          >
            <Radar className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">该分类暂无情报</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
