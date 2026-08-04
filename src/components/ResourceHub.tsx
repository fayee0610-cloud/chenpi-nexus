"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Lock, X, Package } from "lucide-react";
import { fetchResources, incrementResourceDownload, createLead } from "@/lib/dataApi";
import { type ResourceItem } from "@/data/siteData";
import AuthModal, { useAuthUser } from "@/components/AuthModal";
import LoadMoreButton from "@/components/LoadMoreButton";

export default function ResourceHub({ showLimit }: { showLimit?: number }) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockResource, setLockResource] = useState<ResourceItem | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingResource, setPendingResource] = useState<ResourceItem | null>(null);
  const { user } = useAuthUser();

  useEffect(() => {
    let mounted = true;
    fetchResources().then((data) => {
      if (mounted) {
        setResources(data.filter((r) => r.isPublished));
        setLoading(false);
      }
    });
    // 检查是否已留存邮箱
    if (localStorage.getItem("has_submitted_email") === "true") {
      setHasSubmittedEmail(true);
    }
    return () => { mounted = false; };
  }, []);

  const triggerDownload = useCallback(async (resource: ResourceItem) => {
    if (resource.fileUrl) {
      try {
        await incrementResourceDownload(resource.id);
      } catch {}
      const link = document.createElement("a");
      link.href = resource.fileUrl;
      link.download = resource.title;
      link.target = "_blank";
      link.click();
    } else {
      alert("该资源文件正在准备中，敬请期待！");
    }
  }, []);

  const handleDownload = useCallback(async (resource: ResourceItem) => {
    // 需要登录（is_gated）且未登录 → 弹出登录 Modal，记录待下载资源
    if (resource.requireLogin && !user) {
      setPendingResource(resource);
      setAuthOpen(true);
      return;
    }
    // 非强制登录资源：保留邮箱留存兜底（兼容旧逻辑）
    if (resource.requireLogin && !hasSubmittedEmail && user) {
      // 已登录但未留存邮箱：直接下载并留存邮箱
      try {
        await createLead(user.email || "", resource.id, resource.title);
        localStorage.setItem("has_submitted_email", "true");
        setHasSubmittedEmail(true);
      } catch {}
    }
    // 已登录或无需登录 → 直接下载
    await triggerDownload(resource);
  }, [hasSubmittedEmail, triggerDownload, user]);

  // 登录成功后自动触发待下载资源
  useEffect(() => {
    if (user && pendingResource) {
      const res = pendingResource;
      setPendingResource(null);
      triggerDownload(res);
    }
  }, [user, pendingResource, triggerDownload]);

  const handleSubmitEmail = useCallback(async () => {
    if (!email.trim() || !email.includes("@")) return;
    setSubmitting(true);
    // 写入线索到 Supabase（失败不阻断下载，但打印警告便于排查）
    const result = await createLead(email.trim(), lockResource?.id, lockResource?.title);
    if (!result.success) {
      console.warn("[ResourceHub] 邮箱留存失败:", result.error);
    }
    // 记录已提交状态
    localStorage.setItem("has_submitted_email", "true");
    setHasSubmittedEmail(true);
    // 立即触发下载（即使留存失败也放行下载，不影响用户体验）
    if (lockResource) await triggerDownload(lockResource);
    // 关闭弹窗
    setLockResource(null);
    setEmail("");
    setSubmitting(false);
  }, [email, lockResource, triggerDownload]);

  // 首页模式：限制展示条数
  const displayedResources = (() => {
    if (typeof showLimit === "number" && showLimit > 0) {
      return resources.slice(0, showLimit);
    }
    return resources;
  })();

  return (
    <section id="resources" className="relative mx-auto max-w-7xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          精选资源包
        </h2>
        <p className="mt-3 text-sm text-zinc-500">
          深度行业指南 · 实战运营手册 · 品牌策略报告
        </p>
      </div>

      {/* 资源卡片列表 */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40"
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">资源包正在准备中，敬请期待</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedResources.map((resource, i) => (
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
                      resource.requireLogin && !user
                        ? "border border-amber-500/30 bg-amber-950/20 text-amber-400 hover:bg-amber-950/30"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:brightness-110"
                    }`}
                  >
                    {resource.requireLogin && !user ? (
                      <>
                        <Lock className="h-3 w-3" />
                        登录解锁
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

          {/* 首页模式：跳转量子页面 */}
          {typeof showLimit === "number" && displayedResources.length > 0 && (
            <LoadMoreButton href="/resources" label="进入资源包完整列表" />
          )}
        </>
      )}

      {/* 下载壁垒弹窗（极简邮箱留存） */}
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
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Lock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">解锁完整版资料</h3>
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
                留下邮箱即可立即下载完整 PDF，无验证码、无密码。后续不再重复弹窗。
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
                  disabled={!email.trim() || !email.includes("@") || submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-40"
                >
                  {submitting ? "正在获取..." : "立即获取 PDF"}
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] text-zinc-600">
                邮箱仅用于发送资源与偶尔的商业洞察，随时可取消
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录弹窗（is_gated 资源未登录时触发） */}
      <AuthModal isOpen={authOpen} onClose={() => { setAuthOpen(false); setPendingResource(null); }} />
    </section>
  );
}
