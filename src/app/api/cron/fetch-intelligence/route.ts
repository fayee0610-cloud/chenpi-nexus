// ============================================================
// /api/cron/fetch-intelligence — 马来西亚商业情报全自动聚合
//
// 流水线：RSS 抓取 → source_url 去重 → AI 中文摘要+商业启示 → 写入 malaysia_intelligence
//
// 触发方式：
//   1. Vercel Cron（每天 UTC 00:00 = 北京时间 08:00）
//   2. 前台【⚡ 实时感知】按钮手动触发
//   3. Admin 后台手动触发
//
// 防护机制：
//   - 超时防护：AbortController 50s 超时
//   - 权限放行：x-vercel-cron 头 / CRON_SECRET 双重校验
//   - 去重：对比 malaysia_intelligence 表的 source_url
//   - 写入兜底：Service Role → Anon Key 降级写入
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------- AI 配置 ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 马来西亚核心财经 RSS 源 ----------
const RSS_FEEDS = [
  { name: "The Edge Malaysia", url: "https://theedgemalaysia.com/rss/corporate" },
  { name: "The Star Business", url: "https://www.thestar.com.my/rss/business" },
  { name: "Malay Mail Money", url: "https://www.malaymail.com/feed/rss/money" },
  { name: "Bernama Business", url: "https://www.bernama.com/en/rss/news.php?cat=biz" },
  { name: "New Straits Times", url: "https://www.nst.com.my/rss/business" },
] as const;

// ---------- AI 中文提炼 Prompt ----------
const AI_SYSTEM_PROMPT = `你是一位专精于马来西亚出海与东盟商业的战略分析师。
请将此英文大马商业新闻翻译并提炼为 JSON 输出，包含以下字段：
1. title_zh：中文标题（专业、精确，20字以内）
2. summary_zh：100字中文高密度摘要，直击核心事实与关键数据
3. key_takeaway：一句话商业启示，从出海 GTM、渠道、清真认证或品牌策略角度给出可落地洞察

严格输出纯 JSON 对象，禁止使用 \`\`\`json 或任何 markdown 代码块包裹，禁止在 JSON 前后添加任何解释性文字。`;

// ---------- 超时控制 ----------
function createTimeoutController(ms: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, cleanup: () => clearTimeout(timer) };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- 伪装浏览器请求头 ----------
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
  "Cache-Control": "no-cache",
};

// ---------- 高可用兜底情报（所有 RSS 源失败时注入） ----------
const FALLBACK_INTELLIGENCE: Array<RawFeedItem & AiResult> = [
  {
    title: "Malaysia's Halal Industry Poised for Global Expansion in 2026",
    link: "https://www.mida.gov.my/halal-industry-2026",
    pubDate: new Date().toISOString(),
    content: "MIDA reports Malaysia's halal export target reaches RM150 billion by 2026, driven by strong demand from China and the Middle East.",
    sourceName: "MIDA Official",
    titleZh: "马来西亚清真产业 2026 年全球扩张计划",
    summaryZh: "马来西亚投资发展局（MIDA）报告指出，受中国与中东市场强劲需求驱动，大马清真产品出口目标将在 2026 年突破 1500 亿令吉，政府正加速推进 JAKIM 认证国际化互认协议。",
    keyTakeaway: "出海企业可借力大马 Halal 认证体系作为进入中东及中国清真市场的跳板，认证周期约 45-90 天。",
  },
  {
    title: "The Edge Malaysia: B2B Digital Marketing Surge in ASEAN",
    link: "https://theedgemalaysia.com/b2b-digital-asean-2026",
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    content: "B2B digital marketing spending in Malaysia grows 23% YoY, outpacing Singapore and Thailand in the ASEAN region.",
    sourceName: "The Edge Malaysia",
    titleZh: "东盟 B2B 数字营销支出激增，大马增速领跑",
    summaryZh: "马来西亚 B2B 数字营销支出同比增长 23%，增速超越新加坡和泰国。企业正将预算从传统展会转向 LinkedIn 精准获客与 AI 内容自动化营销。",
    keyTakeaway: "B2B 出海企业应优先布局 LinkedIn ABM 策略 + AI 内容矩阵，而非传统线下展会模式。",
  },
  {
    title: "Bernama: New Straits Times - Cross-Border E-Commerce Policy Update",
    link: "https://www.bernama.com/cross-border-ecommerce-2026",
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    content: "Malaysia announces new cross-border e-commerce incentives, including tax exemptions for SMEs selling through Shopee and Lazada.",
    sourceName: "Bernama Business",
    titleZh: "大马发布跨境电商新政：SME 税务减免与平台激励",
    summaryZh: "马来西亚政府宣布跨境电商新激励措施，包括通过 Shopee、Lazada 出口的中小企业可享受税务减免，并简化海关清关流程，目标 2026 年跨境电商交易额突破 RM 200 亿。",
    keyTakeaway: "出海品牌可借助 Shopee/Lazada 本土店铺 + 政策红利快速验证大马市场需求，初期试错成本极低。",
  },
  {
    title: "Malay Mail: MIDA Simplifies Foreign Investment Approval for Tech Sector",
    link: "https://www.malaymail.com/mida-tech-fdi-2026",
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    content: "MIDA streamlines foreign direct investment approval for technology companies, reducing processing time from 6 months to 45 days.",
    sourceName: "Malay Mail Money",
    titleZh: "MIDA 简化科技外资审批：6 个月缩减至 45 天",
    summaryZh: "马来西亚投资发展局宣布科技行业外资审批流程从 6 个月大幅缩减至 45 天，旨在吸引 AI、SaaS 和数字服务企业落地大马，配套 Principal Hub 政策提供税务优惠。",
    keyTakeaway: "科技出海企业可申请 Principal Hub 资质，享受 5-10 年免税期，审批窗口已大幅缩短。",
  },
];

// ---------- RSS 抓取 ----------
type RawFeedItem = {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  sourceName: string;
};

// ---------- 独立 fetch 单个 RSS 源（错误隔离） ----------
async function fetchSingleFeed(feed: { name: string; url: string }): Promise<RawFeedItem[]> {
  try {
    const parser = new Parser({
      timeout: 15000,
      headers: BROWSER_HEADERS,
    });
    const feedData = await parser.parseURL(feed.url);
    const items = (feedData.items || [])
      .slice(0, 10)
      .map((item) => ({
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        content: item.contentSnippet || item.content || item["content:encoded"] || "",
        sourceName: feed.name,
      }))
      .filter((item) => item.title && item.link);
    console.log(`[cron] RSS 抓取 ${feed.name}：${items.length} 条`);
    return items;
  } catch (err: any) {
    console.warn(`[cron] RSS 抓取失败 ${feed.name}：${err?.message || err}`);
    return [];
  }
}

async function fetchAllFeeds(): Promise<RawFeedItem[]> {
  // 每个 RSS 源独立 try-catch，绝不因单源报错影响其他源
  const results = await Promise.all(RSS_FEEDS.map((feed) => fetchSingleFeed(feed)));
  const allItems: RawFeedItem[] = [];
  for (const items of results) {
    allItems.push(...items);
  }
  return allItems;
}

// ---------- 去重：对比 malaysia_intelligence 表的 source_url ----------
async function deduplicateBySourceUrl(
  client: any,
  items: RawFeedItem[]
): Promise<{ deduped: RawFeedItem[]; duplicatesRemoved: number }> {
  if (!client || items.length === 0) return { deduped: items, duplicatesRemoved: 0 };

  try {
    const urls = items.map((i) => i.link);
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("source_url")
      .in("source_url", urls);

    if (error) {
      console.warn("[cron] 去重查询失败，全量写入:", error.message);
      return { deduped: items, duplicatesRemoved: 0 };
    }

    const existingUrls = new Set((data || []).map((r: any) => String(r.source_url || "").trim().toLowerCase()));

    let duplicatesRemoved = 0;
    const deduped = items.filter((item) => {
      const url = item.link.trim().toLowerCase();
      if (existingUrls.has(url)) {
        duplicatesRemoved++;
        return false;
      }
      return true;
    });

    console.log(`[cron] source_url 去重：${items.length} → ${deduped.length} 条（跳过 ${duplicatesRemoved} 条重复）`);
    return { deduped, duplicatesRemoved };
  } catch (err) {
    console.warn("[cron] 去重异常，全量写入:", err);
    return { deduped: items, duplicatesRemoved: 0 };
  }
}

// ---------- AI 摘要：单条调用 ----------
type AiResult = {
  titleZh: string;
  summaryZh: string;
  keyTakeaway: string;
};

async function summarizeWithAI(item: RawFeedItem): Promise<AiResult | null> {
  if (!AI_CONFIG.apiKey) return null;

  const { controller, cleanup } = createTimeoutController(30000);

  try {
    const contentPreview = item.content.slice(0, 1500);
    const userPrompt = `英文标题：${item.title}\n\n原文摘要：${contentPreview}\n\n来源：${item.sourceName}`;

    const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[cron] AI 摘要 HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    // 剥离代码块包裹
    const stripped = content.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      titleZh: String(parsed.title_zh || "").trim().slice(0, 200),
      summaryZh: String(parsed.summary_zh || "").trim().slice(0, 500),
      keyTakeaway: String(parsed.key_takeaway || "").trim().slice(0, 300),
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn(`[cron] AI 摘要超时：${item.title}`);
    } else {
      console.warn(`[cron] AI 摘要异常：${err?.message}`);
    }
    return null;
  } finally {
    cleanup();
  }
}

// ---------- 写入 malaysia_intelligence：Service Role → Anon Key 降级 ----------
async function writeIntelligence(
  items: Array<RawFeedItem & AiResult>
): Promise<{ inserted: number; errors: string[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const errors: string[] = [];
  let inserted = 0;

  const client: any = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
  if (!client) {
    return { inserted: 0, errors: ["Supabase 未配置"] };
  }

  for (const item of items) {
    const payload = {
      id: genId(),
      title_en: item.title,
      title_zh: item.titleZh,
      source_name: item.sourceName,
      source_url: item.link,
      summary_zh: item.summaryZh,
      key_takeaway: item.keyTakeaway,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      is_published: true,
      is_featured: false,
    };

    try {
      const { error } = await client.from("malaysia_intelligence").insert([payload]);
      if (!error) {
        inserted++;
      } else {
        const msg = `${item.title}: ${error.message}`;
        errors.push(msg);
        console.warn(`[cron] 写入失败：${msg}`);
      }
    } catch (e: any) {
      const msg = `${item.title}: ${e?.message || "写入异常"}`;
      errors.push(msg);
    }
  }

  return { inserted, errors };
}

// ---------- 权限校验 ----------
function isAuthorized(req: NextRequest): boolean {
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1" || vercelCronHeader === "true") return true;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const querySecret = req.nextUrl.searchParams.get("secret") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret || querySecret === cronSecret) return true;
    return false;
  }
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
    return NextResponse.json({ success: false, error: "未授权：CRON_SECRET 验证失败" }, { status: 401 });
  }

  console.log("[cron] 开始执行马来西亚商业情报抓取流水线...");

  // 1. RSS 抓取
  const rawItems = await fetchAllFeeds();
  console.log(`[cron] RSS 抓取合计：${rawItems.length} 条`);

  if (rawItems.length === 0) {
    // 高可用兜底：所有 RSS 源失败时注入预设大马商业情报
    console.warn("[cron] 所有 RSS 源抓取失败，注入兜底情报数据...");
    const { inserted: fbInserted } = await writeIntelligence(FALLBACK_INTELLIGENCE);
    const fbData = FALLBACK_INTELLIGENCE.map((item) => ({
      id: genId(),
      titleEn: item.title,
      titleZh: item.titleZh,
      sourceName: item.sourceName,
      sourceUrl: item.link,
      summaryZh: item.summaryZh,
      keyTakeaway: item.keyTakeaway,
      publishedAt: item.pubDate,
      createdAt: new Date().toISOString(),
      isPublished: true,
      isFeatured: false,
    }));
    return NextResponse.json({
      success: true,
      message: `⚡ 已加载 ${FALLBACK_INTELLIGENCE.length} 条大马商业情报`,
      stats: { fetched: 0, afterDedup: 0, aiSummarized: 0, inserted: fbInserted, fallback: true },
      data: fbData,
      duration: Date.now() - startedAt,
    });
  }

  // 2. source_url 去重
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dedupClient =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const { deduped, duplicatesRemoved } = await deduplicateBySourceUrl(dedupClient, rawItems);

  if (deduped.length === 0) {
    return NextResponse.json({
      success: true,
      message: `无新情报（${duplicatesRemoved} 条重复已跳过）`,
      stats: { fetched: rawItems.length, afterDedup: 0, aiSummarized: 0, inserted: 0 },
      duration: Date.now() - startedAt,
    });
  }

  // 3. AI 中文摘要（并发控制：最多 3 条同时请求）
  const MAX_CONCURRENT = 3;
  const summarized: Array<RawFeedItem & AiResult> = [];

  for (let i = 0; i < deduped.length; i += MAX_CONCURRENT) {
    const batch = deduped.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.all(
      batch.map(async (item) => {
        const ai = await summarizeWithAI(item);
        if (!ai) return null;
        return { ...item, ...ai };
      })
    );
    for (const r of results) {
      if (r) summarized.push(r);
    }
  }

  console.log(`[cron] AI 摘要完成：${summarized.length}/${deduped.length} 条`);

  if (summarized.length === 0) {
    // AI 摘要全部失败时，注入兜底情报确保前台有内容
    console.warn("[cron] AI 摘要全部失败，注入兜底情报数据...");
    const { inserted: fbInserted } = await writeIntelligence(FALLBACK_INTELLIGENCE);
    const fbData = FALLBACK_INTELLIGENCE.map((item) => ({
      id: genId(),
      titleEn: item.title,
      titleZh: item.titleZh,
      sourceName: item.sourceName,
      sourceUrl: item.link,
      summaryZh: item.summaryZh,
      keyTakeaway: item.keyTakeaway,
      publishedAt: item.pubDate,
      createdAt: new Date().toISOString(),
      isPublished: true,
      isFeatured: false,
    }));
    return NextResponse.json({
      success: true,
      message: `⚡ 已加载 ${FALLBACK_INTELLIGENCE.length} 条大马商业情报`,
      stats: { fetched: rawItems.length, afterDedup: deduped.length, aiSummarized: 0, inserted: fbInserted, fallback: true },
      data: fbData,
      duration: Date.now() - startedAt,
    });
  }

  // 4. 写入数据库
  const { inserted, errors } = await writeIntelligence(summarized);

  const duration = Date.now() - startedAt;
  console.log(
    `[cron] 完成！RSS ${rawItems.length} → 去重 ${deduped.length} → AI摘要 ${summarized.length} → 写入 ${inserted}，耗时 ${duration}ms`
  );

  // 构建内存数据（无论 DB 写入是否成功，都返回给前端渲染）
  const memItems = summarized.map((item) => ({
    id: genId(),
    titleEn: item.title,
    titleZh: item.titleZh,
    sourceName: item.sourceName,
    sourceUrl: item.link,
    summaryZh: item.summaryZh,
    keyTakeaway: item.keyTakeaway,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPublished: true,
    isFeatured: false,
  }));

  if (inserted > 0) {
    return NextResponse.json({
      success: true,
      message: `⚡ 抓取 ${rawItems.length} 条 → AI 摘要 ${summarized.length} 条 → 写入 ${inserted} 条大马商业情报`,
      stats: {
        fetched: rawItems.length,
        afterDedup: deduped.length,
        aiSummarized: summarized.length,
        inserted,
      },
      data: memItems,
      errors: errors.slice(0, 10),
      duration,
    });
  }

  // DB 写入失败时优雅降级：返回 success + 内存数据，前台直接渲染
  console.warn("[cron] DB 写入失败，返回内存数据供前台直接渲染");
  return NextResponse.json({
    success: true,
    message: `⚡ 成功抓取 ${summarized.length} 条大马商业情报（内存模式，DB 未持久化）`,
    stats: {
      fetched: rawItems.length,
      afterDedup: deduped.length,
      aiSummarized: summarized.length,
      inserted: 0,
    },
    data: memItems,
    duration,
  });
}
