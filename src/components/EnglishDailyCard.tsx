"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Flame,
  CheckCircle2,
  Globe,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Target,
  ArrowLeft,
  Zap,
  Download,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import type { EnglishLesson } from "@/data/englishLessons";
import { useCheckin } from "@/hooks/useCheckin";
import { getUTC8DateKey } from "@/lib/checkinProgress";

// ---------- Supabase 课程数据类型（与 english_daily_lessons 表对齐） ----------
interface ApiLesson {
  id: string;
  date: string;
  day_number: number;
  category: string;
  title: string;
  scene_context: string;
  audio_url: string;
  target_expression: { english: string; phoneticAndLinking: string; chinese: string };
  alternative_expression: { english: string; phoneticAndLinking: string; chinese: string };
  business_takeaway: string;
  shadowing_practice: string[];
  glossary_items: Array<{ term: string; fullForm: string; meaning: string; exampleScene: string }>;
}

// 将 API 数据映射为组件内部 EnglishLesson 格式
function mapApiLesson(row: ApiLesson): EnglishLesson {
  return {
    day: row.day_number,
    title: row.title,
    category: row.category as "Listening" | "Speaking",
    sceneContext: row.scene_context,
    audioUrl: row.audio_url || "",
    targetExpression: row.target_expression,
    alternativeExpression: row.alternative_expression,
    businessTakeaway: row.business_takeaway,
    shadowingPractice: row.shadowing_practice,
    glossaryItems: row.glossary_items,
  };
}

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

// ---------- 主组件 ----------
export default function EnglishDailyCard() {
  // 进度由数据库打卡记录派生：progressDay = 打卡天数 + 1，打卡即解锁下一课
  const { progressDay, streak, checkedInToday: checkedIn, loading: checkinLoading, submitting, degraded, checkin } = useCheckin("english");

  const [allLessons, setAllLessons] = useState<EnglishLesson[]>([]);
  const [lesson, setLesson] = useState<EnglishLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // 音频播放状态
  const [playing, setPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // 录音状态
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化：从 API 拉取全部课程
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/english-lessons");
        if (res.ok) {
          const json = await res.json();
          const lessons = (json.lessons || []).map(mapApiLesson);
          setAllLessons(lessons);
          setLesson(lessons[0] || null);
        }
      } catch (err) {
        console.warn("[EnglishDailyCard] API 拉取失败:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // 展示天数 = 进度天 + 浏览偏移（offset ≤ 0，仅可回看已解锁课程）
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!allLessons.length) return;
    const targetDay = Math.max(1, progressDay + offset);
    const found = allLessons.find((l: EnglishLesson) => l.day === targetDay);
    if (found) setLesson(found);
  }, [offset, progressDay, allLessons]);

  // 最小 offset：只能回看到 Day 1（不可预览未解锁课程）
  const minOffset = 1 - progressDay;

  // 打卡（幂等：服务端 unique 索引去重）
  const handleCheckin = useCallback(async () => {
    if (checkedIn || submitting) return;
    const ok = await checkin();
    if (ok) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }
  }, [checkedIn, submitting, checkin]);

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
    if (!lesson) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 520;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 800, 520);
    gradient.addColorStop(0, "#0f0f23");
    gradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 520);

    // 顶部装饰线
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(60, 60, 40, 3);

    // Day 标签
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`Day ${lesson.day}`, 120, 78);

    // 标题
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = "#f1f5f9";
    const titleLines = wrapText(ctx, lesson.title, 60, 120, 680, 28);
    let y = 120 + titleLines * 28;

    // 主打金句
    ctx.font = "500 14px Inter, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    y += 15;
    ctx.fillText("Power Phrase:", 60, y);
    ctx.font = "600 17px Inter, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    y += 26;
    const exprLines = wrapText(ctx, `"${lesson.targetExpression.english}"`, 60, y, 680, 26);
    y += exprLines * 26 + 12;

    // 中文释义
    ctx.font = "400 13px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const cnLines = wrapText(ctx, lesson.targetExpression.chinese, 60, y, 680, 22);
    y += cnLines * 22 + 15;

    // 备选变体
    ctx.font = "500 14px Inter, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Alternative:", 60, y);
    ctx.font = "500 15px Inter, sans-serif";
    ctx.fillStyle = "#d1d5db";
    y += 24;
    const altLines = wrapText(ctx, `"${lesson.alternativeExpression.english}"`, 60, y, 680, 24);
    y += altLines * 24 + 12;

    // 词汇速查
    ctx.font = "500 13px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Glossary:", 60, y);
    ctx.font = "400 13px Inter, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    y += 22;
    const glossaryText = lesson.glossaryItems
      .map((g) => `${g.term} = ${g.fullForm}`)
      .join("  ·  ");
    const glLines = wrapText(ctx, glossaryText, 60, y, 680, 22);
    y += glLines * 22 + 10;

    // 底部品牌
    ctx.font = "500 12px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("陈皮同学 · 东南亚实局", 60, 490);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("Global Business English Challenge", 540, 490);

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

  // 加载中 / 数据不可用状态（等待课程与打卡进度都就绪，避免 Day 1 闪烁）
  if (loading || checkinLoading || !lesson) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-center">
          {loading ? (
            <>
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">正在加载课程...</p>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-zinc-400">课程数据同步中，请稍后刷新重试</p>
          )}
        </div>
      </div>
    );
  }

  const categoryColor =
    lesson.category === "Listening"
      ? "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-300"
      : "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-300";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-[0_20px_60px_-25px_rgba(59,130,246,0.25)] dark:backdrop-blur-sm">
      {/* 顶部：主题 + 打卡状态 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <Headphones className="h-3 w-3" />
              Business English
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                Day {lesson.day}
              </span>
              <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${categoryColor}`}>
                {lesson.category === "Listening" ? "听力驯化" : "口语护甲"}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{lesson.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 dark:border-orange-500/25 dark:bg-orange-500/10">
          <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">连续 {streak} 天</span>
        </div>
      </div>

      {/* 场景描述 */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">{lesson.sceneContext}</p>
        </div>
      </div>

      {/* 主打控场金句（Main Power Phrase） */}
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-500/15 dark:bg-blue-950/10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            <Volume2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            主打控场金句 · 听力磨耳朵
          </div>
          {/* 语速切换 */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              onClick={() => setSpeechRate(0.8)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                speechRate === 0.8
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              0.8x
            </button>
            <button
              onClick={() => setSpeechRate(1.0)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                speechRate === 1.0
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              1.0x
            </button>
          </div>
        </div>

        <button
          onClick={() => handlePlay(lesson.targetExpression.english)}
          className="flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-white px-3 py-2.5 transition-colors hover:border-blue-300 dark:border-blue-500/10 dark:bg-zinc-950/40 dark:hover:border-blue-500/25"
        >
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              playing
                ? "bg-blue-200 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300"
                : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
            }`}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {lesson.targetExpression.english}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-zinc-500">{lesson.targetExpression.chinese}</p>
          </div>
        </button>
      </div>

      {/* 连读/变音拆解 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
          <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          连读 / 弱读 / 吞音拆解
        </div>
        <div className="rounded-xl border-l-2 border-amber-400 bg-amber-50/50 p-3 dark:border-amber-500/40 dark:bg-zinc-950/40">
          <p className="font-mono text-[11px] font-medium leading-relaxed text-amber-800 dark:text-amber-200/80">
            {lesson.targetExpression.phoneticAndLinking}
          </p>
        </div>
      </div>

      {/* 备选/同义变体句 */}
      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-500/15 dark:bg-violet-950/10">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
          <MessageSquare className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          备选变体句 · 不同语气
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-relaxed text-slate-800 dark:text-zinc-200">
              {lesson.alternativeExpression.english}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
              {lesson.alternativeExpression.chinese}
            </p>
          </div>
          <button
            onClick={() => handlePlay(lesson.alternativeExpression.english)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-600 dark:text-zinc-500 dark:hover:bg-violet-500/15 dark:hover:text-violet-300"
            aria-label="朗读变体句"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 高频商务缩写与词汇速查 */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
          <BookOpen className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          高频缩写与黑话速查 Glossary
        </div>
        <div className="space-y-2">
          {lesson.glossaryItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-zinc-800/50 dark:bg-zinc-900/30"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold text-slate-900 dark:text-zinc-100">{item.term}</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400">{item.fullForm}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">{item.meaning}</p>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-zinc-600">{item.exampleScene}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 实战商业启示 */}
      <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50/50 p-3 dark:border-cyan-500/20 dark:bg-cyan-950/10">
        <div className="flex items-start gap-2">
          <span className="text-sm">💼</span>
          <div>
            <div className="mb-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">实战商业启示</div>
            <p className="text-[11px] leading-relaxed text-cyan-800 dark:text-cyan-200/80">{lesson.businessTakeaway}</p>
          </div>
        </div>
      </div>

      {/* 影子跟读（Shadowing） */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            <Mic className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            影子跟读 Shadowing
          </div>
          {/* 分享按钮 */}
          <button
            onClick={handleShareCard}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
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
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/15 dark:bg-zinc-950/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-relaxed text-slate-800 dark:text-zinc-100">{sentence}</p>
                </div>
                <button
                  onClick={() => handlePlay(sentence)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600 dark:text-zinc-500 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <Mic className="h-3.5 w-3.5" />
              开始录音
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-[11px] font-medium text-red-700 transition-colors animate-pulse dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-300"
            >
              <MicOff className="h-3.5 w-3.5" />
              停止录音
            </button>
          )}

          {audioUrl && (
            <>
              <button
                onClick={playRecording}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                <Play className="h-3 w-3" />
                回放
              </button>
              <button
                onClick={clearRecording}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
            onClick={() => setOffset((o) => Math.max(minOffset, o - 1))}
            disabled={offset <= minOffset}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
            aria-label="上一天"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          {offset < 0 && (
            <button
              onClick={() => setOffset(0)}
              className="rounded-md bg-blue-100 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
            >
              回到今日
            </button>
          )}
          {!checkinLoading && (
            <span className="ml-1 text-[10px] text-slate-500 dark:text-zinc-500">
              已解锁 {Math.min(progressDay, 90)}/90 天
            </span>
          )}
        </div>

        <button
          onClick={handleCheckin}
          disabled={checkedIn || submitting || offset !== 0}
          className={`relative inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
            checkedIn
              ? "cursor-default bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
              : submitting
                ? "cursor-wait bg-slate-200 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                : offset !== 0
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_8px_25px_-8px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_-8px_rgba(59,130,246,0.6)]"
          }`}
        >
          {checkedIn ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              今日已打卡
            </>
          ) : submitting ? (
            "打卡中..."
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
            <div className="rounded-xl border border-green-300 bg-white/95 px-5 py-3 text-center shadow-[0_0_30px_rgba(34,197,94,0.2)] backdrop-blur-sm dark:border-green-500/40 dark:bg-zinc-950/95 dark:shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                打卡成功！已解锁 Day {Math.min(progressDay, 90)}，连续 {streak} 天 🔥
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 数据降级提示：数据库不可用时打卡无法持久化 */}
      {degraded && !checkinLoading && (
        <p className="mt-3 text-center text-[10px] text-amber-600 dark:text-amber-500/70">
          打卡数据同步暂不可用，进度可能无法保存，请稍后重试
        </p>
      )}
    </div>
  );
}
