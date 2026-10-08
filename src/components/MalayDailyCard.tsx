"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Flame, CheckCircle2, Sparkles, BookOpen, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getLessonByDay,
  getUTC8DateKey,
  getYesterdayDateKey,
  type DailyLesson,
} from "@/data/malayLessons";

// 语音朗读：Web Speech API（马来语 ms-MY）
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ms-MY";
  utter.rate = 0.9;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const msVoice = voices.find((v) => v.lang.startsWith("ms")) || voices.find((v) => v.lang === "id-ID");
  if (msVoice) utter.voice = msVoice;
  window.speechSynthesis.speak(utter);
}

interface CheckinState {
  lastDate: string;       // 最后打卡日期 YYYY-MM-DD
  streak: number;         // 连续打卡天数
  progressDay: number;    // 当前应学天数（1-90）
}

const STORAGE_KEY = "malay_checkin_state";

function loadCheckinState(): CheckinState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function saveCheckinState(state: CheckinState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * 计算今日应学天数（进度驱动）：
 * - 新用户（无记录）→ Day 1
 * - 昨天打卡了 → 推进 Day + 1
 * - 断签未打卡 → 保持当前 Day
 */
function resolveProgressDay(): { day: number; state: CheckinState; checkedInToday: boolean } {
  const today = getUTC8DateKey();
  const yesterday = getYesterdayDateKey();
  const stored = loadCheckinState();

  // 新用户
  if (!stored) {
    const fresh: CheckinState = { lastDate: "", streak: 0, progressDay: 1 };
    return { day: 1, state: fresh, checkedInToday: false };
  }

  // 今天已打卡 → 显示当前进度
  if (stored.lastDate === today) {
    return { day: stored.progressDay, state: stored, checkedInToday: true };
  }

  // 昨天打卡了 → 推进到下一天
  if (stored.lastDate === yesterday) {
    const nextDay = Math.min(stored.progressDay + 1, 90);
    const updated: CheckinState = { ...stored, progressDay: nextDay };
    saveCheckinState(updated); // 持久化推进
    return { day: nextDay, state: updated, checkedInToday: false };
  }

  // 断签 → 保持当前应学天数
  return { day: stored.progressDay, state: stored, checkedInToday: false };
}

export default function MalayDailyCard() {
  const [progressDay, setProgressDay] = useState(1);
  const [lesson, setLesson] = useState<DailyLesson>(() => getLessonByDay(1));
  const [checkin, setCheckin] = useState<CheckinState>({ lastDate: "", streak: 0, progressDay: 1 });
  const [checkedIn, setCheckedIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 初始化：从 localStorage 加载进度
  useEffect(() => {
    const { day, state, checkedInToday } = resolveProgressDay();
    setProgressDay(day);
    setLesson(getLessonByDay(day));
    setCheckin(state);
    setCheckedIn(checkedInToday);
    // 触发语音列表加载
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // 翻页 offset（仅浏览，不影响进度）
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (offset === 0) {
      setLesson(getLessonByDay(progressDay));
    } else {
      // 基于 progressDay 前后翻阅
      const targetDay = (((progressDay - 1 + offset) % 90) + 90) % 90 + 1;
      setLesson(getLessonByDay(targetDay));
    }
  }, [offset, progressDay]);

  const handleCheckin = useCallback(() => {
    if (checkedIn) return;
    const today = getUTC8DateKey();
    const yesterday = getYesterdayDateKey();
    const prev = loadCheckinState();
    const wasConsecutive = prev?.lastDate === yesterday;
    const newStreak = wasConsecutive ? (prev?.streak || 0) + 1 : 1;
    const next: CheckinState = {
      lastDate: today,
      streak: newStreak,
      progressDay,
    };
    saveCheckinState(next);
    setCheckin(next);
    setCheckedIn(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  }, [checkedIn, progressDay]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/15 via-zinc-900/50 to-blue-950/15 p-5 sm:p-6 shadow-[0_20px_60px_-25px_rgba(168,85,247,0.25)] backdrop-blur-sm">
      {/* 顶部：主题 + 打卡状态 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <MessageSquare className="h-3 w-3" />
              1-Min Daily Malay
              <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                Day {lesson.day}
              </span>
            </div>
            <div className="text-sm font-semibold text-zinc-100">{lesson.theme}</div>
          </div>
        </div>
        {/* 连续打卡 */}
        <div className="flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-orange-300">连续 {checkin.streak} 天</span>
        </div>
      </div>

      {/* 核心词汇 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <Sparkles className="h-3 w-3 text-purple-400" />
          5 个核心词汇
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lesson.words.map((w, i) => (
            <div
              key={i}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-2 transition-colors hover:border-purple-500/20"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-purple-200">{w.malay}</span>
                  <span className="text-[10px] text-zinc-500">{w.pronunciation}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {w.chinese} · <span className="text-zinc-600">{w.english}</span>
                </div>
              </div>
              <button
                onClick={() => speak(w.malay)}
                aria-label={`朗读 ${w.malay}`}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-purple-500/15 hover:text-purple-300"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 实用金句 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <MessageSquare className="h-3 w-3 text-blue-400" />
          实用金句 · {lesson.sentence.scenario}
        </div>
        <div className="rounded-xl border-l-2 border-purple-500/50 bg-zinc-950/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium italic text-zinc-100">{lesson.sentence.malay}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{lesson.sentence.chinese}</p>
            </div>
            <button
              onClick={() => speak(lesson.sentence.malay)}
              aria-label="朗读金句"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-blue-500/15 hover:text-blue-300"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 避坑指南 */}
      <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-950/10 p-3">
        <div className="flex items-start gap-2">
          <span className="text-sm">💡</span>
          <p className="text-[11px] leading-relaxed text-amber-200/90">{lesson.tip}</p>
        </div>
      </div>

      {/* 打卡按钮 + 日期切换 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            aria-label="上一天"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            aria-label="下一天"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="ml-1 rounded-md bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300 hover:bg-purple-500/20"
            >
              回到今日
            </button>
          )}
        </div>

        {/* 打卡按钮 */}
        <button
          onClick={handleCheckin}
          disabled={checkedIn || offset !== 0}
          className={`relative inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
            checkedIn
              ? "cursor-default bg-green-500/15 text-green-300"
              : offset !== 0
                ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                : "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-[0_8px_25px_-8px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_-8px_rgba(168,85,247,0.6)]"
          }`}
        >
          {checkedIn ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              今日已打卡
            </>
          ) : offset !== 0 ? (
            "浏览模式"
          ) : (
            <>
              <Flame className="h-4 w-4" />
              立即打卡
            </>
          )}

          {/* 打卡成功粒子 */}
          <AnimatePresence>
            {showSuccess && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: (i % 2 === 0 ? 1 : -1) * (20 + i * 4),
                      y: -30 - i * 3,
                      scale: 0,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-yellow-300"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* 打卡成功浮层 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute inset-x-0 top-1/2 z-10 flex justify-center"
          >
            <div className="rounded-xl border border-green-500/40 bg-zinc-950/95 px-5 py-3 text-center shadow-[0_0_30px_rgba(34,197,94,0.3)] backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                打卡成功！连续 {checkin.streak} 天 🔥
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
