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
//   - 权限放行：x-vercel-cron 头 或 CRON_SECRET 校验
//   - 查重去重：写入前匹配 title / source_url，已存在则 Skip
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    "source_url": "原文/报告链接（必须为真实可访问的 URL，若无可填来源首页）",
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

// ---------- AI 调用 ----------
async function generateIntelligence(): Promise<RawItem[]> {
  if (!AI_CONFIG.apiKey) {
    console.warn("[cron/fetch-intelligence] AI API Key 未配置，跳过生成");
    return [];
  }

  const { controller, cleanup } = createTimeoutController(50000); // 50s 超时

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
          { role: "user", content: "请精选 3-5 条最高含金量的硬核情报，严格按 JSON 数组格式输出。" },
        ],
        temperature: 0.4,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[cron/fetch-intelligence] AI 调用失败: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";

    // 提取 JSON 数组
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

type RawItem = {
  title?: string;
  category?: string;
  source_name?: string;
  source_url?: string;
  publish_date?: string;
  summary?: string;
};

// ---------- 字段兜底映射 + 清洗 ----------
function sanitizeItem(raw: RawItem): {
  title: string;
  category: string;
  source_name: string;
  original_url: string;
  published_at: string;
  summary: string;
} | null {
  // 必填字段缺失则丢弃
  const title = String(raw.title || "").trim();
  const summary = String(raw.summary || "").trim();
  if (!title || !summary) return null;

  // category 校验：不在白名单内则尝试兼容映射，仍失败则丢弃
  let category = String(raw.category || "").trim();
  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    // 兼容旧分类（💡 → ⚡）
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

  // 拦截关键词检查
  const fullText = `${title} ${summary}`;
  for (const kw of BLOCKED_KEYWORDS) {
    if (fullText.includes(kw)) {
      console.warn(`[cron/fetch-intelligence] 拦截关键词「${kw}」命中，丢弃：${title}`);
      return null;
    }
  }

  // URL 防空 + 协议补全
  let url = String(raw.source_url || raw.source_name || "").trim();
  if (!url || url === "#" || url === "/") {
    return null; // 无 URL 视为无效一手资料
  }
  if (!/^https?:\/\//.test(url)) {
    url = `https://${url}`;
  }

  // 日期兜底
  let publishedAt = String(raw.publish_date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    publishedAt = new Date().toISOString().slice(0, 10);
  }

  return {
    title: title.slice(0, 200),
    category,
    source_name: String(raw.source_name || "一手资料").slice(0, 100),
    original_url: url,
    published_at: publishedAt,
    summary: summary.slice(0, 1000),
  };
}

// ---------- 去重：title 或 source_url 匹配则 Skip ----------
async function deduplicate(
  supabaseClient: any,
  items: ReturnType<typeof sanitizeItem>[]
): Promise<NonNullable<ReturnType<typeof sanitizeItem>>[]> {
  if (!supabaseClient || items.length === 0) return items.filter(Boolean) as any;

  try {
    const { data, error } = await supabaseClient
      .from("insights_hub")
      .select("title, original_url");

    if (error || !data) {
      console.warn("[cron/fetch-intelligence] 去重查询失败，全量写入:", error?.message);
      return items.filter(Boolean) as any;
    }

    const existingTitles = new Set(data.map((r: any) => String(r.title || "").trim().toLowerCase()));
    const existingUrls = new Set(data.map((r: any) => String(r.original_url || "").trim().toLowerCase()));

    const deduped = items.filter((item) => {
      if (!item) return false;
      const t = item.title.toLowerCase();
      const u = item.original_url.toLowerCase();
      return !existingTitles.has(t) && !existingUrls.has(u);
    });

    console.log(`[cron/fetch-intelligence] 去重：${items.length} → ${deduped.length} 条`);
    return deduped as any;
  } catch (err) {
    console.warn("[cron/fetch-intelligence] 去重异常，全量写入:", err);
    return items.filter(Boolean) as any;
  }
}

// ---------- 写入 Supabase ----------
async function writeToIntelligenceHub(
  items: NonNullable<ReturnType<typeof sanitizeItem>>[]
): Promise<{ inserted: number; errors: string[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { inserted: 0, errors: ["Supabase service role 未配置"] };
  }

  const serverClient = createClient(supabaseUrl, supabaseServiceKey);
  let inserted = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const { error } = await serverClient.from("insights_hub").insert([
        {
          id,
          title: item.title,
          category: item.category,
          summary: item.summary,
          source_name: item.source_name,
          original_url: item.original_url,
          published_at: item.published_at,
          is_published: true,
          is_featured: false,
          api_source: "auto_bot",
          tags: [],
        },
      ]);

      if (error) {
        errors.push(`${item.title}: ${error.message}`);
      } else {
        inserted++;
      }
    } catch (err: any) {
      errors.push(`${item.title}: ${err?.message || "写入异常"}`);
    }
  }

  return { inserted, errors };
}

// ---------- 权限校验：Vercel Cron 头 / CRON_SECRET ----------
function isAuthorized(req: NextRequest): boolean {
  // 1. Vercel Cron 自动触发：检查 x-vercel-cron 头
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1" || vercelCronHeader === "true") {
    return true;
  }

  // 2. CRON_SECRET 校验（Authorization Bearer 或 ?secret=）
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const querySecret = req.nextUrl.searchParams.get("secret") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret || querySecret === cronSecret) {
      return true;
    }
    // 未配置 secret 时不放行（避免被恶意触发）
    return false;
  }

  // 3. 未配置 CRON_SECRET 且非 Vercel Cron：允许前台手动触发（仅生成，不写敏感数据）
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

  // 1. 权限校验
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "未授权：CRON_SECRET 验证失败" },
      { status: 401 }
    );
  }

  console.log("[cron/fetch-intelligence] 开始执行情报抓取流水线...");

  // 2. AI 生成（含超时防护）
  const rawItems = await generateIntelligence();
  console.log(`[cron/fetch-intelligence] AI 生成 → ${rawItems.length} 条原始数据`);

  if (rawItems.length === 0) {
    return NextResponse.json({
      success: true,
      message: "AI 未生成有效情报（可能 API 未配置或无符合硬核标准的内容）",
      stats: { generated: 0, sanitized: 0, deduplicated: 0, inserted: 0 },
      duration: Date.now() - startedAt,
    });
  }

  // 3. 字段兜底映射 + 清洗
  const sanitized = rawItems
    .map(sanitizeItem)
    .filter(Boolean) as NonNullable<ReturnType<typeof sanitizeItem>>[];
  console.log(`[cron/fetch-intelligence] 清洗后 → ${sanitized.length} 条有效数据`);

  if (sanitized.length === 0) {
    return NextResponse.json({
      success: true,
      message: "AI 生成内容未通过清洗（含拦截关键词或字段缺失）",
      stats: { generated: rawItems.length, sanitized: 0, deduplicated: 0, inserted: 0 },
      duration: Date.now() - startedAt,
    });
  }

  // 4. 去重（title 或 source_url 匹配则 Skip）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dedupClient =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const deduped = await deduplicate(dedupClient, sanitized);

  if (deduped.length === 0) {
    return NextResponse.json({
      success: true,
      message: "全部情报已存在，跳过写入",
      stats: {
        generated: rawItems.length,
        sanitized: sanitized.length,
        deduplicated: 0,
        inserted: 0,
      },
      duration: Date.now() - startedAt,
    });
  }

  // 5. 写入数据库
  const { inserted, errors } = await writeToIntelligenceHub(deduped);

  const duration = Date.now() - startedAt;
  console.log(
    `[cron/fetch-intelligence] 完成！生成 ${rawItems.length} → 清洗 ${sanitized.length} → 去重 ${deduped.length} → 写入 ${inserted}，耗时 ${duration}ms`
  );

  return NextResponse.json({
    success: true,
    message: `情报抓取完成：生成 ${rawItems.length} 条 → 清洗 ${sanitized.length} 条 → 去重 ${deduped.length} 条 → 写入 ${inserted} 条`,
    stats: {
      generated: rawItems.length,
      sanitized: sanitized.length,
      deduplicated: deduped.length,
      inserted,
      errors: errors.slice(0, 5),
    },
    duration,
  });
}
