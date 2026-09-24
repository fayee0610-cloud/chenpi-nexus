"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";

// ===== 大马出海频道数据：地道梗 + 极简服务 =====
const CHANNELS = [
  {
    emoji: "☕",
    name: "Kopitiam",
    tag: "Boss, Teh Tarik Satu!",
    sub: "老板，来杯拉茶！",
    service: "南洋社交与资源撮合",
    desc: "在大马，硬核的商业关系可能就是在茶室里聊出来的。",
    pill: "border-amber-500/50 bg-amber-500/15 text-amber-400",
    accent: "text-amber-400",
    dot: "bg-amber-400",
    bar: "from-amber-500 to-amber-400",
  },
  {
    emoji: "👌",
    name: "Boleh!",
    tag: "Boleh! 心里就稳了一半",
    sub: "在大马，听到「Boleh」就稳了一半。",
    service: "GTM 策略与实操落地",
    desc: "找准本地路子，就没有 Tak Boleh 办不到的难题。",
    pill: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
    bar: "from-emerald-500 to-emerald-400",
  },
  {
    emoji: "🌙",
    name: "Halal",
    tag: "本地人的安心密码",
    sub: "不只是清真标志，更是 68% 人口的信任。",
    service: "Halal 准入与合规咨询",
    desc: "带你打通本土核心消费圈，顺畅拿到 JAKIM 准入。",
    pill: "border-green-500/50 bg-green-500/15 text-green-400",
    accent: "text-green-400",
    dot: "bg-green-400",
    bar: "from-green-500 to-green-400",
  },
  {
    emoji: "🗣️",
    name: "Lah!",
    tag: "多一点懂本地人的 Lah",
    sub: "少一点 PPT，多一点 Manglish 的温度。",
    service: "地道 Manglish 本土化营销",
    desc: "用本地族裔的沟通方式，做有温度的品牌表达。",
    pill: "border-blue-500/50 bg-blue-500/15 text-blue-400",
    accent: "text-blue-400",
    dot: "bg-blue-400",
    bar: "from-blue-500 to-blue-400",
  },
  {
    emoji: "🚀",
    name: "Jom!",
    tag: "Jom! 走起出海！",
    sub: "别再观望了，用 AI 杠杆快速实操。",
    service: "AI 商业情报与判断",
    desc: "拒绝纸上谈兵，用 AI 杠杆带你快速出海大马。",
    pill: "border-purple-500/50 bg-purple-500/15 text-purple-400",
    accent: "text-purple-400",
    dot: "bg-purple-400",
    bar: "from-purple-500 to-purple-400",
  },
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const ch = CHANNELS[active];

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

        {/* 右侧：🇲🇾 大马出海频道解码器 —— 单体艺术卡片（地道文化 + 互动切换） */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center lg:justify-end w-full min-w-0"
        >
          <div className="relative w-full max-w-sm lg:max-w-md">
            {/* 流光外框 + 悬浮升起 */}
            <div className="relative group rounded-3xl p-[1.5px] bg-gradient-to-br from-purple-500/50 via-zinc-700/30 to-blue-500/50 transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_30px_rgba(168,85,247,0.18)] hover:shadow-[0_14px_44px_rgba(124,58,237,0.32)]">
              <div className="relative w-full rounded-[22px] overflow-hidden aspect-[4/5] bg-slate-950">

                {/* 大马风情背景画：双峰塔剪影 + 落日 + 椰树 */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 400 500"
                  preserveAspectRatio="xMidYMid slice"
                  fill="none"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="mySky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#1e1b4b" />
                      <stop offset="0.45" stopColor="#3b1d6e" />
                      <stop offset="0.8" stopColor="#0f766e" />
                      <stop offset="1" stopColor="#0b1220" />
                    </linearGradient>
                    <radialGradient id="mySun" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0" stopColor="#fbbf24" stopOpacity="0.95" />
                      <stop offset="0.5" stopColor="#f59e0b" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* 天空 */}
                  <rect width="400" height="500" fill="url(#mySky)" />
                  {/* 落日 */}
                  <circle cx="305" cy="135" r="62" fill="url(#mySun)" />
                  <circle cx="305" cy="135" r="26" fill="#fde68a" opacity="0.85" />
                  {/* 双峰塔剪影 */}
                  <g fill="#070611" opacity="0.92">
                    <path d="M152 500 L152 250 L162 218 L176 184 L190 218 L200 250 L200 500 Z" />
                    <path d="M210 500 L210 240 L220 208 L236 172 L252 208 L262 240 L262 500 Z" />
                  </g>
                  {/* 天桥 */}
                  <rect x="192" y="318" width="22" height="5" rx="2" fill="#1e293b" />
                  {/* 塔身窗格微光 */}
                  <g fill="#a78bfa" opacity="0.35">
                    <rect x="166" y="280" width="3" height="6" />
                    <rect x="184" y="300" width="3" height="6" />
                    <rect x="224" y="270" width="3" height="6" />
                    <rect x="246" y="290" width="3" height="6" />
                  </g>
                  {/* 椰树剪影 */}
                  <g stroke="#0f766e" strokeWidth="2.5" opacity="0.55" fill="none" strokeLinecap="round">
                    <path d="M28 486 Q58 444 92 472" />
                    <path d="M36 494 Q66 462 100 486" />
                    <path d="M372 488 Q340 446 308 474" />
                    <path d="M364 496 Q334 464 300 488" />
                  </g>
                </svg>

                {/* 玻璃质感遮罩，让前景文字可读 */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-zinc-950/45 to-zinc-950/70 backdrop-blur-[3px]" />

                {/* 前景内容 */}
                <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
                  {/* 顶部标题 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-bold tracking-wide text-zinc-100">
                        🇲🇾 切换大马出海频道
                      </div>
                      <div className="mt-0.5 text-[10px] tracking-[0.2em] text-zinc-400">
                        MALAYSIAN VIBE DECODER
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-green-500/30 bg-zinc-950/60 px-2 py-1 text-[9px] font-semibold text-green-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                      </span>
                      LIVE
                    </div>
                  </div>

                  {/* 5 个互动 Pill */}
                  <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                    {CHANNELS.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => setActive(i)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                          i === active
                            ? `${c.pill} scale-105 shadow-md`
                            : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className="text-[13px] leading-none">{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* 内容区：流畅切换地道梗 + 服务 */}
                  <div className="relative mt-4 flex-1 overflow-hidden">
                    {/* 顶部彩色光带，跟随频道色 */}
                    <div className={`absolute -top-1 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r ${ch.bar} blur-[2px]`} />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -14, scale: 0.97 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex h-full flex-col justify-center text-center"
                      >
                        <div className="text-5xl sm:text-6xl leading-none drop-shadow-lg">{ch.emoji}</div>
                        <div className="mt-3 text-lg sm:text-xl font-bold italic text-zinc-50">
                          &ldquo;{ch.tag}&rdquo;
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">{ch.sub}</div>

                        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left backdrop-blur-sm">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${ch.dot}`} />
                            <span className={`text-[11px] font-bold tracking-wide ${ch.accent}`}>【{ch.service}】</span>
                          </div>
                          <div className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
                            {ch.desc}
                          </div>
                        </div>
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
