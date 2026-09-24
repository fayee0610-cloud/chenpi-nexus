"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Radio } from "lucide-react";
import { siteData } from "@/data/siteData";

// ===== 陈皮口述·大马本地化打招呼轮播数据 =====
const CHENPI_GREETINGS = [
  {
    tag: "☕ Kopitiam",
    quote: "Boss, Teh Tarik Satu! (老板，来杯拉茶！)",
    service: "【政商与本土资源撮合】精准对接大马政企、本地商会与主流分销渠道网络。",
    accent: "text-amber-400",
    dot: "bg-amber-400",
  },
  {
    tag: "👌 Boleh!",
    quote: "在大马，听到 Boleh 心里就稳了一半。",
    service: "【GTM 全流程落地】从 0 到 1 定制大马落地路线图，解决准入与经营难题。",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    tag: "🌙 Halal",
    quote: "不只是清真标志，更是本地人的安心密码。",
    service: "【JAKIM 认证与合规准入】高效打通 68% 本土穆斯林主流消费圈，合规准入。",
    accent: "text-green-400",
    dot: "bg-green-400",
  },
  {
    tag: "🗣️ Lah!",
    quote: "少一点高高在上的 PPT，多一点懂本地人的 Lah。",
    service: "【全渠道本土化营销】涵盖 TikTok 达人孵化、线下快闪打卡与本地多语境传播。",
    accent: "text-purple-400",
    dot: "bg-purple-400",
  },
  {
    tag: "🚀 Jom!",
    quote: "别再观望了，Jom (走起) 出海！",
    service: "【AI 商业情报与敏捷攻坚】实时提炼大马财经政策与竞争动态，高效率决策。",
    accent: "text-blue-400",
    dot: "bg-blue-400",
  },
];

export default function Hero() {
  const { profile } = siteData;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const g = CHENPI_GREETINGS[active];

  // 自动轮播 4.5 秒，hover 暂停
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % CHENPI_GREETINGS.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-10 lg:py-20">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* 12 列响应式网格容器 */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full max-w-7xl mx-auto min-h-[80vh]">

        {/* 左侧文字区 col-span-7 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 min-w-0 flex flex-col items-start space-y-6"
        >
          {/* 单个微光 Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 text-[11px] font-medium text-purple-300">
            ⚡ 聚焦马来西亚 GTM · 清真 Halal 准入 · AI 策略杠杆
          </div>

          {/* 大标题：两行结构，允许自然折行，紫蓝渐变高亮关键词 */}
          <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-zinc-50 break-words sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
            <span className="block">
              以<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">大马</span>为核心，
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">AI</span> 为杠杆
            </span>
            <span className="block">
              提供真实的<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">东南亚</span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">出海判断</span>
            </span>
          </h1>

          <p className="text-base text-zinc-400 sm:text-lg lg:text-xl">
            大马 GTM 策略人 / B2B 品牌出海实践者 / 商业情报洞察
          </p>

          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <a
              href="#intelligence"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("intelligence")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110"
            >
              探索大马实局 ↓
              <ArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-900"
            >
              联系我
            </a>
          </div>
        </motion.div>

        {/* 右侧卡片区 col-span-5 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center lg:justify-end w-full min-w-0"
        >
          {/* 人像卡片：流光外框 + 呼吸外发光 + Hover 升起 */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-full">
            <div className="relative group rounded-2xl p-[2px] bg-gradient-to-br from-purple-500/50 via-indigo-500/30 to-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(168,85,247,0.35)] shadow-[0_0_20px_rgba(168,85,247,0.2)]">

              {/* 内层容器：裁剪溢出，图片高清无遮罩 */}
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-slate-900 aspect-[4/5]">

                {/* 核心图片：高清原色，Hover 微放大拉近 */}
                <img
                  src={profile.avatarUrl}
                  alt="陈皮"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* 图片底部渐变遮罩：让下方气泡文字可读 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* 右上角 SYSTEM: ONLINE 状态灯（呼吸脉冲） */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-green-500/30 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold text-green-400 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </span>
                  <Radio className="h-3 w-3" />
                  📡 SYSTEM: ONLINE
                </div>

                {/* 陈皮口述·大马本地化打招呼轮播气泡 —— 固定在图片下方，绝不遮挡脸部 */}
                <div
                  className="absolute bottom-3 left-3 right-3"
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                >
                  <div className="rounded-2xl border border-white/15 bg-zinc-900/80 p-3 shadow-2xl backdrop-blur-md sm:p-3.5">

                    {/* 顶部标签栏：陈皮说 + 5 个进度点 */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-wide text-zinc-400">
                        🗣️ 陈皮说
                      </span>
                      <div className="flex items-center gap-1.5">
                        {CHENPI_GREETINGS.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => setActive(i)}
                            aria-label={`切换到第 ${i + 1} 条`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === active
                                ? `w-5 ${item.dot}`
                                : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 轮播内容：淡入淡出 + 轻微上移 */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-1.5"
                      >
                        {/* ① 标签胶囊 */}
                        <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-bold tracking-wide ${g.accent}`}>
                          {g.tag}
                        </span>
                        {/* ② 文化金句 —— 斜体口述感 */}
                        <p className="text-sm font-medium italic leading-snug text-zinc-50 break-words">
                          &ldquo;{g.quote}&rdquo;
                        </p>
                        {/* ③ 落地服务 —— 淡色高亮框 */}
                        <p className="text-[11px] leading-relaxed text-zinc-300 break-words">
                          {g.service}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 滚动指示器 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-zinc-700 pt-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
