"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";

// ===== 5 大频道：地道文化金句 + 极简落地服务（B2B 政商/GTM/Halal + B2C 营销/AI 情报） =====
const CHANNELS = [
  {
    emoji: "☕",
    name: "Kopitiam",
    quote: "Boss, Teh Tarik Satu! (老板，来杯拉茶！)",
    service: "政商与本土资源撮合",
    desc: "精准对接大马政企、本地商会与主流分销渠道网络。",
    pill: "bg-amber-500/10 text-amber-400",
    ring: "ring-amber-500/25",
    accent: "text-amber-400",
    dot: "bg-amber-400",
    bar: "from-amber-500 to-amber-400",
    glow: "rgba(245, 158, 11, 0.18)", // 茶室琥珀
  },
  {
    emoji: "👌",
    name: "Boleh!",
    quote: "在大马，听到 Boleh 心里就稳了一半。",
    service: "GTM 全流程落地",
    desc: "从 0 到 1 定制大马落地路线图，解决准入与经营难题。",
    pill: "bg-emerald-500/10 text-emerald-400",
    ring: "ring-emerald-500/25",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
    bar: "from-emerald-500 to-emerald-400",
    glow: "rgba(16, 185, 129, 0.18)", // 稳健翡翠
  },
  {
    emoji: "🌙",
    name: "Halal",
    quote: "不只是清真标志，更是本地人的安心密码。",
    service: "JAKIM 认证与合规准入",
    desc: "高效打通 68% 本土穆斯林主流消费圈，合规准入。",
    pill: "bg-green-500/10 text-green-400",
    ring: "ring-green-500/25",
    accent: "text-green-400",
    dot: "bg-green-400",
    bar: "from-green-500 to-green-400",
    glow: "rgba(34, 197, 94, 0.18)", // 清真绿
  },
  {
    emoji: "🗣️",
    name: "Lah!",
    quote: "少一点高高在上的 PPT，多一点懂本地人的 Lah。",
    service: "全渠道本土化营销",
    desc: "涵盖 TikTok 达人孵化、线下快闪打卡与本地多语境传播。",
    pill: "bg-purple-500/10 text-purple-400",
    ring: "ring-purple-500/25",
    accent: "text-purple-400",
    dot: "bg-purple-400",
    bar: "from-purple-500 to-purple-400",
    glow: "rgba(168, 85, 247, 0.18)", // 芒语紫光
  },
  {
    emoji: "🚀",
    name: "Jom!",
    quote: "别再观望了，Jom (走起) 出海！",
    service: "AI 商业情报与敏捷攻坚",
    desc: "实时提炼大马财经政策与竞争动态，高效率决策。",
    pill: "bg-blue-500/10 text-blue-400",
    ring: "ring-blue-500/25",
    accent: "text-blue-400",
    dot: "bg-blue-400",
    bar: "from-blue-500 to-blue-400",
    glow: "rgba(59, 130, 246, 0.18)", // 科技蓝
  },
];

// 查看实战案例 —— 平滑滚动到 #cases，无目标时优雅降级（不触发置顶）
const scrollToCases = (e: React.MouseEvent) => {
  e.preventDefault();
  const el = document.getElementById("cases");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function Hero() {
  // 默认选中 01 / Kopitiam；无自动轮播，控制权完全交给用户
  const [active, setActive] = useState(0);
  const ch = CHANNELS[active];

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      {/* 背景柔光 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* 12 列响应式网格容器 */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full max-w-7xl mx-auto min-h-[80vh]">

        {/* 左侧文字区 col-span-7 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 min-w-0 flex flex-col items-start space-y-7"
        >
          {/* 微光 Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium text-zinc-300 backdrop-blur-sm">
            ⚡ 聚焦马来西亚 GTM · 清真 Halal 准入 · AI 策略杠杆
          </div>

          {/* 大标题：紫蓝渐变高亮关键词 */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(59,130,246,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-8px_rgba(124,58,237,0.55)]"
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
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              联系我
            </a>
          </div>
        </motion.div>

        {/* 右侧：🇲🇾 大马出海频道解码器 —— 单体艺术画幅（频道氛围变色） */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 flex justify-center lg:justify-end w-full min-w-0"
        >
          <div className="relative w-full max-w-sm lg:max-w-[420px]">
            {/* 单体艺术卡片：微光边框 + 通透毛玻璃 + 舒缓层叠阴影 */}
            <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900 aspect-[4/5] lg:aspect-auto lg:h-[480px] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 shadow-[0_30px_80px_-25px_rgba(0,0,0,0.6)] hover:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)]">

              {/* ① 频道氛围光 —— 切换时平滑丝滑渐变变色 */}
              <AnimatePresence>
                <motion.div
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(circle at 50% 24%, ${ch.glow} 0%, transparent 65%)` }}
                  aria-hidden
                />
              </AnimatePresence>
              <AnimatePresence>
                <motion.div
                  key={`b-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.65 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(circle at 50% 94%, ${ch.glow} 0%, transparent 52%)` }}
                  aria-hidden
                />
              </AnimatePresence>

              {/* ② 点阵暗纹 */}
              <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage: "radial-gradient(rgba(130,130,140,0.22) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
                aria-hidden
              />

              {/* ③ 双峰塔天际线剪影（theme-aware 暗纹） */}
              <svg
                className="absolute bottom-0 left-0 h-[32%] w-full"
                viewBox="0 0 400 150"
                preserveAspectRatio="xMidYMax slice"
                fill="none"
                aria-hidden
              >
                <g fill="var(--color-zinc-800)">
                  <path d="M120 150 L120 56 L128 36 L140 16 L152 36 L160 56 L160 150 Z" />
                  <path d="M168 150 L168 48 L176 28 L188 8 L200 28 L208 48 L208 150 Z" />
                  <path d="M216 150 L216 62 L224 44 L236 24 L248 44 L256 62 L256 150 Z" />
                  <rect x="158" y="70" width="14" height="4" rx="1.5" fill="var(--color-zinc-700)" />
                  <rect x="206" y="60" width="14" height="4" rx="1.5" fill="var(--color-zinc-700)" />
                </g>
                <g stroke="var(--color-zinc-800)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8">
                  <path d="M16 150 Q40 120 64 140" />
                  <path d="M372 150 Q348 120 324 140" />
                </g>
              </svg>

              {/* ④ 玻璃遮罩 + 顶部微光高光 */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/10 via-transparent to-zinc-950/40" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* ⑤ 前景内容 */}
              <div className="relative z-10 flex h-full flex-col p-6 sm:p-7">
                {/* 顶部标题 + LIVE */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-bold tracking-wide text-zinc-100">
                      🇲🇾 切换大马出海频道
                    </div>
                    <div className="mt-0.5 text-[10px] tracking-[0.2em] text-zinc-400">
                      MALAYSIAN VIBE DECODER
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-green-500/20 bg-zinc-950/50 px-2 py-1 text-[9px] font-semibold text-green-400 backdrop-blur-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                    </span>
                    LIVE
                  </div>
                </div>

                {/* 5 个互动 Pill —— 移动端横向 Snap 滑动，桌面居中换行 */}
                <div className="mt-5 flex gap-1.5 overflow-x-auto scrollbar-none snap-x snap-mandatory px-0.5 pb-1 lg:flex-wrap lg:justify-center lg:overflow-x-visible">
                  {CHANNELS.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => setActive(i)}
                      className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-300 ${
                        i === active
                          ? `${c.pill} ring-1 ${c.ring}`
                          : "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/15 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-[13px] leading-none">{c.emoji}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                {/* 内容区：地道梗 + 服务 + CTA，流畅切换 */}
                <div className="relative mt-5 flex-1 overflow-hidden">
                  {/* 顶部彩色光带，跟随频道色 */}
                  <div className={`absolute -top-1 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r ${ch.bar} blur-[2px]`} />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full flex-col"
                    >
                      {/* Emoji */}
                      <div className="text-center text-4xl leading-none drop-shadow-lg sm:text-5xl">
                        {ch.emoji}
                      </div>
                      {/* 文化金句（响应式字号，禁止截断） */}
                      <div className="mt-3 text-center text-base font-medium italic leading-snug text-zinc-100 sm:text-lg">
                        &ldquo;{ch.quote}&rdquo;
                      </div>
                      {/* 服务卡 —— 微光边框 + 通透毛玻璃 */}
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${ch.dot}`} />
                          <span className={`text-[11px] font-bold tracking-wide ${ch.accent}`}>
                            【{ch.service}】
                          </span>
                        </div>
                        <div className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
                          {ch.desc}
                        </div>
                      </div>
                      {/* 预留案例联动 CTA —— 微光交互入口 */}
                      <div className="mt-auto pt-4">
                        <button
                          onClick={scrollToCases}
                          className="group/cta relative inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-200 backdrop-blur-sm transition-all duration-300 hover:text-zinc-50 hover:bg-white/10"
                        >
                          <span className={`absolute inset-0 -translate-x-full bg-gradient-to-r ${ch.bar} opacity-0 transition-all duration-500 group-hover/cta:translate-x-0 group-hover/cta:opacity-[0.08]`} />
                          查看实战案例
                          <ArrowRight className={`h-3.5 w-3.5 ${ch.accent} transition-transform duration-300 group-hover/cta:translate-x-1`} />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
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
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/10 pt-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
