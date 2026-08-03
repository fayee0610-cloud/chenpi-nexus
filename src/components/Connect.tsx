"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, Copy, Check, X, QrCode } from "lucide-react";
import { siteData } from "@/data/siteData";

export default function Connect() {
  const { email, wechatId, copyright } = siteData.contact;

  const [showQrModal, setShowQrModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [wechatCopied, setWechatCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [qrHover, setQrHover] = useState(false);

  // ESC 关闭二维码弹窗 + 禁用背景滚动
  useEffect(() => {
    if (!showQrModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowQrModal(false);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [showQrModal]);

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
      // 降级方案
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
      showToast("💬 微信号已复制，快去添加吧");
      setTimeout(() => setWechatCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = wechatId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setWechatCopied(true);
      showToast("💬 微信号已复制，快去添加吧");
      setTimeout(() => setWechatCopied(false), 1800);
    }
  };

  return (
    <section id="connect" className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          联系我
        </h2>
        <p className="mb-10 text-zinc-400">
          有有趣的创意或合作？聊聊看。
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {/* ========== 邮箱卡片 ========== */}
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

          {/* ========== 微信卡片（悬浮预览 + 点击弹窗放大） ========== */}
          <div
            className="relative"
            onMouseEnter={() => setQrHover(true)}
            onMouseLeave={() => setQrHover(false)}
          >
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-green-500/40 hover:bg-zinc-900 hover:text-zinc-100 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <MessageCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                  WeChat 微信
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {wechatId}
                </span>
              </div>
              <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 transition-colors hover:border-zinc-700 hover:bg-zinc-800">
                <QrCode className="h-3.5 w-3.5 text-zinc-500" />
              </div>
            </button>

            {/* 悬浮二维码预览卡片 */}
            <AnimatePresence>
              {qrHover && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 top-full z-40 mt-4 -translate-x-1/2 rounded-2xl border border-green-500/30 bg-zinc-950/95 p-4 shadow-[0_10px_50px_rgba(34,197,94,0.15)] backdrop-blur-xl"
                >
                  <div className="pointer-events-none absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-green-500/30 bg-zinc-950" />
                  <div className="mb-3 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                        扫码添加
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      点击放大查看
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5">
                      <img
                        src="/wechat-qr.png"
                        alt="陈皮同学微信二维码"
                        className="h-[180px] w-[180px] rounded-lg object-contain"
                        draggable={false}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] text-zinc-500">微信号</p>
                        <p className="text-sm font-bold text-zinc-100">
                          {wechatId}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyWechat();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-[10px] font-medium text-green-300 transition-colors hover:bg-green-500/20"
                      >
                        {wechatCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            复制微信号
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-zinc-800/60 pt-10">
          <p className="text-xs text-zinc-600">{copyright}</p>
        </div>
      </div>

      {/* ========== 微信二维码放大弹窗 ========== */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setShowQrModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                bounce: 0.15,
                duration: 0.45,
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 shadow-[0_0_60px_rgba(34,197,94,0.15)]"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/70 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 顶部装饰渐变 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-green-500/10 to-transparent" />

              <div className="px-8 pb-8 pt-10">
                {/* 标题 */}
                <div className="mb-6 text-center">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1">
                    <QrCode className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-300">
                      WeChat 微信
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-50">
                    扫码添加陈皮同学
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    合作 / 交流 / 喝茶 都欢迎
                  </p>
                </div>

                {/* 二维码大图 */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="relative rounded-3xl border border-green-500/20 bg-white p-3 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                    {/* 四角装饰 */}
                    <span className="absolute -left-0.5 -top-0.5 h-6 w-6 border-l-4 border-t-4 border-green-500 rounded-tl-xl" />
                    <span className="absolute -right-0.5 -top-0.5 h-6 w-6 border-r-4 border-t-4 border-green-500 rounded-tr-xl" />
                    <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-b-4 border-r-4 border-green-500 rounded-br-xl" />
                    <img
                      src="/wechat-qr.png"
                      alt="陈皮同学微信二维码"
                      className="h-[224px] w-[224px] rounded-xl object-contain"
                      draggable={false}
                    />
                  </div>
                </div>

                {/* 微信号 + 复制 */}
                <div className="mb-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-normal uppercase tracking-wider text-zinc-500">
                        微信号
                      </p>
                      <p className="mt-0.5 text-base font-bold text-zinc-100">
                        {wechatId}
                      </p>
                    </div>
                    <button
                      onClick={copyWechat}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300 transition-all hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                    >
                      {wechatCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          复制微信号
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-center text-[10px] text-zinc-600">
                  长按保存二维码图片，或直接复制微信号搜索
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
