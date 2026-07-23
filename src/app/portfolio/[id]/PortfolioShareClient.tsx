"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export default function PortfolioShareClient({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // 用户取消分享
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-zinc-500">分享此案例</span>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5 text-green-400" /> 链接已复制</>
        ) : (
          <><Copy className="h-3.5 w-3.5" /> 一键复制链接</>
        )}
      </button>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-950/40"
      >
        <Share2 className="h-3.5 w-3.5" />
        分享海报
      </button>
    </div>
  );
}
