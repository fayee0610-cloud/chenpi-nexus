"use client";

import { useState, useEffect } from "react";
import { Check, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InsightShareClient({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      // 降级方案
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setToast(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setToast(false), 2500);
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
            <><Link2 className="h-3.5 w-3.5" /> 复制链接</>
          )}
        </button>
      </div>

      {/* Toast 提示 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-2 rounded-xl border border-green-500/30 bg-zinc-900/95 px-4 py-2.5 text-sm text-green-300 shadow-2xl backdrop-blur-sm"
          >
            <Check className="h-4 w-4" />
            链接已复制，可直接粘贴分享
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
