"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Flame,
  CheckCircle2,
  Sparkles,
  Globe,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Target,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Zap,
  BookOpen,
  Download,
} from "lucide-react";
import {
  getEnglishLessonByDay,
  getUTC8DateKey,
  getYesterdayDateKey,
  type EnglishLesson,
} from "@/data/englishLessons";

// ---------- 语音朗读：Web Speech API（英语 en-US） ----------
function speak(text: string, rate = 1.0) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = rate;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const enVoice =
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;
  window.speechSynthesis.speak(utter);
}

// ---------- 打卡状态 ----------
interface CheckinState {
  lastDate: string;
  streak: number;
  progressDay: number;
  dayResolvedDate: string;
}

const STORAGE_KEY = "english_checkin_state";

function loadCheckinState(): CheckinState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.progressDay || typeof parsed.progressDay !== "number" || parsed.progressDay < 1) {
        parsed.progressDay = 1;
      }
      if (parsed.progressDay > 7) parsed.progressDay = 7;
      if (typeof parsed.streak !== "number" || parsed.streak < 0) parsed.streak = 0;
      if (typeof parsed.dayResolvedDate !== "string") parsed.dayResolvedDate = "";
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveCheckinState(state: CheckinState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resolveProgressDay(): { day: number; state: CheckinState; checkedInToday: boolean } {
  const today = getUTC8DateKey();
  const yesterday = getYesterdayDateKey();
  const stored = loadCheckinState();

  if (!stored) {
    const fresh: CheckinState = { lastDate: "", streak: 0, progressDay: 1, dayResolvedDate: today };
    return { day: 1, state: fresh, checkedInToday: false };
  }

  const currentProgress =
    typeof stored.progressDay === "number" && stored.progressDay >= 1
      ? Math.min(stored.progressDay, 7)
      : 1;

  if (stored.lastDate === today) {
    return { day: currentProgress, state: stored, checkedInToday: true };
  }

  if (stored.dayResolvedDate === today) {
    return { day: currentProgress, state: stored, checkedInToday: false };
  }

  if (stored.lastDate === yesterday) {
    const nextDay = Math.min(currentProgress + 1, 7);
    const updated: CheckinState = { ...stored, progressDay: nextDay, dayResolvedDate: today };
    saveCheckinState(updated);
    return { day: nextDay, state: updated, checkedInToday: false };
  }

  const resolved: CheckinState = { ...stored, dayResolvedDate: today };
  saveCheckinState(resolved);
  return { day: currentProgress, state: resolved, checkedInToday: false };
}

// ---------- 主组件 ----------
export default function EnglishDailyCard() {
  const [progressDay, setProgressDay] = useState(1);
  const [lesson, setLesson] = useState<EnglishLesson>(() => getEnglishLessonByDay(1));
  const [checkin, setCheckin] = useState<CheckinState>({
    lastDate: "",
    streak: 0,
    progressDay: 1,
    dayResolvedDate: "",
  });
  const [checkedIn, setCheckedIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 音频播放状态
  const [playing, setPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // 录音状态
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化
  useEffect(() => {
    const { day, state, checkedInToday } = resolveProgressDay();
    setProgressDay(day);
    setLesson(getEnglishLessonByDay(day));
    setCheckin(state);
    setCheckedIn(checkedInToday);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // 翻页 offset
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (offset === 0) {
      setLesson(getEnglishLessonByDay(progressDay));
    } else {
      const targetDay = (((progressDay - 1 + offset) % 7) + 7) % 7 + 1;
      setLesson(getEnglishLessonByDay(targetDay));
    }
  }, [offset, progressDay]);

  // 打卡
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
      dayResolvedDate: today,
    };
    saveCheckinState(next);
    setCheckin(next);
    setCheckedIn(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  }, [checkedIn, progressDay]);

  // 播放/暂停（TTS 模拟音频）
  const handlePlay = useCallback(
    (text: string) => {
      if (playing) {
        window.speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      speak(text, speechRate);
      setPlaying(true);
      const utter = new SpeechSynthesisUtterance(text);
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
    },
    [playing, speechRate]
  );

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.warn("[EnglishDailyCard] 麦克风权限被拒绝或不可用:", err);
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
  }, [mediaRecorder]);

  // 回放录音
  const playRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  // 清除录音
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // 生成金句分享卡片（下载为图片）
  const handleShareCard = useCallback(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 450;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 800, 450);
    gradient.addColorStop(0, "#0f0f23");
    gradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // 顶部装饰线
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(60, 60, 40, 3);

    // Day 标签
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`Day ${lesson.day}`, 120, 78);

    // 标题
    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillStyle = "#f1f5f9";
    const titleLines = wrapText(ctx, lesson.title, 60, 130, 680, 32);
    let y = 130 + titleLines * 32;

    // 核心表达
    ctx.font = "500 16px Inter, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    y += 20;
    ctx.fillText("Core Expression:", 60, y);
    ctx.font = "600 18px Inter, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    y += 30;
    const exprLines = wrapText(ctx, `"${lesson.targetExpression.english}"`, 60, y, 680, 28);
    y += exprLines * 28 + 15;

    // 中文释义
    ctx.font = "400 14px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    y += 10;
    const cnLines = wrapText(ctx, lesson.targetExpression.chinese, 60, y, 680, 24);
    y += cnLines * 24 + 20;

    // 底部品牌
    ctx.font = "500 12px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("陈皮同学 · 东南亚实局", 60, 410);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("Global Business English Challenge", 560, 410);

    // 下载
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `english-day-${lesson.day}-${getUTC8DateKey()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [lesson]);

  // 文字换行辅助
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const words = text.split(" ");
    let line = "";
    let lines = 0;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, y);
        line = words[n] + " ";
        y += lineHeight;
        lines++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y);
    lines++;
    return lines;
  }

  const categoryColor =
    lesson.category === "Listening"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/15 via-zinc-900/50 to-cyan-950/15 p-5 sm:p-6 shadow-[0_20px_60px_-25px_rgba(59,130,246,0.25)] backdrop-blur-sm">
      {/* 顶部：主题 + 打卡状态 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Headphones className="h-3 w-3" />
              Business English
              <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                Day {lesson.day}
              </span>
              <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${categoryColor}`}>
                {lesson.category === "Listening" ? "听力驯化" : "口语护甲"}
              </span>
            </div>
            <div className="text-sm font-semibold text-zinc-100">{lesson.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-orange-300">连续 {checkin.streak} 天</span>
        </div>
      </div>

      {/* 场景描述 */}
      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
          <p className="text-[11px] leading-relaxed text-zinc-400">{lesson.sceneContext}</p>
        </div>
      </div>

      {/* 音频播放器 */}
      <div className="mb-4 rounded-xl border border-blue-500/15 bg-blue-950/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <Volume2 className="h-3 w-3 text-blue-400" />
            听力磨耳朵
          </div>
          {/* 语速切换 */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
            <button
              onClick={() => setSpeechRate(0.8)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                speechRate === 0.8
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              0.8x
            </button>
            <button
              onClick={() => setSpeechRate(1.0)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                speechRate === 1.0
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              1.0x
            </button>
          </div>
        </div>

        <button
          onClick={() => handlePlay(lesson.targetExpression.english)}
          className="flex w-full items-center gap-3 rounded-lg border border-blue-500/10 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:border-blue-500/25"
        >
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              playing ? "bg-blue-500/25 text-blue-300" : "bg-blue-500/15 text-blue-400"
            }`}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-zinc-100">
              {lesson.targetExpression.english}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{lesson.targetExpression.chinese}</p>
          </div>
        </button>
      </div>

      {/* 连读/变音拆解 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <Zap className="h-3 w-3 text-amber-400" />
          连读 / 弱读 / 吞音拆解
        </div>
        <div className="rounded-xl border-l-2 border-amber-500/40 bg-zinc-950/40 p-3">
          <p className="font-mono text-[11px] leading-relaxed text-amber-200/80">
            {lesson.targetExpression.phoneticAndLinking}
          </p>
        </div>
      </div>

      {/* 实战商业启示 */}
      <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3">
        <div className="flex items-start gap-2">
          <span className="text-sm">💼</span>
          <div>
            <div className="mb-1 text-[11px] font-medium text-cyan-300">实战商业启示</div>
            <p className="text-[11px] leading-relaxed text-cyan-200/80">{lesson.businessTakeaway}</p>
          </div>
        </div>
      </div>

      {/* 影子跟读（Shadowing） */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <Mic className="h-3 w-3 text-emerald-400" />
            影子跟读 Shadowing
          </div>
          {/* 分享按钮 */}
          <button
            onClick={handleShareCard}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            title="生成今日金句卡片"
          >
            <Download className="h-3 w-3" />
            分享卡片
          </button>
        </div>

        <div className="space-y-2">
          {lesson.shadowingPractice.map((sentence, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-emerald-500/15 bg-zinc-950/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-relaxed text-zinc-100">{sentence}</p>
                </div>
                <button
                  onClick={() => handlePlay(sentence)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300"
                  aria-label="朗读例句"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 录音控制 */}
        <div className="mt-3 flex items-center gap-2">
          {!recording ? (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/20"
            >
              <Mic className="h-3.5 w-3.5" />
              开始录音
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors animate-pulse"
            >
              <MicOff className="h-3.5 w-3.5" />
              停止录音
            </button>
          )}

          {audioUrl && (
            <>
              <button
                onClick={playRecording}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                <Play className="h-3 w-3" />
                回放
              </button>
              <button
                onClick={clearRecording}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                <RotateCcw className="h-3 w-3" />
                重录
              </button>
              {/* 隐藏的 audio 元素用于回放 */}
              <audio ref={audioRef} src={audioUrl} className="hidden" />
            </>
          )}
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
              className="ml-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] text-blue-300 hover:bg-blue-500/20"
            >
              回到今日
            </button>
          )}
        </div>

        <button
          onClick={handleCheckin}
          disabled={checkedIn || offset !== 0}
          className={`relative inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
            checkedIn
              ? "cursor-default bg-green-500/15 text-green-300"
              : offset !== 0
                ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_8px_25px_-8px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_-8px_rgba(59,130,246,0.6)]"
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
              完成今日英文打卡
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
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-blue-300"
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
