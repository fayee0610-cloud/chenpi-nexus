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
  Trash2,
  Check,
} from "lucide-react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { siteData } from "@/data/siteData";
import type { Incense, SanctuaryPost } from "@/data/siteData";
import {
  fetchSanctuaryPosts,
  createSanctuaryPost,
  fetchAsylumStats,
  incrementIncense,
  fetchIncensePillars,
  incrementIdeaEnergy,
} from "@/lib/dataApi";
import { getOrCreateCyberId, getCyberHash } from "@/lib/cyberId";
import LoadMoreButton from "@/components/LoadMoreButton";

// ========== 常量数据（从 siteData 导入：仅 UI 配置，非数据库内容）==========
const buffs = siteData.sanctuary.incenseBuffs;
const fortuneCategories = siteData.sanctuary.fortuneLibrary;
const initialIncenses: Incense[] = siteData.sanctuary.incenses;
const postTagOptions = siteData.sanctuary.postTagOptions;

const reactionButtons = [
  { key: "cool" as const, label: "🔥 酷" },
  { key: "biz" as const, label: "💰 商业" },
  { key: "hard" as const, label: "⚠️ 难点" },
  { key: "fake" as const, label: "😅 伪需求" },
];

// localStorage key：保存用户自己创建帖子的删除凭证 { postId: deleteToken }
const DELETE_TOKENS_STORAGE_KEY = "cp_sanctuary_delete_tokens";

// ========== 4 种赛博配色主题 ==========
type FortuneTheme = {
  key: string;
  name: string;
  // 主色 / 辅色
  primary: string;
  secondary: string;
  // CSS 变量（注入到卡片 style）
  glow: string;
  gridLine: string;
  blurA: string;
  blurB: string;
  ring: string;
  border: string;
  tagBg: string;
  tagText: string;
  signText: string;
  quoteMark: string;
};

const FORTUNE_THEMES: FortuneTheme[] = [
  {
    key: "neon-purple",
    name: "赛博朋克紫",
    primary: "#a855f7",
    secondary: "#22d3ee",
    glow: "rgba(168,85,247,0.35)",
    gridLine: "rgba(168,85,247,0.25)",
    blurA: "rgba(168,85,247,0.25)",
    blurB: "rgba(34,211,238,0.18)",
    ring: "rgba(168,85,247,0.35)",
    border: "rgba(168,85,247,0.25)",
    tagBg: "rgba(168,85,247,0.12)",
    tagText: "#c084fc",
    signText: "#a855f7",
    quoteMark: "rgba(168,85,247,0.45)",
  },
  {
    key: "deep-bay",
    name: "大湾区深海蓝",
    primary: "#3b82f6",
    secondary: "#2dd4bf",
    glow: "rgba(59,130,246,0.35)",
    gridLine: "rgba(59,130,246,0.22)",
    blurA: "rgba(59,130,246,0.25)",
    blurB: "rgba(45,212,191,0.18)",
    ring: "rgba(59,130,246,0.35)",
    border: "rgba(59,130,246,0.25)",
    tagBg: "rgba(59,130,246,0.12)",
    tagText: "#60a5fa",
    signText: "#3b82f6",
    quoteMark: "rgba(59,130,246,0.45)",
  },
  {
    key: "dark-amber",
    name: "黑金商业客",
    primary: "#f59e0b",
    secondary: "#fbbf24",
    glow: "rgba(245,158,11,0.32)",
    gridLine: "rgba(245,158,11,0.2)",
    blurA: "rgba(245,158,11,0.22)",
    blurB: "rgba(251,191,36,0.15)",
    ring: "rgba(245,158,11,0.35)",
    border: "rgba(245,158,11,0.28)",
    tagBg: "rgba(245,158,11,0.12)",
    tagText: "#fbbf24",
    signText: "#f59e0b",
    quoteMark: "rgba(245,158,11,0.45)",
  },
  {
    key: "emerald-cyber",
    name: "极客流光绿",
    primary: "#22c55e",
    secondary: "#10b981",
    glow: "rgba(34,197,94,0.32)",
    gridLine: "rgba(34,197,94,0.2)",
    blurA: "rgba(34,197,94,0.22)",
    blurB: "rgba(16,185,129,0.15)",
    ring: "rgba(34,197,94,0.35)",
    border: "rgba(34,197,94,0.28)",
    tagBg: "rgba(34,197,94,0.12)",
    tagText: "#4ade80",
    signText: "#22c55e",
    quoteMark: "rgba(34,197,94,0.45)",
  },
];

// 获取东八区（UTC+8）当前日期 YYYY-MM-DD（全球读者当日一致，零点自动切换）
function getUTC8DateKey(): string {
  const now = new Date();
  // 转换为 UTC+8：先用 timezoneOffset 抵消本地时区，再加 +8 小时偏移
  const utc8Ms = now.getTime() + now.getTimezoneOffset() * 60_000 + 8 * 3600_000;
  const d = new Date(utc8Ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 字符串 → 32 位正整数哈希（FNV-1a 变体，确定性：同输入同输出）
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 基于种子的确定性 PRNG（线性同余生成器）
// 同一种子永远产出同一序列 → 锁定"今日专属签文"，全球读者当日一致
function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// 生成 6 位极客哈希码（rand 缺省时使用 Math.random，传入 seeded random 则确定性输出）
function genHash(rand: () => number = Math.random): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = "#";
  for (let i = 0; i < 6; i++) {
    hash += chars[Math.floor(rand() * chars.length)];
  }
  return hash;
}

// 生成动态签印编号 NO.YYYYMMDD-XXXX（东八区日期 + 随机序号）
function genSerial(rand: () => number = Math.random): string {
  const d = new Date();
  const utc8Ms = d.getTime() + d.getTimezoneOffset() * 60_000 + 8 * 3600_000;
  const ud = new Date(utc8Ms);
  const ymd = `${ud.getUTCFullYear()}${String(ud.getUTCMonth() + 1).padStart(2, "0")}${String(ud.getUTCDate()).padStart(2, "0")}`;
  const r = Math.floor(1000 + rand() * 9000);
  return `NO.${ymd}-${r}`;
}

// ---------- 删除凭证 localStorage 管理 ----------
function loadDeleteTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DELETE_TOKENS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDeleteToken(postId: string | number, token: string): void {
  if (typeof window === "undefined") return;
  try {
    const tokens = loadDeleteTokens();
    tokens[String(postId)] = token;
    window.localStorage.setItem(DELETE_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // localStorage 写入失败（隐私模式等），静默忽略
  }
}

function removeDeleteToken(postId: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const tokens = loadDeleteTokens();
    delete tokens[String(postId)];
    window.localStorage.setItem(DELETE_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // 静默忽略
  }
}

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
  canDelete,
  onDelete,
  isDeleting,
}: {
  fart: SanctuaryPost;
  onReaction: (id: string, key: keyof SanctuaryPost["reactions"]) => void;
  onEnergy: (id: string) => void;
  onComment: (id: string, text: string) => void;
  canDelete: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [energyPulse, setEnergyPulse] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
      className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700"
    >
      {/* 删除按钮（仅自己创建的帖子显示） */}
      {canDelete && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          {isDeleting ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-950/90 px-2 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            </div>
          ) : confirmingDelete ? (
            <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950/90 px-1.5 py-1">
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  onDelete(fart.id);
                }}
                className="rounded p-1 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="确认删除"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                title="取消"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded p-1 text-zinc-600 opacity-40 transition-all hover:opacity-100 hover:text-red-400"
              title="删除我的帖子"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 标签 + 作者 */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-semibold ${fart.tagColor}`}>
          {fart.tag}
        </span>
        <span className="text-[10px] text-zinc-600">{fart.time}</span>
      </div>

      {/* 内容 */}
      <p className="mb-4 text-sm leading-relaxed text-zinc-200">{fart.content}</p>

      {/* 作者（赛博 ID） */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-[10px] font-bold text-white">
          {fart.author.charAt(0)}
        </div>
        <span className="text-xs text-zinc-300">
          {fart.author.split("#")[0]}
          {getCyberHash(fart.author) && (
            <span className="ml-0.5 font-mono text-[10px] text-purple-400">
              #{getCyberHash(fart.author)}
            </span>
          )}
        </span>
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
export default function Sanctuary({
  showInspirationSign = true,
  showCanvasLimit,
}: {
  showInspirationSign?: boolean;
  showCanvasLimit?: number;
} = {}) {
  const [incenses, setIncenses] = useState<Incense[]>(initialIncenses);
  const [activeIncense, setActiveIncense] = useState<string | null>(null);
  const [buffText, setBuffText] = useState<string | null>(null);
  const [buffId, setBuffId] = useState(0);
  const [showFortune, setShowFortune] = useState(false);
  const [fortuneCategory, setFortuneCategory] = useState<"inspiration" | "growth" | "healing">("inspiration");
  const [currentQuote, setCurrentQuote] = useState<{ lines: string[]; highlightIndex?: number } | null>(null);
  const [fortuneTheme, setFortuneTheme] = useState<FortuneTheme>(FORTUNE_THEMES[0]);
  const [fortuneSerial, setFortuneSerial] = useState<string>("");
  const [fortuneHash, setFortuneHash] = useState<string>("");
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [totalEnergy, setTotalEnergy] = useState(siteData.sanctuary.initialEnergy);
  const [farts, setFarts] = useState<SanctuaryPost[]>([]);
  const [loadingFarts, setLoadingFarts] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [postTag, setPostTag] = useState("💡 概念萌芽");
  const [posting, setPosting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // 用户自主删除凭证：{ postId: deleteToken }，从 localStorage 加载
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  // 正在删除中的帖子 id 集合（用于显示 loading）
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // 上香持久化：加载状态 & 防刷防抖
  const [loadingStats, setLoadingStats] = useState(true);
  const lastIncenseClickRef = useRef(0);
  const INCENSE_COOLDOWN_MS = 500; // 500ms 防刷
  // 上香 Toast 提示
  const [incenseToast, setIncenseToast] = useState<string | null>(null);
  const fortuneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fartIdRef = useRef(4);

  // 加载时从 Supabase 读取最新帖子 + 上香累计数据 + localStorage 删除凭证
  useEffect(() => {
    let mounted = true;
    // 加载用户保存的删除凭证（判断哪些帖子可删）
    setDeleteTokens(loadDeleteTokens());
    fetchSanctuaryPosts().then((data) => {
      if (mounted) {
        setFarts(data);
        setLoadingFarts(false);
      }
    }).catch(() => {
      if (mounted) setLoadingFarts(false);
    });
    // 读取全网累计上香次数（totalEnergy 持久化）
    fetchAsylumStats()
      .then((stats) => {
        if (mounted && typeof stats.incenseCount === "number") {
          setTotalEnergy(stats.incenseCount);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingStats(false);
      });
    // 批量读取各香柱累计 count，覆盖 siteData 初始基数
    fetchIncensePillars()
      .then((pillarMap) => {
        if (mounted && pillarMap && Object.keys(pillarMap).length > 0) {
          setIncenses((prev) =>
            prev.map((inc) =>
              typeof pillarMap[inc.id] === "number"
                ? { ...inc, count: pillarMap[inc.id] }
                : inc
            )
          );
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // 点击能量场数字 +1
  const handleEnergyClick = useCallback(() => {
    setTotalEnergy((prev) => prev + 1);
  }, []);

  // 上香逻辑
  // 从指定分类抽取一条金句（rand 缺省时随机，传入 seeded random 则确定性锁定今日签文）
  const pickRandomQuote = useCallback(
    (category: "inspiration" | "growth" | "healing", rand: () => number = Math.random) => {
      const pool = siteData.sanctuary.fortuneLibrary[category].quotes;
      return pool[Math.floor(rand() * pool.length)];
    },
    []
  );

  // 生成/刷新签文 —— 今日专属签文（东八区日期 + 分类 作为种子，全球读者当日一致）
  const handleRevealFortune = useCallback(() => {
    // 种子 = UTC+8 日期 | 分类 → 同一天同一分类永远抽出同一条签文
    const dateKey = getUTC8DateKey();
    const seed = hashSeed(`${dateKey}|${fortuneCategory}`);
    const rand = createSeededRandom(seed);
    setCurrentQuote(pickRandomQuote(fortuneCategory, rand));
    setFortuneTheme(FORTUNE_THEMES[Math.floor(rand() * FORTUNE_THEMES.length)]);
    setFortuneSerial(genSerial(rand));
    setFortuneHash(genHash(rand));
    setTiltStyle({});
    setShowFortune(true);
  }, [fortuneCategory, pickRandomQuote]);

  // 3D Tilt 跟随鼠标
  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * 16;
    const rotateX = -y * 16;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: "transform 0.15s ease-out",
    });
  }, []);

  const handleTiltLeave = useCallback(() => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    });
  }, []);

  // 【重新求签】手动抽卡：使用 Math.random() 真随机，突破今日锁定
  const handleChangeQuote = useCallback(() => {
    setCurrentQuote(pickRandomQuote(fortuneCategory));
    setFortuneTheme(FORTUNE_THEMES[Math.floor(Math.random() * FORTUNE_THEMES.length)]);
    setFortuneSerial(genSerial());
    setFortuneHash(genHash());
  }, [fortuneCategory, pickRandomQuote]);

  // 切换分类 → 抽取该分类的今日锁定签文（同一天同一分类全球一致）
  const handleCategoryChange = useCallback((cat: "inspiration" | "growth" | "healing") => {
    setFortuneCategory(cat);
    const dateKey = getUTC8DateKey();
    const seed = hashSeed(`${dateKey}|${cat}`);
    const rand = createSeededRandom(seed);
    setCurrentQuote(pickRandomQuote(cat, rand));
  }, [pickRandomQuote]);

  // -------- 每日上香防刷：每个香柱每天最多上香 1 次 --------
  const INCENSE_DAILY_KEY = "cp_incense_daily";
  // 每个香柱每天最多上香次数
  const INCENSE_DAILY_LIMIT = 1;

  function getTodayKey(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function getIncenseDailyMap(): Record<string, number> {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(INCENSE_DAILY_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      // 自动清理过期日期记录
      const today = getTodayKey();
      const filtered: Record<string, any> = {};
      for (const [date, map] of Object.entries(parsed || {})) {
        if (date === today) filtered[date] = map;
      }
      return filtered[today] || {};
    } catch {
      return {};
    }
  }

  function getIncenseTodayCount(incenseId: string): number {
    const map = getIncenseDailyMap();
    return Number(map[incenseId] || 0);
  }

  function recordIncenseToday(incenseId: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(INCENSE_DAILY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const today = getTodayKey();
      if (!parsed[today]) parsed[today] = {};
      parsed[today][incenseId] = (parsed[today][incenseId] || 0) + 1;
      window.localStorage.setItem(INCENSE_DAILY_KEY, JSON.stringify(parsed));
    } catch {
      // 静默忽略
    }
  }

  // 上香 Toast 显示（3秒后自动消失）
  const showIncenseToast = useCallback((msg: string) => {
    setIncenseToast(msg);
    setTimeout(() => setIncenseToast(null), 3000);
  }, []);

  const handleIncenseClick = useCallback((id: string) => {
    // 1) 前端防刷：500ms 冷却期
    const now = Date.now();
    if (now - lastIncenseClickRef.current < INCENSE_COOLDOWN_MS) {
      return;
    }
    lastIncenseClickRef.current = now;

    // 2) 每日防刷：每个香柱每天最多上香 INCENSE_DAILY_LIMIT 次
    const todayCount = getIncenseTodayCount(id);
    if (todayCount >= INCENSE_DAILY_LIMIT) {
      showIncenseToast("今日诚心已至，明日再来上香吧！");
      // 仍触发一次微弱视觉反馈（不增加计数）
      setActiveIncense(id);
      setTimeout(() => setActiveIncense(null), 800);
      return;
    }

    // 记录今日上香次数
    recordIncenseToday(id);

    // 触发赛博上香视觉特效：发光烟雾、Buff 飘字、功德计数 +1
    setActiveIncense(id);
    const randomBuff = buffs[Math.floor(Math.random() * buffs.length)];
    setBuffText(randomBuff);
    setBuffId((prev) => prev + 1);
    setIncenses((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, count: inc.count + 1 } : inc))
    );
    // 先乐观更新 UI，后端完成后再同步真实值
    setTotalEnergy((prev) => prev + 1);
    // Toast 温馨提示
    showIncenseToast("诚心已至，愿以此祝祷！");

    // 3) 持久化：原子递增 DB 总能量 + 单柱 count
    incrementIncense(id)
      .then((dbCount) => {
        if (typeof dbCount === "number") {
          setTotalEnergy(dbCount);
        }
      })
      .catch((err) => {
        console.warn("[Sanctuary] 上香持久化失败，将在下次刷新时同步:", err?.message || err);
      });

    setTimeout(() => setActiveIncense(null), 1000);
    setTimeout(() => setBuffText(null), 2500);
  }, [showIncenseToast]);

  // 表态 +1
  const handleReaction = useCallback((fartId: string, key: keyof SanctuaryPost["reactions"]) => {
    setFarts((prev) =>
      prev.map((f) =>
        f.id === fartId
          ? { ...f, reactions: { ...f.reactions, [key]: f.reactions[key] + 1 } }
          : f
      )
    );
  }, []);

  // 注入能量 +1（乐观更新 + 异步持久化到 sanctuary_posts.likes）
  const handleEnergy = useCallback((fartId: string) => {
    setFarts((prev) =>
      prev.map((f) => (f.id === fartId ? { ...f, likes: f.likes + 1 } : f))
    );
    setTotalEnergy((prev) => prev + 1);
    // 异步持久化：失败则回滚（静默处理，不阻断用户体验）
    incrementIdeaEnergy(fartId)
      .then((dbEnergy) => {
        if (typeof dbEnergy === "number") {
          setFarts((prev) =>
            prev.map((f) => (f.id === fartId ? { ...f, likes: dbEnergy } : f))
          );
        }
      })
      .catch((err) => {
        console.warn("[Sanctuary] 注入能量持久化失败:", err?.message || err);
        // 回滚乐观 +1
        setFarts((prev) =>
          prev.map((f) => (f.id === fartId ? { ...f, likes: Math.max(0, f.likes - 1) } : f))
        );
        setTotalEnergy((prev) => Math.max(0, prev - 1));
      });
  }, []);

  // 评论
  const handleComment = useCallback((fartId: string, text: string) => {
    const cyberAuthor = getOrCreateCyberId();
    setFarts((prev) =>
      prev.map((f) =>
        f.id === fartId
          ? {
              ...f,
              comments: [
                ...f.comments,
                { author: cyberAuthor, text, time: "刚刚" },
              ],
            }
          : f
      )
    );
  }, []);

  // 用户自主删除自己的帖子（凭 localStorage 中保存的 delete_token）
  const handleDeletePost = useCallback(async (fartId: string) => {
    const token = deleteTokens[fartId];
    if (!token) return;
    setDeletingIds((prev) => new Set(prev).add(fartId));
    try {
      const res = await fetch(`/api/sanctuary/posts?id=${encodeURIComponent(fartId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      // 删除成功：从状态移除帖子 + 清除 localStorage 凭证
      setFarts((prev) => prev.filter((f) => f.id !== fartId));
      removeDeleteToken(fartId);
      setDeleteTokens((prev) => {
        const next = { ...prev };
        delete next[fartId];
        return next;
      });
    } catch (err) {
      console.warn("[Sanctuary] 删除帖子失败:", err instanceof Error ? err.message : err);
      window.alert("删除失败：" + (err instanceof Error ? err.message : err));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(fartId);
        return next;
      });
    }
  }, [deleteTokens]);

  // 发布脑洞 — 写入 Supabase 持久化
  const handlePost = async () => {
    if (!postContent.trim() || posting) return;
    setPosting(true);
    const tagColor = postTagOptions.find((t) => t.label === postTag)?.color || "text-blue-400 bg-blue-500/10";
    // 生成赛博 ID（未登录用户），已登录用户可传入固定昵称
    const cyberAuthor = getOrCreateCyberId();
    try {
      const newPost = await createSanctuaryPost({
        content: postContent.trim(),
        tag: postTag,
        author: cyberAuthor,
      });
      const finalPost: SanctuaryPost = newPost
        ? { ...newPost, tagColor }
        : {
            id: String(fartIdRef.current++),
            content: postContent.trim(),
            tag: postTag,
            tagColor,
            author: cyberAuthor,
            time: "刚刚",
            likes: 0,
            reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
            comments: [],
            isNew: true,
          };
      setFarts((prev) => [finalPost, ...prev]);
      setPostContent("");
      // 保存删除凭证到 localStorage + state（仅 Supabase 写入成功时）
      if (newPost?.deleteToken) {
        saveDeleteToken(finalPost.id, newPost.deleteToken);
        setDeleteTokens((prev) => ({ ...prev, [finalPost.id]: newPost.deleteToken! }));
      }
    } catch (err) {
      // Supabase 写入失败 — 打印详细错误便于排查，仍在前端临时显示
      console.warn("[Sanctuary] 发帖写入 Supabase 失败:", err instanceof Error ? err.message : err);
      const fallback: SanctuaryPost = {
        id: String(fartIdRef.current++),
        content: postContent.trim(),
        tag: postTag,
        tagColor,
        author: cyberAuthor,
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
    // 临时移除 Tilt 变换，避免变换矩阵影响截图
    const prevTransform = fortuneRef.current.style.transform;
    fortuneRef.current.style.transform = "none";
    try {
      // 生成标准 data:image/png;base64 格式，9:16 高清海报
      const dataUrl = await toPng(fortuneRef.current, {
        quality: 0.95,
        pixelRatio: 3, // 高清渲染，适配移动端 Retina 屏
        cacheBust: true, // 防止图片资源缓存干扰
        backgroundColor: "#09090b",
      });

      const fileName = `chenpi-inspiration-${fortuneHash.replace("#", "")}.png`;
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
      // 恢复 Tilt 变换
      if (fortuneRef.current) {
        fortuneRef.current.style.transform = prevTransform;
      }
      setDownloading(false);
    }
  }, [downloading, fortuneHash]);

  // 脑洞画布列表：首页限制条数
  const displayedFarts = (() => {
    if (typeof showCanvasLimit === "number" && showCanvasLimit > 0) {
      return farts.slice(0, showCanvasLimit);
    }
    return farts;
  })();

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
              {loadingStats ? (
                <span className="h-4 w-16 animate-pulse rounded-md bg-zinc-800 text-transparent">0</span>
              ) : (
                <motion.span
                  key={totalEnergy}
                  initial={{ scale: 1.3, color: "#a855f7" }}
                  animate={{ scale: 1, color: "#fafafa" }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-bold text-zinc-50"
                >
                  {totalEnergy.toLocaleString()}
                </motion.span>
              )}
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
          {loadingFarts ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
              ))}
            </div>
          ) : displayedFarts.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">还没有人留下脑洞，来抢沙发吧</p>
            </div>
          ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {displayedFarts.map((fart) => (
                  <CommunityCard
                    key={fart.id}
                    fart={fart}
                    onReaction={handleReaction}
                    onEnergy={handleEnergy}
                    onComment={handleComment}
                    canDelete={!!deleteTokens[String(fart.id)]}
                    onDelete={handleDeletePost}
                    isDeleting={deletingIds.has(fart.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
            {/* 首页模式：跳转量子页面 */}
            {typeof showCanvasLimit === "number" && farts.length > displayedFarts.length && (
              <LoadMoreButton href="/sanctuary" label="进入脑洞画布完整列表" />
            )}
          </>
          )}
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

              {/* 9:16 赛博便签海报（设计师级极简 + 3D Tilt） */}
              <div
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
                style={tiltStyle}
              >
              <div
                ref={fortuneRef}
                className="relative w-[300px] overflow-hidden rounded-2xl sm:w-[340px]"
                style={{
                  aspectRatio: "9 / 16",
                  background: "rgba(9, 9, 11, 0.78)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: `0 0 45px ${fortuneTheme.glow}, 0 0 0 1px ${fortuneTheme.border} inset`,
                }}
              >
                {/* 背景层：赛博网格 + 几何水印 + 光晕（降透明度去油） */}
                <div className="absolute inset-0">
                  <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                      backgroundImage: `linear-gradient(${fortuneTheme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${fortuneTheme.gridLine} 1px, transparent 1px)`,
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div
                    className="absolute right-4 top-20 h-28 w-28 rotate-45 border opacity-[0.15]"
                    style={{ borderColor: fortuneTheme.border }}
                  />
                  <div
                    className="absolute left-4 bottom-28 h-20 w-20 rotate-12 border opacity-[0.15]"
                    style={{ borderColor: fortuneTheme.border }}
                  />
                  <div
                    className="absolute -top-24 left-1/4 h-48 w-48 rounded-full blur-3xl opacity-60"
                    style={{ background: fortuneTheme.blurA }}
                  />
                  <div
                    className="absolute -bottom-24 right-1/4 h-48 w-48 rounded-full blur-3xl opacity-60"
                    style={{ background: fortuneTheme.blurB }}
                  />
                </div>

                {/* 渐变边框光晕（Cyber Glow Border） */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${fortuneTheme.primary}30, transparent 40%, transparent 60%, ${fortuneTheme.secondary}30)`,
                    maskImage: "linear-gradient(black, black) padding-box, linear-gradient(black, black)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: 1,
                  }}
                />

                {/* 内容层 */}
                <div className="relative z-10 flex h-full flex-col p-7">
                  {/* Header：12px 极小半透灰，无粗边框无强装饰 */}
                  <div className="flex items-center justify-between">
                    <div
                      className="text-[12px] font-medium"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      陈皮同学
                    </div>
                    <div
                      className="text-[12px] tabular-nums tracking-wide"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {new Date().toLocaleDateString("zh-CN").replace(/\//g, ".")}
                    </div>
                  </div>

                  {/* 分类标签（与金句主题色绑定） */}
                  <div className="mt-5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide"
                      style={{
                        borderColor: `${siteData.sanctuary.fortuneLibrary[fortuneCategory].highlightColor}40`,
                        background: `${siteData.sanctuary.fortuneLibrary[fortuneCategory].highlightColor}10`,
                        color: siteData.sanctuary.fortuneLibrary[fortuneCategory].highlightColor,
                      }}
                    >
                      {fortuneCategories[fortuneCategory].icon}
                      {fortuneCategories[fortuneCategory].label}
                    </span>
                  </div>

                  {/* 中部：三行短诗（现代诗排版） */}
                  <div className="relative my-8 flex flex-1 items-center justify-center">
                    {/* 极淡柔光背景 */}
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: `radial-gradient(ellipse at center, ${fortuneTheme.primary}0A 0%, transparent 70%)`,
                      }}
                    />

                    {/* 双引号浮标 - 上 */}
                    <span
                      className="absolute left-1 top-0 font-serif text-2xl leading-none"
                      style={{ color: fortuneTheme.quoteMark, opacity: 0.4 }}
                    >
                      "
                    </span>

                    {/* 三行诗内容（逐行渲染，highlightIndex 行荧光高亮） */}
                    <div className="relative z-10 w-full px-5">
                      {currentQuote.lines.map((line, i) => {
                        const isHighlight = i === currentQuote.highlightIndex;
                        const highlightColor = siteData.sanctuary.fortuneLibrary[fortuneCategory].highlightColor;
                        return (
                          <p
                            key={i}
                            className="text-center"
                            style={{
                              fontSize: "19px",
                              lineHeight: 2.2,
                              letterSpacing: "0.05em",
                              fontWeight: isHighlight ? 500 : 400,
                              color: isHighlight ? highlightColor : "rgba(255,255,255,0.85)",
                              textShadow: isHighlight ? `0 0 12px ${highlightColor}40` : "none",
                            }}
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>

                    {/* 双引号浮标 - 下 */}
                    <span
                      className="absolute bottom-0 right-1 rotate-180 font-serif text-2xl leading-none"
                      style={{ color: fortuneTheme.quoteMark, opacity: 0.4 }}
                    >
                      "
                    </span>
                  </div>

                  {/* 底部：二维码 + 编号（极简收纳） */}
                  <div className="flex items-end justify-between">
                    {/* 左侧：陈皮签印（极淡） */}
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-md border text-[8px] font-semibold"
                      style={{
                        borderColor: `${fortuneTheme.signText}40`,
                        color: `${fortuneTheme.signText}88`,
                        background: `${fortuneTheme.signText}08`,
                      }}
                    >
                      陈皮
                    </div>
                    {/* 右侧：编号 + 二维码 */}
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className="font-mono text-[10px] leading-none"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {fortuneSerial}
                        </span>
                        <span
                          className="font-mono text-[10px] leading-none"
                          style={{ color: `${fortuneTheme.tagText}CC` }}
                        >
                          {fortuneHash}
                        </span>
                      </div>
                      <div
                        className="overflow-hidden rounded-lg border border-white/10 bg-white p-2"
                        style={{ borderRadius: "8px" }}
                      >
                        <QRCodeSVG
                          value="https://chenpi-nexus.vercel.app"
                          size={80}
                          level="M"
                          fgColor="#09090b"
                          bgColor="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 毛玻璃边框光晕 */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-1"
                  style={{ boxShadow: `0 0 30px ${fortuneTheme.glow} inset` }}
                />
              </div>
              </div>

              {/* 操作按钮区 */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={handleChangeQuote}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  换一张
                </button>
                <button
                  onClick={handleDownloadFortune}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {downloading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 生成中...</>
                  ) : (
                    <><Download className="h-3.5 w-3.5" /> 保存高光海报</>
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

      {/* 上香 Toast 提示 */}
      <AnimatePresence>
        {incenseToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[60] flex items-center gap-2 rounded-xl border border-purple-500/30 bg-zinc-900/95 px-4 py-2.5 text-sm text-purple-200 shadow-2xl backdrop-blur-sm"
          >
            <span className="text-base">🕯️</span>
            {incenseToast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
