"use client";

/* ============================================================
 * /admin — 极简内容发布后台
 *
 * 完整建表 SQL 见 src/lib/supabase.ts 顶部注释（TEXT 主键版）
 * 三张表：projects / insights / sanctuary_posts，均开启 RLS 公开读
 * ============================================================
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LogOut,
  Briefcase,
  Sparkles,
  MessageCircle,
  Settings,
  Plus,
  Trash2,
  Send,
  Save,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  Upload,
  FileText,
  Mail,
  Radar,
  Edit3,
  ImagePlus,
  Link2,
  Star,
} from "lucide-react";
import {
  createInsight,
  fetchProjects,
  fetchInsights,
  fetchSanctuaryPosts,
  fetchSiteConfig,
  saveSiteConfig,
  deleteProject,
  deleteInsight,
  deleteSanctuaryPost,
  toggleProjectPublish,
  toggleInsightPublish,
  toggleResourcePublish,
  fetchResources,
  createResource,
  deleteResource,
  uploadResourceFile,
  fetchLeads,
  deleteLead,
  fetchInsightsHub,
  createInsightHub,
  updateInsightHub,
  deleteInsightHub,
  toggleInsightHubPublish,
  toggleInsightHubFeature,
  uploadPortfolioCover,
} from "@/lib/dataApi";
import type { SiteConfig, Lead } from "@/lib/dataApi";
import type { PortfolioProject, InsightItem, SanctuaryPost, ResourceItem, InsightHubItem, InsightHubCategory } from "@/data/siteData";

type AdminTab = "portfolio" | "insights" | "sanctuary" | "resources" | "leads" | "hub" | "config";

// 列表项扩展 isPublished 字段（DB 返回，但 fetchProjects/fetchInsights 未映射，admin 页面自行管理）
type AdminProject = PortfolioProject & { isPublished: boolean };
type AdminInsight = InsightItem & { isPublished: boolean };

const TOKEN_KEY = "admin_token";

function validateToken(token: string | null): boolean {
  if (!token) return false;
  try {
    // 浏览器端使用 atob 解码 Base64（服务端用 Buffer 生成，纯 ASCII 负载可安全解码）
    const payload = JSON.parse(atob(token));
    return payload.role === "admin" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("portfolio");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (validateToken(token)) {
      setAuthed(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setAuthed(true);
        setPassword("");
      } else {
        setLoginError(data.error || "登录失败");
      }
    } catch {
      setLoginError("网络错误，请稍后重试");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
  };

  if (!authed) {
    return <LoginView password={password} setPassword={setPassword} error={loginError} onLogin={handleLogin} isLoading={isLoggingIn} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">内容管理后台</h1>
              <p className="text-[10px] text-zinc-500">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            退出
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 pb-3">
          {[
            { key: "portfolio" as const, label: "作品案例", icon: <Briefcase className="h-3.5 w-3.5" /> },
            { key: "insights" as const, label: "灵感文章", icon: <Sparkles className="h-3.5 w-3.5" /> },
            { key: "sanctuary" as const, label: "庇护所互动", icon: <MessageCircle className="h-3.5 w-3.5" /> },
            { key: "resources" as const, label: "资源包", icon: <Package className="h-3.5 w-3.5" /> },
            { key: "leads" as const, label: "线索", icon: <Mail className="h-3.5 w-3.5" /> },
            { key: "hub" as const, label: "情报站", icon: <Radar className="h-3.5 w-3.5" /> },
            { key: "config" as const, label: "站点配置", icon: <Settings className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "portfolio" && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PortfolioEditor />
            </motion.div>
          )}
          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InsightsEditor />
            </motion.div>
          )}
          {activeTab === "sanctuary" && (
            <motion.div
              key="sanctuary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SanctuaryManager />
            </motion.div>
          )}
          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ResourceEditor />
            </motion.div>
          )}
          {activeTab === "leads" && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LeadsManager />
            </motion.div>
          )}
          {activeTab === "hub" && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InsightHubEditor />
            </motion.div>
          )}
          {activeTab === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ConfigEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ========== 登录页 ==========
function LoginView({
  password,
  setPassword,
  error,
  onLogin,
  isLoading,
}: {
  password: string;
  setPassword: (v: string) => void;
  error: string;
  onLogin: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/3 top-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-purple-500/30 bg-zinc-950/90 p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)] backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/20">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-zinc-50">管理员登录</h1>
            <p className="mt-1 text-xs text-zinc-500">输入密码进入内容管理后台</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLogin()}
                placeholder="请输入管理员密码"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={onLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "进入后台"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ========== Tab 1: 作品案例编辑器 ==========
function PortfolioEditor() {
  const [form, setForm] = useState({
    title: "",
    subTitle: "",
    category: "品牌与市场战术",
    role: "",
    date: "",
    image: "",
    challenge: "",
    metrics: [{ value: "", label: "" }],
    solutions: [{ title: "", detail: "" }],
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [projectList, setProjectList] = useState<AdminProject[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // 编辑 Modal 状态
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [editForm, setEditForm] = useState<typeof form | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadProjects = async () => {
    setListLoading(true);
    try {
      const data = await fetchProjects();
      // fetchProjects 未映射 is_published 字段，此处补充默认值 true
      setProjectList(data.map((p) => ({ ...p, isPublished: true })));
    } catch (err) {
      console.warn("[admin] loadProjects 失败:", err);
      setStatus({ type: "error", msg: "数据加载失败，请检查网络或关闭广告拦截插件" });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleToggleProjectPublish = async (id: string | number, current: boolean) => {
    try {
      await toggleProjectPublish(String(id), !current);
      setProjectList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPublished: !current } : p))
      );
    } catch {
      alert("切换失败");
    }
  };

  const handleDeleteProject = async (id: string | number) => {
    if (!window.confirm("确定要彻底删除此项作品案例吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
      setStatus({ type: "success", msg: "作品案例已删除" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "删除失败" });
    } finally {
      setDeletingId(null);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMetric = () => {
    setForm((prev) => ({ ...prev, metrics: [...prev.metrics, { value: "", label: "" }] }));
  };
  const removeMetric = (i: number) => {
    setForm((prev) => ({ ...prev, metrics: prev.metrics.filter((_, idx) => idx !== i) }));
  };
  const updateMetric = (i: number, key: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)),
    }));
  };

  const addSolution = () => {
    setForm((prev) => ({ ...prev, solutions: [...prev.solutions, { title: "", detail: "" }] }));
  };
  const removeSolution = (i: number) => {
    setForm((prev) => ({ ...prev, solutions: prev.solutions.filter((_, idx) => idx !== i) }));
  };
  const updateSolution = (i: number, key: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      solutions: prev.solutions.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setStatus({ type: "error", msg: "请填写项目标题" });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        title: form.title,
        subTitle: form.subTitle,
        category: form.category,
        role: form.role,
        date: form.date,
        image: form.image,
        challenge: form.challenge,
        metrics: form.metrics.filter((m) => m.value),
        solutions: form.solutions.filter((s) => s.title),
      };
      // 走 API 路由以触发 revalidatePath 刷新前台缓存
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "创建失败");
      }
      setStatus({ type: "success", msg: "作品案例发布成功！前台缓存已刷新" });
      setForm({
        title: "", subTitle: "", category: "品牌与市场战术",
        role: "", date: "", image: "", challenge: "",
        metrics: [{ value: "", label: "" }],
        solutions: [{ title: "", detail: "" }],
      });
      loadProjects();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "发布失败" });
    } finally {
      setSubmitting(false);
    }
  };

  // 封面图上传处理（新建表单）
  const handleImageUpload = async (file: File, target: "form" | "editForm") => {
    if (target === "form") setUploadingImage(true);
    else setEditUploadingImage(true);
    try {
      const result = await uploadPortfolioCover(file);
      if (result?.url) {
        if (target === "form") {
          setForm((prev) => ({ ...prev, image: result.url }));
        } else {
          setEditForm((prev) => (prev ? { ...prev, image: result.url } : prev));
        }
        setStatus({ type: "success", msg: "封面图上传成功" });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "图片上传失败" });
    } finally {
      if (target === "form") setUploadingImage(false);
      else setEditUploadingImage(false);
    }
  };

  // 打开编辑 Modal
  const handleEditProject = (project: AdminProject) => {
    setEditingProject(project);
    setEditForm({
      title: project.title || "",
      subTitle: project.subTitle || "",
      category: project.category || "品牌与市场战术",
      role: project.role || "",
      date: project.date || "",
      image: project.image || "",
      challenge: project.challenge || "",
      metrics: project.metrics?.length ? project.metrics : [{ value: "", label: "" }],
      solutions: project.solutions?.length ? project.solutions : [{ title: "", detail: "" }],
    });
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    if (!editingProject || !editForm) return;
    if (!editForm.title.trim()) {
      setStatus({ type: "error", msg: "请填写项目标题" });
      return;
    }
    setEditSubmitting(true);
    try {
      const payload = {
        id: String(editingProject.id),
        title: editForm.title,
        subTitle: editForm.subTitle,
        category: editForm.category,
        role: editForm.role,
        date: editForm.date,
        image: editForm.image,
        challenge: editForm.challenge,
        metrics: editForm.metrics.filter((m) => m.value),
        solutions: editForm.solutions.filter((s) => s.title),
      };
      // 走 API 路由以触发 revalidatePath 刷新前台缓存
      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "更新失败");
      }
      setStatus({ type: "success", msg: "作品案例已更新，前台缓存已刷新！" });
      setEditingProject(null);
      setEditForm(null);
      loadProjects();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "更新失败" });
    } finally {
      setEditSubmitting(false);
    }
  };

  // 编辑 Modal 中的字段更新
  const updateEditField = (field: string, value: any) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };
  const addEditMetric = () => {
    setEditForm((prev) => prev ? { ...prev, metrics: [...prev.metrics, { value: "", label: "" }] } : prev);
  };
  const removeEditMetric = (i: number) => {
    setEditForm((prev) => prev ? { ...prev, metrics: prev.metrics.filter((_, idx) => idx !== i) } : prev);
  };
  const updateEditMetric = (i: number, key: string, val: string) => {
    setEditForm((prev) => prev ? {
      ...prev,
      metrics: prev.metrics.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)),
    } : prev);
  };
  const addEditSolution = () => {
    setEditForm((prev) => prev ? { ...prev, solutions: [...prev.solutions, { title: "", detail: "" }] } : prev);
  };
  const removeEditSolution = (i: number) => {
    setEditForm((prev) => prev ? { ...prev, solutions: prev.solutions.filter((_, idx) => idx !== i) } : prev);
  };
  const updateEditSolution = (i: number, key: string, val: string) => {
    setEditForm((prev) => prev ? {
      ...prev,
      solutions: prev.solutions.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)),
    } : prev);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">发布作品案例</h2>
        <p className="mt-1 text-sm text-zinc-500">新增一个作品集项目，保存至 Supabase projects 表</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        {/* 基础信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="项目标题 *">
            <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="如：跨境品牌 DTC 独立站增长路线" className="input-admin" />
          </FormField>
          <FormField label="副标题">
            <input value={form.subTitle} onChange={(e) => updateField("subTitle", e.target.value)} placeholder="一句话概述项目" className="input-admin" />
          </FormField>
          <FormField label="分类 *">
            <input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="如：品牌与市场战术 / AI 与硬件探索 / 阶段性创意实验" className="input-admin" />
          </FormField>
          <FormField label="角色">
            <input value={form.role} onChange={(e) => updateField("role", e.target.value)} placeholder="如：品牌策略总监" className="input-admin" />
          </FormField>
          <FormField label="执行时间">
            <input value={form.date} onChange={(e) => updateField("date", e.target.value)} placeholder="如：2024.03 - 2024.09" className="input-admin" />
          </FormField>
          <FormField label="封面图 URL">
            <input value={form.image} onChange={(e) => updateField("image", e.target.value)} placeholder="https://..." className="input-admin" />
          </FormField>
        </div>

        {/* 封面图上传组件 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">封面图上传</label>
            <span className="text-[10px] text-zinc-500">推荐比例: 16:9 (1200×675) | 格式: JPG/PNG/WebP | 大小: &lt; 2MB</span>
          </div>
          <div className="flex items-center gap-4">
            <label className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 transition-all hover:border-purple-500/50 hover:bg-purple-500/5 ${uploadingImage ? "pointer-events-none opacity-60" : ""}`}>
              {uploadingImage ? (
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              ) : (
                <ImagePlus className="h-6 w-6 text-zinc-500" />
              )}
              <span className="text-xs text-zinc-500">{uploadingImage ? "上传中..." : "点击或拖拽上传封面图"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "form");
                  e.target.value = "";
                }}
              />
            </label>
            {form.image && (
              <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700">
                <img src={form.image} alt="封面预览" className="h-full w-full object-cover" />
                <button
                  onClick={() => updateField("image", "")}
                  className="absolute right-1 top-1 rounded bg-zinc-950/80 p-0.5 text-zinc-400 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 核心数据标尺 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">核心数据标尺（Metrics）</label>
            <button onClick={addMetric} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
              <Plus className="h-3 w-3" /> 添加
            </button>
          </div>
          <div className="space-y-2">
            {form.metrics.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={m.value}
                  onChange={(e) => updateMetric(i, "value", e.target.value)}
                  placeholder="数据值（如 GMV +180%）"
                  className="input-admin flex-1"
                />
                <input
                  value={m.label}
                  onChange={(e) => updateMetric(i, "label", e.target.value)}
                  placeholder="说明（如 海外独立站季度增长）"
                  className="input-admin flex-1"
                />
                {form.metrics.length > 1 && (
                  <button onClick={() => removeMetric(i)} className="rounded-lg border border-zinc-800 px-3 text-zinc-500 hover:border-red-500/50 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 挑战背景 */}
        <FormField label="项目挑战与背景">
          <textarea
            value={form.challenge}
            onChange={(e) => updateField("challenge", e.target.value)}
            rows={4}
            placeholder="描述项目面临的痛点与挑战..."
            className="input-admin resize-none"
          />
        </FormField>

        {/* 破局战术 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">破局战术与解法（多步骤）</label>
            <button onClick={addSolution} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
              <Plus className="h-3 w-3" /> 添加步骤
            </button>
          </div>
          <div className="space-y-3">
            {form.solutions.map((s, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">步骤 {i + 1}</span>
                  {form.solutions.length > 1 && (
                    <button onClick={() => removeSolution(i)} className="text-zinc-500 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  value={s.title}
                  onChange={(e) => updateSolution(i, "title", e.target.value)}
                  placeholder="战术标题"
                  className="input-admin mb-2"
                />
                <textarea
                  value={s.detail}
                  onChange={(e) => updateSolution(i, "detail", e.target.value)}
                  rows={2}
                  placeholder="详细描述..."
                  className="input-admin resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 状态提示 */}
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === "success"
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {status.msg}
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 发布中...</>
          ) : (
            <><Save className="h-4 w-4" /> 发布作品案例</>
          )}
        </button>
      </div>

      <style jsx>{`
        .input-admin {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background-color: rgb(9 9 11);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(244 244 245);
          outline: none;
          transition: all 0.15s;
        }
        .input-admin::placeholder {
          color: rgb(82 82 91);
        }
        .input-admin:focus {
          border-color: rgba(168, 85, 247, 0.5);
        }
      `}</style>

      {/* 已发布作品列表 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">已发布作品（{projectList.length}）</h3>
          <button
            onClick={loadProjects}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          </div>
        ) : projectList.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无作品数据</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {projectList.map((p) => (
              <div key={p.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {p.category}
                    </span>
                    {p.date && <span className="text-[10px] text-zinc-600">{p.date}</span>}
                  </div>
                  <h4 className="truncate text-sm font-medium text-zinc-100">{p.title}</h4>
                  {p.subTitle && <p className="mt-0.5 truncate text-xs text-zinc-500">{p.subTitle}</p>}
                </div>
                {/* 发布状态开关 */}
                <div className="flex flex-shrink-0 items-center gap-2 pt-1">
                  <span className={`text-[10px] ${p.isPublished ? "text-green-400" : "text-zinc-500"}`}>
                    {p.isPublished ? "已发布" : "未发布"}
                  </span>
                  <button
                    onClick={() => handleToggleProjectPublish(p.id, p.isPublished)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.isPublished ? "bg-green-500" : "bg-zinc-600"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${p.isPublished ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
                <button
                  onClick={() => handleEditProject(p)}
                  title="编辑作品"
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(p.id)}
                  disabled={deletingId === p.id}
                  title="删除作品"
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== 编辑作品 Modal ========== */}
      <AnimatePresence>
        {editingProject && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setEditingProject(null); setEditForm(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-8 w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-zinc-900 shadow-[0_0_60px_rgba(168,85,247,0.15)]"
            >
              {/* 顶部 Bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">编辑作品案例</h3>
                  <span className="text-xs text-zinc-500">· {editingProject.title}</span>
                </div>
                <button
                  onClick={() => { setEditingProject(null); setEditForm(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                  取消
                </button>
              </div>

              {/* 可滚动内容区 */}
              <div className="max-h-[calc(85vh-64px)] space-y-5 overflow-y-auto px-6 py-6">
                {/* 基础信息 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="项目标题 *">
                    <input value={editForm.title} onChange={(e) => updateEditField("title", e.target.value)} className="input-admin" />
                  </FormField>
                  <FormField label="副标题">
                    <input value={editForm.subTitle} onChange={(e) => updateEditField("subTitle", e.target.value)} className="input-admin" />
                  </FormField>
                  <FormField label="分类 *">
                    <input value={editForm.category} onChange={(e) => updateEditField("category", e.target.value)} className="input-admin" />
                  </FormField>
                  <FormField label="角色">
                    <input value={editForm.role} onChange={(e) => updateEditField("role", e.target.value)} className="input-admin" />
                  </FormField>
                  <FormField label="执行时间">
                    <input value={editForm.date} onChange={(e) => updateEditField("date", e.target.value)} className="input-admin" />
                  </FormField>
                  <FormField label="封面图 URL">
                    <input value={editForm.image} onChange={(e) => updateEditField("image", e.target.value)} className="input-admin" />
                  </FormField>
                </div>

                {/* 封面图上传 + 高清预览 */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-300">封面图上传 / 预览</label>
                    <span className="text-[10px] text-zinc-500">推荐比例: 16:9 (1200×675) | 格式: JPG/PNG/WebP | 大小: &lt; 2MB</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 transition-all hover:border-purple-500/50 hover:bg-purple-500/5 ${editUploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                      {editUploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      ) : (
                        <ImagePlus className="h-6 w-6 text-zinc-500" />
                      )}
                      <span className="text-xs text-zinc-500">{editUploadingImage ? "上传中..." : "点击或拖拽上传新封面图"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "editForm");
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {editForm.image && (
                      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700">
                        <img src={editForm.image} alt="封面高清预览" className="h-full w-full object-cover" />
                        <button
                          onClick={() => updateEditField("image", "")}
                          className="absolute right-1 top-1 rounded bg-zinc-950/80 p-0.5 text-zinc-400 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 核心数据标尺 */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-300">核心数据标尺（Metrics）</label>
                    <button onClick={addEditMetric} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
                      <Plus className="h-3 w-3" /> 添加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editForm.metrics.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={m.value} onChange={(e) => updateEditMetric(i, "value", e.target.value)} placeholder="数据值" className="input-admin flex-1" />
                        <input value={m.label} onChange={(e) => updateEditMetric(i, "label", e.target.value)} placeholder="说明" className="input-admin flex-1" />
                        {editForm.metrics.length > 1 && (
                          <button onClick={() => removeEditMetric(i)} className="rounded-lg border border-zinc-800 px-3 text-zinc-500 hover:border-red-500/50 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 挑战背景 */}
                <FormField label="项目挑战与背景">
                  <textarea value={editForm.challenge} onChange={(e) => updateEditField("challenge", e.target.value)} rows={3} className="input-admin resize-none" />
                </FormField>

                {/* 破局战术 */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-300">破局战术与解法（多步骤）</label>
                    <button onClick={addEditSolution} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
                      <Plus className="h-3 w-3" /> 添加步骤
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editForm.solutions.map((s, i) => (
                      <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-500">步骤 {i + 1}</span>
                          {editForm.solutions.length > 1 && (
                            <button onClick={() => removeEditSolution(i)} className="text-zinc-500 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <input value={s.title} onChange={(e) => updateEditSolution(i, "title", e.target.value)} placeholder="战术标题" className="input-admin mb-2" />
                        <textarea value={s.detail} onChange={(e) => updateEditSolution(i, "detail", e.target.value)} rows={2} placeholder="详细描述..." className="input-admin resize-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-md">
                <button
                  onClick={() => { setEditingProject(null); setEditForm(null); }}
                  className="rounded-xl border border-zinc-800 px-5 py-2.5 text-sm text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200"
                >
                  取消
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 保存中...</>
                  ) : (
                    <><Save className="h-4 w-4" /> 保存修改</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== Tab 2: 灵感文章编辑器 ==========
function InsightsEditor() {
  const [form, setForm] = useState({
    title: "",
    category: "✦ 深度长文",
    readTime: "",
    audioUrl: "",
    date: "",
    author: "",
    summary: "",
    contentText: "",
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [insightList, setInsightList] = useState<AdminInsight[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const loadInsights = async () => {
    setListLoading(true);
    try {
      const data = await fetchInsights();
      // fetchInsights 未映射 is_published 字段，此处补充默认值 true
      setInsightList(data.map((i) => ({ ...i, isPublished: true })));
    } catch (err) {
      console.warn("[admin] loadInsights 失败:", err);
      setStatus({ type: "error", msg: "数据加载失败，请检查网络或关闭广告拦截插件" });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleToggleInsightPublish = async (id: string | number, current: boolean) => {
    try {
      await toggleInsightPublish(String(id), !current);
      setInsightList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isPublished: !current } : i))
      );
    } catch {
      alert("切换失败");
    }
  };

  const handleDeleteInsight = async (id: string | number) => {
    if (!window.confirm("确定要彻底删除此项灵感文章吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteInsight(id);
      setInsightList((prev) => prev.filter((i) => i.id !== id));
      setStatus({ type: "success", msg: "灵感文章已删除" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "删除失败" });
    } finally {
      setDeletingId(null);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setStatus({ type: "error", msg: "请填写文章标题" });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const content = form.contentText
        .split("\n\n")
        .filter(Boolean)
        .map((para) => {
          if (para.startsWith("> ")) {
            return { type: "blockquote" as const, text: para.slice(2) };
          }
          if (para.startsWith("## ")) {
            return { type: "heading" as const, text: para.slice(3) };
          }
          if (para.startsWith("```")) {
            const lines = para.split("\n");
            const lang = lines[0].slice(3).trim();
            const text = lines.slice(1, lines.length - 1).join("\n");
            return { type: "code" as const, lang, text };
          }
          if (para.startsWith("- ")) {
            return {
              type: "list" as const,
              items: para.split("\n").map((l) => l.replace(/^- /, "")),
            };
          }
          return { type: "paragraph" as const, text: para };
        });

      const insight: Partial<InsightItem> = {
        title: form.title,
        category: form.category,
        readTime: form.readTime || undefined,
        listenTime: form.audioUrl || undefined,
        date: form.date,
        author: form.author,
        excerpt: form.summary,
        content,
      };
      await createInsight(insight);
      setStatus({ type: "success", msg: "灵感文章发布成功！" });
      setForm({
        title: "", category: "✦ 深度长文",
        readTime: "", audioUrl: "",
        date: "", author: "", summary: "", contentText: "",
      });
      loadInsights();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "发布失败" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">发布灵感文章</h2>
        <p className="mt-1 text-sm text-zinc-500">新增一篇深度思考内容，支持简易 Markdown 语法（标题 / 引用 / 列表 / 代码块）</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        {/* 基础信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="文章标题 *">
            <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="如：AI 时代下 B2B 营销人的第二曲线" className="input-insight" />
          </FormField>
          <FormField label="分类 *">
            <input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="如：✦ 深度长文 / 短观点 / 🎙️ 音频思考" className="input-insight" />
          </FormField>
          <FormField label="作者">
            <input value={form.author} onChange={(e) => updateField("author", e.target.value)} placeholder="如：陈述中马 / 策略探索者" className="input-insight" />
          </FormField>
          <FormField label="阅读时长">
            <input value={form.readTime} onChange={(e) => updateField("readTime", e.target.value)} placeholder="如：5 min" className="input-insight" />
          </FormField>
          <FormField label="发布日期">
            <input value={form.date} onChange={(e) => updateField("date", e.target.value)} placeholder="如：2024.07.15" className="input-insight" />
          </FormField>
          <FormField label="音频 URL（播客用）">
            <input value={form.audioUrl} onChange={(e) => updateField("audioUrl", e.target.value)} placeholder="https://..." className="input-insight" />
          </FormField>
        </div>

        {/* 摘要 */}
        <FormField label="摘要">
          <textarea
            value={form.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            rows={2}
            placeholder="一句话概括文章核心观点..."
            className="input-insight resize-none"
          />
        </FormField>

        {/* 正文 Markdown */}
        <FormField label="正文内容（简易 Markdown）">
          <textarea
            value={form.contentText}
            onChange={(e) => updateField("contentText", e.target.value)}
            rows={12}
            placeholder={`支持语法：\n\n普通段落（空行分隔）\n\n## 二级标题\n\n> 引用金句\n\n- 列表项1\n- 列表项2\n\n\`\`\`js\n代码块\n\`\`\``}
            className="input-insight resize-y font-mono text-xs leading-relaxed"
          />
        </FormField>

        {/* 状态 */}
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === "success"
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {status.msg}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 发布中...</>
          ) : (
            <><Send className="h-4 w-4" /> 发布灵感文章</>
          )}
        </button>
      </div>

      <style jsx>{`
        .input-insight {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background-color: rgb(9 9 11);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(244 244 245);
          outline: none;
          transition: all 0.15s;
        }
        .input-insight::placeholder {
          color: rgb(82 82 91);
        }
        .input-insight:focus {
          border-color: rgba(168, 85, 247, 0.5);
        }
      `}</style>

      {/* 已发布文章列表 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">已发布文章（{insightList.length}）</h3>
          <button
            onClick={loadInsights}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          </div>
        ) : insightList.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无文章数据</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {insightList.map((i) => (
              <div key={i.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {i.category}
                    </span>
                    {i.readTime && <span className="text-[10px] text-zinc-600">{i.readTime}</span>}
                    {i.date && <span className="text-[10px] text-zinc-600">{i.date}</span>}
                  </div>
                  <h4 className="truncate text-sm font-medium text-zinc-100">{i.title}</h4>
                  {i.excerpt && <p className="mt-0.5 truncate text-xs text-zinc-500">{i.excerpt}</p>}
                </div>
                {/* 发布状态开关 */}
                <div className="flex flex-shrink-0 items-center gap-2 pt-1">
                  <span className={`text-[10px] ${i.isPublished ? "text-green-400" : "text-zinc-500"}`}>
                    {i.isPublished ? "已发布" : "未发布"}
                  </span>
                  <button
                    onClick={() => handleToggleInsightPublish(i.id, i.isPublished)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${i.isPublished ? "bg-green-500" : "bg-zinc-600"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${i.isPublished ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteInsight(i.id)}
                  disabled={deletingId === i.id}
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === i.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Tab: 资源包编辑器 ==========
function ResourceEditor() {
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    outline: ["", ""] as string[],
    category: "指南",
    requireLogin: false,
  });
  const [fileInfo, setFileInfo] = useState<{ url: string; size: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resourceList, setResourceList] = useState<ResourceItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadResources = async () => {
    setListLoading(true);
    try {
      const data = await fetchResources();
      setResourceList(data);
    } catch (err) {
      console.warn("[admin] loadResources 失败:", err);
      setStatus({ type: "error", msg: "数据加载失败，请检查网络或关闭广告拦截插件" });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addOutlineItem = () => {
    setForm((prev) => ({ ...prev, outline: [...prev.outline, ""] }));
  };
  const removeOutlineItem = (i: number) => {
    setForm((prev) => ({ ...prev, outline: prev.outline.filter((_, idx) => idx !== i) }));
  };
  const updateOutlineItem = (i: number, val: string) => {
    setForm((prev) => ({
      ...prev,
      outline: prev.outline.map((o, idx) => (idx === i ? val : o)),
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", msg: "仅支持 PDF 文件" });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const result = await uploadResourceFile(file);
      if (result) {
        setFileInfo({ url: result.url, size: result.size, name: file.name });
        setStatus({ type: "success", msg: "文件上传成功" });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "文件上传失败" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setStatus({ type: "error", msg: "请填写资源标题" });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const resource: Partial<ResourceItem> = {
        title: form.title,
        excerpt: form.excerpt,
        outline: form.outline.filter(Boolean),
        category: form.category,
        requireLogin: form.requireLogin,
        isPublished: true,
        fileUrl: fileInfo?.url,
        fileSize: fileInfo?.size,
      };
      await createResource(resource);
      setStatus({ type: "success", msg: "资源包发布成功！" });
      setForm({
        title: "",
        excerpt: "",
        outline: ["", ""],
        category: "指南",
        requireLogin: false,
      });
      setFileInfo(null);
      loadResources();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "发布失败" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要彻底删除此资源包吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteResource(id);
      setResourceList((prev) => prev.filter((r) => r.id !== id));
      setStatus({ type: "success", msg: "资源包已删除" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "删除失败" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await toggleResourcePublish(id, !current);
      setResourceList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isPublished: !current } : r))
      );
    } catch {
      alert("切换失败");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">发布资源包</h2>
        <p className="mt-1 text-sm text-zinc-500">新增一个资源包（指南 / 手册 / 报告），支持 PDF 上传至 Supabase Storage</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        {/* 基础信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="资源标题 *">
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="如：AI 硬件 GEO 指南"
              className="input-resource"
            />
          </FormField>
          <FormField label="资源分类">
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="input-resource"
            >
              <option value="指南">指南</option>
              <option value="手册">手册</option>
              <option value="报告">报告</option>
            </select>
          </FormField>
        </div>

        {/* 精炼摘要 */}
        <FormField label="精炼摘要（Excerpt）">
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            rows={3}
            placeholder="一句话概括资源核心价值..."
            className="input-resource resize-none"
          />
        </FormField>

        {/* 核心目录 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">核心目录（Outline）</label>
            <button
              onClick={addOutlineItem}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            >
              <Plus className="h-3 w-3" /> 添加条目
            </button>
          </div>
          <div className="space-y-2">
            {form.outline.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={(e) => updateOutlineItem(i, e.target.value)}
                  placeholder={`目录条目 ${i + 1}`}
                  className="input-resource flex-1"
                />
                {form.outline.length > 1 && (
                  <button
                    onClick={() => removeOutlineItem(i)}
                    className="rounded-lg border border-zinc-800 px-3 text-zinc-500 hover:border-red-500/50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 下载权限 */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-4">
          <div className="flex-1 pr-4">
            <h4 className="text-sm font-semibold text-zinc-100">下载需登录</h4>
            <p className="mt-1 text-xs text-zinc-500">开启后，访客需登录才可下载该资源</p>
          </div>
          <button
            onClick={() => updateField("requireLogin", !form.requireLogin)}
            role="switch"
            aria-checked={form.requireLogin}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              form.requireLogin
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.requireLogin ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* PDF 文件上传 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">PDF 文件上传</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragging
                ? "border-purple-500/60 bg-purple-500/5"
                : "border-zinc-700 bg-zinc-950/40"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="resource-pdf-upload"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                <p className="text-xs text-zinc-500">上传中...</p>
              </div>
            ) : fileInfo ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-xs truncate">{fileInfo.name}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  大小：{fileInfo.size} ·{" "}
                  <a
                    href={fileInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    查看文件
                  </a>
                </p>
                <button
                  onClick={() => setFileInfo(null)}
                  className="text-xs text-zinc-500 hover:text-red-400"
                >
                  移除文件
                </button>
              </div>
            ) : (
              <label
                htmlFor="resource-pdf-upload"
                className="flex cursor-pointer flex-col items-center gap-2 py-2"
              >
                <Upload className="h-6 w-6 text-zinc-500" />
                <p className="text-sm text-zinc-400">点击或拖拽 PDF 文件到此处上传</p>
                <p className="text-[10px] text-zinc-600">仅支持 .pdf 格式</p>
              </label>
            )}
          </div>
        </div>

        {/* 状态提示 */}
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === "success"
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {status.msg}
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 发布中...</>
          ) : (
            <><Save className="h-4 w-4" /> 发布资源包</>
          )}
        </button>
      </div>

      <style jsx>{`
        .input-resource {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background-color: rgb(9 9 11);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(244 244 245);
          outline: none;
          transition: all 0.15s;
        }
        .input-resource::placeholder {
          color: rgb(82 82 91);
        }
        .input-resource:focus {
          border-color: rgba(168, 85, 247, 0.5);
        }
      `}</style>

      {/* 已发布资源列表 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">已发布资源（{resourceList.length}）</h3>
          <button
            onClick={loadResources}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          </div>
        ) : resourceList.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无资源数据</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {resourceList.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {r.category}
                    </span>
                    {r.fileSize && <span className="text-[10px] text-zinc-600">{r.fileSize}</span>}
                    <span className="text-[10px] text-zinc-600">下载 {r.downloadCount} 次</span>
                    {r.requireLogin && (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                        需登录
                      </span>
                    )}
                  </div>
                  <h4 className="truncate text-sm font-medium text-zinc-100">{r.title}</h4>
                  {r.excerpt && <p className="mt-0.5 truncate text-xs text-zinc-500">{r.excerpt}</p>}
                </div>
                {/* 发布状态开关 */}
                <div className="flex flex-shrink-0 items-center gap-2 pt-1">
                  <span className={`text-[10px] ${r.isPublished ? "text-green-400" : "text-zinc-500"}`}>
                    {r.isPublished ? "已发布" : "未发布"}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(r.id, r.isPublished)}
                    disabled={togglingId === r.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isPublished ? "bg-green-500" : "bg-zinc-600"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${r.isPublished ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Tab 3: 庇护所互动管理 ==========
function SanctuaryManager() {
  const [posts, setPosts] = useState<SanctuaryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchSanctuaryPosts();
      setPosts(data);
    } catch (err) {
      console.warn("[admin] loadPosts 失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要彻底删除这条庇护所留言吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteSanctuaryPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("删除失败：" + (err.message || ""));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-50">庇护所互动管理</h2>
          <p className="mt-1 text-sm text-zinc-500">管理访客在「庇护所」发布的脑洞与吐槽卡片</p>
        </div>
        <button
          onClick={loadPosts}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
        >
          <Eye className="h-3.5 w-3.5" />
          刷新
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无留言数据</p>
            <p className="mt-1 text-xs text-zinc-600">访客发布的脑洞/吐槽会显示在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-5">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${post.tagColor || "bg-zinc-800 text-zinc-400"}`}>
                      {post.tag}
                    </span>
                    <span className="text-[11px] text-zinc-500">{post.author}</span>
                    <span className="text-[11px] text-zinc-600">·</span>
                    <span className="text-[11px] text-zinc-600">{post.time}</span>
                  </div>
                  <p className="text-sm text-zinc-200">{post.content}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-500">
                    <span>⚡ {post.likes} 能量</span>
                    <span>🔥 {post.reactions?.cool || 0}</span>
                    <span>💰 {post.reactions?.biz || 0}</span>
                    <span>⚠️ {post.reactions?.hard || 0}</span>
                    <span>😅 {post.reactions?.fake || 0}</span>
                    <span>💬 {(post.comments || []).length} 评论</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === post.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Tab: 线索管理 (Leads) ==========
function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.warn("[admin] loadLeads 失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要删除此条线索吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const csv = [
      "邮箱,资源,提交时间",
      ...leads.map((l) => `${l.email},${l.resourceTitle || ""},${l.createdAt}`),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-50">线索管理</h2>
          <p className="mt-1 text-sm text-zinc-500">管理访客下载资源时提交的邮箱线索</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            导出 CSV
          </button>
          <button
            onClick={loadLeads}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
      </div>

      {/* 顶部统计 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Mail className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-50">{leads.length}</p>
            <p className="text-xs text-zinc-500">总线索数</p>
          </div>
        </div>
      </div>

      {/* 线索列表 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无线索数据</p>
            <p className="mt-1 text-xs text-zinc-600">访客下载资源时提交的邮箱将显示在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {/* 表头 */}
            <div className="hidden gap-4 px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500 md:flex">
              <div className="flex-1">邮箱</div>
              <div className="flex-1">下载资源</div>
              <div className="w-40">提交时间</div>
              <div className="w-10" />
            </div>
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-start gap-4 p-5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[10px] text-zinc-600 md:hidden">邮箱</span>
                  <span className="truncate text-sm text-zinc-100">{lead.email}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[10px] text-zinc-600 md:hidden">下载资源</span>
                  <span className="truncate text-sm text-zinc-300">{lead.resourceTitle || "—"}</span>
                </div>
                <div className="flex w-40 flex-col">
                  <span className="text-[10px] text-zinc-600 md:hidden">提交时间</span>
                  <span className="truncate text-xs text-zinc-500">{lead.createdAt}</span>
                </div>
                <button
                  onClick={() => handleDelete(lead.id)}
                  disabled={deletingId === lead.id}
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === lead.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Tab: 情报站编辑器 (Insight Hub) ==========
function InsightHubEditor() {
  const [form, setForm] = useState({
    title: "",
    category: "🤖 机器人/具身智能" as InsightHubCategory,
    sourceName: "",
    originalUrl: "",
    publishedAt: "",
    summary: "",
    isFeatured: false,
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hubList, setHubList] = useState<InsightHubItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadHub = async () => {
    setListLoading(true);
    try {
      const data = await fetchInsightsHub();
      setHubList(data);
    } catch (err) {
      console.warn("[admin] loadHub 失败:", err);
      setStatus({ type: "error", msg: "数据加载失败，请检查网络或关闭广告拦截插件" });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadHub();
  }, []);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setStatus({ type: "error", msg: "请填写资讯标题" });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const item: Partial<InsightHubItem> = {
        title: form.title,
        category: form.category,
        summary: form.summary,
        sourceName: form.sourceName,
        originalUrl: form.originalUrl,
        publishedAt: form.publishedAt,
        isPublished: true,
        isFeatured: form.isFeatured,
      };
      await createInsightHub(item);
      setStatus({ type: "success", msg: "情报站内容发布成功！" });
      setForm({
        title: "",
        category: "🤖 机器人/具身智能",
        sourceName: "",
        originalUrl: "",
        publishedAt: "",
        summary: "",
        isFeatured: false,
      });
      loadHub();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "发布失败" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要彻底删除此条情报吗？此操作不可撤销。")) return;
    setDeletingId(id);
    try {
      await deleteInsightHub(id);
      setHubList((prev) => prev.filter((h) => h.id !== id));
      setStatus({ type: "success", msg: "情报已删除" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "删除失败" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await toggleInsightHubPublish(id, !current);
      setHubList((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isPublished: !current } : h))
      );
    } catch {
      alert("切换失败");
    } finally {
      setTogglingId(null);
    }
  };

  // 切换置顶
  const handleToggleFeature = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await toggleInsightHubFeature(id, !current);
      setHubList((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isFeatured: !current } : h))
      );
    } catch {
      alert("置顶切换失败");
    } finally {
      setTogglingId(null);
    }
  };

  // 编辑情报
  const [editingHub, setEditingHub] = useState<InsightHubItem | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; summary: string; category: InsightHubCategory; sourceName: string; originalUrl: string; publishedAt: string }>({ title: "", summary: "", category: "🤖 机器人/具身智能", sourceName: "", originalUrl: "", publishedAt: "" });

  const handleEdit = (item: InsightHubItem) => {
    setEditingHub(item);
    setEditForm({
      title: item.title,
      summary: item.summary,
      category: item.category,
      sourceName: item.sourceName,
      originalUrl: item.originalUrl,
      publishedAt: item.publishedAt,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingHub) return;
    setTogglingId(editingHub.id);
    try {
      await updateInsightHub(editingHub.id, {
        title: editForm.title,
        summary: editForm.summary,
        category: editForm.category,
        sourceName: editForm.sourceName,
        originalUrl: editForm.originalUrl,
        publishedAt: editForm.publishedAt,
      });
      setHubList((prev) =>
        prev.map((h) =>
          h.id === editingHub.id
            ? { ...h, ...editForm }
            : h
        )
      );
      setEditingHub(null);
      setStatus({ type: "success", msg: "情报编辑成功" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "编辑失败" });
    } finally {
      setTogglingId(null);
    }
  };

  // AI 一键生成并写入
  const [aiGenerating, setAiGenerating] = useState(false);
  const handleAiGenerate = async () => {
    setAiGenerating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (!result.success || !result.items?.length) {
        setStatus({ type: "error", msg: result.error || "AI 生成失败" });
        return;
      }
      let saved = 0;
      for (const item of result.items) {
        try {
          await createInsightHub({
            title: item.title,
            category: item.category,
            summary: item.summary,
            sourceName: item.source_name,
            originalUrl: item.original_url,
            publishedAt: item.published_at,
            isPublished: true,
            isFeatured: false,
            apiSource: "ai_generated",
            tags: item.tags || [],
          });
          saved++;
        } catch {}
      }
      setStatus({ type: "success", msg: `AI 已生成 ${saved} 条情报` });
      loadHub();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "AI 请求失败" });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">情报站管理</h2>
        <p className="mt-1 text-sm text-zinc-500">新增、编辑、置顶、删除行业情报，支持 AI 一键生成</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        {/* 基础信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="资讯标题 *">
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="如：智元机器人发布远征 A2 具身智能新品"
              className="input-hub"
            />
          </FormField>
          <FormField label="分类 *">
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="input-hub"
            >
              <option value="🤖 机器人/具身智能">🤖 机器人/具身智能</option>
              <option value="💡 AI技术/大厂策略">💡 AI技术/大厂策略</option>
              <option value="📈 品牌策略/GTM干货">📈 品牌策略/GTM干货</option>
            </select>
          </FormField>
          <FormField label="来源名称">
            <input
              value={form.sourceName}
              onChange={(e) => updateField("sourceName", e.target.value)}
              placeholder="如：智元机器人官方发布会"
              className="input-hub"
            />
          </FormField>
          <FormField label="原文链接">
            <input
              value={form.originalUrl}
              onChange={(e) => updateField("originalUrl", e.target.value)}
              placeholder="https://..."
              className="input-hub"
            />
          </FormField>
          <FormField label="发布日期">
            <input
              value={form.publishedAt}
              onChange={(e) => updateField("publishedAt", e.target.value)}
              placeholder="如：2025.07.20"
              className="input-hub"
            />
          </FormField>
        </div>

        {/* 陈皮提炼看点 */}
        <FormField label="陈皮提炼看点（100字核心摘要）">
          <textarea
            value={form.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            rows={4}
            placeholder="用一句话提炼这条情报的核心看点..."
            className="input-hub resize-none"
          />
        </FormField>

        {/* 是否置顶 */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-4">
          <div className="flex-1 pr-4">
            <h4 className="text-sm font-semibold text-zinc-100">置顶</h4>
            <p className="mt-1 text-xs text-zinc-500">开启后，该情报将在情报站顶部展示</p>
          </div>
          <button
            onClick={() => updateField("isFeatured", !form.isFeatured)}
            role="switch"
            aria-checked={form.isFeatured}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              form.isFeatured
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isFeatured ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* 状态提示 */}
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === "success"
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {status.msg}
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 发布中...</>
          ) : (
            <><Save className="h-4 w-4" /> 发布情报</>
          )}
        </button>

        {/* AI 一键生成 */}
        <button
          onClick={handleAiGenerate}
          disabled={aiGenerating}
          className="ml-3 inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-3 text-sm font-semibold text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50"
        >
          {aiGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> AI 生成中...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> AI 一键生成</>
          )}
        </button>
      </div>

      <style jsx>{`
        .input-hub {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background-color: rgb(9 9 11);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(244 244 245);
          outline: none;
          transition: all 0.15s;
        }
        .input-hub::placeholder {
          color: rgb(82 82 91);
        }
        .input-hub:focus {
          border-color: rgba(168, 85, 247, 0.5);
        }
      `}</style>

      {/* 已发布情报列表 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">已发布情报（{hubList.length}）</h3>
          <button
            onClick={loadHub}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          </div>
        ) : hubList.length === 0 ? (
          <div className="py-16 text-center">
            <Radar className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无情报数据</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {hubList.map((h) => (
              <div key={h.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {h.category}
                    </span>
                    {h.publishedAt && <span className="text-[10px] text-zinc-600">{h.publishedAt}</span>}
                    {h.isFeatured && (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                        置顶
                      </span>
                    )}
                    {h.apiSource === "ai_generated" && (
                      <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400">
                        AI生成
                      </span>
                    )}
                  </div>
                  <h4 className="truncate text-sm font-medium text-zinc-100">{h.title}</h4>
                  {h.sourceName && <p className="mt-0.5 truncate text-xs text-zinc-500">来源：{h.sourceName}</p>}
                </div>
                {/* 操作按钮组 */}
                <div className="flex flex-shrink-0 items-center gap-2 pt-1">
                  {/* 置顶按钮 */}
                  <button
                    onClick={() => handleToggleFeature(h.id, h.isFeatured ?? false)}
                    disabled={togglingId === h.id}
                    title={h.isFeatured ? "取消置顶" : "置顶"}
                    className={`rounded-lg border p-2 transition-all disabled:opacity-50 ${
                      h.isFeatured
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                        : "border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-400"
                    }`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  {/* 编辑按钮 */}
                  <button
                    onClick={() => handleEdit(h)}
                    title="编辑"
                    className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-blue-500/50 hover:text-blue-400"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {/* 发布状态开关 */}
                  <span className={`text-[10px] ${h.isPublished ? "text-green-400" : "text-zinc-500"}`}>
                    {h.isPublished ? "已发布" : "未发布"}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(h.id, h.isPublished)}
                    disabled={togglingId === h.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${h.isPublished ? "bg-green-500" : "bg-zinc-600"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${h.isPublished ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  disabled={deletingId === h.id}
                  className="flex-shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === h.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {editingHub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingHub(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-100">编辑情报</h3>
                <button onClick={() => setEditingHub(null)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">标题</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">分类</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as InsightHubCategory })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="🤖 机器人/具身智能">🤖 机器人/具身智能</option>
                    <option value="💡 AI技术/大厂策略">💡 AI技术/大厂策略</option>
                    <option value="📈 品牌策略/GTM干货">📈 品牌策略/GTM干货</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">看点摘要</label>
                  <textarea
                    value={editForm.summary}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">来源</label>
                    <input
                      value={editForm.sourceName}
                      onChange={(e) => setEditForm({ ...editForm, sourceName: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">发布日期</label>
                    <input
                      value={editForm.publishedAt}
                      onChange={(e) => setEditForm({ ...editForm, publishedAt: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">原文链接</label>
                  <input
                    value={editForm.originalUrl}
                    onChange={(e) => setEditForm({ ...editForm, originalUrl: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditingHub(null)} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">
                    取消
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={togglingId === editingHub.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {togglingId === editingHub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存修改
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== 通用表单字段 ==========
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

// ========== Tab 4: 站点配置 (Feature Flags) ==========
const FEATURE_FLAGS: {
  key: keyof SiteConfig;
  label: string;
  desc: string;
  default: boolean;
}[] = [
  { key: "show_portfolio", label: "作品集模块", desc: "首页展示作品案例与战术拆解", default: true },
  { key: "show_insights", label: "深度文章模块", desc: "首页展示灵感点与深度思考", default: true },
  { key: "show_insights_hub", label: "情报站模块", desc: "首页展示行业情报与自动化抓取内容", default: true },
  { key: "show_resources", label: "资源包模块", desc: "首页展示精选 PDF 资源下载", default: true },
  { key: "show_chenpi_ai", label: "陈皮 AI 助手", desc: "右下角浮动的智能对话助手", default: true },
  { key: "show_sanctuary", label: "脑洞与吐槽画布", desc: "社区互动与赛博上香模块", default: true },
  { key: "show_inspiration_sign", label: "今日灵感签文", desc: "每日赛博灵感便签海报", default: true },
];

function ConfigEditor() {
  // 本地默认配置（Supabase 不可用 / 表未创建时的防崩溃 Fallback）
  const LOCAL_DEFAULT_CONFIG: SiteConfig = {
    show_portfolio: true,
    show_insights: true,
    show_insights_hub: true,
    show_resources: true,
    show_chenpi_ai: true,
    show_sanctuary: true,
    show_inspiration_sign: true,
  };

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "warning"; msg: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // fetchSiteConfig 内部已有 try-catch 并返回默认配置，
        // 此处再包一层防御，确保任何异常都不会导致界面崩溃
        const data = await fetchSiteConfig();
        if (mounted) setConfig(data || LOCAL_DEFAULT_CONFIG);
      } catch (err) {
        // 极端情况（如 Supabase 连接异常）：静默降级到本地默认配置
        console.warn("site_config 加载降级到本地默认配置:", err);
        if (mounted) setConfig(LOCAL_DEFAULT_CONFIG);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: keyof SiteConfig) => {
    if (!config) return;
    setConfig({ ...config, [key]: !config[key] });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setStatus(null);
    try {
      await saveSiteConfig(config);
      setStatus({ type: "success", msg: "站点配置已保存至 Supabase，首页将立即生效" });
    } catch (err: any) {
      // 保存失败时使用琥珀色警告（非红色致命错误），提示用户表可能未创建
      const reason = err?.message || "未知错误";
      setStatus({
        type: "warning",
        msg: `本地配置已更新，但 Supabase 同步失败：${reason}。若尚未创建 site_config 表，请先在 SQL Editor 执行建表语句（见 src/lib/supabase.ts 注释）。`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!config) {
    // 兜底：理论上不会到达此处，但作为最终防御
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">配置加载失败</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">站点配置 · 模块显隐控制</h2>
        <p className="mt-1 text-sm text-zinc-500">
          通过开关灵活控制首页各模块的显隐，适配不同阶段（求职展示 / 社区推广）的品牌定位。配置将持久化写入 Supabase <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-purple-300">site_config</code> 表。
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="space-y-3">
          {FEATURE_FLAGS.map((flag) => {
            const enabled = config[flag.key];
            return (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-100">{flag.label}</h4>
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                      {flag.key}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{flag.desc}</p>
                </div>
                <button
                  onClick={() => toggle(flag.key)}
                  role="switch"
                  aria-checked={enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    enabled
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* 状态提示 */}
        {status && (
          <div className={`mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === "success"
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
          }`}>
            {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <span className="leading-relaxed">{status.msg}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 保存中...</>
          ) : (
            <><Save className="h-4 w-4" /> 保存配置</>
          )}
        </button>
      </div>
    </div>
  );
}
