"use client";

import { motion } from "framer-motion";
import { ArrowDown, Radio } from "lucide-react";
import { siteData } from "@/data/siteData";

export default function Hero() {
  const { profile } = siteData;
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 py-10 lg:py-20">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* 响应式布局：移动端垂直排列，桌面端左文右图双列 */}
        <div className="flex flex-col items-center gap-8 py-10 lg:flex-row lg:items-center lg:gap-12 lg:py-20">
          {/* 左侧：主张与定位 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:flex-1 lg:max-w-2xl"
          >
            {/* 动态状态 */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-sm text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {profile.status}
            </div>

            {/* 大标题：严格两行结构 + 紫蓝渐变高亮「人」「AI」「市场」 */}
            <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl xl:text-6xl">
              以<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">人</span>为本，
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">AI</span> 为杠杆
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">市场</span>会有答案
            </h1>

            <p className="mb-8 text-base text-zinc-400 sm:text-lg lg:text-xl">
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

          {/* 右侧：赛博名片卡片（赛博动效升级） */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:max-w-lg lg:flex-1"
          >
            <div className="group relative">
              {/* 人像卡片：照片 100% 原色清晰，无任何蒙层/滤镜/overlay */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-500 hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]">
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />

                {/* 右上角科技角标：状态灯呼吸脉冲（独立浮层，非蒙层） */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-green-500/30 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold text-green-400 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <Radio className="h-3 w-3" />
                  📡 SYSTEM: ONLINE
                </div>

                {/* 霓虹流光边框：渐变光带沿边框流动（仅边框，不覆盖图片） */}
                <div className="animate-border-flow pointer-events-none absolute -inset-px rounded-2xl bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.6),transparent,rgba(59,130,246,0.6),transparent)] opacity-60 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] p-px" />
              </div>

              {/* 照片下方属性标签区（移出照片外部，不再遮挡人像） */}
              <div className="mt-4 px-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-zinc-700/60 bg-zinc-900/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  &ldquo;{profile.quote}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        </div>
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
