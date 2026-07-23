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
import { siteData } from "@/data/siteData";
import type { Incense, SanctuaryPost } from "@/data/siteData";

// ========== 常量数据（从 siteData 导入）==========
const buffs = siteData.sanctuary.incenseBuffs;
const fortunes = siteData.sanctuary.fortunes;
const initialIncenses: Incense[] = siteData.sanctuary.incenses;
const initialFarts: SanctuaryPost[] = siteData.sanctuary.initialPosts;
const postTagOptions = siteData.sanctuary.postTagOptions;

const reactionButtons = [
  { key: "cool" as const, label: "🔥 酷" },
  { key: "biz" as const, label: "💰 商业" },
  { key: "hard" as const, label: "⚠️ 难点" },
  { key: "fake" as const, label: "😅 伪需求" },
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
  fart: SanctuaryPost;
  onReaction: (id: number, key: keyof SanctuaryPost["reactions"]) => void;
  onEnergy: (id: number) => void;
  onComment: (id: number, text: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [energyPulse, setEnergyPulse] = useState(false);

  const handleReaction = (key: keyof SanctuaryPost["reactions"]) => {
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
  const [totalEnergy, setTotalEnergy] = useState(siteData.sanctuary.initialEnergy);
  const [farts, setFarts] = useState<SanctuaryPost[]>(initialFarts);
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
  const handleReaction = useCallback((fartId: number, key: keyof SanctuaryPost["reactions"]) => {
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
    const newFart: SanctuaryPost = {
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
