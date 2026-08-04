"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Radar, Sparkles, TrendingUp, Bot, Loader2, Copy, CheckCheck, RefreshCw } from "lucide-react";
import { fetchInsightsHub } from "@/lib/dataApi";
import { type InsightHubItem, type InsightHubCategory } from "@/data/siteData";
import LoadMoreButton from "@/components/LoadMoreButton";

const CATEGORY_TABS = [
  { key: "all", label: "全部分类", icon: Radar },
  { key: "🤖 机器人/具身智能", label: "机器人/具身智能", icon: Bot },
  { key: "⚡ AI技术/大厂策略", label: "AI技术/大厂策略", icon: Sparkles },
  { key: "📈 品牌策略/GTM干货", label: "品牌策略/GTM干货", icon: TrendingUp },
] as const;

const CATEGORY_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  "🤖 机器人/具身智能": { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-cyan-500/5" },
  "⚡ AI技术/大厂策略": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-purple-500/5" },
  "📈 品牌策略/GTM干货": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/5" },
};

export default function InformationHub({ showLimit }: { showLimit?: number }) {
  const [items, setItems] = useState<InsightHubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 一键复制情报文本（带落款链接）
  const handleCopyInsight = async (item: InsightHubItem) => {
    const tagLine = `—— 摘自【陈皮同学 · 赛博情报站】| ${
      typeof window !== "undefined" ? `${window.location.origin}/hub` : "https://chenpi.dev/hub"
    }`;
    const payload = `${item.title}\n[${item.category}] ${item.sourceName || "匿名来源"} | ${item.publishedAt || ""}\n\n${
      item.summary || ""
    }\n${tagLine}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        // 降级方案：textarea + execCommand
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((cur) => (cur === item.id ? null : cur)), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchInsightsHub();
      // 过滤 isPublished = true，未发布的前台不可见
      const published = data.filter((i) => i.isPublished);
      setItems(published);
    } catch (err: any) {
      console.warn("[InformationHub] loadData 失败:", err?.message || err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchInsightsHub();
        if (mounted) {
          const published = data.filter((i) => i.isPublished);
          setItems(published);
        }
      } catch (err) {
        console.warn("[InformationHub] 首次加载失败:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ⚡ 实时感知：调用 Cron 接口一键完成 生成 → 清洗 → 去重 → 写入
  const handleAiRefresh = async () => {
    setAiRefreshing(true);
    setAiMessage(null);
    try {
      const res = await fetch("/api/cron/fetch-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      const stats = result.stats || {};
      const inserted = stats.inserted ?? 0;
      const duplicatesRemoved = stats.duplicatesRemoved ?? 0;

      if (inserted > 0) {
        // 写入成功：立即刷新数据
        setAiMessage(`⚡ 写入 ${inserted}/${stats.afterDedup ?? stats.totalItems ?? stats.sanitized ?? "?"} 条（24h跳过 ${duplicatesRemoved} 条重复）`);
        // 小延迟后刷新，确保 Supabase 写入落盘（避免读取时还在 RLS/复制延迟）
        await new Promise((r) => setTimeout(r, 400));
        await loadData();
      } else {
        // 写入为 0 时，分三种情况提示：重复 / 清洗拦截 / 写入失败
        if (duplicatesRemoved > 0) {
          setAiMessage(`⚠️ 24h 内已有重复情报（跳过 ${duplicatesRemoved} 条），稍后再试或换个时间`);
        } else if (!result.success) {
          // 优先展示真实 Supabase 错误 + hint 修复指引
          const realErr = result.error || (result.errors && result.errors[0]) || result.message || "未知错误";
          // hint 太长，截取关键部分展示
          const hint = result.hint ? ` | 修复：${result.hint.slice(0, 80)}...` : "";
          setAiMessage(`❌ ${realErr}${hint}`);
        } else {
          setAiMessage(result.message || "暂无新情报，稍后再试");
        }
        // 即使本次没写入新数据，也刷新一次（可能数据库里之前有没读取到的）
        await loadData();
      }
    } catch (err: any) {
      setAiMessage(`❌ 网络错误：${err?.message || "AI 感知请求失败"}`);
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
    const sorted = [...filteredItems].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
    // 首页模式：限制展示条数
    if (typeof showLimit === "number" && showLimit > 0) {
      return sorted.slice(0, showLimit);
    }
    return sorted;
  }, [filteredItems, showLimit]);

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
          具身智能 · AI大厂 · GTM战术 — 第一手硬核商业情报提炼
        </p>

        {/* ⚡ 实时感知按钮 */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleAiRefresh}
            disabled={aiRefreshing}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50"
          >
            {aiRefreshing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                感知中...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                ⚡ 实时感知
              </>
            )}
          </button>
          {aiMessage && (
            <span className={`text-xs whitespace-nowrap ${
              aiMessage.startsWith("❌") || aiMessage.includes("失败") || aiMessage.startsWith("写入失败")
                ? "text-rose-400"
                : aiMessage.startsWith("⚠️")
                ? "text-amber-400"
                : "text-emerald-400"
            }`}>
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
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES["⚡ AI技术/大厂策略"];
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

                  {/* 底部：来源 + 日期 + 分享通道 + 查看原文 */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-500">{item.sourceName}</span>
                      <span className="text-[10px] text-zinc-600">{item.publishedAt}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyInsight(item);
                        }}
                        title="一键复制（精髓 + 陈皮洞察 + 站点落款）"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-all ${
                          copiedId === item.id
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-purple-500/40 hover:bg-zinc-800 hover:text-purple-300"
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <CheckCheck className="h-3 w-3" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            分享/复制
                          </>
                        )}
                      </button>
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

      {/* 首页模式：跳转量子页面 */}
      {typeof showLimit === "number" && !loading && sortedItems.length > 0 && (
        <LoadMoreButton href="/hub" label="进入情报站完整列表" />
      )}
    </section>
  );
}
