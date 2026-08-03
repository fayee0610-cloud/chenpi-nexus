"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  MessageSquare,
  Headphones,
  Search,
  Loader2,
  Eye,
} from "lucide-react";
import Header from "@/components/Header";
import { siteData } from "@/data/siteData";
import type { InsightItem } from "@/data/siteData";
import { fetchInsights } from "@/lib/dataApi";

type FilterKey = "all" | "article" | "short" | "podcast";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "article", label: "图文长文" },
  { key: "short", label: "短观点" },
  { key: "podcast", label: "播客与音频" },
];

const typeIcon: Record<string, React.ReactNode> = {
  article: <BookOpen className="h-3.5 w-3.5" />,
  short: <MessageSquare className="h-3.5 w-3.5" />,
  podcast: <Headphones className="h-3.5 w-3.5" />,
};

const typeLabel: Record<string, string> = {
  article: "长文",
  short: "短观点",
  podcast: "播客",
};

const staticInsights: InsightItem[] = siteData.insights;

export default function InsightsListPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [insights, setInsights] = useState<InsightItem[]>(staticInsights);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchInsights();
        if (mounted) setInsights(data);
      } catch (err) {
        console.warn("[insights] 数据加载失败，已降级处理:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = insights;
    if (filter !== "all") {
      result = result.filter((i) => i.type === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.excerpt.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [insights, filter, searchQuery]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回首页
        </Link>

        {/* 页面标题 */}
        <div className="mt-8 mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            灵感点
          </h1>
          <p className="mx-auto max-w-xl text-zinc-400">
            关于品牌、AI 与创意的深度思考与碎片灵感
          </p>
        </div>

        {/* 搜索 + 标签过滤 */}
        <div className="mb-10 space-y-4">
          {/* 搜索框 */}
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
            <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章标题、摘要或分类..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                清除
              </button>
            )}
          </div>

          {/* 标签过滤 */}
          <div className="flex flex-wrap justify-center gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-zinc-100 text-zinc-950"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              {searchQuery ? "未找到匹配的文章" : "该分类下暂无文章"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/insights/${item.id}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
                >
                  <div className="relative h-44 overflow-hidden">
                    {item.image?.trim() ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
                        {typeIcon[item.type]}
                        {typeLabel[item.type]}
                      </span>
                      {item.readTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                          <Clock className="h-3 w-3" />
                          {item.readTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="mb-2 text-sm font-semibold text-zinc-100 line-clamp-2 group-hover:text-purple-300">
                      {item.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2">
                      {item.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-600">
                      {item.date && <span>{item.date}</span>}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </>
  );
}
