"use client";

import { motion } from "framer-motion";
import { ArrowDown, Radio } from "lucide-react";
import { siteData } from "@/data/siteData";

export default function Hero() {
  const { profile } = siteData;
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
          {/* 动态状态 */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-sm text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {profile.status}
          </div>

          {/* 大标题：两行结构，允许自然折行，紫蓝渐变高亮关键词 */}
          <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-zinc-50 break-words sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
            <span className="block">
              以<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">人</span>为本，
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">AI</span> 为杠杆
            </span>
            <span className="block">
              提供真实的<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">东南亚</span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">营销判断</span>
            </span>
          </h1>

          <p className="text-base text-zinc-400 sm:text-lg lg:text-xl">
            {profile.subTitle}
          </p>

          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110"
            >
              浏览作品
              <ArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#connect"
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

                {/* 右上角 SYSTEM: ONLINE 状态灯（呼吸脉冲） */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-green-500/30 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold text-green-400 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </span>
                  <Radio className="h-3 w-3" />
                  📡 SYSTEM: ONLINE
                </div>

                {/* 右下方玻璃质感金句浮层 */}
                <div className="absolute bottom-3 right-3 max-w-[80%] bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                  <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-100">
                    &ldquo;谋于策略，成于闭环，对结果负责。&rdquo;
                  </p>
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
