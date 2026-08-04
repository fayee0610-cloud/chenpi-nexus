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

            {/* 大标题：响应式字号缩放 + 紫蓝渐变高亮关键词 */}
            <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl xl:text-6xl">
              以<span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">人</span>为本，
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">市场</span>会有答案。
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
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-purple-500/40 bg-zinc-900 shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">
              {/* 图片 + CSS 赛博调色 */}
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover brightness-95 contrast-110 saturate-90"
              />

              {/* 激光扫描线：从上至下无缝循环穿过的紫蓝色光束（2s/次） */}
              <div className="animate-laser-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-purple-400/30 to-transparent" />
              <div className="animate-laser-scanline pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/80 to-transparent shadow-[0_0_8px_rgba(168,85,247,0.8)]" />

              {/* 深紫深蓝渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-blue-950/20 mix-blend-overlay" />

              {/* 右上角科技角标：状态灯呼吸脉冲 */}
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-green-500/30 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold text-green-400 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <Radio className="h-3 w-3" />
                📡 SYSTEM: ONLINE
              </div>

              {/* 左下角属性标签 */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-zinc-700/60 bg-zinc-950/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  &ldquo;{profile.quote}&rdquo;
                </p>
              </div>

              {/* 霓虹流光边框：渐变光带沿边框流动 */}
              <div className="animate-border-flow pointer-events-none absolute -inset-px rounded-2xl bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.6),transparent,rgba(59,130,246,0.6),transparent)] opacity-60 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] p-px" />

              {/* 装饰边框光 */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-purple-500/20" />
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
