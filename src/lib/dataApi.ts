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
  type MalaysiaIntelligence,
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
  // 标签：兼容 jsonb 数组 / 逗号分隔字符串 / 旧数据无 tags 列
  let tags: string[] = [];
  if (row.tags) {
    if (typeof row.tags === "string") {
      try {
        const parsed = JSON.parse(row.tags);
        tags = Array.isArray(parsed) ? parsed : row.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
      } catch {
        tags = row.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(row.tags)) {
      tags = row.tags;
    }
  }
  // 实证图集：兼容 jsonb 数组 / 旧数据无 gallery 列
  let gallery: { url: string; caption?: string }[] | undefined = undefined;
  if (row.gallery) {
    if (Array.isArray(row.gallery)) {
      gallery = row.gallery.filter((g: any) => g && g.url);
    } else if (typeof row.gallery === "string") {
      try {
        const parsed = JSON.parse(row.gallery);
        if (Array.isArray(parsed)) gallery = parsed.filter((g: any) => g && g.url);
      } catch { /* 忽略损坏的 JSON */ }
    }
  }
  // 破局战术：兼容旧字段名 strategy 与新字段名 solutions
  const rawSolutions = row.solutions || row.strategy || [];
  const solutions: { title: string; detail: string; imageUrl?: string }[] = Array.isArray(rawSolutions)
    ? rawSolutions.map((s: any) => ({
        title: s.title || s.detail_title || "",
        detail: s.detail || s.description || s.detail_text || "",
        imageUrl: s.imageUrl || s.image_url || undefined,
      }))
    : [];
  return {
    id: row.id,
    title: row.title || "",
    subTitle: row.sub_title || row.subtitle || "",
    image: row.image_url || row.cover_image || row.image || "",
    date: row.date || row.execution_time || "",
    role: row.role || "",
    metrics: row.metrics || [],
    tags,
    tab,
    category: cat,
    challenge: row.challenge || "",
    solutions,
    gallery,
    demoUrl: row.demo_url || undefined,
    ctaText: row.cta_text || undefined,
    ctaLink: row.cta_link || undefined,
    // 商业交付指标（兼容旧数据：字段缺失时降级为空）
    clientIndustry: row.client_industry || undefined,
    malaysiaChannels: row.malaysia_channels || undefined,
    halalCertificationCycle: row.halal_certification_cycle || undefined,
    deliverables: row.deliverables || undefined,
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
    image: row.cover_url || "",
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
      console.error("[dataApi] ❌ fetchSanctuaryPosts 查询出错:", error.code, error.message, error.details);
      return [];
    }
    if (!data || data.length === 0) return [];

    // sanctuary_posts 表无 is_published 列，全部展示
    const allRows = data;
    const topLevel = allRows.filter((row: any) => !row.parent_id);
    const replies = allRows.filter((row: any) => !!row.parent_id);

    return topLevel.map((row: any) => {
      // 将回复挂载到对应主帖的 comments 数组
      const postReplies = replies
        .filter((r: any) => r.parent_id === row.id)
        .map((r: any) => ({
          author: r.author || "出海玩家",
          text: r.content || "",
          time: r.created_at ? new Date(r.created_at).toLocaleString("zh-CN") : "",
        }));
      return {
        id: String(row.id),
        content: row.content || "",
        tag: row.tag || "",
        tagColor: "text-zinc-400 bg-zinc-800",
        author: row.author || "出海玩家",
        time: row.created_at ? new Date(row.created_at).toLocaleString("zh-CN") : "",
        likes: row.likes || 0,
        reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
        comments: postReplies,
      } as SanctuaryPost;
    });
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
  parentId?: string;
}): Promise<(SanctuaryPost & { deleteToken?: string }) | null> {
  const res = await fetch("/api/sanctuary/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: post.content,
      tag: post.tag,
      author: post.author,
      avatar: post.avatar,
      parent_id: post.parentId,
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
    author: row.author || "出海玩家",
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

// ---------- 删除：深度洞察 ----------
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
      image: row.cover_url || "",
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
        date: (project.date && String(project.date).trim()) ? project.date : null,
        metrics: project.metrics || [],
        tags: project.tags || [],
        challenge: project.challenge,
        // DB 列名为 strategy，但兼容新列 solutions；优先写 strategy
        strategy: project.solutions || [],
        gallery: project.gallery || [],
        image_url: project.image,
        cta_text: project.ctaText || null,
        cta_link: project.ctaLink || null,
        // 商业交付指标
        client_industry: project.clientIndustry || null,
        malaysia_channels: project.malaysiaChannels || null,
        halal_certification_cycle: project.halalCertificationCycle || null,
        deliverables: project.deliverables || null,
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
  if (project.date !== undefined) updateData.date = (project.date && String(project.date).trim()) ? project.date : null;
  if (project.image !== undefined) updateData.image_url = project.image;
  if (project.challenge !== undefined) updateData.challenge = project.challenge;
  if (project.metrics !== undefined) updateData.metrics = project.metrics;
  if (project.tags !== undefined) updateData.tags = project.tags;
  if (project.solutions !== undefined) {
    // 同步写入 strategy 与 solutions 两列，兼容新旧 schema
    updateData.strategy = project.solutions;
    updateData.solutions = project.solutions;
  }
  if (project.gallery !== undefined) updateData.gallery = project.gallery;
  if (project.ctaText !== undefined) updateData.cta_text = project.ctaText;
  if (project.ctaLink !== undefined) updateData.cta_link = project.ctaLink;
  // 商业交付指标
  if (project.clientIndustry !== undefined) updateData.client_industry = project.clientIndustry;
  if (project.malaysiaChannels !== undefined) updateData.malaysia_channels = project.malaysiaChannels;
  if (project.halalCertificationCycle !== undefined) updateData.halal_certification_cycle = project.halalCertificationCycle;
  if (project.deliverables !== undefined) updateData.deliverables = project.deliverables;

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

// ---------- 写入：创建深度洞察 ----------
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
        date: (insight.date && String(insight.date).trim()) ? insight.date : null,
        author: insight.author,
        content: insight.content
          ? serializeContent(insight.content as ContentBlock[])
          : "",
        audio_url: insight.listenTime ? insight.listenTime : null,
        cover_url: insight.image || null,
        is_published: true,
      },
    ])
    .select();
  if (error) throw error;
  return data;
}

// ---------- 更新深度洞察 ----------
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
    coverUrl: string;
  }>
) {
  if (!supabase) throw new Error("Supabase not configured");
  const payload: Record<string, any> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.excerpt !== undefined) payload.summary = patch.excerpt;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.tags !== undefined) payload.tags = JSON.stringify(patch.tags || []);
  if (patch.readTime !== undefined) payload.read_time = patch.readTime;
  if (patch.date !== undefined) payload.date = (patch.date && String(patch.date).trim()) ? patch.date : null;
  if (patch.author !== undefined) payload.author = patch.author;
  if (patch.content !== undefined) payload.content = serializeContent(patch.content);
  if (patch.listenTime !== undefined) payload.audio_url = patch.listenTime;
  if (patch.coverUrl !== undefined) payload.cover_url = patch.coverUrl || null;
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
        coverUrl: row.cover_url || "",
        category: row.category || "指南",
        requireLogin: row.require_login ?? false,
        isPublished: true,
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
        cover_url: resource.coverUrl || null,
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

// ---------- Supabase Storage 封面图上传（insights & resources 共用 bucket） ----------
export async function uploadCoverImage(file: File): Promise<{ url: string } | null> {
  if (!supabase) throw new Error("Supabase not configured");
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("portfolio-covers").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("portfolio-covers").getPublicUrl(fileName);
  return { url: urlData.publicUrl };
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

// ---------- Insights Hub (东南亚实局) CRUD ----------
// 统一操作 malaysia_intelligence 表（后台手动发布 + AI 抓取 + 前台瀑布流三方共表）
export async function fetchInsightsHub(): Promise<InsightHubItem[]> {
  if (!supabase) return [];
  try {
    // 显式指定列名，避免 select("*") 触发 schema cache 报错
    // 7天TTL + 单次最多20条，防止无限制全量加载
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data, error } = await supabase
      .from("malaysia_intelligence")
      .select("id,title_zh,title_en,title,category,summary_zh,source_name,source_url,published_at,is_published,is_featured,tags,created_at")
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .range(0, 19);

    // 若 schema 不匹配（如 tags 列缺失），降级为基础列查询
    if (error && (error.code === "PGRST204" || error.message.includes("schema cache") || error.message.includes("Could not find"))) {
      console.warn("[dataApi] malaysia_intelligence schema 不完整，降级到基础列查询:", error.message);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const basic = await supabase
        .from("malaysia_intelligence")
        .select("id,title_zh,title_en,title,category,summary_zh,source_name,source_url,published_at,is_published,is_featured,created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .range(0, 19);
      if (basic.error || !basic.data) return [];
      return basic.data
        .filter((row: any) => row.is_published !== false)
        .map((row: any) => ({
          id: row.id,
          title: row.title_zh || row.title_en || row.title || "",
          category: row.category || "🎯 深度洞察",
          summary: row.summary_zh || "",
          sourceName: row.source_name || "",
          originalUrl: row.source_url || "",
          publishedAt: row.published_at || "",
          isPublished: true,
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
        title: row.title_zh || row.title_en || row.title || "",
        category: row.category || "🎯 深度洞察",
        summary: row.summary_zh || "",
        sourceName: row.source_name || "",
        originalUrl: row.source_url || "",
        publishedAt: row.published_at || "",
        isPublished: true,
        isFeatured: row.is_featured ?? false,
        apiSource: "manual",
        tags: row.tags ? (typeof row.tags === "string" ? safeParseTags(row.tags) : row.tags) : [],
      })) as InsightHubItem[];
  } catch (err) {
    logNetworkFallback("fetchInsightsHub", err);
    return [];
  }
}

// ---------- Malaysia Intelligence（马来西亚商业情报）CRUD ----------
// 表：malaysia_intelligence
// 字段：id, title_en, title_zh, source_name, source_url, summary_zh, key_takeaway, published_at, created_at, is_published, is_featured

/**
 * 拉取最新 N 条马来西亚商业情报（按 published_at DESC）
 * 兼容表不存在/列缺失：返回空数组，前端展示空状态
 */
// 安全解析 tags（兼容 jsonb 数组 / 逗号分隔字符串）
function safeParseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((t: any) => String(t || "").trim()).filter(Boolean);
  } catch { /* 非数组 JSON，按逗号分隔 */ }
  return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export async function fetchMalaysiaIntelligence(limit = 12): Promise<MalaysiaIntelligence[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("malaysia_intelligence")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      // 表不存在或列缺失时静默降级
      console.warn("[dataApi] fetchMalaysiaIntelligence 查询失败（表可能尚未创建）:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.id,
      titleEn: row.title_en || "",
      titleZh: row.title_zh || row.title_en || "",
      sourceName: row.source_name || "",
      sourceUrl: row.source_url || "",
      summaryZh: row.summary_zh || "",
      keyTakeaway: row.key_takeaway || "",
      publishedAt: row.published_at || row.created_at || "",
      createdAt: row.created_at || "",
      isPublished: row.is_published !== false,
      isFeatured: row.is_featured ?? false,
      category: row.category || "政策/贸易",
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === "string" ? safeParseTags(row.tags) : []),
      importanceScore: typeof row.importance_score === "number" ? row.importance_score : 3,
    })) as MalaysiaIntelligence[];
  } catch (err) {
    logNetworkFallback("fetchMalaysiaIntelligence", err);
    return [];
  }
}

/**
 * 创建马来西亚商业情报记录
 * id 为 UUID 类型，由 DB 用 gen_random_uuid() 自动生成（前端不传 id，避免 22P02 错误）
 * 列缺失时自动降级（逐列移除重试）
 */
export async function createMalaysiaIntelligence(item: Partial<MalaysiaIntelligence>) {
  if (!supabase) throw new Error("Supabase not configured");

  const payload: Record<string, any> = {
    // 不传 id：让 DB 的 gen_random_uuid() 自动生成
    title_en: item.titleEn || item.titleZh || "",
    title_zh: item.titleZh || item.titleEn || "",
    title: item.titleZh || item.titleEn || "",
    source_name: item.sourceName || "",
    source_url: item.sourceUrl || "",
    category: item.category || "政策/贸易",
    summary_zh: item.summaryZh || "",
    key_takeaway: item.keyTakeaway || "",
    // 空日期转 null，避免空字符串写 TIMESTAMPTZ 列报错
    published_at: item.publishedAt && String(item.publishedAt).trim() ? item.publishedAt : new Date().toISOString(),
    is_published: item.isPublished ?? true,
    is_featured: item.isFeatured ?? false,
    tags: Array.isArray(item.tags) ? item.tags : [],
    importance_score: typeof item.importanceScore === "number" ? item.importanceScore : 3,
  };

  const { data, error } = await supabase
    .from("malaysia_intelligence")
    .insert([payload])
    .select();

  if (error) throw error;
  return data;
}

const DATAAPI_MISSING_COLS_CACHE = new Set<string>();
// malaysia_intelligence 表已知列（用于缺列降级重试）
const DATAAPI_HUB_KNOWN_COLS = [
  "title_zh", "title_en", "title", "category", "summary_zh", "source_name", "source_url",
  "published_at", "is_published", "is_featured", "tags", "importance_score", "key_takeaway",
];

export async function createInsightHub(item: Partial<InsightHubItem>) {
  if (!supabase) throw new Error("Supabase not configured");

  // 统一写入 malaysia_intelligence 表（前台瀑布流读取同表，打通前后台数据）
  // id 为 UUID，由 DB 用 gen_random_uuid() 自动生成，前端不传 id
  const MAX_TRIES = DATAAPI_HUB_KNOWN_COLS.length + 1;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const payload: Record<string, any> = {};
    const maybeAdd = (col: string, value: any) => {
      if (value === undefined || value === null) return;
      if (DATAAPI_MISSING_COLS_CACHE.has(col)) return;
      payload[col] = value;
    };
    // 字段映射：InsightHubItem → malaysia_intelligence
    maybeAdd("title_zh", item.title || "");
    maybeAdd("title_en", item.title || "");
    maybeAdd("title", item.title || "");
    maybeAdd("category", item.category || "🎯 深度洞察");
    maybeAdd("summary_zh", item.summary || "");
    maybeAdd("source_name", item.sourceName || "");
    maybeAdd("source_url", item.originalUrl || "");
    // 空日期转 ISO，避免空字符串写 TIMESTAMPTZ 列报错
    maybeAdd("published_at", (item.publishedAt && String(item.publishedAt).trim()) ? item.publishedAt : new Date().toISOString());
    maybeAdd("is_published", item.isPublished ?? true);
    maybeAdd("is_featured", item.isFeatured ?? false);
    maybeAdd("tags", Array.isArray(item.tags) ? item.tags : []);
    maybeAdd("importance_score", 3);

    const { data, error } = await supabase
      .from("malaysia_intelligence")
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
  throw new Error("createInsightHub 超过最大重试次数：请补全 malaysia_intelligence 表列（ALTER TABLE）");
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
    "🌏 东南亚实局",
    "🤖 AI 营销杠杆",
    "🎯 深度洞察",
    "📦 战术拆解",
  ];
  if (!ALLOWED_CATEGORIES.includes(item.category)) {
    return { success: false, error: `分类不合法，仅允许：${ALLOWED_CATEGORIES.join(" / ")}` };
  }

  // 品牌策略分类的内容过滤：严禁跨境电商类泛资讯
  if (item.category === "📦 战术拆解") {
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
    // 统一写入 malaysia_intelligence 表，不传 id（DB 用 gen_random_uuid() 自动生成）
    // published_at 使用 ISO 8601 格式，避免空字符串/非标准日期写 TIMESTAMPTZ 列报错
    const insertPayload: Record<string, any> = {
      title_zh: item.title,
      title_en: item.title,
      title: item.title,
      category: item.category,
      summary_zh: item.summary,
      source_name: item.source_name,
      source_url: item.original_url,
      published_at: new Date().toISOString(),
      is_published: true,
      is_featured: false,
      tags: item.tags || [],
      importance_score: 3,
    };
    const { data, error } = await serverClient
      .from("malaysia_intelligence")
      .insert([insertPayload])
      .select("id");
    if (error) return { success: false, error: error.message };
    const newId = data && data[0] ? data[0].id : undefined;
    return { success: true, id: newId };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function deleteInsightHub(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("malaysia_intelligence").delete().eq("id", String(id));
  if (error) throw error;
}

export async function toggleInsightHubPublish(id: string, isPublished: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("malaysia_intelligence")
    .update({ is_published: isPublished })
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- 切换置顶状态 ----------
export async function toggleInsightHubFeature(id: string, isFeatured: boolean) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("malaysia_intelligence")
    .update({ is_featured: isFeatured })
    .eq("id", String(id));
  if (error) throw error;
}

// ---------- 编辑东南亚实局内容 ----------
export async function updateInsightHub(id: string, updates: Partial<InsightHubItem>) {
  if (!supabase) throw new Error("Supabase not configured");
  const updateData: Record<string, any> = {};
  // 字段映射：InsightHubItem → malaysia_intelligence
  if (updates.title !== undefined) {
    updateData.title_zh = updates.title;
    updateData.title_en = updates.title;
    updateData.title = updates.title;
  }
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.summary !== undefined) updateData.summary_zh = updates.summary;
  if (updates.sourceName !== undefined) updateData.source_name = updates.sourceName;
  if (updates.originalUrl !== undefined) updateData.source_url = updates.originalUrl;
  if (updates.publishedAt !== undefined) {
    // 空日期转 null，避免空字符串写 TIMESTAMPTZ 列报错
    updateData.published_at = (updates.publishedAt && String(updates.publishedAt).trim()) ? updates.publishedAt : null;
  }
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;
  if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from("malaysia_intelligence")
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
  if (updates.coverUrl !== undefined) updateData.cover_url = updates.coverUrl || null;

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
    // 优先：从 incense_stats 表汇总所有香柱的 count 总和
    const { data: statsData, error: statsErr } = await supabase
      .from("incense_stats")
      .select("count");
    if (!statsErr && statsData && statsData.length > 0) {
      const total = statsData.reduce((sum: number, row: any) => sum + Number(row.count || 0), 0);
      return { incenseCount: total };
    }
    if (statsErr && !statsErr.message?.includes("does not exist") && !statsErr.message?.includes("relation")) {
      console.error("[dataApi] ❌ fetchAsylumStats incense_stats 查询出错:", statsErr.code, statsErr.message);
    }
    // 降级：读 asylum_stats 表（旧表）
    const { data, error } = await supabase
      .from("asylum_stats")
      .select("incense_count")
      .eq("id", ASYLUM_STATS_ROW_ID)
      .single();
    if (error) {
      if (
        error.code === "PGRST116" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation") ||
        error.code === "42P01"
      ) {
        return fallback;
      }
      console.error("[dataApi] ❌ fetchAsylumStats asylum_stats 异常:", error.code, error.message);
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
  // 优先直接调用 Supabase RPC（SECURITY DEFINER 绕过 RLS，并发安全原子递增）
  // increment_incense 可能返回 VOID（旧版）或 INT8（修复后），两种都兼容
  if (supabase && incenseId) {
    try {
      const { data, error } = await (supabase as any).rpc("increment_incense", {
        incense_id: incenseId,
      });
      if (error) {
        console.error("[dataApi] ❌ increment_incense RPC 错误:", error.code, error.message);
      }
      if (!error && data != null && data !== "") {
        // INT8 可能以 string 或 number 形式返回
        return Number(data);
      }
      // RPC 返回 VOID（无返回值）→ 立即查询 incense_stats 获取最新 count
      if (!error) {
        const { data: statsRow, error: statsErr } = await supabase
          .from("incense_stats")
          .select("count")
          .eq("id", incenseId)
          .single();
        if (!statsErr && statsRow) {
          return Number(statsRow.count || 0);
        }
      }
    } catch (rpcErr) {
      console.error("[dataApi] ❌ incrementIncense RPC 异常:", rpcErr instanceof Error ? rpcErr.message : rpcErr);
      // 降级到 API 代理
    }
  }
  // 降级：通过服务端 API 代理（service_role key）
  try {
    const res = await fetch("/api/asylum/incense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incenseId ? { incense_id: incenseId } : {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[dataApi] ❌ incrementIncense API 失败:", `HTTP ${res.status}`, text);
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    if (json && typeof json.incenseCount === "number") {
      return json.incenseCount;
    }
    return null;
  } catch (err) {
    console.error("[dataApi] ❌ incrementIncense 全部失败:", err instanceof Error ? err.message : err);
    throw err;
  }
}

/**
 * 批量读取所有香柱的累计 count（供前端初始化覆盖初始基数）
 * 表不存在时返回空对象，前端沿用 siteData 初始基数
 */
export async function fetchIncensePillars(): Promise<Record<string, number>> {
  // 优先：客户端直连 incense_stats 表读取（RLS 允许匿名 SELECT）
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("incense_stats")
        .select("id, count");
      if (error) {
        console.error("[dataApi] ❌ fetchIncensePillars incense_stats 错误:", error.code, error.message);
      }
      if (!error && data && data.length > 0) {
        const map: Record<string, number> = {};
        for (const row of data as any[]) {
          if (row && typeof row.id === "string") {
            map[row.id] = Number(row.count || 0);
          }
        }
        return map;
      }
    } catch (err) {
      console.error("[dataApi] ❌ fetchIncensePillars 直连异常:", err instanceof Error ? err.message : err);
    }
  }
  // 降级：通过 API 代理读取 sanctuary_incense 表
  try {
    const res = await fetch("/api/asylum/incense", { method: "GET" });
    if (!res.ok) {
      console.error("[dataApi] ❌ fetchIncensePillars API 失败:", `HTTP ${res.status}`);
      return {};
    }
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
    console.error("[dataApi] ❌ fetchIncensePillars 全部失败:", err instanceof Error ? err.message : err);
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
