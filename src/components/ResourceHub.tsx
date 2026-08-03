"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Lock, X, Check, Package } from "lucide-react";
import { fetchResources, incrementResourceDownload } from "@/lib/dataApi";
import { siteData, type ResourceItem } from "@/data/siteData";

export default function ResourceHub() {
  const [resources, setResources] = useState<ResourceItem[]>(siteData.resources);
  const [loading, setLoading] = useState(true);
  const [lockResource, setLockResource] = useState<ResourceItem | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchResources().then((data) => {
      if (mounted) {
        setResources(data.filter((r) => r.isPublished));
        setLoading(false);
      }
    });
    // 检查是否已注册（localStorage）
    const savedEmail = localStorage.getItem("user_email");
    if (savedEmail) setRegistered(true);
    return () => { mounted = false; };
  }, []);

  const handleDownload = useCallback(async (resource: ResourceItem) => {
    // 需要登录但未注册 → 弹窗
    if (resource.requireLogin && !registered) {
      setLockResource(resource);
      return;
    }

    // 已注册或无需登录 → 直接下载
    if (resource.fileUrl) {
      try {
        await incrementResourceDownload(resource.id);
        const link = document.createElement("a");
        link.href = resource.fileUrl;
        link.download = resource.title;
        link.target = "_blank";
        link.click();
      } catch {
        // 降级：直接打开 URL
        window.open(resource.fileUrl, "_blank");
      }
    } else {
      // 无文件 URL（Mock 数据），提示
      alert("该资源文件正在准备中，敬请期待！");
    }
  }, [registered]);

  const handleSubmitEmail = useCallback(() => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    localStorage.setItem("user_email", email.trim());
    setRegistered(true);
    setSubmitted(true);
    setTimeout(() => {
      setLockResource(null);
      setSubmitted(false);
      setEmail("");
      // 自动触发下载
      if (lockResource) handleDownload(lockResource);
    }, 1500);
  }, [email, lockResource, handleDownload]);

  return (
    <section id="resources" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-400">
          <Package className="h-3.5 w-3.5" />
          Resource Hub
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          精选资源包
        </h2>
        <p className="mt-3 text-sm text-zinc-500">
          深度行业指南 · 实战运营手册 · 品牌策略报告
        </p>
      </div>

      {/* 资源卡片列表 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40"
              />
            ))
          : resources.map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/60"
              >
                {/* 顶部图标 + 分类 */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                    {resource.category}
                  </span>
                </div>

                {/* 标题 */}
                <h3 className="mb-2 text-base font-bold text-zinc-100">
                  {resource.title}
                </h3>

                {/* 摘要 */}
                <p className="mb-4 text-xs leading-relaxed text-zinc-500">
                  {resource.excerpt}
                </p>

                {/* 目录 */}
                {resource.outline.length > 0 && (
                  <ul className="mb-4 space-y-1.5">
                    {resource.outline.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-zinc-500">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* 底部信息 + 下载按钮 */}
                <div className="mt-auto flex items-center justify-between border-t border-zinc-800/60 pt-4">
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                    {resource.fileSize && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {resource.fileSize}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {resource.downloadCount} 次下载
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(resource)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      resource.requireLogin && !registered
                        ? "border border-amber-500/30 bg-amber-950/20 text-amber-400 hover:bg-amber-950/30"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:brightness-110"
                    }`}
                  >
                    {resource.requireLogin && !registered ? (
                      <>
                        <Lock className="h-3 w-3" />
                        解锁 PDF
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        获取 PDF
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
      </div>

      {/* 下载壁垒弹窗（邮箱注册引导） */}
      <AnimatePresence>
        {lockResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setLockResource(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            >
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                    <Check className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-200">解锁成功！</p>
                  <p className="mt-1 text-xs text-zinc-500">正在准备下载...</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <Lock className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">解锁完整资源</h3>
                        <p className="text-[11px] text-zinc-500">{lockResource.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLockResource(null)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mb-4 text-xs leading-relaxed text-zinc-400">
                    留下你的邮箱，即可免费获取完整 PDF。陈皮同学会偶尔分享有价值的商业洞察，随时可取消订阅。
                  </p>

                  <div className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitEmail()}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                    />
                    <button
                      onClick={handleSubmitEmail}
                      disabled={!email.trim()}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-40"
                    >
                      解锁并下载
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[10px] text-zinc-600">
                    注册即表示同意接收偶尔的商业洞察邮件
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
