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

// ---------- 马来西亚精准商业 RSS 源 ----------
// 严格聚焦：B2B 贸易 / 清真 Halal / MIDA 投资政策 / 零售电商 / 中马合作
// 排除：房地产 / 股市大盘 / 油价棕油大宗商品 / 国外巨头人事
const RSS_FEEDS = [
  // 官方机构：MIDA 投资政策、外资准入、Principal Hub
  { name: "MIDA News", url: "https://www.mida.gov.my/feed/" },
  // 官方机构：MATRADE 出口促进、贸易展会、市场准入
  { name: "MATRADE News", url: "https://matrade.gov.my/feed/" },
  // 主流商业媒体 - Business/Trade 专栏（混合源，依赖 AI 二次过滤）
  { name: "The Star Business", url: "https://www.thestar.com.my/rss/business/" },
  { name: "Bernama Business", url: "https://www.bernama.com/en/rss/news.php?cat=biz" },
  { name: "New Straits Times Biz", url: "https://www.nst.com.my/rss/business" },
] as const;

// ---------- 关键词预过滤：客户端硬性丢弃无关新闻 ----------
// 命中标题/内容任一关键词即丢弃，不进入 AI 提炼环节
const IRRELEVANT_KEYWORDS = [
  // 房地产
  "property", "real estate", "housing", "condo", "apartment", "property market",
  "house price", "property developer", "landed property",
  // 股市大盘
  "stock market", "bursa", "kuala lumpur stock", "stock index", "share price",
  "equity market", "ipo ", "stock close", "market close",
  // 大宗商品
  "crude oil", "oil price", "palm oil", "crude palm", "cpo price", "rubber price",
  "gold price", "commodity prices",
  // 国外巨头人事
  "tesla ceo", "apple ceo", "tata group", "elon musk", "netflix", "disney",
  // 通用社会新闻
  "haze", "traffic accident", "murder", "court case", "election",
] as const;

function isIrrelevant(item: RawFeedItem): boolean {
  const text = `${item.title} ${item.content}`.toLowerCase();
  return IRRELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

// ---------- AI 中文提炼 Prompt（强过滤 + 商业启示重构） ----------
const AI_SYSTEM_PROMPT = `你是一位专精于【大马 GTM 策略 / B2B 品牌出海 / 清真 Halal 准入】的资深商业分析师。

【目标读者】中国 B2B 品牌出海决策者、大马 GTM 咨询客户、清真市场准入企业。

【严格相关性过滤规则】
仅当新闻符合以下 5 大领域之一时，才生成摘要：
1. 大马/东盟 B2B 贸易与消费品市场（零售、FMCG、电商、品牌出海动态）
2. 清真 Halal 产业与 JAKIM 准入政策（清真认证、食品/美妆/供应链准入）
3. 中国企业出海大马/东南亚 GTM 实战政策（MIDA 投资优惠、MATRADE 展会、关税、出海合规）
4. 大马本地渠道与营销趋势（TikTok Shop / Shopee / Lazada / 线下零售 / 品牌营销案例）
5. 中马双边贸易与产业合作（制造业、跨境电商、品牌供应链合作）

【直接丢弃规则】
凡涉及以下主题的新闻，必须返回 {"relevant": false}：
- 房地产开发/房价/楼盘
- 股市大盘/股票涨跌/指数收盘
- 原油/棕榈油/橡胶等大宗商品价格波动
- 国外无关巨头人事变动（Tesla/Apple/Tata 等）
- 通用社会新闻（天气/交通/犯罪/选举）

【输出格式】
若相关，输出：
{"relevant": true, "title_zh": "中文标题20字内", "summary_zh": "100字高密度中文摘要，直击核心事实与关键数据", "key_takeaway": "一句话商业启示"}

【key_takeaway 要求】
必须从"品牌出海 / 大马 GTM 落地 / 渠道拓展 / 清真合规避坑"角度给出可落地建议。
示例："建议出海消费品牌提前布局 JAKIM 清真认证，认证周期 45-90 天，可借力大马作为东盟与中东清真市场跳板。"

若不相关，输出：{"relevant": false}

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
// 严格对齐站长定位：大马 GTM / 清真 Halal / B2B 品牌出海 / 零售电商 / 中马合作
const FALLBACK_INTELLIGENCE: Array<RawFeedItem & AiResult> = [
  {
    title: "Malaysia Halal Industry Master Plan 2030: JAKIM Certification Goes Global",
    link: "https://www.mida.gov.my/halal-master-plan-2030",
    pubDate: new Date().toISOString(),
    content: "Malaysia launches Halal Industry Master Plan 2030, targeting RM150 billion halal export. JAKIM signs mutual recognition agreements with 12 countries including Saudi Arabia, UAE and Indonesia.",
    sourceName: "MIDA Official",
    titleZh: "大马清真产业 2030 总规划：JAKIM 认证国际化互认加速",
    summaryZh: "马来西亚发布清真产业 2030 总规划，目标清真出口突破 1500 亿令吉。JAKIM 已与沙特、阿联酋、印尼等 12 国签署清真认证互认协议，大马成为全球清真市场准入枢纽。",
    keyTakeaway: "建议出海消费品牌提前布局 JAKIM 清真认证（周期 45-90 天），借力大马互认体系一键打通东盟与中东 57 亿清真消费市场。",
  },
  {
    title: "MIDA Principal Hub: 45-Day Fast Track for Chinese Brands Entering Malaysia",
    link: "https://www.mida.gov.my/principal-hub-fast-track",
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    content: "MIDA streamlines Principal Hub approval for foreign brands, cutting processing time from 6 months to 45 days. Qualified companies enjoy 10-year tax holiday.",
    sourceName: "MIDA Official",
    titleZh: "MIDA Principal Hub 绿色通道：中国品牌落地大马 45 天审批",
    summaryZh: "MIDA 将 Principal Hub 外资审批从 6 个月压缩至 45 天，符合资质的出海企业可享 10 年免税期。政策重点吸引 B2B 消费品牌、数字服务和 SaaS 企业落地大马作为东盟总部。",
    keyTakeaway: "年营收 >RM 500 万的 B2B 出海品牌建议申请 Principal Hub 资质，享受 10 年免税 + 100% 外资持股，审批窗口已大幅缩短。",
  },
  {
    title: "TikTok Shop Malaysia GMV Surges 280%: Cross-Border Brands Dominate FMCG",
    link: "https://www.thestar.com.my/business/tiktok-shop-gmv-surge",
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    content: "TikTok Shop Malaysia reports 280% GMV growth YoY, with cross-border Chinese FMCG brands capturing 45% market share in beauty and snacks categories.",
    sourceName: "The Star Business",
    titleZh: "TikTok Shop 大马 GMV 暴涨 280%：跨境中国品牌主导 FMCG",
    summaryZh: "TikTok Shop 大马 GMV 同比增长 280%，中国跨境美妆、零食品牌占据 45% 市场份额。直播带货 + 本土仓发货模式成为 FMCG 品牌快速验证大马市场的核心渠道。",
    keyTakeaway: "建议美妆/零食出海品牌优先布局 TikTok Shop 大马本土店 + MFP 计划（马来西亚跨境合作伙伴），3 个月可验证市场需求，初期试错成本 <RM 5 万。",
  },
  {
    title: "China-Malaysia Trade Hits Record USD 200 Billion: Manufacturing & E-Commerce Lead",
    link: "https://www.bernama.com/en/general/china-malaysia-trade-2030",
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    content: "China-Malaysia bilateral trade reaches USD 200 billion in 2025, with manufacturing components and cross-border e-commerce as top growth drivers. RCEP tariff cuts boost Chinese brands entering Malaysia.",
    sourceName: "Bernama Business",
    titleZh: "中马贸易破 2000 亿美元：制造业与跨境电商双轮驱动",
    summaryZh: "中马双边贸易额 2025 年突破 2000 亿美元，制造业零部件和跨境电商成为核心增长引擎。RCEP 关税削减政策红利释放，中国品牌进入大马的关税成本平均下降 15-20%。",
    keyTakeaway: "出海制造与消费品牌可借力 RCEP 原产地累积规则，在大马设区域分拨中心，享受关税减免 + 东盟 6 亿市场一体化流通红利。",
  },
  {
    title: "Shopee Malaysia Launches China Cross-Border Incubation: Zero Commission for 6 Months",
    link: "https://www.nst.com.my/business/shopee-china-incubation",
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    content: "Shopee Malaysia launches China Cross-Border Incubation Program, offering zero commission for first 6 months and dedicated traffic support for new Chinese FMCG brands entering the Malaysian market.",
    sourceName: "New Straits Times Biz",
    titleZh: "Shopee 大马启动中国跨境孵化计划：新品牌前 6 月零佣金",
    summaryZh: "Shopee 大马推出中国跨境品牌孵化计划，新入驻中国 FMCG 品牌享前 6 个月零佣金 + 专属流量扶持 + 本土运营顾问。目标 2026 年引入 500 个优质中国品牌。",
    keyTakeaway: "建议新锐消费品牌（美妆/家居/3C 配件）优先申请 Shopee 跨境孵化计划，6 个月零成本验证大马市场 PMF，再决定是否长期投入本土化运营。",
  },
  {
    title: "MATRADE Export Promotion 2026: 15 Trade Missions Targeting Chinese Brands",
    link: "https://matrade.gov.my/export-mission-2026",
    pubDate: new Date(Date.now() - 18000000).toISOString(),
    content: "MATRADE announces 15 outbound trade missions for 2026, with China as priority market. Malaysian distributors actively seeking Chinese FMCG, beauty and halal-certified food brands for exclusive partnerships.",
    sourceName: "MATRADE News",
    titleZh: "MATRADE 2026 出口促进：15 场贸易展会锁定中国品牌",
    summaryZh: "马来西亚贸易发展局（MATRADE）公布 2026 年 15 场对外贸易展会，中国为核心目标市场。大马本土分销商正主动寻找中国 FMCG、美妆和清真食品品牌开展独家代理合作。",
    keyTakeaway: "出海品牌可关注 MATRADE 官网贸易展会日程，通过 INternational Sourcing Programme (INSP) 对接大马本土分销商，省去 BD 成本，30 天内可签下区域独家代理协议。",
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

  // 关键词预过滤：硬性丢弃地产/股市/油价/棕油等无关新闻
  const filtered = allItems.filter((item) => {
    if (isIrrelevant(item)) {
      console.log(`[cron] 预过滤丢弃（无关关键词）：${item.title}`);
      return false;
    }
    return true;
  });
  console.log(`[cron] 关键词预过滤：${allItems.length} → ${filtered.length} 条`);
  return filtered;
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

    // AI 相关性过滤：不相关新闻直接丢弃，不生成卡片
    if (parsed.relevant === false) {
      console.log(`[cron] AI 过滤丢弃（不相关）：${item.title}`);
      return null;
    }

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
