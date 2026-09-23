"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { siteData } from "@/data/siteData";

export default function Connect() {
  const { email, wechatId, copyright } = siteData.contact;

  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [wechatCopied, setWechatCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Toast 自动消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (msg: string) => {
    setToast({ msg, key: Date.now() });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      showToast("📧 邮箱已复制到剪贴板");
      setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setEmailCopied(true);
      showToast("📧 邮箱已复制到剪贴板");
      setTimeout(() => setEmailCopied(false), 1800);
    }
  };

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setWechatCopied(true);
      showToast(`已复制微信号 ${wechatId}，欢迎添加！`);
      setTimeout(() => setWechatCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = wechatId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setWechatCopied(true);
      showToast(`已复制微信号 ${wechatId}，欢迎添加！`);
      setTimeout(() => setWechatCopied(false), 1800);
    }
  };

  return (
    <section id="contact" className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          联系我
        </h2>
        <p className="mb-10 text-zinc-400">
          预约大马出海策略咨询 / 商业合作对接
        </p>

        {/* ========== 联系方式卡片 ========== */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {/* 邮箱卡片 */}
          <div className="group relative">
            <button
              onClick={copyEmail}
              className="inline-flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-zinc-900 hover:text-zinc-100 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                  Email
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {email}
                </span>
              </div>
              <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-800">
                {emailCopied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                )}
              </div>
            </button>
          </div>

          {/* 微信卡片 — 深色玻璃拟态 */}
          <div className="group relative">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-zinc-900/40 to-zinc-900/40 px-6 py-3.5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              {/* 左侧：微信 Icon + WECHAT 标签 */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <MessageCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-normal uppercase tracking-wider text-green-500/60">
                  WECHAT 微信
                </span>
                <span className="text-sm font-bold text-zinc-50">
                  {wechatId}
                </span>
              </div>
              {/* 右侧：复制按钮 */}
              <button
                onClick={copyWechat}
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300 transition-all hover:bg-green-500/20"
              >
                {wechatCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    📋 复制微信号
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/60 pt-10">
          <p className="text-xs text-zinc-600">{copyright}</p>
        </div>
      </div>

      {/* ========== Toast 友好提示 ========== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
            className="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-5 py-3 text-sm font-medium text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
