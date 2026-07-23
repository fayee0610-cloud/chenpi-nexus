"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Tag,
  X,
  Calendar,
  User,
  Target,
  Lightbulb,
  ExternalLink,
  MessageCircle,
  Zap,
} from "lucide-react";

type TabKey = "brand" | "ai" | "experiment";

interface Project {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  date: string;
  role: string;
  metrics: { value: string; label: string }[];
  tags: string[];
  tab: TabKey;
  category: string;
  challenge: string;
  solutions: { title: string; detail: string }[];
  demoUrl?: string;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "brand", label: "品牌与市场战术" },
  { key: "ai", label: "AI 与硬件探索" },
  { key: "experiment", label: "阶段性创意实验" },
];

const portfolioProjects: Project[] = [
  {
    id: 1,
    title: "新马 & 跨境品牌全球化定位与 DTC 独立站增长路线",
    subtitle: "从 0 到 1 搭建跨境品牌定位体系，驱动 DTC 独立站增长飞轮",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=600&fit=crop",
    date: "2024.03 - 2024.09",
    role: "品牌策略总监",
    metrics: [
      { value: "GMV +180%", label: "海外独立站季度增长" },
      { value: "100k+", label: "搜索品牌词曝光突破" },
      { value: "3.2%", label: "独立站转化率" },
    ],
    tags: ["品牌战术", "跨境出海", "独立站"],
    tab: "brand",
    category: "品牌与市场战术",
    challenge:
      "新马地区消费电子品牌面临出海定位模糊、DTC 独立站流量结构单一、品牌词搜索量近乎为零的困境。传统铺货模式遭遇平台流量红利见顶，亟需建立品牌侧护城河与独立增长通道。",
    solutions: [
      {
        title: "品牌定位与视觉体系重塑",
        detail:
          "基于东南亚 + 欧美双市场调研，提炼品牌核心价值主张，重构视觉识别系统（VI），建立跨市场统一的品牌叙事框架。",
      },
      {
        title: "DTC 独立站增长飞轮搭建",
        detail:
          "搭建 Shopify 独立站 + Google Ads + Meta Ads 投放体系，配合 SEO 内容矩阵与 KOL 合作，实现自然流量占比从 5% 提升至 35%。",
      },
      {
        title: "数据驱动的用户留存策略",
        detail:
          "部署 GA4 + Mixpanel 事件追踪，构建用户分层 RFM 模型，通过 EDM 与再营销广告将复购率提升至 42%。",
      },
    ],
    demoUrl: "https://example.com/demo-brand",
  },
  {
    id: 2,
    title: "AI Agent 赋能硬件选型与自动化市场情报系统",
    subtitle: "搭建多 Agent 协作系统，实现硬件选型与市场情报的全自动化",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
    date: "2024.06 - 至今",
    role: "AI 硬件探索者 & 架构设计",
    metrics: [
      { value: "效率 +400%", label: "情报收集效率提升" },
      { value: "10+", label: "自动化 Workflow" },
      { value: "24/7", label: "全天候市场监控" },
    ],
    tags: ["AI 硬件", "Coze/OpenClaw", "自动化"],
    tab: "ai",
    category: "AI 与硬件探索",
    challenge:
      "硬件选型需跨数十个供应商比对参数与价格，市场情报依赖人工爬取与整理，效率低、覆盖窄、延迟高。团队需要一个能 7×24 自动运转的情报系统来支撑快速决策。",
    solutions: [
      {
        title: "多 Agent 协作架构设计",
        detail:
          "基于 Coze / OpenClaw 搭建「采集 Agent → 分析 Agent → 决策 Agent」三层架构，自动抓取供应商数据、比对参数、生成选型报告。",
      },
      {
        title: "10+ 自动化 Workflow 编排",
        detail:
          "覆盖价格监控、竞品分析、供应链预警、需求趋势预测等场景，情报产出从人工 3 天压缩至自动 15 分钟。",
      },
      {
        title: "硬件选型知识图谱",
        detail:
          "构建设备参数知识图谱与供应商评分模型，结合 AI 推荐引擎，将选型决策准确率提升至 92%。",
      },
    ],
    demoUrl: "https://example.com/demo-ai",
  },
  {
    id: 3,
    title: "「湾区博聘」超级个体多平台内容与灵感测试",
    subtitle: "以超级个体身份搭建多平台内容矩阵，验证冷启动方法论",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
    date: "2024.01 - 2024.06",
    role: "脑洞创造者 & 独立运营",
    metrics: [
      { value: "4000+", label: "冷启动高粘性读者" },
      { value: "20w+", label: "矩阵曝光量" },
      { value: "12%", label: "互动率（行业均值 3%）" },
    ],
    tags: ["创意实验", "内容矩阵", "极客尝试"],
    tab: "experiment",
    category: "阶段性创意实验",
    challenge:
      "以一人之力验证「超级个体」内容矩阵的可行性——在没有团队、没有预算的前提下，能否通过多平台内容分发与精准话题运营，在 6 个月内建立高粘性读者群？",
    solutions: [
      {
        title: "多平台内容矩阵搭建",
        detail:
          "同步运营公众号、小红书、即刻、少数派 4 个平台，针对不同平台调性定制内容切片策略，单篇内容复用率达到 300%。",
      },
      {
        title: "热点话题雷达与快速创作",
        detail:
          "搭建基于 RSS + AI 摘要的话题监控系统，从热点发现到内容发布平均周期 < 4 小时，抢占了多个行业话题首发窗口。",
      },
      {
        title: "读者社群与反馈飞轮",
        detail:
          "通过「内容 → 评论区互动 → 社群沉淀 → 下期选题」的闭环，将读者互动率稳定在 12%，远超行业 3% 均值。",
      },
    ],
  },
];

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<TabKey>("brand");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = portfolioProjects.filter((p) => p.tab === activeTab);

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
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all hover:-translate-y-1 hover:border-zinc-700"
              >
                {/* 图片 */}
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
                        {project.metrics[0].value}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {project.metrics[0].label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 内容 */}
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
                    {selectedProject.subtitle}
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
                    <img
                      src={selectedProject.image}
                      alt={selectedProject.title}
                      className="h-64 w-full object-cover brightness-90 contrast-110"
                    />
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
                  {selectedProject.demoUrl && (
                    <button
                      onClick={() =>
                        window.open(selectedProject.demoUrl, "_blank")
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      访问项目线上 Demo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
