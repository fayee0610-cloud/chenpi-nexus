"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Radar,
  Sparkles,
  Loader2,
  Copy,
  CheckCheck,
  Newspaper,
  Clock,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { fetchMalaysiaIntelligence } from "@/lib/dataApi";
import { type MalaysiaIntelligence } from "@/data/siteData";
import LoadMoreButton from "@/components/LoadMoreButton";

// 来源媒体对应的主题色
const SOURCE_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  "The Edge Malaysia": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "The Star Business": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400" },
  "Malay Mail Money": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400" },
  "Bernama Business": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" },
  "New Straits Times": { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400" },
};

const DEFAULT_SOURCE_STYLE = { border: "border-zinc-700", bg: "bg-zinc-800/50", text: "text-zinc-400" };

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

export default function InformationHub({ showLimit }: { showLimit?: number }) {
  const [items, setItems] = useState<MalaysiaIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMalaysiaIntelligence(12);
      setItems(data);
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
        const data = await fetchMalaysiaIntelligence(12);
        if (mounted) setItems(data);
      } catch (err) {
        console.warn("[InformationHub] 首次加载失败:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ⚡ 实时感知：触发 RSS 抓取 → AI 摘要 → 写入 malaysia_intelligence
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

      if (inserted > 0) {
        setAiMessage(`⚡ 成功抓取并写入 ${inserted} 条马来西亚商业情报`);
        await new Promise((r) => setTimeout(r, 400));
        await loadData();
      } else {
        if (!result.success) {
          const realErr = result.error || (result.errors && result.errors[0]) || result.message || "未知错误";
          setAiMessage(`❌ ${realErr}`);
        } else {
          setAiMessage(result.message || "暂无新情报");
        }
        await loadData();
      }
    } catch (err: any) {
      setAiMessage(`❌ 网络错误：${err?.message || "请求失败"}`);
    } finally {
      setAiRefreshing(false);
    }
  };

  const handleCopy = async (item: MalaysiaIntelligence) => {
    const tagLine = `—— 摘自【陈皮同学 · 东南亚实局】`;
    const payload = `${item.titleZh}\n[${item.sourceName}] ${formatDate(item.publishedAt)}\n\n${item.summaryZh}\n\n💡 商业启示：${item.keyTakeaway}\n${tagLine}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
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

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const displayItems = typeof showLimit === "number" && showLimit > 0
    ? items.slice(0, showLimit)
    : items;

  return (
    <section id="intelligence" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-10 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            ⚡ 以马来西亚/东盟市场为绝对核心
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          东南亚实局
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500">
          全自动聚合大马核心财经媒体，AI 实时提炼中文摘要与商业启示
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
              aiMessage.startsWith("❌") ? "text-rose-400"
              : aiMessage.startsWith("⚠️") ? "text-amber-400"
              : "text-emerald-400"
            }`}>
              {aiMessage}
            </span>
          )}
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40"
              />
            ))
          : displayItems.map((item, i) => {
              const style = SOURCE_STYLES[item.sourceName] || DEFAULT_SOURCE_STYLE;
              const isExpanded = expandedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                  className={`break-inside-avoid rounded-2xl border bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:bg-zinc-900/60 ${
                    item.isFeatured
                      ? `${style.border} ${style.bg} shadow-lg`
                      : "border-zinc-800"
                  }`}
                >
                  {/* 顶部：来源标签 + 时间 */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.border} ${style.bg} ${style.text}`}>
                      <Newspaper className="h-3 w-3" />
                      {item.sourceName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>

                  {/* 中文标题 */}
                  <h3
                    className="mb-2 cursor-pointer text-sm font-bold leading-snug text-zinc-100 hover:text-emerald-300"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {item.titleZh}
                  </h3>

                  {/* AI 中文摘要 */}
                  <div className="mb-3">
                    <span className="mb-1.5 inline-block rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                      AI 摘要
                    </span>
                    <p className={`text-xs leading-relaxed text-zinc-400 ${isExpanded ? "" : "line-clamp-3"}`}>
                      {item.summaryZh}
                    </p>
                    {item.summaryZh.length > 80 && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        {isExpanded ? "收起" : "展开"}
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* 商业启示卡片 */}
                  {item.keyTakeaway && (
                    <div className="mb-3 rounded-lg border-l-[3px] border-emerald-500/60 bg-gradient-to-br from-emerald-500/10 via-zinc-900/40 to-transparent p-2.5">
                      <span className="mb-1 inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                        <Lightbulb className="h-2.5 w-2.5" />
                        商业启示
                      </span>
                      <p className="text-xs leading-relaxed text-zinc-300">
                        {item.keyTakeaway}
                      </p>
                    </div>
                  )}

                  {/* 底部：复制 + 查看原文 */}
                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                    <span className="text-[10px] text-zinc-600 line-clamp-1 max-w-[40%]">
                      {item.titleEn}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item);
                        }}
                        title="一键复制（摘要 + 商业启示）"
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
                            复制
                          </>
                        )}
                      </button>
                      <a
                        href={/^https?:\/\//.test(item.sourceUrl) ? item.sourceUrl : `https://${item.sourceUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800"
                      >
                        原文
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
        {!loading && displayItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 text-center"
          >
            <Radar className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
            <p className="mb-2 text-sm text-zinc-500">暂无马来西亚商业情报</p>
            <p className="text-xs text-zinc-600">点击上方「⚡ 实时感知」按钮，自动抓取大马财经媒体并 AI 提炼</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 首页模式：跳转完整列表 */}
      {typeof showLimit === "number" && !loading && displayItems.length > 0 && (
        <LoadMoreButton href="/hub" label="进入东南亚实局完整列表" />
      )}
    </section>
  );
}
