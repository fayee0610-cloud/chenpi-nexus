"use client";

import { motion } from "framer-motion";
import { ArrowDown, ShieldCheck, MapPin, CheckCircle2, Zap, Radio } from "lucide-react";

export default function Hero() {
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

        {/* 右侧：大马出海策略指挥舱 —— 错落悬浮 UI 卡片组（替代休闲人像，建立商务信任） */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center lg:justify-end w-full min-w-0"
        >
          <div className="relative w-full max-w-sm lg:max-w-md aspect-[4/5] mx-auto">

            {/* 卡片 1：Halal 准入 AI 流程（左上，微倾 -4°，翡翠呼吸光） */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 0.6, delay: 0.25, type: "spring", stiffness: 120 }}
              whileHover={{ rotate: 0, y: -8, scale: 1.035, transition: { type: "spring", stiffness: 300, damping: 18 } }}
              className="absolute top-[3%] left-[1%] w-[74%] z-10"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: [0.25, 0.5, 0.25] }}
                transition={{ repeat: Infinity, duration: 3.2, delay: 0.4 }}
                className="absolute -inset-1.5 rounded-3xl bg-emerald-500/25 blur-2xl pointer-events-none"
              />
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-3.5 shadow-xl">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">Halal 准入 · AI 流程</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    <Zap className="h-2.5 w-2.5" />AI
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-medium text-zinc-300">
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5">原料审核</span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5">JAKIM 申报</span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded border border-emerald-500/30 px-1.5 py-0.5 text-emerald-400">清真标印</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[9px] text-zinc-500">
                  <span>周期预估</span>
                  <span className="text-zinc-300">8-12 周</span>
                </div>
              </div>
            </motion.div>

            {/* 卡片 2：大马商业情报 LIVE（居中最大，不倾斜，科技蓝呼吸光） */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 120 }}
              whileHover={{ y: -8, scale: 1.035, transition: { type: "spring", stiffness: 300, damping: 18 } }}
              className="absolute top-[27%] left-[14%] w-[82%] z-30"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.8, delay: 0.2 }}
                className="absolute -inset-1.5 rounded-3xl bg-blue-500/30 blur-2xl pointer-events-none"
              />
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/85 backdrop-blur-xl p-4 shadow-2xl">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-100">大马商业情报</span>
                  </div>
                  <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-400">LIVE</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span className="truncate text-[10px] text-zinc-300">大马零售渠道周报</span>
                    <span className="ml-auto shrink-0 text-[8px] text-zinc-500">The Edge · 2h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                    <span className="truncate text-[10px] text-zinc-300">Halal 政策更新</span>
                    <span className="ml-auto shrink-0 text-[8px] text-zinc-500">JAKIM · 5h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="truncate text-[10px] text-zinc-300">令吉汇率波动</span>
                    <span className="ml-auto shrink-0 text-[8px] text-zinc-500">BNM · 1d</span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1 border-t border-zinc-800 pt-2 text-[9px] text-zinc-500">
                  <Radio className="h-2.5 w-2.5 text-blue-400" />
                  本周 <span className="font-semibold text-blue-400">+12</span> 条情报
                </div>
              </div>
            </motion.div>

            {/* 卡片 3：KL/柔佛战略节点（右下，微倾 +4°，钛紫呼吸光） */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ duration: 0.6, delay: 0.55, type: "spring", stiffness: 120 }}
              whileHover={{ rotate: 0, y: -8, scale: 1.035, transition: { type: "spring", stiffness: 300, damping: 18 } }}
              className="absolute bottom-[2%] right-[1%] w-[72%] z-20"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: [0.25, 0.5, 0.25] }}
                transition={{ repeat: Infinity, duration: 3.5, delay: 0.6 }}
                className="absolute -inset-1.5 rounded-3xl bg-purple-500/25 blur-2xl pointer-events-none"
              />
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-3.5 shadow-xl">
                <div className="mb-2.5 flex items-center gap-1.5 text-purple-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">战略节点 · 3 城</span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-400 ring-2 ring-purple-500/30" />
                    <span className="text-[8px] text-zinc-400">巴生谷</span>
                  </div>
                  <span className="h-px flex-1 mx-1 border-t border-dashed border-zinc-700" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500 ring-2 ring-purple-500/40" />
                    <span className="text-[8px] font-medium text-zinc-200">柔佛</span>
                  </div>
                  <span className="h-px flex-1 mx-1 border-t border-dashed border-zinc-700" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-400 ring-2 ring-purple-500/30" />
                    <span className="text-[8px] text-zinc-400">槟城</span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[9px] text-zinc-500">
                  <span>GTM 落地</span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />已部署
                  </span>
                </div>
              </div>
            </motion.div>

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
