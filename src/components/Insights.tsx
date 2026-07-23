"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, BookOpen, Headphones, MessageSquare, ImageIcon } from "lucide-react";

type FilterKey = "all" | "featured" | "article" | "short" | "podcast";

interface InsightItem {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  type: FilterKey;
  readTime?: string;
  listenTime?: string;
  isFeatured?: boolean;
}

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "featured", label: "✦ 精选" },
  { key: "article", label: "图文长文" },
  { key: "short", label: "核心短观点" },
  { key: "podcast", label: "播客与音频" },
];

const insights: InsightItem[] = [
  {
    id: 1,
    title: "AI 时代品牌叙事范式转移：从功能诉求到情感共生",
    excerpt:
      "当生成式 AI 让产品功能趋同，品牌如何通过叙事构建不可替代的情感护城河？本文深入解析 6 个先锋案例。",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop",
    type: "article",
    readTime: "5 min",
    isFeatured: true,
  },
  {
    id: 2,
    title: "短观点：硬件产品的「冷启动」需要热内容",
    excerpt: "硬件创业不是技术竞赛，而是内容密度的较量。",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop",
    type: "short",
    isFeatured: true,
  },
  {
    id: 3,
    title: "播客 EP.12 | 和硬件创业者聊聊 AI 产品的灵魂",
    excerpt: "收听时长 32 分钟",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=400&h=300&fit=crop",
    type: "podcast",
    listenTime: "32 min",
    isFeatured: true,
  },
  {
    id: 4,
    title: "营销自动化工具的选型陷阱与避坑指南",
    excerpt: "市面上 80% 的 MarTech 工具都在贩卖焦虑，真正有价值的只有这三类。",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    type: "article",
    readTime: "8 min",
  },
  {
    id: 5,
    title: "短观点：内容复利 > 流量赌博",
    excerpt: "可持续的内容资产才是长期 ROI 的来源。",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    type: "short",
  },
  {
    id: 6,
    title: "播客 EP.11 | 品牌人如何与 AI 协作而不被取代",
    excerpt: "收听时长 28 分钟",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop",
    type: "podcast",
    listenTime: "28 min",
  },
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

export default function Insights() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const featured = insights.filter((i) => i.isFeatured);
  const heroFeatured = featured[0];
  const sideFeatured = featured.slice(1);

  const regular = insights.filter((i) => {
    if (filter === "all") return !i.isFeatured;
    if (filter === "featured") return false;
    return !i.isFeatured && i.type === filter;
  });

  return (
    <section id="insights" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            灵感点
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            关于品牌、AI 与创意的深度思考与碎片灵感
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
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

        {/* Featured Focus Area */}
        {(filter === "all" || filter === "featured") && (
          <div className="mb-10 grid gap-6 lg:grid-cols-3">
            {/* Hero Featured */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-zinc-900/40 lg:col-span-2">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-blue-500/20" />
              <div className="relative h-64 overflow-hidden sm:h-80">
                <img
                  src={heroFeatured.image}
                  alt={heroFeatured.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
              </div>
              <div className="relative p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    <Star className="h-3 w-3 fill-blue-400" />
                    深度推荐
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {heroFeatured.readTime} 深度阅读
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-zinc-50 sm:text-2xl">
                  {heroFeatured.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {heroFeatured.excerpt}
                </p>
              </div>
            </div>

            {/* Side Featured Stack */}
            <div className="flex flex-col gap-6">
              {sideFeatured.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:border-zinc-700"
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        {typeIcon[item.type]}
                        {typeLabel[item.type]}
                      </span>
                      {item.listenTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                          <Headphones className="h-3 w-3" />
                          {item.listenTime}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Flow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {regular.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
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
                    {item.listenTime && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                        <Headphones className="h-3 w-3" />
                        {item.listenTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="mb-2 text-sm font-semibold text-zinc-100 line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2">
                    {item.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
