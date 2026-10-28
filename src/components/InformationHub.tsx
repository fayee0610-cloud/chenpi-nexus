"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  CalendarClock,
  X,
  Maximize2,
  Tag,
} from "lucide-react";
import { fetchMalaysiaIntelligence } from "@/lib/dataApi";
import { type MalaysiaIntelligence } from "@/data/siteData";
import LoadMoreButton from "@/components/LoadMoreButton";

// 来源媒体对应的主题色
const SOURCE_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  "MIDA Official": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "MIDA News": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "MATRADE News": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400" },
  "The Star Business": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400" },
  "Bernama Business": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" },
  "New Straits Times Biz": { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  "New Straits Times": { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  "The Edge Malaysia": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400" },
  "Malay Mail Money": { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400" },
  // v5 多源配衡新增信源
  "FMT Business": { border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-400" },
  "Vulcan Post": { border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400" },
  "Google News Policy": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "Google News Halal": { border: "border-lime-500/30", bg: "bg-lime-500/10", text: "text-lime-400" },
  "Google News Food": { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-400" },
  "Google News Beauty": { border: "border-pink-500/30", bg: "bg-pink-500/10", text: "text-pink-400" },
  "Google News AgriB2B": { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400" },
  "Google News Commerce": { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-400" },
  // v6 双轨制新增信源
  "MIDA": { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "Google News Business": { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400" },
  "Google News Economy": { border: "border-sky-500/30", bg: "bg-sky-500/10", text: "text-sky-400" },
  "Business Today MY": { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-400" },
  "Google News Social": { border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/10", text: "text-fuchsia-400" },
  "Inside Retail Asia": { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-400" },
  "TechInAsia Malaysia": { border: "border-indigo-500/30", bg: "bg-indigo-500/10", text: "text-indigo-400" },
  "SoyaCincau": { border: "border-green-500/30", bg: "bg-green-500/10", text: "text-green-400" },
  "Lowyat.NET": { border: "border-lime-500/30", bg: "bg-lime-500/10", text: "text-lime-400" },
  "Reddit r/malaysia": { border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-300" },
  "Reddit MalaysianPF": { border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-300" },
  "Google News Lowyat": { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" },
};

const DEFAULT_SOURCE_STYLE = { border: "border-zinc-700", bg: "bg-zinc-800/50", text: "text-zinc-400" };

// v6 双轨制：来源属性静态映射（零 DDL——track 不入库，按 sourceName 前端判定）
// 🏛️ 官方政策（MIDA/MATRADE 等） / 📊 财经主流（大报与垂直媒体） / 💬 本地舆情（Reddit/Lowyat 论坛）
type SourceTrack = "official" | "business" | "community";
const SOURCE_TRACK: Record<string, SourceTrack> = {
  // 官方政策轨道
  "MIDA": "official",
  "MIDA Official": "official",
  "MIDA News": "official",
  "MATRADE News": "official",
  "Google News Policy": "official",
  // 财经主流轨道
  "FMT Business": "business",
  "Google News Business": "business",
  "Google News Economy": "business",
  "Business Today MY": "business",
  "Vulcan Post": "business",
  "Google News Halal": "business",
  "Google News Food": "business",
  "Google News Beauty": "business",
  "Google News AgriB2B": "business",
  "Google News Commerce": "business",
  "Google News Social": "business",
  "Inside Retail Asia": "business",
  "TechInAsia Malaysia": "business",
  "SoyaCincau": "business",
  "Lowyat.NET": "business",
  "The Star Business": "business",
  "Bernama Business": "business",
  "New Straits Times Biz": "business",
  "The Edge Malaysia": "business",
  "Malay Mail Money": "business",
  // 本地舆情轨道
  "Reddit r/malaysia": "community",
  "Reddit MalaysianPF": "community",
  "Google News Lowyat": "community",
};

const TRACK_BADGE: Record<SourceTrack, { label: string; className: string }> = {
  official: { label: "🏛️ 官方政策", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  business: { label: "📊 财经主流", className: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  community: { label: "💬 本地舆情", className: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
};

// 未匹配到映射的来源：Google News 系默认财经主流，其余不展示徽章
function getTrack(sourceName?: string): SourceTrack | null {
  if (!sourceName) return null;
  if (SOURCE_TRACK[sourceName]) return SOURCE_TRACK[sourceName];
  if (sourceName.startsWith("Google News")) return "business";
  return null;
}

// 默认展示 6 条，展开后最多 18 条；数据池拉 60 条（保底类目补位的弹药库）
const DEFAULT_LIMIT = 6;
const EXPANDED_LIMIT = 18;
const FETCH_POOL = 60;

// v6 保底类目清单：与后端 QUOTA_CATS 对齐（核心出海板块前台至少可见 1 条）
const QUOTA_DISPLAY_CATS = ["政策/贸易", "清真/食品", "美妆/消费", "农业/B2B", "3C数码", "渠道/电商"];

// v6 保底配额展示补位：全部视图的默认窗口（18 条）若缺失某保底类目，
// 将该类目最新 1 条提升入窗口（等量置换窗口尾部最旧条目，不丢弃数据，仅顺延）
function backfillQuota(pool: MalaysiaIntelligence[]): MalaysiaIntelligence[] {
  if (pool.length <= EXPANDED_LIMIT) return pool;
  const windowItems = pool.slice(0, EXPANDED_LIMIT);
  const windowCats = new Set(windowItems.map((i) => i.category));
  const missing = QUOTA_DISPLAY_CATS.filter((c) => !windowCats.has(c));
  if (missing.length === 0) return pool;
  const used = new Set(windowItems.map((i) => i.id));
  const picks: MalaysiaIntelligence[] = [];
  for (const cat of missing) {
    const pick = pool.find((i) => i.category === cat && !used.has(i.id));
    if (pick) {
      picks.push(pick);
      used.add(pick.id);
    }
  }
  if (picks.length === 0) return pool;
  const keepCount = Math.max(EXPANDED_LIMIT - picks.length, DEFAULT_LIMIT);
  const kept = windowItems.slice(0, keepCount);
  const keptIds = new Set(kept.map((i) => i.id));
  const rest = pool.filter((i) => !keptIds.has(i.id));
  return [...kept, ...picks, ...rest];
}

// 分类筛选 Tab（与后端 category 字段对齐：行业赛道八分类）
const CATEGORY_TABS = ["全部", "政策/贸易", "清真/食品", "美妆/消费", "农业/B2B", "3C数码", "渠道/电商", "金融/科技", "展会/活动"];

// AI 情报价值打分标签（1-5 分）
function getImportanceBadge(score?: number): { label: string; className: string } | null {
  if (!score || score < 4) return null;
  if (score >= 5) return { label: "★ 重点关注", className: "bg-rose-500/15 text-rose-300 border-rose-500/40" };
  return { label: "高价值", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
}

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
  const [showAll, setShowAll] = useState(false); // 展开更多历史情报
  const [selectedItem, setSelectedItem] = useState<MalaysiaIntelligence | null>(null); // 详情弹窗
  const [activeCategory, setActiveCategory] = useState<string>("全部"); // 分类筛选
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set()); // 刚抓取的新情报高亮

  const loadData = async (silent = false): Promise<MalaysiaIntelligence[]> => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchMalaysiaIntelligence(FETCH_POOL);
      setItems(data);
      return data;
    } catch (err: any) {
      console.warn("[InformationHub] loadData 失败:", err?.message || err);
      if (!silent) setItems([]);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMalaysiaIntelligence(FETCH_POOL);
        if (mounted) setItems(data);
      } catch (err) {
        console.warn("[InformationHub] 首次加载失败:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 详情弹窗：ESC 关闭 + 禁用背景滚动
  useEffect(() => {
    if (!selectedItem) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  // ⚡ 实时感知：触发 RSS 抓取 → AI 摘要 → upsert malaysia_intelligence
  // 携带 cooldown=1 参数，后端检查 3 分钟冷却防护
  const handleAiRefresh = async () => {
    setAiRefreshing(true);
    setAiMessage(null);
    try {
      const res = await fetch("/api/cron/fetch-intelligence?cooldown=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // 防御：Vercel 超时/异常会返回非 JSON 文本页（如 "An error occurred..."），
      // 这里先校验 content-type，避免 res.json() 在首字母处崩溃。
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("application/json")) {
        // 非 JSON 响应（通常是 Serverless 超时或运行时错误页），尝试读文本用于诊断
        let detail = "";
        try {
          detail = (await res.text()).slice(0, 120);
        } catch { /* 忽略 */ }
        setAiMessage(
          res.status === 504 || res.status === 502
            ? "⏳ 感知超时：RSS+AI 流水线耗时过长，请稍后重试（数据仍可在下方查看历史）"
            : `⚠ 感知服务异常${detail ? `：${detail}` : ""}`
        );
        setAiRefreshing(false);
        return;
      }

      let result: any;
      try {
        result = await res.json();
      } catch {
        setAiMessage("⚠ 响应解析失败，请稍后重试");
        setAiRefreshing(false);
        return;
      }

      if (!result || result.success === false) {
        setAiMessage(result?.error ? `⚠ ${result.error}` : "⚠ 感知失败，请稍后重试");
        setAiRefreshing(false);
        return;
      }

      // 冷却中：距离上次更新 <3 分钟，直接提示不重复消耗 Token
      if (result.cooldown === true) {
        setAiMessage(result.message || "⏳ 刚刚已更新过，请稍后再试");
        setAiRefreshing(false);
        return;
      }

      // 感知完成：回读数据库获取最新排序后的全量数据
      setAiMessage(result.message || "⚡ 已更新最新大马商业情报");
      const prevIds = new Set(items.map((i) => i.id));
      const dbData = await loadData(true);

      // 标记新出现的情报 ID 用于高亮
      if (dbData.length > 0) {
        const newIds = new Set<string>();
        dbData.forEach((item) => {
          if (!prevIds.has(item.id)) newIds.add(item.id);
        });
        if (newIds.size > 0) {
          setNewItemIds(newIds);
          setTimeout(() => setNewItemIds(new Set()), 5000);
        }
      }

      // 兜底：DB 回读为空时，用 API 返回的 result.data 渲染
      if ((!dbData || dbData.length === 0) && Array.isArray(result.data) && result.data.length > 0) {
        // 将 API 返回的内存数据 prepend 到当前列表顶部
        const apiItems = result.data as MalaysiaIntelligence[];
        const apiNewIds = new Set(apiItems.map((i) => i.id));
        setItems((prev) => [...apiItems, ...prev.filter((i) => !apiNewIds.has(i.id))]);
        setShowAll(false);
        setNewItemIds(apiNewIds);
        setTimeout(() => setNewItemIds(new Set()), 5000);
        if (result.persisted === false) {
          setAiMessage("⚡ 已加载最新情报（本次 DB 未持久化，刷新后需重新感知）");
        }
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

  // 首页模式：使用 showLimit；否则默认 6 条，展开后 18 条
  const isHomeMode = typeof showLimit === "number" && showLimit > 0;
  const currentLimit = isHomeMode ? showLimit! : (showAll ? EXPANDED_LIMIT : DEFAULT_LIMIT);

  // 原新闻发布时间倒序排序（真实时序优先，避免同批次抓取全部挤在一起）
  // importanceScore 仅在发布时间相同时作为二次排序依据
  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.publishedAt || 0).getTime();
    const timeB = new Date(b.publishedAt || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.importanceScore || 3) - (a.importanceScore || 3);
  });

  // v6 保底配额展示：全部视图按保底类目补位重排（防单一分类霸屏）；分类视图维持纯时间序
  const filteredItems =
    activeCategory === "全部"
      ? backfillQuota(sortedItems)
      : sortedItems.filter((item) => item.category === activeCategory);

  const displayItems = filteredItems.slice(0, currentLimit);
  const hasMore = !isHomeMode && !showAll && filteredItems.length > DEFAULT_LIMIT;

  return (
    <section id="intelligence" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          东南亚实局
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500">
          聚合大马官方机构、财经大报、垂直行业与本地社区舆情（双轨制），AI 按行业提炼中文摘要与商业启示
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
              : aiMessage.startsWith("⏳") ? "text-amber-400"
              : aiMessage.startsWith("⚠️") ? "text-amber-400"
              : "text-emerald-400"
            }`}>
              {aiMessage}
            </span>
          )}
        </div>
      </div>

      {/* 分类筛选 Tab */}
      {!isHomeMode && items.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {CATEGORY_TABS.map((cat) => {
            const count =
              cat === "全部"
                ? items.length
                : items.filter((it) => it.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "border-purple-500/50 bg-purple-500/15 text-purple-200"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {cat}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  activeCategory === cat ? "bg-purple-500/30 text-purple-100" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
              const isNew = newItemIds.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                  className={`break-inside-avoid rounded-2xl border bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:bg-zinc-900/60 ${
                    isNew
                      ? "border-blue-500/50 ring-1 ring-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                      : item.isFeatured
                      ? `${style.border} ${style.bg} shadow-lg`
                      : "border-zinc-800"
                  }`}
                >
                  {/* 顶部：来源标签 + 分类 + 价值徽章 + 发布时间 */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.border} ${style.bg} ${style.text}`}>
                        <Newspaper className="h-3 w-3" />
                        {item.sourceName}
                      </span>
                      {item.category && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                          <Tag className="h-2.5 w-2.5" />
                          {item.category}
                        </span>
                      )}
                      {(() => {
                        // v6 双轨制：来源属性徽章（🏛️ 官方政策 / 📊 财经主流 / 💬 本地舆情）
                        const track = getTrack(item.sourceName);
                        if (!track) return null;
                        const tb = TRACK_BADGE[track];
                        return (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tb.className}`}>
                            {tb.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const badge = getImportanceBadge(item.importanceScore);
                        if (!badge) return null;
                        return (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
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
                          setSelectedItem(item);
                        }}
                        title="打开完整详情弹窗"
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-all hover:border-purple-500/40 hover:bg-zinc-800 hover:text-purple-300"
                      >
                        <Maximize2 className="h-3 w-3" />
                        详情
                      </button>
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

      {/* 展开更多大马商业情报 */}
      {!isHomeMode && !loading && items.length > DEFAULT_LIMIT && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100"
          >
            <CalendarClock className="h-4 w-4 text-purple-400" />
            {showAll ? "收起历史情报" : "展开更多大马商业情报"}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}

      {/* 获客引导锚点 */}
      {!isHomeMode && !loading && items.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            <span className="mr-1">💡</span>
            需要针对您产品的马来西亚定制化 GTM 策略与 Halal 准入评估？
            <button
              onClick={() => {
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="ml-1 inline-flex items-center gap-1 text-purple-400 underline decoration-purple-500/30 underline-offset-4 transition-colors hover:text-purple-300 hover:decoration-purple-500/60"
            >
              点击预约 1v1 咨询
              <ExternalLink className="h-3 w-3" />
            </button>
          </p>
        </div>
      )}

      {/* 首页模式：跳转完整列表 */}
      {isHomeMode && !loading && displayItems.length > 0 && (
        <LoadMoreButton href="/hub" label="进入东南亚实局完整列表" />
      )}

      {/* ===== 完整情报详情弹窗（React Portal 挂载 document.body）===== */}
      {selectedItem && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 z-10 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1.5 text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-100"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 来源 + 时间 + 分类 */}
              <div className="mb-4 flex flex-wrap items-center gap-2 pr-10">
                {(() => {
                  const st = SOURCE_STYLES[selectedItem.sourceName] || DEFAULT_SOURCE_STYLE;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${st.border} ${st.bg} ${st.text}`}>
                      <Newspaper className="h-3 w-3" />
                      {selectedItem.sourceName}
                    </span>
                  );
                })()}
                {selectedItem.category && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-medium text-purple-300">
                    <Tag className="h-3 w-3" />
                    {selectedItem.category}
                  </span>
                )}
                {(() => {
                  // v6 双轨制：详情弹窗同步展示来源属性徽章
                  const track = getTrack(selectedItem.sourceName);
                  if (!track) return null;
                  const tb = TRACK_BADGE[track];
                  return (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tb.className}`}>
                      {tb.label}
                    </span>
                  );
                })()}
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(selectedItem.publishedAt)}
                </span>
              </div>

              {/* 中文标题 */}
              <h2 className="mb-4 text-xl font-bold leading-snug text-zinc-50">
                {selectedItem.titleZh}
              </h2>

              {/* 原始英文标题 */}
              {selectedItem.titleEn && selectedItem.titleEn !== selectedItem.titleZh && (
                <p className="mb-5 text-xs leading-relaxed text-zinc-500">{selectedItem.titleEn}</p>
              )}

              {/* AI 摘要 */}
              <div className="mb-5">
                <span className="mb-2 inline-block rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                  AI 摘要
                </span>
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                  {selectedItem.summaryZh}
                </p>
              </div>

              {/* 商业启示 */}
              {selectedItem.keyTakeaway && (
                <div className="mb-5 rounded-xl border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/10 via-zinc-900/40 to-transparent p-4">
                  <span className="mb-2 inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <Lightbulb className="h-3 w-3" />
                    商业启示 / 营销落地建议
                  </span>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">
                    {selectedItem.keyTakeaway}
                  </p>
                </div>
              )}

              {/* 标签 */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {selectedItem.tags.map((t, i) => (
                    <span key={i} className="rounded-md border border-zinc-800 bg-zinc-800/40 px-2 py-0.5 text-[11px] text-zinc-400">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* 底部操作 */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => handleCopy(selectedItem)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    copiedId === selectedItem.id
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-purple-500/40 hover:bg-zinc-800 hover:text-purple-300"
                  }`}
                >
                  {copiedId === selectedItem.id ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === selectedItem.id ? "已复制" : "复制情报"}
                </button>
                {selectedItem.sourceUrl && (
                  <a
                    href={/^https?:\/\//.test(selectedItem.sourceUrl) ? selectedItem.sourceUrl : `https://${selectedItem.sourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    查看原文
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
