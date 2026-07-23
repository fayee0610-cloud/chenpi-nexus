"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
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
  Download,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { siteData } from "@/data/siteData";
import type { Incense, SanctuaryPost } from "@/data/siteData";
import { fetchSanctuaryPosts, createSanctuaryPost } from "@/lib/dataApi";

// ========== 常量数据（从 siteData 导入）==========
const buffs = siteData.sanctuary.incenseBuffs;
const fortuneCategories = siteData.sanctuary.fortuneLibrary;
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
export default function Sanctuary({ showInspirationSign = true }: { showInspirationSign?: boolean } = {}) {
  const [incenses, setIncenses] = useState<Incense[]>(initialIncenses);
  const [activeIncense, setActiveIncense] = useState<string | null>(null);
  const [buffText, setBuffText] = useState<string | null>(null);
  const [buffId, setBuffId] = useState(0);
  const [showFortune, setShowFortune] = useState(false);
  const [fortuneCategory, setFortuneCategory] = useState<"inspiration" | "growth" | "healing">("inspiration");
  const [currentQuote, setCurrentQuote] = useState("");
  const [totalEnergy, setTotalEnergy] = useState(siteData.sanctuary.initialEnergy);
  const [farts, setFarts] = useState<SanctuaryPost[]>(initialFarts);
  const [postContent, setPostContent] = useState("");
  const [postTag, setPostTag] = useState("💡 概念萌芽");
  const [posting, setPosting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fortuneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fartIdRef = useRef(4);

  // 加载时从 Supabase 读取最新帖子
  useEffect(() => {
    let mounted = true;
    fetchSanctuaryPosts().then((data) => {
      if (mounted && data.length > 0) setFarts(data);
    });
    return () => { mounted = false; };
  }, []);

  // 点击能量场数字 +1
  const handleEnergyClick = useCallback(() => {
    setTotalEnergy((prev) => prev + 1);
  }, []);

  // 上香逻辑
  // 从指定分类随机抽取一条金句
  const pickRandomQuote = useCallback((category: "inspiration" | "growth" | "healing") => {
    const pool = siteData.sanctuary.fortuneLibrary[category].quotes;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // 生成/刷新签文
  const handleRevealFortune = useCallback(() => {
    setCurrentQuote(pickRandomQuote(fortuneCategory));
    setShowFortune(true);
  }, [fortuneCategory, pickRandomQuote]);

  // 切换分类并重新抽取
  const handleCategoryChange = useCallback((cat: "inspiration" | "growth" | "healing") => {
    setFortuneCategory(cat);
    setCurrentQuote(pickRandomQuote(cat));
  }, [pickRandomQuote]);

  const handleIncenseClick = useCallback((id: string) => {
    // 仅触发赛博上香视觉特效：发光烟雾、Buff 飘字、功德计数 +1
    // 严禁触发任何海报/便签弹窗（已解耦）
    setActiveIncense(id);
    const randomBuff = buffs[Math.floor(Math.random() * buffs.length)];
    setBuffText(randomBuff);
    setBuffId((prev) => prev + 1);
    setIncenses((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, count: inc.count + 1 } : inc))
    );
    setTotalEnergy((prev) => prev + 1);

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

  // 发布脑洞 — 写入 Supabase 持久化
  const handlePost = async () => {
    if (!postContent.trim() || posting) return;
    setPosting(true);
    const tagColor = postTagOptions.find((t) => t.label === postTag)?.color || "text-blue-400 bg-blue-500/10";
    try {
      const newPost = await createSanctuaryPost({
        content: postContent.trim(),
        tag: postTag,
        author: "匿名创作者",
      });
      const finalPost: SanctuaryPost = newPost
        ? { ...newPost, tagColor }
        : {
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
      setFarts((prev) => [finalPost, ...prev]);
      setPostContent("");
    } catch (err) {
      // Supabase 写入失败时仍在前端显示（降级处理）
      const fallback: SanctuaryPost = {
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
      setFarts((prev) => [fallback, ...prev]);
      setPostContent("");
    } finally {
      setPosting(false);
    }
  };

  // 下载灵感便签为 PNG（移动端弹预览 Modal，支持微信长按保存）
  const handleDownloadFortune = useCallback(async () => {
    if (!fortuneRef.current || downloading) return;
    setDownloading(true);
    try {
      // 生成标准 data:image/png;base64 格式，移动端/微信浏览器长按可直接保存
      const dataUrl = await toPng(fortuneRef.current, {
        quality: 0.95,
        pixelRatio: 3, // 高清渲染，适配移动端 Retina 屏
        cacheBust: true, // 防止图片资源缓存干扰
        backgroundColor: "#09090b",
      });

      const fileName = `chenpi-inspiration-${new Date().toISOString().split("T")[0]}.png`;
      // 移动端检测（含微信浏览器 UA 判断）
      const ua = navigator.userAgent.toLowerCase();
      const isMobile = window.innerWidth < 768 || ua.includes("mobile") || ua.includes("micromessenger");

      if (isMobile) {
        // 移动端/微信：展示预览 Modal，用户长按图片保存到相册
        setPreviewImage(dataUrl);
      } else {
        // 桌面端：直接触发下载
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("海报生成失败:", err);
      // 降级提示
      window.alert("海报生成失败，请截图保存或稍后重试");
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

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
          <Link
            href="/sanctuary"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-purple-500/40 hover:text-purple-300"
          >
            查看全部
            <ArrowRight className="h-3 w-3" />
          </Link>
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

            {/* 签文生成器：分类选择 + 生成按钮 */}
            {showInspirationSign && (
            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/10 to-zinc-950/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Scroll className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-zinc-200">今日赛博灵感签文</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(fortuneCategories) as Array<keyof typeof fortuneCategories>).map((key) => {
                  const cat = fortuneCategories[key];
                  const active = fortuneCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleCategoryChange(key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? cat.color
                          : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  );
                })}
                <button
                  onClick={handleRevealFortune}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  生成签文
                </button>
              </div>
            </div>
            )}
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
                onKeyDown={(e) => e.key === "Enter" && !posting && handlePost()}
                placeholder="写下一个不成熟的脑洞或吐槽..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                onClick={handlePost}
                disabled={posting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
              >
                {posting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> 发布中...</>
                ) : (
                  <><Send className="h-4 w-4" /> 发布</>
                )}
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

          {/* 独立海报生成按钮（与上香解耦，仅主动点击才弹出 9:16 海报 Modal） */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleRevealFortune}
              className="group inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-blue-950/30 px-6 py-3 text-sm font-medium text-purple-300 transition-all hover:border-purple-500/60 hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]"
            >
              <ImageIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              生成分享海报
              <Sparkles className="h-3.5 w-3.5 text-purple-400/70" />
            </button>
          </div>
        </div>
      </div>

      {/* 签文 9:16 海报 Modal */}
      <AnimatePresence>
        {showFortune && currentQuote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFortune(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotateX: 25 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.85, opacity: 0, rotateX: 15 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative flex flex-col items-center"
              style={{ perspective: 1000 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowFortune(false)}
                className="absolute -top-11 right-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 9:16 赛博便签海报 */}
              <div
                ref={fortuneRef}
                className="relative w-[300px] overflow-hidden rounded-2xl sm:w-[340px]"
                style={{ aspectRatio: "9 / 16" }}
              >
                {/* 背景层：赛博网格 + 渐变 + 霓虹光晕 */}
                <div className="absolute inset-0 bg-zinc-950">
                  <div
                    className="absolute inset-0 opacity-[0.18]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(168,85,247,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                  {/* 几何水印 */}
                  <div className="absolute right-4 top-20 h-32 w-32 rotate-45 border border-purple-500/10" />
                  <div className="absolute left-4 bottom-24 h-24 w-24 rotate-12 border border-blue-500/10" />
                  <div className="absolute -top-24 left-1/4 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
                  <div className="absolute -bottom-24 right-1/4 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
                </div>

                {/* 内容层 */}
                <div className="relative z-10 flex h-full flex-col p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-500">
                        <Flame className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200">陈皮同学 · 赛博灵感中枢</span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-[10px] tracking-wider text-zinc-500">
                    {new Date().toLocaleDateString("zh-CN").replace(/\//g, ".")}
                  </div>

                  {/* 分类标签 */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${fortuneCategories[fortuneCategory].color}`}>
                      {fortuneCategories[fortuneCategory].icon}
                      {fortuneCategories[fortuneCategory].label}
                    </span>
                  </div>

                  {/* 中部：签文金句 */}
                  <div className="flex flex-1 flex-col items-center justify-center py-4">
                    <span className="mb-2 text-4xl font-serif text-purple-500/40">"</span>
                    <p className="text-center text-base font-bold leading-relaxed text-zinc-100">
                      {currentQuote}
                    </p>
                    <span className="mt-2 text-4xl font-serif leading-none text-purple-500/40 rotate-180">"</span>
                  </div>

                  {/* 底部：签名 + 二维码 */}
                  <div className="flex items-end justify-between border-t border-purple-500/20 pt-3">
                    <div className="flex-1 pr-3">
                      <p className="text-xs font-bold text-zinc-300">Chenpi</p>
                      <p className="text-[10px] text-zinc-500">OPC & Brand Strategist</p>
                      <p className="mt-1.5 text-[9px] leading-tight text-zinc-600">
                        扫码探索陈皮同学的数字空间
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-1.5">
                      <QRCodeSVG
                        value="https://myneuralhub.com"
                        size={52}
                        level="M"
                        fgColor="#09090b"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* 毛玻璃边框光晕 */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-purple-500/30" />
              </div>

              {/* 操作按钮区 */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentQuote(pickRandomQuote(fortuneCategory))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  换一条
                </button>
                <button
                  onClick={handleDownloadFortune}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {downloading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 生成中...</>
                  ) : (
                    <><Download className="h-3.5 w-3.5" /> 保存便签</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFortune(false);
                    scrollToCanvas();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/40"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  去发表脑洞
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动端图片预览 Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={previewImage}
                alt="赛博灵感便签预览"
                className="w-full rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10"
                // 确保图片可被微信识别并长按保存
              />
              <div className="mt-4 space-y-1.5 text-center">
                <p className="text-sm font-medium text-zinc-300">
                  长按图片保存到相册
                </p>
                <p className="text-xs text-zinc-500">
                  微信内可直接长按 → 保存图片，若无法保存请截图
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
