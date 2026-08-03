"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, Tag, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { siteData } from "@/data/siteData";
import type { PortfolioProject } from "@/data/siteData";
import { fetchProjects } from "@/lib/dataApi";

type TabKey = "all" | "brand" | "ai" | "experiment";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "brand", label: "品牌与市场战术" },
  { key: "ai", label: "AI 与硬件探索" },
  { key: "experiment", label: "阶段性创意实验" },
];

const staticProjects: PortfolioProject[] = siteData.portfolio.projects;

export default function PortfolioListPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [projects, setProjects] = useState<PortfolioProject[]>(staticProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchProjects();
        if (mounted) setProjects(data);
      } catch (err) {
        console.warn("[portfolio] 数据加载失败，已降级处理:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered =
    activeTab === "all" ? projects : projects.filter((p) => p.tab === activeTab);

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
            作品集
          </h1>
          <p className="mx-auto max-w-xl text-zinc-400">
            从品牌战略到 AI 硬件探索，持续交付可量化的创意价值
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-100 text-zinc-950"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 作品网格 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-500">
            该分类下暂无作品
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
                <Link
                  key={project.id}
                  href={`/portfolio/${project.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
                >
                  {/* 图片 */}
                  <div className="relative h-48 overflow-hidden">
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
                    {project.metrics[0] && (
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-lg font-bold text-white">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {project.metrics[0].value}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {project.metrics[0].label}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="p-5">
                    <h3 className="mb-2 text-base font-semibold text-zinc-100 line-clamp-2">
                      {project.title}
                    </h3>
                    {project.subTitle && (
                      <p className="mb-3 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                        {project.subTitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {project.tags.slice(0, 3).map((tag) => (
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
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </>
  );
}
