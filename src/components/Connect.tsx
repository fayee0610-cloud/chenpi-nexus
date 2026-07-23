"use client";

import { useState } from "react";
import { Mail, MessageCircle, Copy, Check, ArrowUpRight, QrCode } from "lucide-react";

export default function Connect() {
  const [copied, setCopied] = useState(false);
  const [showWechat, setShowWechat] = useState(false);

  const wechatId = "MyNeuralHub";

  const handleCopy = () => {
    navigator.clipboard?.writeText(wechatId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* 邮箱 */}
          <a
            href="mailto:hello@myneuralhub.com"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Mail className="h-4 w-4" />
            ✉️ 电子邮箱
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600" />
          </a>

          {/* 微信 */}
          <button
            onClick={() => setShowWechat(!showWechat)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <MessageCircle className="h-4 w-4" />
            💬 微信 (WeChat)
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600" />
          </button>
        </div>

        {/* 微信展开区 */}
        {showWechat && (
          <div className="mx-auto mb-12 max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
              <QrCode className="h-4 w-4" />
              微信号
            </div>
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
              {/* 伪二维码占位 */}
              <div className="grid grid-cols-8 gap-0.5">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 ${Math.random() > 0.5 ? "bg-zinc-100" : "bg-transparent"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <code className="rounded-lg bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300">
                {wechatId}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-zinc-800/60 pt-10">
          <p className="text-xs text-zinc-600">
            © 2025 数字中枢 My Neural Hub
          </p>
        </div>
      </div>
    </section>
  );
}
