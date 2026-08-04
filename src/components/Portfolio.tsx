"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Tag,
  X,
  Calendar,
  User,
  Target,
  Lightbulb,
  MessageCircle,
  Zap,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { siteData } from "@/data/siteData";
import type { PortfolioProject } from "@/data/siteData";
import { fetchProjects } from "@/lib/dataApi";
import LoadMoreButton from "@/components/LoadMoreButton";

type TabKey = "brand" | "ai" | "experiment";

const tabs = siteData.portfolio.categories;

export default function Portfolio({ showLimit }: { showLimit?: number }) {
  const [activeTab, setActiveTab] = useState<TabKey>("brand");
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 Supabase 加载真实数据
  useEffect(() => {
    let mounted = true;
    fetchProjects().then((data) => {
      if (mounted) {
        setPortfolioProjects(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = (() => {
    const list = portfolioProjects.filter((p) => p.tab === activeTab);
    if (typeof showLimit === "number" && showLimit > 0) {
      return list.slice(0, showLimit);
    }
    return list;
  })();

  // ESC 关闭 + 禁用背景滚动
  useEffect(() => {
    if (!selectedProject) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProject(null);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedProject]);

  // 关闭 Modal 并滚动至联系区
  const handleCloseAndScrollToConnect = useCallback(() => {
    setSelectedProject(null);
    setTimeout(() => {
      document.getElementById("connect")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, []);

  return (
    <section id="portfolio" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            作品集
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            从品牌战略到 AI 硬件探索，持续交付可量化的创意价值
          </p>
          <Link
            href="/portfolio"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-purple-500/40 hover:text-purple-300"
          >
            查看全部
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-100 text-zinc-950"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="portfolio-tab"
                  className="absolute inset-0 -z-10 rounded-xl bg-zinc-100"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Target className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">该分类下暂无作品</p>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
              >
                {/* 图片 - 16:9 自适应防变形 */}
                <div className="relative aspect-video overflow-hidden">
                  {project.image?.trim() ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    {project.metrics[0] && (
                      <div>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          {project.metrics[0].value}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {project.metrics[0].label}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 内容 */}
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-100">
                      {project.title}
                    </h3>
                    <Link
                      href={`/portfolio/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title="查看独立详情页"
                      className="flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-500 transition-all hover:border-purple-500/50 hover:text-purple-300"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover 提示 */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 backdrop-blur-sm">
                    点击查看案例详情 →
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
        )}

        {/* 首页模式：跳转量子页面 */}
        {typeof showLimit === "number" && !loading && filtered.length > 0 && (
          <LoadMoreButton href="/portfolio" label="进入作品集完整列表" />
        )}
      </div>

      {/* ========== 作品案例详情 Modal ========== */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-8 w-full max-w-3xl rounded-2xl border border-purple-500/30 bg-zinc-900 shadow-[0_0_60px_rgba(168,85,247,0.15)]"
            >
              {/* 顶部 Bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-md">
                <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                  [ {selectedProject.category} ]
                </span>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                  关闭
                </button>
              </div>

              {/* 可滚动内容区 */}
              <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-6">
                {/* Header 区 */}
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold leading-tight text-zinc-50">
                    {selectedProject.title}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {selectedProject.subTitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedProject.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {selectedProject.role}
                    </span>
                  </div>
                </div>

                {/* 核心战绩标尺 */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {selectedProject.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-center"
                    >
                      <div
                        className={`text-2xl font-bold ${
                          i === 0
                            ? "text-green-400"
                            : i === 1
                            ? "text-blue-400"
                            : "text-purple-400"
                        }`}
                      >
                        {m.value}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 标签 */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 项目挑战与背景 */}
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <Target className="h-4 w-4 text-blue-400" />
                    项目挑战与背景
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {selectedProject.challenge}
                  </p>
                </div>

                {/* 破局战术与解法 */}
                <div className="mb-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <Lightbulb className="h-4 w-4 text-purple-400" />
                    破局战术与解法
                  </h3>
                  <div className="space-y-3">
                    {selectedProject.solutions.map((s, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-zinc-100">
                            {s.title}
                          </span>
                        </div>
                        <p className="pl-7 text-sm leading-relaxed text-zinc-400">
                          {s.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 赛博视觉/架构图展示区 */}
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <Zap className="h-4 w-4 text-green-400" />
                    赛博视觉 / 架构图
                  </h3>
                  <div className="group relative overflow-hidden rounded-xl border border-zinc-800">
                    {selectedProject.image?.trim() ? (
                      <img
                        src={selectedProject.image}
                        alt={selectedProject.title}
                        className="h-64 w-full object-cover brightness-90 contrast-110"
                      />
                    ) : (
                      <div className="h-64 w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                    {/* 状态灯 */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                      <span className="text-xs text-green-400">DEMO ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* 底部 Actions */}
                <div className="flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
                  <button
                    onClick={handleCloseAndScrollToConnect}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    关于此项目聊聊
                  </button>
                  <Link
                    href={`/portfolio/${selectedProject.id}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm text-zinc-300 transition-all hover:border-purple-500/50 hover:text-purple-300"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    查看独立详情页
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
