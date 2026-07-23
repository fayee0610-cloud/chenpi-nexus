"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Eye, Tag } from "lucide-react";

type TabKey = "brand" | "ai" | "experiment";

interface Project {
  id: number;
  title: string;
  image: string;
  metric: string;
  metricLabel: string;
  tags: string[];
  tab: TabKey;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "brand", label: "品牌与市场战术" },
  { key: "ai", label: "AI 与硬件探索" },
  { key: "experiment", label: "阶段性创意实验" },
];

const projects: Project[] = [
  {
    id: 1,
    title: "新锐消费电子品牌 0-1 冷启动",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=500&fit=crop",
    metric: "GMV +180%",
    metricLabel: "首季度增长",
    tags: ["品牌策略", "增长黑客"],
    tab: "brand",
  },
  {
    id: 2,
    title: "SaaS 产品年度整合营销战役",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
    metric: "曝光 500W+",
    metricLabel: "全渠道触达",
    tags: ["B2B 营销", "内容运营"],
    tab: "brand",
  },
  {
    id: 3,
    title: "AI 驱动的智能家居交互原型",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=500&fit=crop",
    metric: "交互效率 +60%",
    metricLabel: "用户测试",
    tags: ["AI 产品", "硬件设计"],
    tab: "ai",
  },
  {
    id: 4,
    title: "边缘计算设备语音助手调优",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop",
    metric: "延迟 < 200ms",
    metricLabel: "端到端响应",
    tags: ["LLM", "边缘 AI"],
    tab: "ai",
  },
  {
    id: 5,
    title: "Web3 社区品牌视觉实验",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=500&fit=crop",
    metric: "社区增长 3x",
    metricLabel: "3 个月",
    tags: ["视觉设计", "社区运营"],
    tab: "experiment",
  },
  {
    id: 6,
    title: "生成式 AI 短视频工作流",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=500&fit=crop",
    metric: "产能提升 10x",
    metricLabel: "日产出量",
    tags: ["AIGC", "工作流"],
    tab: "experiment",
  },
];

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<TabKey>("brand");
  const filtered = projects.filter((p) => p.tab === activeTab);

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
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-lg font-bold text-white">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        {project.metric}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {project.metricLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-3 text-base font-semibold text-zinc-100">
                    {project.title}
                  </h3>
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
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
