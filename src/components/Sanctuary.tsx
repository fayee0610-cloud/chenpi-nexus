"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
  Scroll,
  Send,
  PenLine,
  MessageSquare,
  ChevronDown,
  CornerDownRight,
} from "lucide-react";

// ========== 类型定义 ==========
interface Incense {
  id: string;
  emoji: string;
  name: string;
  color: string;
  glowClass: string;
  borderClass: string;
  count: number;
}

interface Comment {
  author: string;
  text: string;
  time: string;
}

interface BrainFart {
  id: number;
  content: string;
  tag: string;
  tagColor: string;
  author: string;
  time: string;
  likes: number;
  reactions: { cool: number; biz: number; hard: number; fake: number };
  comments: Comment[];
  isNew?: boolean;
}

// ========== 常量数据 ==========
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
  { id: "1", emoji: "🕯️", name: "方案一次过", color: "text-blue-400", glowClass: "shadow-blue-500/40", borderClass: "hover:border-blue-500/50", count: 128 },
  { id: "2", emoji: "💰", name: "甲方即刻回款", color: "text-amber-400", glowClass: "shadow-amber-500/40", borderClass: "hover:border-amber-500/50", count: 96 },
  { id: "3", emoji: "💡", name: "灵感瞬间爆发", color: "text-purple-400", glowClass: "shadow-purple-500/40", borderClass: "hover:border-purple-500/50", count: 234 },
  { id: "4", emoji: "🕊️", name: "沟通极其顺畅", color: "text-green-400", glowClass: "shadow-green-500/40", borderClass: "hover:border-green-500/50", count: 167 },
  { id: "5", emoji: "💥", name: "品牌防塌房", color: "text-red-400", glowClass: "shadow-red-500/40", borderClass: "hover:border-red-500/50", count: 88 },
  { id: "6", emoji: "🚀", name: "准点无痛下班", color: "text-orange-400", glowClass: "shadow-orange-500/40", borderClass: "hover:border-orange-500/50", count: 312 },
];

const initialFarts: BrainFart[] = [
  {
    id: 1,
    content: "做一款只有墨水屏和 3 个物理按键的赛博灵感卡片，连着 Coze 接口，随时按一下就把声音转成结构化 Prompt 存回 Notion，大家觉得有戏吗？",
    tag: "💡 概念萌芽",
    tagColor: "text-blue-400 bg-blue-500/10",
    author: "赛博农夫",
    time: "2小时前",
    likes: 42,
    reactions: { cool: 12, biz: 8, hard: 3, fake: 2 },
    comments: [
      { author: "硬件老兵", text: "墨水屏 + 物理按键的成本可以压到 80 块以内，有戏。", time: "1小时前" },
      { author: "产品经理阿May", text: "关键不是硬件，是后面的 Prompt 模板库做不做得好。", time: "30分钟前" },
      { author: "赛博农夫", text: "对，所以我打算先做软件 MVP，再反推硬件。", time: "10分钟前" },
    ],
  },
  {
    id: 2,
    content: "甲方说要「既有大厂的稳重，又有赛博朋克的叛逆，还要带一点新马东南亚本土风情」，我直接把上香页面发给了他。",
    tag: "🔥 职场发疯",
    tagColor: "text-red-400 bg-red-500/10",
    author: "策略打工人",
    time: "5小时前",
    likes: 89,
    reactions: { cool: 45, biz: 2, hard: 30, fake: 8 },
    comments: [
      { author: "设计受害者", text: "甲方看完上香页面说：这个可以，但能不能再大气一点？", time: "4小时前" },
      { author: "策略打工人", text: "我反手给他上了一柱「品牌防塌房香」", time: "3小时前" },
    ],
  },
  {
    id: 3,
    content: "做 independent B2B 独立站的第 30 天，把全流程 Workflow 接上了 AI 自动化，感觉一个人真的能打出一个小团队的产出。",
    tag: "✦ 阶段探索",
    tagColor: "text-purple-400 bg-purple-500/10",
    author: "深圳探索者",
    time: "1天前",
    likes: 56,
    reactions: { cool: 20, biz: 18, hard: 4, fake: 1 },
    comments: [
      { author: "独立开发者K", text: "同感，AI 自动化让单人作战成为可能。你用的什么 Workflow 工具？", time: "20小时前" },
      { author: "深圳探索者", text: "Coze + n8n + Notion，三件套够用了", time: "18小时前" },
    ],
  },
];

const reactionButtons = [
  { key: "cool" as const, label: "🔥 酷" },
  { key: "biz" as const, label: "💰 商业" },
  { key: "hard" as const, label: "⚠️ 难点" },
  { key: "fake" as const, label: "😅 伪需求" },
];

const postTagOptions = [
  { label: "💡 概念萌芽", color: "text-blue-400 bg-blue-500/10" },
  { label: "🔥 职场发疯/吐槽", color: "text-red-400 bg-red-500/10" },
  { label: "🤖 AI 硬件想法", color: "text-purple-400 bg-purple-500/10" },
];

// ========== 粒子动画组件 ==========
function SmokeParticles({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.8, y: 0, scale: 0.3, x: 0 }}
          animate={{
            opacity: 0,
            y: -60 - Math.random() * 50,
            scale: 1.5 + Math.random() * 0.8,
            x: (Math.random() - 0.5) * 40,
          }}
          transition={{ duration: 1.5 + Math.random() * 0.8, ease: "easeOut" }}
          className="absolute h-3 w-3 rounded-full blur-sm"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

// ========== 单张社区卡片组件 ==========
function CommunityCard({
  fart,
  onReaction,
  onEnergy,
  onComment,
}: {
  fart: BrainFart;
  onReaction: (id: number, key: keyof BrainFart["reactions"]) => void;
  onEnergy: (id: number) => void;
  onComment: (id: number, text: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [energyPulse, setEnergyPulse] = useState(false);

  const handleReaction = (key: keyof BrainFart["reactions"]) => {
    onReaction(fart.id, key);
    setActiveReaction(key);
    setTimeout(() => setActiveReaction(null), 600);
  };

  const handleEnergy = () => {
    onEnergy(fart.id);
    setEnergyPulse(true);
    setTimeout(() => setEnergyPulse(false), 800);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(fart.id, commentText.trim());
    setCommentText("");
  };

  return (
    <motion.div
      layout
      initial={fart.isNew ? { opacity: 0, y: -30, scale: 0.9 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700"
    >
      {/* 标签 + 作者 */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-semibold ${fart.tagColor}`}>
          {fart.tag}
        </span>
        <span className="text-[10px] text-zinc-600">{fart.time}</span>
      </div>

      {/* 内容 */}
      <p className="mb-4 text-sm leading-relaxed text-zinc-200">{fart.content}</p>

      {/* 作者 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-[10px] font-bold text-white">
          {fart.author.charAt(0)}
        </div>
        <span className="text-xs text-zinc-400">{fart.author}</span>
      </div>

      {/* 表态按钮 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {reactionButtons.map((btn) => {
          const isActive = activeReaction === btn.key;
          const count = fart.reactions[btn.key];
          return (
            <button
              key={btn.key}
              onClick={() => handleReaction(btn.key)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-all hover:scale-105 ${
                isActive
                  ? "scale-110 border-purple-500/50 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span>{btn.label}</span>
              {count > 0 && (
                <span className={`font-bold ${isActive ? "text-purple-300" : "text-zinc-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 底部操作栏 */}
      <div className="mt-auto space-y-3 border-t border-zinc-800/60 pt-3">
        <div className="flex items-center justify-between">
          {/* 注入能量 */}
          <button
            onClick={handleEnergy}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all hover:scale-105 ${
              energyPulse
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.5)]"
                : "bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white hover:brightness-110"
            }`}
          >
            <Zap className={`h-3 w-3 ${energyPulse ? "animate-ping" : ""}`} />
            注入能量 ({fart.likes})
          </button>

          {/* 展开讨论 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[11px] text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200"
          >
            <MessageSquare className="h-3 w-3" />
            展开讨论 ({fart.comments.length})
            <ChevronDown className={`h-3 w-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* 评论区 */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
                {fart.comments.map((cmt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CornerDownRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-zinc-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-zinc-300">{cmt.author}</span>
                        <span className="text-[10px] text-zinc-600">{cmt.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-400">{cmt.text}</p>
                    </div>
                  </div>
                ))}
                {/* 快捷评论输入 */}
                <div className="flex gap-2 border-t border-zinc-800/60 pt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="说点什么..."
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleComment}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    回复
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ========== 主组件 ==========
export default function Sanctuary() {
  const [incenses, setIncenses] = useState<Incense[]>(initialIncenses);
  const [activeIncense, setActiveIncense] = useState<string | null>(null);
  const [buffText, setBuffText] = useState<string | null>(null);
  const [buffId, setBuffId] = useState(0);
  const [showFortune, setShowFortune] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(1842);
  const [farts, setFarts] = useState<BrainFart[]>(initialFarts);
  const [postContent, setPostContent] = useState("");
  const [postTag, setPostTag] = useState("💡 概念萌芽");
  const canvasRef = useRef<HTMLDivElement>(null);
  const fartIdRef = useRef(4);

  // 点击能量场数字 +1
  const handleEnergyClick = useCallback(() => {
    setTotalEnergy((prev) => prev + 1);
  }, []);

  // 上香逻辑
  const handleIncenseClick = useCallback((id: string) => {
    setActiveIncense(id);
    const randomBuff = buffs[Math.floor(Math.random() * buffs.length)];
    setBuffText(randomBuff);
    setBuffId((prev) => prev + 1);
    setIncenses((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, count: inc.count + 1 } : inc))
    );
    setTotalEnergy((prev) => prev + 1);

    const todayIndex = new Date().getDate() % fortunes.length;
    setFortuneIndex(todayIndex);
    setShowFortune(true);

    setTimeout(() => setActiveIncense(null), 1000);
    setTimeout(() => setBuffText(null), 2500);
  }, []);

  // 表态 +1
  const handleReaction = useCallback((fartId: number, key: keyof BrainFart["reactions"]) => {
    setFarts((prev) =>
      prev.map((f) =>
        f.id === fartId
          ? { ...f, reactions: { ...f.reactions, [key]: f.reactions[key] + 1 } }
          : f
      )
    );
  }, []);

  // 注入能量 +1
  const handleEnergy = useCallback((fartId: number) => {
    setFarts((prev) =>
      prev.map((f) => (f.id === fartId ? { ...f, likes: f.likes + 1 } : f))
    );
    setTotalEnergy((prev) => prev + 1);
  }, []);

  // 评论
  const handleComment = useCallback((fartId: number, text: string) => {
    setFarts((prev) =>
      prev.map((f) =>
        f.id === fartId
          ? {
              ...f,
              comments: [
                ...f.comments,
                { author: "匿名访客", text, time: "刚刚" },
              ],
            }
          : f
      )
    );
  }, []);

  // 发布脑洞
  const handlePost = () => {
    if (!postContent.trim()) return;
    const tagColor = postTagOptions.find((t) => t.label === postTag)?.color || "text-blue-400 bg-blue-500/10";
    const newFart: BrainFart = {
      id: fartIdRef.current++,
      content: postContent.trim(),
      tag: postTag,
      tagColor,
      author: "匿名创作者",
      time: "刚刚",
      likes: 0,
      reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
      comments: [],
      isNew: true,
    };
    setFarts((prev) => [newFart, ...prev]);
    setPostContent("");
  };

  // 滚动至发帖框
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

        {/* ========== 模块 A：一起上上香 ========== */}
        <div className="mb-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">一起上上香</h3>
            </div>
            {/* 功德能量场 */}
            <button
              onClick={handleEnergyClick}
              className="group flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/10 px-4 py-2 transition-all hover:border-purple-500/40 hover:bg-purple-950/20"
            >
              <Zap className="h-4 w-4 text-purple-400 transition-transform group-hover:scale-125" />
              <span className="text-sm text-zinc-300">今日全网已注入能量：</span>
              <motion.span
                key={totalEnergy}
                initial={{ scale: 1.3, color: "#a855f7" }}
                animate={{ scale: 1, color: "#fafafa" }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold text-zinc-50"
              >
                {totalEnergy.toLocaleString()}
              </motion.span>
              <span className="text-sm text-purple-400">⚡</span>
            </button>
          </div>

          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
            {/* Buff 飘字 */}
            <AnimatePresence>
              {buffText && (
                <motion.div
                  key={buffId}
                  initial={{ opacity: 0, scale: 0.6, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-4"
                >
                  <div className="rounded-xl border border-purple-500/40 bg-zinc-950/95 px-6 py-3 text-center shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-sm">
                    <div className="text-xl font-bold text-purple-400">{buffText}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 香型卡片 */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {incenses.map((incense) => {
                const particleColors: Record<string, string> = {
                  "1": "rgba(59,130,246,0.4)",
                  "2": "rgba(251,191,36,0.4)",
                  "3": "rgba(168,85,247,0.4)",
                  "4": "rgba(34,197,94,0.4)",
                  "5": "rgba(239,68,68,0.4)",
                  "6": "rgba(249,115,22,0.4)",
                };
                return (
                  <button
                    key={incense.id}
                    onClick={() => handleIncenseClick(incense.id)}
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${incense.borderClass} ${incense.glowClass}`}
                  >
                    <SmokeParticles
                      active={activeIncense === incense.id}
                      color={particleColors[incense.id] || "rgba(168,85,247,0.4)"}
                    />
                    <span
                      className={`text-3xl transition-transform duration-300 group-hover:scale-110 ${
                        activeIncense === incense.id ? "animate-pulse" : ""
                      }`}
                    >
                      {incense.emoji}
                    </span>
                    <span className={`text-xs font-medium ${incense.color}`}>{incense.name}</span>
                    <motion.span
                      key={incense.count}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-xs text-zinc-500"
                    >
                      {incense.count} 柱
                    </motion.span>
                  </button>
                );
              })}
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

        {/* ========== 模块 B：脑洞与吐槽画布 ========== */}
        <div ref={canvasRef}>
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-zinc-100">脑洞与吐槽画布</h3>
          </div>

          {/* 发帖框 */}
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {postTagOptions.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => setPostTag(tag.label)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    postTag === tag.label
                      ? "bg-zinc-100 text-zinc-950"
                      : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder="写下一个不成熟的脑洞或吐槽..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                onClick={handlePost}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
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
                <CommunityCard
                  key={fart.id}
                  fart={fart}
                  onReaction={handleReaction}
                  onEnergy={handleEnergy}
                  onComment={handleComment}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
