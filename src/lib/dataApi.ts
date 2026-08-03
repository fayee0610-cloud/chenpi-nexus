// ============================================================
// 数据获取工具：优先从 Supabase 读取，失败/未配置时降级到 siteData
// 适配新表结构：projects(sub_title, strategy) / insights(summary, content TEXT, audio_url) / sanctuary_posts(简化)
// ============================================================

import { supabase } from "./supabase";
import {
  siteData,
  type PortfolioProject,
  type InsightItem,
  type SanctuaryPost,
  type ContentBlock,
  type ResourceItem,
} from "@/data/siteData";

// 生成 TEXT 主键
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
export async function fetchProjects(): Promise<PortfolioProject[]> {
  if (!supabase) return siteData.portfolio.projects;

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return siteData.portfolio.projects;
    }

    return data.map((row: any) => {
      // 根据 category 推断 tab
      const cat = row.category || "";
      let tab: "brand" | "ai" | "experiment" = "brand";
      if (cat.includes("AI") || cat.includes("硬件")) tab = "ai";
      else if (cat.includes("创意") || cat.includes("实验")) tab = "experiment";

      return {
        id: row.id,
        title: row.title || "",
        subTitle: row.sub_title || "",
        image: row.image_url || "",
        date: row.date || "",
        role: row.role || "",
        metrics: row.metrics || [],
        tags: [], // 新表无 tags 列，使用空数组
        tab,
        category: row.category || "",
        challenge: row.challenge || "",
        solutions: row.strategy || [], // DB 列名为 strategy，映射为 solutions
        demoUrl: row.demo_url || undefined,
      } as PortfolioProject;
    });
  } catch {
    return siteData.portfolio.projects;
  }
}

// ---------- Insights ----------
export async function fetchInsights(): Promise<InsightItem[]> {
  if (!supabase) return siteData.insights;

  try {
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return siteData.insights;
    }

    return data.map((row: any) => {
      const cat = row.category || "";
      let type: "article" | "short" | "podcast" = "article";
      if (cat.includes("短观点")) type = "short";
      else if (cat.includes("音频") || cat.includes("播客") || row.audio_url) type = "podcast";

      return {
        id: row.id,
        title: row.title || "",
        excerpt: row.summary || "", // DB 列名为 summary，映射为 excerpt
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
    });
  } catch {
    return siteData.insights;
  }
}

// ---------- Sanctuary Posts ----------
export async function fetchSanctuaryPosts(): Promise<SanctuaryPost[]> {
  if (!supabase) return siteData.sanctuary.initialPosts;

  try {
    const { data, error } = await supabase
      .from("sanctuary_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return siteData.sanctuary.initialPosts;
    }

    return data.map((row: any) => ({
      id: row.id,
      content: row.content || "",
      tag: row.tag || "",
      tagColor: "text-zinc-400 bg-zinc-800",
      author: row.author || "匿名",
      time: row.created_at ? new Date(row.created_at).toLocaleString("zh-CN") : "",
      likes: row.likes || 0,
      reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
      comments: [],
    })) as SanctuaryPost[];
  } catch {
    return siteData.sanctuary.initialPosts;
  }
}

export async function deleteSanctuaryPost(id: string | number) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("sanctuary_posts").delete().eq("id", String(id));
  if (error) throw error;
}

// ---------- 写入：创建庇护所帖子 ----------
export async function createSanctuaryPost(post: {
  content: string;
  tag?: string;
  author?: string;
  avatar?: string;
}): Promise<SanctuaryPost | null> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("sanctuary_posts")
    .insert([
      {
        id: genId(),
        content: post.content,
        tag: post.tag || null,
        author: post.author || "匿名创作者",
        avatar: post.avatar || null,
        likes: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    content: data.content || "",
    tag: data.tag || "",
    tagColor: "text-zinc-400 bg-zinc-800",
    author: data.author || "匿名",
    time: data.created_at ? new Date(data.created_at).toLocaleString("zh-CN") : "刚刚",
    likes: data.likes || 0,
    reactions: { cool: 0, biz: 0, hard: 0, fake: 0 },
    comments: [],
    isNew: true,
  } as SanctuaryPost;
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
  if (!supabase) {
    return siteData.portfolio.projects.find((p) => String(p.id) === id) || null;
  }
  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error || !data) {
      return siteData.portfolio.projects.find((p) => String(p.id) === id) || null;
    }
    const cat = data.category || "";
    let tab: "brand" | "ai" | "experiment" = "brand";
    if (cat.includes("AI") || cat.includes("硬件")) tab = "ai";
    else if (cat.includes("创意") || cat.includes("实验")) tab = "experiment";
    return {
      id: data.id,
      title: data.title || "",
      subTitle: data.sub_title || "",
      image: data.image_url || "",
      date: data.date || "",
      role: data.role || "",
      metrics: data.metrics || [],
      tags: [],
      tab,
      category: data.category || "",
      challenge: data.challenge || "",
      solutions: data.strategy || [],
      demoUrl: data.demo_url || undefined,
    } as PortfolioProject;
  } catch {
    return siteData.portfolio.projects.find((p) => String(p.id) === id) || null;
  }
}

// ---------- 单条查询：文章 ----------
export async function fetchInsightById(id: string): Promise<InsightItem | null> {
  if (!supabase) {
    return siteData.insights.find((i) => String(i.id) === id) || null;
  }
  try {
    const { data, error } = await supabase.from("insights").select("*").eq("id", id).single();
    if (error || !data) {
      return siteData.insights.find((i) => String(i.id) === id) || null;
    }
    const cat = data.category || "";
    let type: "article" | "short" | "podcast" = "article";
    if (cat.includes("短观点")) type = "short";
    else if (cat.includes("音频") || cat.includes("播客") || data.audio_url) type = "podcast";
    return {
      id: data.id,
      title: data.title || "",
      excerpt: data.summary || "",
      image: "",
      type,
      category: data.category || "",
      readTime: data.read_time || undefined,
      listenTime: data.audio_url ? "15 min" : undefined,
      isFeatured: false,
      date: data.date || "",
      author: data.author || "",
      views: "0",
      likes: 0,
      content: parseContent(data.content || ""),
    } as InsightItem;
  } catch {
    return siteData.insights.find((i) => String(i.id) === id) || null;
  }
}

// ---------- 站点配置 (Feature Flags) ----------
export interface SiteConfig {
  show_portfolio: boolean;
  show_insights: boolean;
  show_chenpi_ai: boolean;
  show_sanctuary: boolean;
  show_inspiration_sign: boolean;
}

const DEFAULT_CONFIG: SiteConfig = {
  show_portfolio: true,
  show_insights: true,
  show_chenpi_ai: true,
  show_sanctuary: true,
  show_inspiration_sign: true,
};

export async function fetchSiteConfig(): Promise<SiteConfig> {
  if (!supabase) return DEFAULT_CONFIG;
  try {
    const { data } = await supabase.from("site_config").select("key, value").eq("key", "feature_flags").single();
    if (data?.value && typeof data.value === "object") {
      return { ...DEFAULT_CONFIG, ...(data.value as object) };
    }
    return DEFAULT_CONFIG;
  } catch {
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
        demo_url: project.demoUrl,
        image_url: project.image,
      },
    ])
    .select();
  if (error) throw error;
  return data;
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
  if (!supabase) return siteData.resources;

  try {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return siteData.resources;
    }

    return data.map((row: any) => ({
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
  } catch {
    return siteData.resources;
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
  } catch {
    // RPC 可能不存在，用读+写替代
    const { data } = await supabase.from("resources").select("download_count").eq("id", String(id)).single();
    if (data) {
      await supabase.from("resources").update({ download_count: (data.download_count || 0) + 1 }).eq("id", String(id));
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
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("resources").getPublicUrl(fileName);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  return { url: urlData.publicUrl, size: `${sizeMB} MB` };
}
