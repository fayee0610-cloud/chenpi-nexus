"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot } from "lucide-react";
import { siteData } from "@/data/siteData";

const { bubbles, quickQuestions, replies } = siteData.mascot;

export default function Mascot() {
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbleIndex((prev) => (prev + 1) % bubbles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const typeMessage = useCallback((text: string) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setTypedText("");
    setIsTyping(true);
    let i = 0;
    typingTimerRef.current = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 40);
  }, []);

  const handleQuestion = (q: string) => {
    typeMessage(replies[q] || "这个问题我还在思考中...");
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* 浮动气泡 */}
      <AnimatePresence mode="wait">
        {!showDialog && (
          <motion.div
            key={bubbleIndex}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-24 right-6 z-40 max-w-[200px] rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-300 shadow-xl backdrop-blur-sm"
          >
            {bubbles[bubbleIndex]}
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-zinc-800 bg-zinc-900/95" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对话框 */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-sm"
          >
            {/* 头部 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-zinc-100">赛博替身</span>
              </div>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setTypedText("");
                  setIsTyping(false);
                  if (typingTimerRef.current) clearInterval(typingTimerRef.current);
                }}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 打字机回复区 */}
            {typedText && (
              <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-sm leading-relaxed text-zinc-300">
                  {typedText}
                  {isTyping && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-400 align-middle" />}
                </p>
              </div>
            )}

            {/* 快捷提问 */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">试试问我：</p>
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuestion(q)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-all hover:border-purple-500/40 hover:bg-zinc-950/60 hover:text-zinc-100"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar 按钮 */}
      <motion.button
        onClick={() => setShowDialog(!showDialog)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-50 animate-pulse-glow" />
        <Bot className="relative h-7 w-7 text-white" />
      </motion.button>
    </>
  );
}
