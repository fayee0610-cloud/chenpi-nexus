"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  BookOpen,
  Headphones,
  MessageSquare,
  X,
  Link2,
  Play,
  Pause,
  ThumbsUp,
  ArrowRight,
  Eye,
  Calendar,
  User,
  Copy,
  Check,
} from "lucide-react";
import { siteData } from "@/data/siteData";
import type { InsightItem } from "@/data/siteData";

type FilterKey = "all" | "featured" | "article" | "short" | "podcast";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "featured", label: "✦ 精选" },
  { key: "article", label: "图文长文" },
  { key: "short", label: "短观点" },
  { key: "podcast", label: "播客与音频" },
];

const insightsData: InsightItem[] = siteData.insights;

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
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showLikeFloat, setShowLikeFloat] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const featured = insightsData.filter((i) => i.isFeatured);
  const heroFeatured = featured[0];
  const sideFeatured = featured.slice(1);

  const regular = insightsData.filter((i) => {
    if (filter === "all") return !i.isFeatured;
    if (filter === "featured") return false;
    return !i.isFeatured && i.type === filter;
  });

  // ESC 关闭 + 禁用背景滚动
  useEffect(() => {
    if (!selectedInsight) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedInsight(null);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedInsight]);

  // 打开 Modal 时重置状态
  useEffect(() => {
    if (selectedInsight) {
      setLikeCount(selectedInsight.likes);
      setCopied(false);
      setShowLikeFloat(false);
      setAudioPlaying(false);
      setAudioProgress(0);
    }
  }, [selectedInsight]);

  // 音频进度模拟
  useEffect(() => {
    if (!audioPlaying || !selectedInsight) return;
    const timer = setInterval(() => {
      setAudioProgress((prev) => {
        if (prev >= 100) {
          setAudioPlaying(false);
          return 100;
        }
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [audioPlaying, selectedInsight]);

  // 复制链接
  const handleCopyLink = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // 点赞 +1 飘字
  const handleLike = useCallback(() => {
    setLikeCount((prev) => prev + 1);
    setShowLikeFloat(true);
    setTimeout(() => setShowLikeFloat(false), 1500);
  }, []);

  // 滚动至指定区域
  const handleScrollTo = useCallback((id: string) => {
    setSelectedInsight(null);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, []);

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
        {(filter === "all" || filter === "featured") && heroFeatured && (
          <div className="mb-10 grid gap-6 lg:grid-cols-3">
            {/* Hero Featured */}
            <div
              onClick={() => setSelectedInsight(heroFeatured)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-500/30 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-blue-500/50 lg:col-span-2"
            >
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
                  onClick={() => setSelectedInsight(item)}
                  className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
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
                      {item.readTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {item.readTime}
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
                onClick={() => setSelectedInsight(item)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
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

      {/* ========== 沉浸式阅读器 Modal ========== */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedInsight(null)}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/90 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", bounce: 0.12, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-purple-500/30 bg-zinc-950/95 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
            >
              {/* 顶部阅读工具栏 */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
                    [ {selectedInsight.category} ]
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {selectedInsight.readTime || selectedInsight.listenTime} read
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5" />
                        复制链接
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    关闭 (ESC)
                  </button>
                </div>
              </div>

              {/* 可滚动内容区 */}
              <div className="max-h-[calc(85vh-56px)] overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
                {/* 音频播放器特例 */}
                {selectedInsight.type === "podcast" && (
                  <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setAudioPlaying(!audioPlaying)}
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                      >
                        {audioPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 translate-x-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
                          <span>{selectedInsight.listenTime} 音频</span>
                          <span>{Math.floor(audioProgress)}%</span>
                        </div>
                        {/* 波浪纹进度条 */}
                        <div className="relative h-10 overflow-hidden rounded-lg bg-zinc-950">
                          <div className="absolute inset-0 flex items-center gap-0.5 px-2">
                            {Array.from({ length: 60 }).map((_, i) => {
                              const barHeight = 20 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.3) * 10;
                              const isActive = (i / 60) * 100 < audioProgress;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 rounded-full transition-colors duration-150"
                                  style={{
                                    height: `${Math.max(4, barHeight)}px`,
                                    background: isActive
                                      ? "linear-gradient(to top, #a855f7, #3b82f6)"
                                      : "rgba(63, 63, 70, 0.5)",
                                  }}
                                />
                              );
                            })}
                          </div>
                          {/* 播放头 */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                            style={{ left: `${audioProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 文章 Header */}
                <div className="mb-8">
                  <h1 className="mb-4 text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">
                    {selectedInsight.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedInsight.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {selectedInsight.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {selectedInsight.views} 阅读
                    </span>
                  </div>
                </div>

                {/* 封面图 */}
                <div className="mb-8 overflow-hidden rounded-xl border border-zinc-800">
                  <img
                    src={selectedInsight.image}
                    alt={selectedInsight.title}
                    className="h-48 w-full object-cover brightness-90 contrast-110 sm:h-64"
                  />
                </div>

                {/* 正文排版 */}
                <article className="space-y-5">
                  {selectedInsight.content.map((block, i) => {
                    if (block.type === "heading") {
                      return (
                        <h2
                          key={i}
                          className="pt-2 text-lg font-bold text-zinc-100 sm:text-xl"
                        >
                          {block.text}
                        </h2>
                      );
                    }
                    if (block.type === "paragraph") {
                      return (
                        <p
                          key={i}
                          className="text-base leading-relaxed text-zinc-300 md:text-lg"
                        >
                          {block.text}
                        </p>
                      );
                    }
                    if (block.type === "blockquote") {
                      return (
                        <blockquote
                          key={i}
                          className="rounded-r-xl border-l-4 border-purple-500 bg-purple-950/20 p-4 italic text-purple-200"
                        >
                          {block.text}
                        </blockquote>
                      );
                    }
                    if (block.type === "code") {
                      return (
                        <div
                          key={i}
                          className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                            <span className="text-xs text-zinc-500">
                              {block.lang || "code"}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(block.text || "");
                              }}
                              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                            >
                              <Copy className="h-3 w-3" />
                              复制
                            </button>
                          </div>
                          <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-green-400">
                            <code>{block.text}</code>
                          </pre>
                        </div>
                      );
                    }
                    if (block.type === "list") {
                      return (
                        <ul key={i} className="space-y-2">
                          {block.items?.map((item, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-base leading-relaxed text-zinc-300 md:text-lg"
                            >
                              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </article>

                {/* 底部互动区 */}
                <div className="mt-10 border-t border-zinc-800 pt-6">
                  {/* 点赞按钮 + 飘字动画 */}
                  <div className="relative mb-6">
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-medium text-purple-300 transition-all hover:scale-105 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      激发灵感 ({likeCount})
                    </button>
                    <AnimatePresence>
                      {showLikeFloat && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 0.8 }}
                          animate={{ opacity: 0, y: -40, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5 }}
                          className="pointer-events-none absolute left-20 top-0 text-lg font-bold text-purple-400"
                        >
                          +1 ⚡
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 引导转化区 */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <p className="mb-4 text-sm text-zinc-400">
                      对这个观点有同感？去庇护所交流脑洞，或联系我深入探讨。
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => handleScrollTo("sanctuary")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm text-purple-300 transition-all hover:bg-purple-500/20"
                      >
                        去庇护所交流
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleScrollTo("connect")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-blue-500"
                      >
                        联系我深入探讨
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
