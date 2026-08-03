// ============================================================
// /api/cron/fetch-intelligence — 赛博情报局自动抓取与生成
//
// 战略定位：陈皮垂直行业专家 IP
// 三大硬核板块：🤖 机器人/具身智能 | ⚡ AI技术/大厂策略 | 📈 品牌策略/GTM干货
//
// 触发方式：
//   1. Vercel Cron（每天 UTC 00:00 = 北京时间 08:00）
//   2. 前台【⚡ 实时感知】按钮手动触发
//   3. Admin 后台 AI 一键生成
//
// 防护机制：
//   - 超时防护：AbortController 50s 超时，留 10s 给 DB 写入
//   - 权限放行：x-vercel-cron 头 / CRON_SECRET 双重校验
//   - 查重去重：仅针对 24h 内同标题/同URL记录去重，历史数据不干扰
//   - 写入兜底：Service Role → Anon Key 降级写入，确保任何配置下都能落地
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// 服务端 Admin 客户端（使用 SUPABASE_SERVICE_ROLE_KEY，绕过 RLS）
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";
// 复用项目内已配好的 Supabase 单例 + dataApi createInsightHub 作为兜底
import { createInsightHub } from "@/lib/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel 函数最大执行时长

// ---------- AI 配置 ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 允许的三大分类 ----------
const ALLOWED_CATEGORIES = [
  "🤖 机器人/具身智能",
  "⚡ AI技术/大厂策略",
  "📈 品牌策略/GTM干货",
] as const;

// ---------- 拦截关键词（坚决剔除的内容） ----------
const BLOCKED_KEYWORDS = [
  // 跨境电商类泛资讯
  "跨境电商", "Shopee", "Lazada", "Amazon选品", "东南亚电商", "拉美电商", "中东电商",
  "代购", "铺货", "买量投流", "TikTok刷粉",
  // 低质量内容标识
  "公关软文", "广告推介", "媒体通稿", "新闻快讯",
];

// ---------- 陈皮深度视角提炼 Prompt ----------
const SYSTEM_PROMPT = `你是"陈皮"，一位深耕 AI / 具身智能 / GTM 战术的垂直行业专家编辑。

## 核心任务
基于你对最新行业动态的深度知识，精选 3-5 条最高含金量的硬核情报。每条情报必须是一手资料，坚决剔除新闻快讯、公关软文、广告推介、媒体通稿。

## 三大聚焦板块（category 仅能 3 选 1）
1. 🤖 机器人/具身智能：具身智能落地、商业化进展、前沿硬件/场景研究报告与专家访谈
2. ⚡ AI技术/大厂策略：主流大厂/头部 AI 企业的技术演进、产品路线图、战略布局深度拆解
3. 📈 品牌策略/GTM干货：AI/具身智能/大厂产品的 ToB/ToC 营销、公关、社媒、GEO（生成式搜索引擎优化）等实战 GTM 战术与研究

## 数据源限定（仅接受以下一手信息）
- 行业/机构研究报告
- 大厂/标杆企业官方发布
- 专家/高管深度访谈
- 白皮书

## 绝对拦截（以下内容必须丢弃）
- 新闻快讯、公关软文、广告推介、泛泛的媒体通稿
- 跨境电商选品、铺货、买量投流、刷粉
- 与三大板块无关的泛资讯

## 输出格式（严格 JSON 数组，3-5 条，不要输出任何其他文字）
[
  {
    "title": "情报标题（专业、精确、直击本质，20字以内）",
    "category": "🤖 机器人/具身智能" | "⚡ AI技术/大厂策略" | "📈 品牌策略/GTM干货",
    "source_name": "信息来源（如：机构报告 / 大厂发布 / 专家访谈）",
    "source_url": "原文/报告链接（必须为真实可访问的 URL，若无可填来源首页，例如机构的公开报告页面，如：https://www.mckinsey.com/ 或 https://openai.com/blog 或 https://news.mit.edu）",
    "publish_date": "YYYY-MM-DD",
    "summary": "【一手核心事实/报告精髓】\\n说明该报告/访谈/策略的核心要点（2-3句）。\\n\\n【陈皮战术洞察】\\n从 ToB/ToC 营销、GTM、公关或 GEO 角度，分析该动态对垂直行业的启发与可延展研究切入点。"
  }
]

如果知识中没有通过筛选的硬核内容，返回空数组 []。`;

// ---------- 超时控制：AbortController ----------
function createTimeoutController(ms: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, cleanup: () => clearTimeout(timer) };
}

// ---------- 生成 TEXT 主键 ----------
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- AI 调用 ----------
type RawItem = {
  title?: string;
  category?: string;
  source_name?: string;
  source_url?: string;
  publish_date?: string;
  summary?: string;
};

async function generateIntelligence(): Promise<RawItem[]> {
  if (!AI_CONFIG.apiKey) {
    console.warn("[cron/fetch-intelligence] AI API Key 未配置，跳过生成");
    return [];
  }

  const { controller, cleanup } = createTimeoutController(50000);

  try {
    const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "请精选 3-5 条最高含金量的硬核情报，严格按 JSON 数组格式输出。今日日期：" + new Date().toISOString().slice(0, 10) },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[cron/fetch-intelligence] AI 调用失败: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[cron/fetch-intelligence] AI 返回内容无 JSON 数组");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed as RawItem[];
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("[cron/fetch-intelligence] AI 调用超时（50s）");
    } else {
      console.error("[cron/fetch-intelligence] AI 调用异常:", err?.message || err);
    }
    return [];
  } finally {
    cleanup();
  }
}

type SanitizedItem = {
  title: string;
  category: string;
  source_name: string;
  original_url: string;
  published_at: string;
  summary: string;
};

// ---------- 字段兜底映射 + 清洗 ----------
function sanitizeItem(raw: RawItem): SanitizedItem | null {
  const title = String(raw.title || "").trim();
  const summary = String(raw.summary || "").trim();
  if (!title || !summary) return null;

  let category = String(raw.category || "").trim();
  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    if (category.includes("AI技术") || category.includes("大厂")) {
      category = "⚡ AI技术/大厂策略";
    } else if (category.includes("机器人") || category.includes("具身")) {
      category = "🤖 机器人/具身智能";
    } else if (category.includes("品牌") || category.includes("GTM")) {
      category = "📈 品牌策略/GTM干货";
    } else {
      return null;
    }
  }

  const fullText = `${title} ${summary}`;
  for (const kw of BLOCKED_KEYWORDS) {
    if (fullText.includes(kw)) {
      console.warn(`[cron/fetch-intelligence] 拦截关键词「${kw}」命中，丢弃：${title}`);
      return null;
    }
  }

  // URL：若 AI 给了 source_url，优先使用；否则根据 source_name 生成机构首页兜底；
  // 兜底优先级：真实 source_url → 机构名 → 机构通用首页；为保证流程通畅，不做空 URL 拦截
  let url = String(raw.source_url || "").trim();
  const sourceName = String(raw.source_name || "").trim();
  if (!url || url === "#" || url === "/") {
    // source_url 缺失时，给一个合理的兜底（保证去重不冲突，且点击原文不报错）
    if (sourceName.includes("麦肯锡") || sourceName.includes("McKinsey")) url = "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights";
    else if (sourceName.includes("BCG") || sourceName.includes("波士顿")) url = "https://www.bcg.com/publications";
    else if (sourceName.includes("Gartner")) url = "https://www.gartner.com/en/newsroom";
    else if (sourceName.includes("OpenAI")) url = "https://openai.com/news";
    else if (sourceName.includes("特斯拉") || sourceName.includes("Tesla")) url = "https://www.tesla.com/blog";
    else if (sourceName.includes("MIT")) url = "https://news.mit.edu/topic/artificial-intelligence2";
    else if (sourceName.includes("Stanford") || sourceName.includes("斯坦福")) url = "https://hai.stanford.edu/news";
    else url = `https://example.com/source-not-available/${encodeURIComponent(title)}`;
  }
  if (!/^https?:\/\//.test(url)) {
    url = `https://${url}`;
  }

  let publishedAt = String(raw.publish_date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    publishedAt = new Date().toISOString().slice(0, 10);
  }

  return {
    title: title.slice(0, 200),
    category,
    source_name: sourceName.slice(0, 100) || "一手资料",
    original_url: url.slice(0, 500),
    published_at: publishedAt,
    summary: summary.slice(0, 2000),
  };
}

// ---------- 去重：仅对 24 小时内的同标题/同URL 去重（历史数据不干扰） ----------
async function deduplicateWithin24h(
  supabaseClient: any,
  items: SanitizedItem[]
): Promise<{ deduped: SanitizedItem[]; duplicatesRemoved: number }> {
  if (!supabaseClient || items.length === 0) return { deduped: items, duplicatesRemoved: 0 };

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabaseClient
      .from("insights_hub")
      .select("title, original_url, created_at")
      // 仅查最近 24h 内创建的记录；老记录不参与本次去重
      .gte("created_at", twentyFourHoursAgo);

    if (error || !data) {
      console.warn("[cron/fetch-intelligence] 24h 去重查询失败，全量写入:", error?.message);
      return { deduped: items, duplicatesRemoved: 0 };
    }

    const recentTitles = new Set(data.map((r: any) => String(r.title || "").trim().toLowerCase()));
    const recentUrls = new Set(data.map((r: any) => String(r.original_url || "").trim().toLowerCase()));

    let duplicatesRemoved = 0;
    const deduped = items.filter((item) => {
      if (!item) return false;
      const t = item.title.toLowerCase();
      const u = item.original_url.toLowerCase();
      const isDup = recentTitles.has(t) || recentUrls.has(u);
      if (isDup) {
        duplicatesRemoved++;
        console.warn(`[cron/fetch-intelligence] 24h 内已存在，Skip：${item.title}`);
      }
      return !isDup;
    });

    console.log(`[cron/fetch-intelligence] 去重（24h内）：${items.length} → ${deduped.length} 条（跳过 ${duplicatesRemoved} 条重复）`);
    return { deduped, duplicatesRemoved };
  } catch (err) {
    console.warn("[cron/fetch-intelligence] 24h 去重异常，全量写入:", err);
    return { deduped: items, duplicatesRemoved: 0 };
  }
}

// ---------- 智能写入：列发现 + 自动降级 ----------
const CORE_COLUMNS = ["id", "title", "category", "summary", "source_name", "original_url", "published_at"];
const OPTIONAL_COLUMNS = ["is_published", "is_featured", "api_source", "tags"];
const ALL_KNOWN_COLUMNS = [...CORE_COLUMNS, ...OPTIONAL_COLUMNS];

// 模块级缓存：已确认 EXISTS / MISSING 的列，避免重复探测
let EXISTING_COLUMNS_CACHE: Set<string> | null = null;
let MISSING_COLUMNS_FOR_HINT: string[] = [];

function parseMissingColumn(errMessage: string): string | null {
  const m1 = errMessage.match(/find the '([^']+)' column/);
  if (m1) return m1[1];
  const m2 = errMessage.match(/column "([^"]+)" of relation/);
  if (m2) return m2[1];
  return null;
}

/**
 * 启动时自动发现 insights_hub 表实际存在的列：
 * 用 SELECT * LIMIT 1 取任意一行，从返回对象的 key 中提取真实列名。
 * 失败时回退为空缓存（后续走逐列降级策略）。
 */
async function discoverExistingColumns(client: any): Promise<Set<string> | null> {
  if (EXISTING_COLUMNS_CACHE) return EXISTING_COLUMNS_CACHE;
  try {
    // 取任意一行，从 data 返回的 key 得到真实列
    const { data, error } = await client.from("insights_hub").select("*").limit(1);
    if (error || !data || data.length === 0) {
      // 没有数据时，尝试一次无数据的 select id 查询确认表可访问；列发现置空，走逐列降级
      const r = await client.from("insights_hub").select("id").limit(0);
      if (r.error) console.warn("[cron/fetch-intelligence] 表访问失败，跳过列发现:", r.error.message);
      return null;
    }
    const cols = new Set(Object.keys(data[0] || {}));
    EXISTING_COLUMNS_CACHE = cols;
    MISSING_COLUMNS_FOR_HINT = ALL_KNOWN_COLUMNS.filter((c) => !cols.has(c));
    console.log(
      `[cron/fetch-intelligence] insights_hub 列发现：实际存在 ${cols.size} 列（${[...cols].join(",")}），缺失 ${MISSING_COLUMNS_FOR_HINT.length} 列（${MISSING_COLUMNS_FOR_HINT.join(",") || "无"}）`
    );
    return cols;
  } catch (e: any) {
    console.warn("[cron/fetch-intelligence] 列发现异常，后续走逐列降级:", e?.message);
    return null;
  }
}

/** 构造 payload：只写实际存在的列（优先用"列发现"结果，否则先写全部再逐列降级） */
function buildSafePayload(item: SanitizedItem, existingCols: Set<string> | null) {
  const payload: Record<string, any> = {};
  const tryAdd = (col: string, value: any) => {
    if (existingCols === null) {
      // 还没发现，全加，失败时逐列移除
      payload[col] = value;
      return;
    }
    if (existingCols.has(col)) payload[col] = value;
  };
  tryAdd("id", genId());
  tryAdd("title", item.title);
  tryAdd("category", item.category);
  tryAdd("summary", item.summary);
  tryAdd("source_name", item.source_name);
  tryAdd("original_url", item.original_url);
  tryAdd("published_at", item.published_at);
  // 可选列：有默认值
  tryAdd("is_published", true);
  tryAdd("is_featured", false);
  tryAdd("api_source", "auto_bot");
  tryAdd("tags", []);
  return payload;
}

// 逐列降级缓存：当列发现未生效时，记录已确认不存在的列
const COL_NOT_FOUND_FALLBACK = new Set<string>();

/**
 * 智能写入：
 * 1. 优先使用"列发现"得到的真实列集合构造 payload
 * 2. 若列发现失败或写入抛错，逐列捕获 column not found 并黑掉该列后重试
 * 3. 最终保证最少核心列集合(id/title/category/summary) 能写入即可
 */
async function safeInsert(client: any, item: SanitizedItem): Promise<{ success: boolean; error: string | null }> {
  const existingCols = EXISTING_COLUMNS_CACHE;
  let payload = buildSafePayload(item, existingCols);
  const MAX_TRIES = ALL_KNOWN_COLUMNS.length + 1;

  for (let tries = 0; tries < MAX_TRIES; tries++) {
    try {
      // 应用"逐列降级"发现的黑名单（在列发现失败时生效）
      if (COL_NOT_FOUND_FALLBACK.size > 0) {
        for (const bad of COL_NOT_FOUND_FALLBACK) {
          delete payload[bad];
        }
      }
      const { error } = await client.from("insights_hub").insert([payload]);
      if (!error) return { success: true, error: null };

      const missingCol = parseMissingColumn(error.message);
      if (missingCol && ALL_KNOWN_COLUMNS.includes(missingCol)) {
        COL_NOT_FOUND_FALLBACK.add(missingCol);
        console.warn(`[cron/fetch-intelligence] 列"${missingCol}"不存在，从 payload 移除后重试`);
        delete payload[missingCol];
        continue;
      }
      // 非"列不存在"的错误
      return { success: false, error: error.message };
    } catch (e: any) {
      return { success: false, error: e?.message || "写入异常" };
    }
  }
  return { success: false, error: "超过最大重试次数，insights_hub 表缺少必要列，请执行 supabase.ts 中的 ALTER TABLE SQL" };
}

/** 返回用户提示：哪些列缺失 + 修复 SQL */
function getSchemaHint(): string | null {
  const missing = MISSING_COLUMNS_FOR_HINT.length > 0
    ? MISSING_COLUMNS_FOR_HINT
    : [...COL_NOT_FOUND_FALLBACK];
  if (missing.length === 0) return null;
  const addColsSQL = missing
    .map((col) => {
      switch (col) {
        case "is_published":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;";
        case "is_featured":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;";
        case "api_source":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS api_source TEXT DEFAULT 'manual';";
        case "tags":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;";
        case "source_name":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS source_name TEXT;";
        case "original_url":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS original_url TEXT;";
        case "published_at":
          return "ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS published_at DATE;";
        default:
          return `-- 未知列：${col}`;
      }
    })
    .join(" ");
  return `表缺少列（${missing.join(",")}），请在 Supabase SQL Editor 执行：${addColsSQL}`;
}

// ---------- 写入 Supabase：Admin Client → Anon Key → dataApi 三层兜底 ----------
async function writeWithFallback(
  items: SanitizedItem[]
): Promise<{ inserted: number; errors: string[]; method: string; firstError: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const errors: string[] = [];
  let inserted = 0;
  let method = "none";
  let firstError: string | null = null;

  // ★ 写前列发现：探测 insights_hub 真实列，后续 payload 只写存在的列
  const probeClient: any = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
  if (probeClient) await discoverExistingColumns(probeClient);

  // 策略 1：supabaseAdmin（使用 SUPABASE_SERVICE_ROLE_KEY，绕过 RLS）
  if (supabaseAdmin) {
    method = "service_role";
    console.log("[cron/fetch-intelligence] 写入策略 1：supabaseAdmin (service_role)");
    for (const item of items) {
      const result = await safeInsert(supabaseAdmin, item);
      if (result.success) {
        inserted++;
      } else {
        const msg = `${item.title}: ${result.error}`;
        errors.push(`[${method}] ${msg}`);
        if (!firstError) firstError = msg;
      }
    }
    if (inserted === items.length || items.length === 0) {
      return { inserted, errors, method, firstError };
    }
    if (inserted > 0) {
      // 有部分成功也返回（服务端列缺失缓存全局生效，下次 cron 自动用更安全的 payload）
      return { inserted, errors, method, firstError };
    }
    console.warn(`[cron/fetch-intelligence] service_role 写入全部失败，降级到 anon key`);
  } else {
    console.warn("[cron/fetch-intelligence] SUPABASE_SERVICE_ROLE_KEY 未配置，跳过 service_role 策略");
  }

  // 策略 2：Anon Key（依赖 insights_hub 表的 INSERT RLS Policy）
  if (supabaseUrl && supabaseAnonKey && inserted < items.length) {
    method = hasServiceRoleKey ? "service_role_failed_fallback_anon" : "anon";
    console.log("[cron/fetch-intelligence] 写入策略 2：anon key");
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const remaining = items.slice(inserted);
    for (const item of remaining) {
      const result = await safeInsert(anonClient, item);
      if (result.success) {
        inserted++;
      } else {
        const msg = `${item.title}: ${result.error}`;
        errors.push(`[${method}] ${msg}`);
        if (!firstError) firstError = msg;
      }
    }
    if (inserted > 0) {
      return { inserted, errors, method, firstError };
    }
  }

  // 策略 3：dataApi.createInsightHub 兜底（复用项目已有的 Supabase 单例，只做最少字段）
  if (inserted === 0 && items.length > 0) {
    method = "dataApi_fallback";
    console.log("[cron/fetch-intelligence] 写入策略 3：dataApi.createInsightHub");
    for (const item of items) {
      try {
        await createInsightHub({
          title: item.title,
          category: item.category as any,
          summary: item.summary,
          sourceName: item.source_name,
          originalUrl: item.original_url,
          publishedAt: item.published_at,
          isPublished: true,
          isFeatured: false,
          apiSource: "auto_bot",
          tags: [],
        });
        inserted++;
      } catch (err: any) {
        const msg = `${item.title}: ${err?.message || "dataApi 写入失败"}`;
        errors.push(`[${method}] ${msg}`);
        if (!firstError) firstError = msg;
      }
    }
  }

  return { inserted, errors, method, firstError };
}

// ---------- 权限校验：Vercel Cron 头 / CRON_SECRET ----------
function isAuthorized(req: NextRequest): boolean {
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1" || vercelCronHeader === "true") {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const querySecret = req.nextUrl.searchParams.get("secret") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret || querySecret === cronSecret) {
      return true;
    }
    return false;
  }

  // 未配置 CRON_SECRET：允许前台/后台按钮手动触发
  return true;
}

// ---------- 主路由 ----------
export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const startedAt = Date.now();

  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "未授权：CRON_SECRET 验证失败" },
      { status: 401 }
    );
  }

  console.log("[cron/fetch-intelligence] 开始执行情报抓取流水线...");

  // 1. AI 生成
  const rawItems = await generateIntelligence();
  console.log(`[cron/fetch-intelligence] AI 生成 → ${rawItems.length} 条原始数据`);

  if (rawItems.length === 0) {
    return NextResponse.json({
      success: false,
      error: "AI 未生成有效情报（请检查 AI_API_KEY 配置或 AI 模型是否正常返回）",
      stats: { generated: 0, sanitized: 0, duplicatesRemoved: 0, afterDedup: 0, inserted: 0, method: "n/a" },
      errors: [],
      duration: Date.now() - startedAt,
    });
  }

  // 2. 字段兜底映射 + 清洗
  const sanitized = rawItems.map(sanitizeItem).filter(Boolean) as SanitizedItem[];
  console.log(`[cron/fetch-intelligence] 清洗后 → ${sanitized.length} 条有效数据`);

  if (sanitized.length === 0) {
    return NextResponse.json({
      success: false,
      error: "AI 生成内容未通过清洗（含拦截关键词或字段缺失）",
      stats: { generated: rawItems.length, sanitized: 0, duplicatesRemoved: 0, afterDedup: 0, inserted: 0, method: "n/a" },
      errors: [],
      duration: Date.now() - startedAt,
    });
  }

  // 3. 24h 内去重（历史数据不干扰）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dedupClient =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const { deduped, duplicatesRemoved } = await deduplicateWithin24h(dedupClient, sanitized);

  if (deduped.length === 0) {
    return NextResponse.json({
      success: true,
      message: `24 小时内已存在相同情报（${duplicatesRemoved} 条重复已跳过），稍后再试或检查前台展示。`,
      stats: {
        generated: rawItems.length,
        sanitized: sanitized.length,
        duplicatesRemoved,
        afterDedup: 0,
        inserted: 0,
        method: "n/a",
      },
      errors: [],
      duration: Date.now() - startedAt,
    });
  }

  // 4. 写入数据库（三层兜底）
  const { inserted, errors, method, firstError } = await writeWithFallback(deduped);

  const duration = Date.now() - startedAt;
  console.log(
    `[cron/fetch-intelligence] 完成！生成 ${rawItems.length} → 清洗 ${sanitized.length} → 去重+24h ${deduped.length} → 写入 ${inserted}/${deduped.length}（method=${method}），耗时 ${duration}ms`
  );

  // 成功/失败都统一返回 hint（schema 提示），方便用户自助修复
  const schemaHint = getSchemaHint();
  const isOk = inserted > 0;

  if (isOk) {
    return NextResponse.json({
      success: true,
      message: `完成：生成 ${rawItems.length} → 清洗 ${sanitized.length} → 24h重复跳过 ${duplicatesRemoved} → 写入 ${inserted}/${deduped.length}${schemaHint ? "（部分列缺失，已自动降级写入，建议补 ALTER TABLE）" : ""}`,
      hint: schemaHint || "表结构完整，无需修复",
      stats: {
        generated: rawItems.length,
        sanitized: sanitized.length,
        duplicatesRemoved,
        afterDedup: deduped.length,
        inserted,
        totalItems: deduped.length,
        method,
      },
      errors: errors.slice(0, 10),
      duration,
    });
  }

  // 写入失败：返回真实错误 + 明确修复指引
  const svcHint = hasServiceRoleKey
    ? ""
    : "请在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY=（Supabase Dashboard → Settings → API → service_role secret）";
  const finalHint = [schemaHint, svcHint].filter(Boolean).join(" | ");

  return NextResponse.json(
    {
      success: false,
      error: firstError || "写入失败：未知原因",
      hint: finalHint || "请检查 Supabase 表结构与网络连接",
      message: `写入失败：${firstError || "未知错误"}`,
      stats: {
        generated: rawItems.length,
        sanitized: sanitized.length,
        duplicatesRemoved,
        afterDedup: deduped.length,
        inserted: 0,
        totalItems: deduped.length,
        method,
      },
      errors: errors.slice(0, 10),
      duration,
    },
    { status: 500 }
  );
}
