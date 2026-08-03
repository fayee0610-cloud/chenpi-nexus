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
// 复用项目内已配好的 Supabase 单例 + dataApi createInsightHub 作为兜底（处理好 Env 降级）
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

// ---------- 写入 Supabase：Service Role → Anon Key → dataApi 三层兜底 ----------
async function writeWithFallback(
  items: SanitizedItem[]
): Promise<{ inserted: number; errors: string[]; method: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const errors: string[] = [];
  let inserted = 0;
  let method = "none";

  // 策略 1：Service Role Key → 最高权限，绕过 RLS（推荐）
  if (supabaseUrl && supabaseServiceKey) {
    method = "service_role";
    const serverClient = createClient(supabaseUrl, supabaseServiceKey);
    for (const item of items) {
      try {
        const id = genId();
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
          errors.push(`[${method}] ${item.title}: ${error.message}`);
        } else {
          inserted++;
        }
      } catch (err: any) {
        errors.push(`[${method}] ${item.title}: ${err?.message || "写入异常"}`);
      }
    }
    if (inserted === items.length || items.length === 0) {
      return { inserted, errors, method };
    }
  }

  // 策略 2：Anon Key（依赖 insights_hub 表的 INSERT RLS）
  if (supabaseUrl && supabaseAnonKey && inserted < items.length) {
    method = supabaseServiceKey ? "service_role_fallback_anon" : "anon";
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const remaining = items.slice(inserted); // 仅写入前一步失败的
    let extraInserted = 0;
    for (const item of remaining) {
      try {
        const id = genId();
        const { error } = await anonClient.from("insights_hub").insert([
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
          errors.push(`[${method}] ${item.title}: ${error.message}`);
        } else {
          inserted++;
          extraInserted++;
        }
      } catch (err: any) {
        errors.push(`[${method}] ${item.title}: ${err?.message || "写入异常"}`);
      }
    }
    if (extraInserted > 0 || inserted > 0) {
      return { inserted, errors, method };
    }
  }

  // 策略 3：dataApi.createInsightHub 兜底（复用项目已有的 Supabase 单例 + 错误处理）
  if (inserted === 0 && items.length > 0) {
    method = "dataApi_fallback";
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
        errors.push(`[${method}] ${item.title}: ${err?.message || "dataApi 写入失败"}`);
      }
    }
  }

  // 如果全部为 0，给出统一的配置提示
  if (inserted === 0 && items.length > 0) {
    errors.unshift(
      `写入失败：未找到可用的 Supabase 写入方式。请确保 SUPABASE_SERVICE_ROLE_KEY 已配置（推荐），或在 insights_hub 表上启用允许 anon INSERT 的 RLS Policy。`
    );
  }

  return { inserted, errors, method };
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
  const { inserted, errors, method } = await writeWithFallback(deduped);

  const duration = Date.now() - startedAt;
  console.log(
    `[cron/fetch-intelligence] 完成！生成 ${rawItems.length} → 清洗 ${sanitized.length} → 去重+24h ${deduped.length} → 写入 ${inserted}/${deduped.length}（method=${method}），耗时 ${duration}ms`
  );

  // 全部写入失败 → success=false，前台可提示错误
  const isOk = inserted > 0;
  return NextResponse.json(
    {
      success: isOk,
      message: isOk
        ? `完成：生成 ${rawItems.length} → 清洗 ${sanitized.length} → 24h重复跳过 ${duplicatesRemoved} → 写入 ${inserted}/${deduped.length}`
        : `写入失败：${errors[0] || "未知错误"}（请检查 .env.local 的 SUPABASE_SERVICE_ROLE_KEY）`,
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
    },
    { status: isOk ? 200 : 500 }
  );
}
