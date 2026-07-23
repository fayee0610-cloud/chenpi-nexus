"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, ThumbsUp, Scroll, Send, PenLine } from "lucide-react";

interface Incense {
  id: string;
  emoji: string;
  name: string;
  color: string;
  glowClass: string;
  count: number;
}

interface BrainFart {
  id: number;
  title: string;
  content: string;
  tag: string;
  tagColor: string;
  likes: number;
  reactions: Record<string, number>;
  isNew?: boolean;
}

const buffs = [
  "功德 +1",
  "运势 +100",
  "甲方沟通顺畅度 +50%",
  "Bug 自动消失 +1",
  "发量 +1",
  "脑洞清晰度 +200%",
  "✨ 欧气爆棚：方案一次过审！",
  "灵感涌入速度 +300%",
  "下班准时率 +99%",
];

const fortunes = [
  "今日宜：开始一件小事，去写下一个不成熟的脑洞",
  "今日宜：大胆提案，甲方今天心情不错",
  "今日宜：和 AI 聊聊，它会给你意想不到的灵感",
  "今日宜：整理旧作品，会有新的发现",
  "今日宜：休息一下，最好的创意往往在放松时降临",
  "今日宜：把那个疯狂的念头说出来，也许有人懂",
];

const initialIncenses: Incense[] = [
  { id: "1", emoji: "🕯️", name: "方案过审香", color: "text-blue-400", glowClass: "shadow-blue-500/30", count: 128 },
  { id: "2", emoji: "💰", name: "甲方回款香", color: "text-amber-400", glowClass: "shadow-amber-500/30", count: 96 },
  { id: "3", emoji: "💡", name: "灵感爆发香", color: "text-purple-400", glowClass: "shadow-purple-500/30", count: 234 },
  { id: "4", emoji: "🕊️", name: "沟通顺畅香", color: "text-green-400", glowClass: "shadow-green-500/30", count: 167 },
  { id: "5", emoji: "💥", name: "防塌房香", color: "text-red-400", glowClass: "shadow-red-500/30", count: 88 },
  { id: "6", emoji: "🚀", name: "按时下班香", color: "text-orange-400", glowClass: "shadow-orange-500/30", count: 312 },
];

const initialFarts: BrainFart[] = [
  {
    id: 1,
    title: "AI 硬件的终极形态可能是「无感」",
    content: "当技术足够成熟时，最好的交互就是没有交互。",
    tag: "💡 概念萌芽",
    tagColor: "text-blue-400 bg-blue-500/10",
    likes: 42,
    reactions: { cool: 12, biz: 8, hard: 3, fake: 2 },
  },
  {
    id: 2,
    title: "客户说「再大气一点」的时候",
    content: "翻译：我也不知道我要什么，但我就是觉得不够好。",
    tag: "🔥 职场发疯/吐槽",
    tagColor: "text-red-400 bg-red-500/10",
    likes: 89,
    reactions: { cool: 45, biz: 2, hard: 30, fake: 8 },
  },
  {
    id: 3,
    title: "内容策略的复利效应",
    content: "一篇好文章三年后还在带来询盘，这就是数字资产的魔力。",
    tag: "💡 概念萌芽",
    tagColor: "text-blue-400 bg-blue-500/10",
    likes: 56,
    reactions: { cool: 20, biz: 18, hard: 4, fake: 1 },
  },
];

const reactionButtons = [
  { key: "cool", label: "🔥 酷" },
  { key: "biz", label: "💰 商业" },
  { key: "hard", label: "⚠️ 难点" },
  { key: "fake", label: "😅 伪需求" },
];

function SmokeParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.7, y: 0, scale: 0.5, x: 0 }}
          animate={{
            opacity: 0,
            y: -50 - Math.random() * 40,
            scale: 1.5 + Math.random(),
            x: (Math.random() - 0.5) * 30,
          }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
          className="absolute h-3 w-3 rounded-full bg-zinc-400/30 blur-sm"
        />
      ))}
    </div>
  );
}

export default function Sanctuary() {
  const [incenses, setIncenses] = useState<Incense[]>(initialIncenses);
  const [activeIncense, setActiveIncense] = useState<string | null>(null);
  const [buffText, setBuffText] = useState<string | null>(null);
  const [showFortune, setShowFortune] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(1842);
  const [farts, setFarts] = useState<BrainFart[]>(initialFarts);
  const [postTitle, setPostTitle] = useState("");
  const [postTag, setPostTag] = useState("💡 概念萌芽");
  const canvasRef = useRef<HTMLDivElement>(null);
  const fartIdRef = useRef(4);

  const handleIncenseClick = useCallback((id: string) => {
    setActiveIncense(id);
    const randomBuff = buffs[Math.floor(Math.random() * buffs.length)];
    setBuffText(randomBuff);
    setIncenses((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, count: inc.count + 1 } : inc))
    );
    setTotalEnergy((prev) => prev + 1);

    const todayIndex = new Date().getDate() % fortunes.length;
    setFortuneIndex(todayIndex);
    setShowFortune(true);

    setTimeout(() => setActiveIncense(null), 800);
    setTimeout(() => setBuffText(null), 2500);
  }, []);

  const handleReaction = (fartId: number, reactionKey: string) => {
    setFarts((prev) =>
      prev.map((f) =>
        f.id === fartId
          ? { ...f, reactions: { ...f.reactions, [reactionKey]: (f.reactions[reactionKey] || 0) + 1 } }
          : f
      )
    );
  };

  const handleEnergy = (fartId: number) => {
    setFarts((prev) =>
      prev.map((f) => (f.id === fartId ? { ...f, likes: f.likes + 1 } : f))
    );
    setTotalEnergy((prev) => prev + 1);
  };

  const handlePost = () => {
    if (!postTitle.trim()) return;
    const newFart: BrainFart = {
      id: fartIdRef.current++,
      title: postTitle.trim(),
      content: "匿名创作者发布",
      tag: postTag,
      tagColor: postTag.includes("概念")
        ? "text-blue-400 bg-blue-500/10"
        : "text-red-400 bg-red-500/10",
      likes: 0,
      reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
      isNew: true,
    };
    setFarts((prev) => [newFart, ...prev]);
    setPostTitle("");
    setTimeout(() => {
      canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollToCanvas = () => {
    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="sanctuary"
      className="mx-4 rounded-3xl bg-gradient-to-b from-zinc-950 via-purple-950/20 to-zinc-950 px-6 py-24 sm:mx-6"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            庇护所
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            一个轻量的精神避风港，为创意人补充能量
          </p>
        </div>

        {/* 一起上上香 */}
        <div className="mb-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">一起上上香</h3>
            </div>
            {/* 功德能量场 */}
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/10 px-4 py-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-zinc-300">今日全网已注入能量：</span>
              <motion.span
                key={totalEnergy}
                initial={{ scale: 1.2, color: "#a855f7" }}
                animate={{ scale: 1, color: "#fafafa" }}
                className="text-sm font-bold text-zinc-50"
              >
                {totalEnergy.toLocaleString()}
              </motion.span>
              <span className="text-sm text-purple-400">⚡</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
            {/* Buff 飘字 */}
            <AnimatePresence>
              {buffText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -30 }}
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                >
                  <div className="rounded-xl border border-purple-500/30 bg-zinc-950/90 px-6 py-3 text-center shadow-xl backdrop-blur-sm">
                    <div className="text-xl font-bold text-purple-400">{buffText}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 香型卡片 */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {incenses.map((incense) => (
                <button
                  key={incense.id}
                  onClick={() => handleIncenseClick(incense.id)}
                  className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:-translate-y-1 hover:border-zinc-700 hover:shadow-lg ${incense.glowClass}`}
                >
                  <SmokeParticles active={activeIncense === incense.id} />
                  <span className={`text-3xl transition-transform duration-300 group-hover:scale-110 ${activeIncense === incense.id ? "animate-pulse" : ""}`}>
                    {incense.emoji}
                  </span>
                  <span className={`text-xs font-medium ${incense.color}`}>{incense.name}</span>
                  <span className="text-xs text-zinc-500">{incense.count} 柱</span>
                </button>
              ))}
            </div>

            {/* 签文卡片 */}
            <AnimatePresence>
              {showFortune && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-zinc-950/40 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Scroll className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-400">今日赛博灵感签文</span>
                    </div>
                    <p className="mb-4 text-base text-zinc-200">{fortunes[fortuneIndex]}</p>
                    <button
                      onClick={scrollToCanvas}
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-950/20 px-4 py-2 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/40"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      ✍️ 去画布发表脑洞
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 脑洞与吐槽画布 */}
        <div ref={canvasRef}>
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-zinc-100">脑洞与吐槽画布</h3>
          </div>

          {/* 发帖框 */}
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-3 flex gap-2">
              {["💡 概念萌芽", "🔥 职场发疯/吐槽"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPostTag(tag)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    postTag === tag
                      ? "bg-zinc-100 text-zinc-950"
                      : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder="写下一个不成熟的脑洞或吐槽..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                onClick={handlePost}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
              >
                <Send className="h-4 w-4" />
                发布
              </button>
            </div>
          </div>

          {/* 卡片列表 */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {farts.map((fart) => (
                <motion.div
                  key={fart.id}
                  layout
                  initial={fart.isNew ? { opacity: 0, y: -30, scale: 0.9 } : { opacity: 0 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700"
                >
                  <div className="mb-3">
                    <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-semibold ${fart.tagColor}`}>
                      {fart.tag}
                    </span>
                  </div>
                  <h4 className="mb-2 text-sm font-bold text-zinc-100">{fart.title}</h4>
                  <p className="mb-5 text-xs leading-relaxed text-zinc-400">{fart.content}</p>

                  <div className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {reactionButtons.map((btn) => (
                        <button
                          key={btn.key}
                          onClick={() => handleReaction(fart.id, btn.key)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400 transition-all hover:scale-105 hover:border-zinc-700 hover:text-zinc-200"
                        >
                          <span>{btn.label}</span>
                          {fart.reactions[btn.key] > 0 && (
                            <span className="text-zinc-500">{fart.reactions[btn.key]}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {fart.likes}
                      </div>
                      <button
                        onClick={() => handleEnergy(fart.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
                      >
                        <Zap className="h-3 w-3" />
                        注入能量 (+1)
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
