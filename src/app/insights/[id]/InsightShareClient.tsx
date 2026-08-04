"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

export default function InsightShareClient({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-zinc-500">分享此文</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-green-400" /> 链接已复制</>
          ) : (
            <><Copy className="h-3.5 w-3.5" /> 复制链接</>
          )}
        </button>
        <button
          onClick={() => setQrOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/40"
        >
          <Share2 className="h-3.5 w-3.5" />
          分享到微信
        </button>
      </div>

      {/* 微信分享二维码弹窗 */}
      <AnimatePresence>
        {qrOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                    <Share2 className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">微信扫码分享</h3>
                    <p className="text-[11px] text-zinc-500">打开微信扫一扫即可分享</p>
                  </div>
                </div>
                <button
                  onClick={() => setQrOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 二维码主体 */}
              <div className="flex flex-col items-center gap-4 px-6 py-8">
                <div className="rounded-2xl bg-white p-4 shadow-lg">
                  {currentUrl ? (
                    <QRCodeSVG
                      value={currentUrl}
                      size={200}
                      level="M"
                      fgColor="#09090b"
                      bgColor="#ffffff"
                      marginSize={1}
                    />
                  ) : (
                    <div className="h-[200px] w-[200px] animate-pulse rounded bg-zinc-200" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    扫码后在微信中打开，点击右上角 ··· 转发给好友
                  </p>
                </div>
              </div>

              {/* 底部复制 */}
              <div className="border-t border-zinc-800 px-5 py-3">
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 text-green-400" /> 链接已复制</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> 复制链接</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
