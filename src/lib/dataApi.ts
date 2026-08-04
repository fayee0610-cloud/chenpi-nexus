// ============================================================
// 数据获取工具：优先从 Supabase 读取，失败/未配置时返回空数组（无 Mock 降级）
// 适配新表结构：projects(sub_title, strategy) / insights(summary, content TEXT, audio_url) / sanctuary_posts(简化)
// ============================================================

import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type PortfolioProject,
  type InsightItem,
  type SanctuaryPost,
  type ContentBlock,
  type ResourceItem,
  type InsightHubItem,
} from "@/data/siteData";

// 生成 TEXT 主键
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 生成随机删除凭证（32 字符十六进制），前端 localStorage 保存，用于用户自主删除帖子
function genDeleteToken(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- 网络错误识别与友好兜底 ----------
// 捕获 fetch 层的网络异常（插件拦截/断网/Supabase 不可达），
// 打印友好 warn 日志，避免 Next.js dev 错误覆盖层抛出 unhandled runtime error。
function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Network request failed") ||
    msg.includes("ERR_NETWORK") ||
    msg.includes("fetch failed") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ETIMEDOUT")
  );
}

function logNetworkFallback(scope: string, err: unknown): void {
  if (isNetworkError(err)) {
    console.warn(`[dataApi] 网络请求被拦截或连接失败，返回空数组 [${scope}]:`, err instanceof Error ? err.message : err);
  } else {
    console.warn(`[dataApi] ${scope} 读取异常，返回空数组:`, err instanceof Error ? err.message : err);
  }
}

// 将纯文本 content 解析为 ContentBlock[]（简易 Markdown）
function parseContent(text: string): ContentBlock[] {
  if (!text) return [];
  // 如果已经是 JSON 数组格式，直接解析
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // 不是 JSON，按 Markdown 解析
  }
  return text
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
        const codeText = lines.slice(1, lines.length - 1).join("\n");
        return { type: "code" as const, lang, text: codeText };
      }
      if (para.startsWith("- ")) {
        return {
          type: "list" as const,
          items: para.split("\n").map((l) => l.replace(/^- /, "")),
        };
      }
      return { type: "paragraph" as const, text: para };
    });
}

// 将 ContentBlock[] 序列化为纯文本（用于存入 insights.content TEXT 列）
function serializeContent(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks);
}

// ---------- Portfolio ----------
// category → tab 精准映射字典（与 siteData.portfolio.categories 的 label 完全对齐）
const CATEGORY_TO_TAB: Record<string, "brand" | "ai" | "experiment"> = {
  "品牌与市场战术": "brand",
  "AI 与硬件探索": "ai",
  "阶段性创意实验": "experiment",
};

export async function fetchProjects(): Promise<PortfolioProject[]> {
  if (!supabase) return [];

  try {
    // 服务端过滤 is_published = true，确保隐藏内容不传输到前端
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      // 若 is_published 字段不存在，降级为全量查询 + 客户端过滤
      if (error.message && error.message.includes("is_published")) {
        console.warn("[dataApi] projects 表无 is_published 字段，建议执行 ALTER TABLE projects ADD COLUMN is_published BOOLEAN DEFAULT TRUE");
        const retry = await supabase.from("projects").select("*").order("created_at", { ascending: false });
        if (retry.error || !retry.data) return [];
        return retry.data
          .filter((row: any) => row.is_published !== false)
          .map(mapProjectRow);
      }
      console.warn("[dataApi] fetchProjects 查询出错:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map(mapProjectRow);
  } catch (err) {
    logNetworkFallback("fetchProjects", err);
    return [];
  }
}

// projects 表行 → PortfolioProject 映射
function mapProjectRow(row: any): PortfolioProject {
  const cat = (row.category || "").trim();
  // 精准匹配字典，匹配失败时根据关键词兜底，最后默认 brand
  let tab: "brand" | "ai" | "experiment" = CATEGORY_TO_TAB[cat] || "brand";
  if (!CATEGORY_TO_TAB[cat]) {
    if (cat.includes("AI") || cat.includes("硬件")) tab = "ai";
    else if (cat.includes("创意") || cat.includes("实验")) tab = "experiment";
  }
  return {
    id: row.id,
    title: row.title || "",
    subTitle: row.sub_title || "",
    image: row.image_url || "",
    date: row.date || "",
    role: row.role || "",
    metrics: row.metrics || [],
    tags: [],
    tab,
    category: cat,
    challenge: row.challenge || "",
    solutions: row.strategy || [],
    demoUrl: row.demo_url || undefined,
  } as PortfolioProject;
}

// ---------- Insights ----------
export async function fetchInsights(): Promise<InsightItem[]> {
  if (!supabase) return [];

  try {
    // 服务端过滤 is_published = true
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      // 字段不存在时降级
      if (error.message && error.message.includes("is_published")) {
        console.warn("[dataApi] insights 表无 is_published 字段，建议执行 ALTER TABLE insights ADD COLUMN is_published BOOLEAN DEFAULT TRUE");
        const retry = await supabase.from("insights").select("*").order("created_at", { ascending: false });
        if (retry.error || !retry.data) return [];
        return retry.data
          .filter((row: any) => row.is_published !== false)
          .map((row: any) => mapInsightRow(row));
      }
      console.warn("[dataApi] fetchInsights 查询出错:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row: any) => mapInsightRow(row));
  } catch (err) {
    logNetworkFallback("fetchInsights", err);
    return [];
  }
}

// insights 表行 → InsightItem 映射
function mapInsightRow(row: any): InsightItem {
  const cat = row.category || "";
  let type: "article" | "short" | "podcast" = "article";
  if (cat.includes("短观点")) type = "short";
  else if (cat.includes("音频") || cat.includes("播客") || row.audio_url) type = "podcast";

  let tags: string[] | undefined = undefined;
  if (row.tags) {
    if (typeof row.tags === "string") {
      try {
        tags = JSON.parse(row.tags);
      } catch {
        tags = row.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(row.tags)) {
      tags = row.tags;
    }
    if (tags && !Array.isArray(tags)) tags = undefined;
  }

  return {
    id: row.id,
    title: row.title || "",
    excerpt: row.summary || "",
    image: "",
    type,
    category: row.category || "",
    tags,
    readTime: row.read_time || undefined,
    listenTime: row.audio_url ? "15 min" : undefined,
    isFeatured: false,
    date: row.date || "",
    author: row.author || "",
    views: "0",
    likes: 0,
    commentCount: typeof row.comment_count === "number" ? row.comment_count : 0,
    content: parseContent(row.content || ""),
  } as InsightItem;
}

// ---------- Sanctuary Posts ----------
export async function fetchSanctuaryPosts(): Promise<SanctuaryPost[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("sanctuary_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[dataApi] fetchSanctuaryPosts 查询出错:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data
      .filter((row: any) => row.is_published !== false)
      .map((row: any) => ({
        id: String(row.id),
        content: row.content || "",
        tag: row.tag || "",
        tagColor: "text-zinc-400 bg-zinc-800",
        author: row.author || "赛博访客",
        time: row.created_at ? new Date(row.created_at).toLocaleString("zh-CN") : "",
        likes: row.likes || 0,
        reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
        comments: [],
      })) as SanctuaryPost[];
  } catch (err) {
    logNetworkFallback("fetchSanctuaryPosts", err);
    return [];
  }
}

export async function deleteSanctuaryPost(id: string | number) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("sanctuary_posts").delete().eq("id", String(id));
  if (error) throw error;
}

// ---------- 写入：创建庇护所帖子（走服务端代理，避免浏览器直连 CORS/RLS/fetch 劫持） ----------
export async function createSanctuaryPost(post: {
  content: string;
  tag?: string;
  author?: string;
  avatar?: string;
}): Promise<(SanctuaryPost & { deleteToken?: string }) | null> {
  const res = await fetch("/api/sanctuary/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: post.content,
      tag: post.tag,
      author: post.author,
      avatar: post.avatar,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.post) {
    throw new Error(data.error || "发布失败");
  }
  const row = data.post;
  return {
    id: String(row.id),
    content: row.content || "",
    tag: row.tag || "",
    tagColor: "text-zinc-400 bg-zinc-800",
    author: row.author || "赛博访客",
    time: row.time || "刚刚",
    likes: row.likes || 0,
    reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
    comments: [],
    isNew: true,
    deleteToken: data.deleteToken,
  } as SanctuaryPost & { deleteToken?: string };
}

// ---------- 删除：作品 ----------
export async function deleteProject(id: string | number) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("projects").delete().eq("id", String(id));
  if (error) throw error;
}

// ---------- 删除：灵感文章 ----------
export async function deleteInsight(id: string | number) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("insights").delete().eq("id", String(id));
  if (error) throw error;
}

// ---------- 单条查询：作品 ----------
export async function fetchProjectById(id: string): Promise<PortfolioProject | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapProjectRow(data);
  } catch (err) {
    logNetworkFallback("fetchProjectById", err);
    return null;
  }
}

// ---------- 单条查询：文章 ----------
export async function fetchInsightById(id: string): Promise<InsightItem | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("insights").select("*").eq("id", id).single();
    if (error || !data) return null;
    const row = data as any;
    const cat = row.category || "";
    let type: "article" | "short" | "podcast" = "article";
    if (cat.includes("短观点")) type = "short";
    else if (cat.includes("音频") || cat.includes("播客") || row.audio_url) type = "podcast";
    return {
      id: row.id,
      title: row.title || "",
      excerpt: row.summary || "",
      image: "",
      type,
      category: row.category || "",
      readTime: row.read_time || undefined,
      listenTime: row.audio_url ? "15 min" : undefined,
      isFeatured: false,
      date: row.date || "",
      author: row.author || "",
      views: "0",
      likes: 0,
      content: parseContent(row.content || ""),
    } as InsightItem;
  } catch (err) {
    logNetworkFallback("fetchInsightById", err);
    return null;
  }
}

// ---------- 站点配置 (Feature Flags) ----------
export interface SiteConfig {
  show_portfolio: boolean;
  show_insights: boolean;
  show_insights_hub: boolean;
  show_resources: boolean;
  show_chenpi_ai: boolean;
  show_sanctuary: boolean;
  show_inspiration_sign: boolean;
}

const DEFAULT_CONFIG: SiteConfig = {
  show_portfolio: true,
  show_insights: true,
  show_insights_hub: true,
  show_resources: true,
  show_chenpi_ai: true,
  show_sanctuary: true,
  show_inspiration_sign: true,
};

export async function fetchSiteConfig(): Promise<SiteConfig> {
  if (!supabase) return DEFAULT_CONFIG;
  try {
    const { data } = await supabase.from("site_config").select("key, value").eq("key", "feature_flags").single();
    const cfgRow = data as any;
    if (cfgRow?.value && typeof cfgRow.value === "object") {
      return { ...DEFAULT_CONFIG, ...(cfgRow.value as object) };
    }
    return DEFAULT_CONFIG;
  } catch (err) {
    logNetworkFallback("fetchSiteConfig", err);
    return DEFAULT_CONFIG;
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("site_config")
    .upsert({ key: "feature_flags", value: config });
  if (error) throw error;
}

// ---------- 写入：创建作品 ----------
export async function createProject(project: Partial<PortfolioProject>) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        id: genId(),
        title: project.title,
        sub_title: project.subTitle,
        category: project.category,
        role: project.role,
        date: project.date,
        metrics: project.metrics || [],
        challenge: project.challenge,
        strategy: project.solutions || [], // DB 列名为 strategy
        image_url: project.image,
      },
    ])
    .select();
  if (error) throw error;
  return data;
}

// ---------- 更新：编辑作品（无限次修改） ----------
export async function updateProject(id: string, project: Partial<PortfolioProject>) {
  if (!supabase) throw new Error("Supabase not configured");
  const updateData: Record<string, any> = {};
  if (project.title !== undefined) updateData.title = project.title;
  if (project.subTitle !== undefined) updateData.sub_title = project.subTitle;
  if (project.category !== undefined) updateData.category = project.category;
  if (project.role !== undefined) updateData.role = project.role;
  if (project.date !== undefined) updateData.date = project.date;
  if (project.image !== undefined) updateData.image_url = project.image;
  if (project.challenge !== undefined) updateData.challenge = project.challenge;
  if (project.metrics !== undefined) updateData.metrics = project.metrics;
  if (project.solutions !== undefined) updateData.strategy = project.solutions;

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", String(id))
    .select();
  if (error) throw error;
  return data;
}

// ---------- Supabase Storage: 作品集封面图上传 ----------
export async function uploadPortfolioCover(file: File): Promise<{ url: string } | null> {
  if (!supabase) throw new Error("Supabase 未配置，无法上传图片");
  // 校验文件类型
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`不支持的图片格式：${file.type || "未知"}，仅支持 JPG / PNG / WebP`);
  }
  // 校验文件大小（< 2MB）
  if (file.size > 2 * 1024 * 1024) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(`图片大小 ${sizeMB}MB 超过 2MB 限制，请压缩后上传`);
  }
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `portfolio-covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from("portfolio-covers").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    // 提取 Supabase Storage 的具体错误信息，便于前端展示和排查
    const errMsg = error.message || JSON.stringify(error);
    if (errMsg.includes("Bucket not found") || errMsg.includes("404")) {
      throw new Error("Storage bucket 'portfolio-covers' 不存在，请在 Supabase Dashboard 创建该 Public Bucket");
    }
    if (errMsg.includes("policy") || errMsg.includes("403") || errMsg.includes("Unauthorized")) {
      throw new Error("Storage RLS 策略拒绝上传，请在 Supabase 配置允许匿名 INSERT 的 Policy");
    }
    throw new Error(`图片上传失败：${errMsg}`);
  }
  const { data: urlData } = supabase.storage.from("portfolio-covers").getPublicUrl(fileName);
  return { url: urlData.publicUrl };
}

// ---------- 写入：创建灵感文章 ----------
export async function createInsight(insight: Partial<InsightItem>) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("insights")
    .insert([
      {
        id: genId(),
        title: insight.title,
        summary: insight.excerpt, // DB 列名为 summary
        category: insight.category,
        tags: Array.isArray(insight.tags) ? JSON.stringify(insight.tags) : null,
        read_time: insight.readTime,
        date: insight.date,
        author: insight.author,
        content: insight.content
          ? serializeContent(insight.content as ContentBlock[])
          : "",
        audio_url: insight.listenTime ? insight.listenTime : null,
        is_published: true,
      },
    ])
    .select();
  if (error) throw error;
  return data;
}

// ---------- 更新灵感文章 ----------
export async function updateInsight(
  id: string | number,
  patch: Partial<{
    title: string;
    excerpt: string;
    category: string;
    tags: string[];
    readTime: string;
    date: string;
    author: string;
    content: ContentBlock[];
    listenTime: string;
  }>
) {
  if (!supabase) throw new Error("Supabase not configured");
  const payload: Record<string, any> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.excerpt !== undefined) payload.summary = patch.excerpt;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.tags !== undefined) payload.tags = JSON.stringify(patch.tags || []);
  if (patch.readTime !== undefined) payload.read_time = patch.readTime;
  if (patch.date !== undefined) payload.date = patch.date;
  if (patch.author !== undefined) payload.author = patch.author;
  if (patch.content !== undefined) payload.content = serializeContent(patch.content);
  if (patch.listenTime !== undefined) payload.audio_url = patch.listenTime;
  const { error } = await supabase
    .from("insights")
    .update(payload)
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- 切换发布状态 ----------
export async function toggleProjectPublish(id: string, isPublished: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("projects")
    .update({ is_published: isPublished })
    .eq("id", String(id));
  if (error) throw error;
}

export async function toggleInsightPublish(id: string, isPublished: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("insights")
    .update({ is_published: isPublished })
    .eq("id", String(id));
  if (error) throw error;
}

export async function toggleResourcePublish(id: string, isPublished: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("resources")
    .update({ is_published: isPublished })
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- Resources CRUD ----------
export async function fetchResources(): Promise<ResourceItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[dataApi] fetchResources 查询出错:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data
      .filter((row: any) => row.is_published !== false) // 前台只展示已发布内容
      .map((row: any) => ({
        id: row.id,
        title: row.title || "",
        excerpt: row.excerpt || "",
        outline: row.outline ? (typeof row.outline === "string" ? JSON.parse(row.outline) : row.outline) : [],
        fileUrl: row.file_url || "",
        fileSize: row.file_size || "",
        category: row.category || "指南",
        requireLogin: row.require_login ?? false,
        isPublished: row.is_published ?? true,
        downloadCount: row.download_count || 0,
        date: row.created_at ? new Date(row.created_at).toLocaleDateString("zh-CN").replace(/\//g, ".") : "",
      })) as ResourceItem[];
  } catch (err) {
    logNetworkFallback("fetchResources", err);
    return [];
  }
}

export async function createResource(resource: Partial<ResourceItem>) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("resources")
    .insert([
      {
        id: genId(),
        title: resource.title,
        excerpt: resource.excerpt,
        outline: resource.outline || [],
        file_url: resource.fileUrl || null,
        file_size: resource.fileSize || null,
        category: resource.category || "指南",
        require_login: resource.requireLogin ?? false,
        is_published: resource.isPublished ?? true,
        download_count: 0,
      },
    ])
    .select();
  if (error) throw error;
  return data;
}

export async function deleteResource(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("resources").delete().eq("id", String(id));
  if (error) throw error;
}

export async function incrementResourceDownload(id: string) {
  if (!supabase) return;
  try {
    await supabase.rpc("increment_download_count", { resource_id: String(id) });
  } catch (err) {
    // RPC 可能不存在，用读+写替代
    logNetworkFallback("incrementResourceDownload(rpc)", err);
    try {
      const { data } = await supabase.from("resources").select("download_count").eq("id", String(id)).single();
      const dlRow = data as any;
      if (dlRow) {
        await supabase.from("resources").update({ download_count: (dlRow.download_count || 0) + 1 }).eq("id", String(id));
      }
    } catch (err2) {
      logNetworkFallback("incrementResourceDownload(fallback)", err2);
    }
  }
}

// ---------- Supabase Storage 文件上传 ----------
export async function uploadResourceFile(file: File): Promise<{ url: string; size: string } | null> {
  if (!supabase) throw new Error("Supabase not configured");
  const ext = file.name.split(".").pop() || "pdf";
  const fileName = `resources/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("resources").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/pdf",
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("resources").getPublicUrl(fileName);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  return { url: urlData.publicUrl, size: `${sizeMB} MB` };
}

// ---------- Leads / 线索收集 ----------
export interface Lead {
  id: string;
  email: string;
  name?: string;
  source?: string;
  notes?: string;
  resourceId?: string;
  resourceTitle?: string;
  sourceArticleTitle?: string; // 线索溯源：该用户是在哪篇文章下留下的联系方式
  createdAt: string;
}

// Upsert 附加选项（用于评论区邮箱静默打靶）
export interface CreateLeadOptions {
  name?: string;          // 用户昵称
  source?: string;        // 线索来源（如「文章评论区」）
  notes?: string;         // 自动追加的评论摘要
  sourceArticleTitle?: string; // 线索溯源：评论所属文章标题
  client?: SupabaseClient; // 可选：传入 service_role 客户端绕过 RLS
}

export async function createLead(
  email: string,
  resourceId?: string,
  resourceTitle?: string,
  options?: CreateLeadOptions
): Promise<{ success: boolean; error?: string }> {
  const client = options?.client || supabase;
  if (!client) {
    // 未配置 Supabase 时静默成功（不影响用户主流程）
    return { success: false, error: "Supabase 未配置" };
  }
  try {
    // Upsert：以 email 为唯一键去重，存在则更新 name/notes/updated_at，不存在则插入
    // 优先尝试带 source_article_title 列写入；若表缺少该列则降级重试（兼容旧表结构）
    const baseRow: Record<string, any> = {
      id: genId(),
      email,
      name: options?.name || null,
      source: options?.source || null,
      notes: options?.notes || null,
      resource_id: resourceId || null,
      resource_title: resourceTitle || null,
      updated_at: new Date().toISOString(),
    };
    if (options?.sourceArticleTitle) {
      baseRow.source_article_title = options.sourceArticleTitle;
    }

    const { error } = await client
      .from("leads")
      .upsert([baseRow], { onConflict: "email", ignoreDuplicates: false });

    // 列缺失降级：移除 source_article_title 后重试
    if (error && /source_article_title/i.test(error.message || "")) {
      console.warn("[dataApi] createLead 缺少 source_article_title 列，降级重试");
      const { error: retryErr } = await client
        .from("leads")
        .upsert(
          [
            {
              id: genId(),
              email,
              name: options?.name || null,
              source: options?.source || null,
              notes: options?.notes || null,
              resource_id: resourceId || null,
              resource_title: resourceTitle || null,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "email", ignoreDuplicates: false }
        );
      if (retryErr) {
        console.warn("[dataApi] createLead upsert 降级失败:", retryErr.message);
        return { success: false, error: retryErr.message };
      }
      return { success: true };
    }
    if (error) {
      // RLS 阻止写入或缺少 email 唯一约束时，Supabase 返回 error
      console.warn("[dataApi] createLead upsert 失败:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    logNetworkFallback("createLead", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchLeads(): Promise<Lead[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      email: row.email || "",
      name: row.name || "",
      source: row.source || "",
      notes: row.notes || "",
      resourceId: row.resource_id || "",
      resourceTitle: row.resource_title || "",
      sourceArticleTitle: row.source_article_title || "",
      createdAt: row.created_at ? new Date(row.created_at).toLocaleString("zh-CN") : "",
    })) as Lead[];
  } catch (err) {
    logNetworkFallback("fetchLeads", err);
    return [];
  }
}

export async function deleteLead(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("leads").delete().eq("id", String(id));
  if (error) throw error;
}

// ---------- Insights Hub (情报站) CRUD ----------
export async function fetchInsightsHub(): Promise<InsightHubItem[]> {
  if (!supabase) return [];
  try {
    // 显式指定列名，避免 select("*") 触发 schema cache 报错
    const { data, error } = await supabase
      .from("insights_hub")
      .select("id,title,category,summary,source_name,original_url,published_at,is_published,is_featured,api_source,tags,created_at")
      .order("created_at", { ascending: false });

    // 若 schema 不匹配（如 tags/api_source 列缺失），降级为基础列查询
    if (error && (error.code === "PGRST204" || error.message.includes("schema cache") || error.message.includes("Could not find"))) {
      console.warn("[dataApi] insights_hub schema 不完整，降级到基础列查询:", error.message);
      const basic = await supabase
        .from("insights_hub")
        .select("id,title,category,summary,source_name,original_url,published_at,is_published,is_featured,created_at")
        .order("created_at", { ascending: false });
      if (basic.error || !basic.data) return [];
      return basic.data
        .filter((row: any) => row.is_published !== false)
        .map((row: any) => ({
          id: row.id,
          title: row.title || "",
          category: row.category || "⚡ AI技术/大厂策略",
          summary: row.summary || "",
          sourceName: row.source_name || "",
          originalUrl: row.original_url || "",
          publishedAt: row.published_at || "",
          isPublished: row.is_published ?? true,
          isFeatured: row.is_featured ?? false,
          apiSource: "manual",
          tags: [],
        })) as InsightHubItem[];
    }

    if (error) {
      console.warn("[dataApi] fetchInsightsHub 查询出错:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];
    return data
      .filter((row: any) => row.is_published !== false) // 前台只展示已发布内容
      .map((row: any) => ({
        id: row.id,
        title: row.title || "",
        category: row.category || "⚡ AI技术/大厂策略",
        summary: row.summary || "",
        sourceName: row.source_name || "",
        originalUrl: row.original_url || "",
        publishedAt: row.published_at || "",
        isPublished: row.is_published ?? true,
        isFeatured: row.is_featured ?? false,
        apiSource: row.api_source || "manual",
        tags: row.tags ? (typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags) : [],
      })) as InsightHubItem[];
  } catch (err) {
    logNetworkFallback("fetchInsightsHub", err);
    return [];
  }
}

const DATAAPI_MISSING_COLS_CACHE = new Set<string>();
const DATAAPI_HUB_KNOWN_COLS = [
  "id", "title", "category", "summary", "source_name", "original_url",
  "published_at", "is_published", "is_featured", "api_source", "tags",
];

export async function createInsightHub(item: Partial<InsightHubItem>) {
  if (!supabase) throw new Error("Supabase not configured");

  const id = genId();
  const MAX_TRIES = DATAAPI_HUB_KNOWN_COLS.length + 1;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const payload: Record<string, any> = { id };
    const maybeAdd = (col: string, value: any) => {
      if (value === undefined || value === null) return;
      if (DATAAPI_MISSING_COLS_CACHE.has(col)) return;
      payload[col] = value;
    };
    maybeAdd("title", item.title);
    maybeAdd("category", item.category);
    maybeAdd("summary", item.summary);
    maybeAdd("source_name", item.sourceName);
    maybeAdd("original_url", item.originalUrl);
    maybeAdd("published_at", item.publishedAt);
    maybeAdd("is_published", item.isPublished ?? true);
    maybeAdd("is_featured", item.isFeatured ?? false);
    maybeAdd("api_source", item.apiSource || "manual");
    maybeAdd("tags", item.tags || []);

    const { data, error } = await supabase
      .from("insights_hub")
      .insert([payload])
      .select();

    if (!error) return data;

    // 检测缺列错误 → 加入黑名单后重试
    const m1 = error.message?.match(/find the '([^']+)' column/);
    const m2 = error.message?.match(/column "([^"]+)" of relation/);
    const missing = (m1?.[1] || m2?.[1]) as string | undefined;
    if (missing && DATAAPI_HUB_KNOWN_COLS.includes(missing) && !DATAAPI_MISSING_COLS_CACHE.has(missing)) {
      DATAAPI_MISSING_COLS_CACHE.add(missing);
      console.warn(`[dataApi/createInsightHub] 列"${missing}"缺失，移除后重试`);
      continue;
    }
    throw error;
  }
  throw new Error("createInsightHub 超过最大重试次数：请补全 insights_hub 表列（ALTER TABLE）");
}

// ---------- 服务端专用：API 自动化写入（使用 service_role key） ----------
export async function createInsightHubViaAPI(item: {
  title: string;
  category: string;
  summary: string;
  source_name: string;
  original_url: string;
  tags?: string[];
}, serviceRoleKey?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Supabase service role not configured" };
  }

  // 允许的分类白名单
  const ALLOWED_CATEGORIES = [
    "🤖 机器人/具身智能",
    "⚡ AI技术/大厂策略",
    "📈 品牌策略/GTM干货",
  ];
  if (!ALLOWED_CATEGORIES.includes(item.category)) {
    return { success: false, error: `分类不合法，仅允许：${ALLOWED_CATEGORIES.join(" / ")}` };
  }

  // 品牌策略分类的内容过滤：严禁跨境电商类泛资讯
  if (item.category === "📈 品牌策略/GTM干货") {
    const blockedKeywords = ["跨境电商", "Shopee", "Shopee", "拉美", "东南亚电商", "代购", "铺货"];
    const text = `${item.title} ${item.summary} ${item.source_name}`;
    for (const kw of blockedKeywords) {
      if (text.includes(kw)) {
        return { success: false, error: `品牌策略分类禁止跨境电商类泛资讯（检测到关键词：${kw}）` };
      }
    }
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const serverClient = createClient(supabaseUrl, supabaseServiceKey);
    const id = genId();
    const { error } = await serverClient.from("insights_hub").insert([
      {
        id,
        title: item.title,
        category: item.category,
        summary: item.summary,
        source_name: item.source_name,
        original_url: item.original_url,
        published_at: new Date().toLocaleDateString("zh-CN").replace(/\//g, "."),
        is_published: true,
        is_featured: false,
        api_source: "auto_bot",
        tags: item.tags || [],
      },
    ]);
    if (error) return { success: false, error: error.message };
    return { success: true, id };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function deleteInsightHub(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("insights_hub").delete().eq("id", String(id));
  if (error) throw error;
}

export async function toggleInsightHubPublish(id: string, isPublished: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("insights_hub")
    .update({ is_published: isPublished })
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- 切换置顶状态 ----------
export async function toggleInsightHubFeature(id: string, isFeatured: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("insights_hub")
    .update({ is_featured: isFeatured })
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- 编辑情报站内容 ----------
export async function updateInsightHub(id: string, updates: Partial<InsightHubItem>) {
  if (!supabase) throw new Error("Supabase not configured");
  const updateData: Record<string, any> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.sourceName !== undefined) updateData.source_name = updates.sourceName;
  if (updates.originalUrl !== undefined) updateData.original_url = updates.originalUrl;
  if (updates.publishedAt !== undefined) updateData.published_at = updates.publishedAt;
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;
  if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from("insights_hub")
    .update(updateData)
    .eq("id", String(id))
    .select();
  if (error) throw error;
  return data;
}

// ---------- 编辑资源包 ----------
export async function updateResource(id: string, updates: Partial<ResourceItem>) {
  if (!supabase) throw new Error("Supabase not configured");
  const updateData: Record<string, any> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
  if (updates.outline !== undefined) updateData.outline = updates.outline;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.requireLogin !== undefined) updateData.require_login = updates.requireLogin;
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;
  if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl;
  if (updates.fileSize !== undefined) updateData.file_size = updates.fileSize;

  const { data, error } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", String(id))
    .select();
  if (error) throw error;
  return data;
}

// ---------- Asylum Stats（庇护所统计：全网累计上香次数）----------
export interface AsylumStats {
  incenseCount: number;
}

const ASYLUM_STATS_ROW_ID = "main";

export async function fetchAsylumStats(): Promise<AsylumStats> {
  const fallback: AsylumStats = { incenseCount: 0 };
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from("asylum_stats")
      .select("incense_count")
      .eq("id", ASYLUM_STATS_ROW_ID)
      .single();
    if (error) {
      // 表不存在 / 行不存在 → 返回 0
      if (
        error.code === "PGRST116" || // 0 rows returned
        error.message?.includes("does not exist") ||
        error.message?.includes("relation") ||
        error.code === "42P01"
      ) {
        return fallback;
      }
      console.warn("[dataApi] fetchAsylumStats 异常:", error.message);
      return fallback;
    }
    const row = data as { incense_count?: unknown };
    return {
      incenseCount: typeof row.incense_count === "number" ? row.incense_count : 0,
    };
  } catch (err) {
    logNetworkFallback("fetchAsylumStats", err);
    return fallback;
  }
}

/**
 * 上香次数原子递增（客户端调用 → 转发到服务端 API Route）
 * 服务端使用 service_role key 执行 UPDATE asylum_stats SET incense_count = incense_count + 1 RETURNING incense_count
 * 保证并发安全；若服务端失败则返回 null，前端降级为纯内存临时计数。
 * @param incenseId 可选，单柱持久化（sanctuary_incense 表）
 */
export async function incrementIncense(incenseId?: string): Promise<number | null> {
  try {
    const res = await fetch("/api/asylum/incense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incenseId ? { incense_id: incenseId } : {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    if (json && typeof json.incenseCount === "number") {
      return json.incenseCount;
    }
    return null;
  } catch (err) {
    logNetworkFallback("incrementIncense", err);
    throw err;
  }
}

/**
 * 批量读取所有香柱的累计 count（供前端初始化覆盖初始基数）
 * 表不存在时返回空对象，前端沿用 siteData 初始基数
 */
export async function fetchIncensePillars(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/asylum/incense", { method: "GET" });
    if (!res.ok) return {};
    const json = await res.json();
    if (!json || !Array.isArray(json.pillars)) return {};
    const map: Record<string, number> = {};
    for (const p of json.pillars) {
      if (p && typeof p.incenseId === "string" && typeof p.count === "number") {
        map[p.incenseId] = p.count;
      }
    }
    return map;
  } catch (err) {
    logNetworkFallback("fetchIncensePillars", err);
    return {};
  }
}

/**
 * 脑洞注入能量持久化（sanctuary_posts.likes 原子递增）
 * 服务端使用 service_role key，失败返回 null，前端降级为纯内存计数
 */
export async function incrementIdeaEnergy(ideaId: string | number): Promise<number | null> {
  try {
    const res = await fetch("/api/sanctuary/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea_id: String(ideaId) }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    if (json && typeof json.energy === "number") {
      return json.energy;
    }
    return null;
  } catch (err) {
    logNetworkFallback("incrementIdeaEnergy", err);
    throw err;
  }
}

/**
 * 读取单篇文章最新 likes（供弹窗打开时拉取真实数值，避免刷新归零）
 * 失败返回 null，前端降级使用列表中的缓存值
 */
export async function fetchInsightLikes(insightId: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/insights/like?insight_id=${encodeURIComponent(insightId)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json.likes === "number") return json.likes;
    return null;
  } catch (err) {
    logNetworkFallback("fetchInsightLikes", err);
    return null;
  }
}

/**
 * 文章【激发灵感】持久化（insights.likes 原子递增）
 * 服务端使用 service_role key，失败返回 null，前端降级为纯内存计数
 */
export async function incrementInsightLikes(insightId: string): Promise<number | null> {
  try {
    const res = await fetch("/api/insights/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insight_id: insightId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    if (json && typeof json.likes === "number") {
      return json.likes;
    }
    return null;
  } catch (err) {
    logNetworkFallback("incrementInsightLikes", err);
    throw err;
  }
}
