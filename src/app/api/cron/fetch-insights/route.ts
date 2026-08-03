import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInsightHubViaAPI } from "@/lib/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel 函数最大执行时长

// ============================================================
// /api/cron/fetch-insights
// 全自动 Cron Job：搜索 → AI 提炼 → 写入 insights_hub
// 安全校验：CRON_SECRET 环境变量
// 触发方式：Vercel Cron / 外部定时器 GET/POST 带 ?secret=xxx
// ============================================================

// ---------- AI 配置 ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 搜索关键词（覆盖三大分类） ----------
const SEARCH_QUERIES = [
  // 🤖 机器人/具身智能
  "智元机器人 最新动态 2025",
  "宇树科技 人形机器人 2025",
  "逐际动力 具身智能 2025",
  // 💡 AI技术/大厂策略
  "OpenAI Anthropic 商业化策略 2025",
  "华为 大模型 GTM 2025",
  "Google DeepMind 最新发布 2025",
  // 📈 品牌策略/GTM干货
  "Apple Tesla 品牌策略 发布会 2025",
  "Anker DJI 品牌定位 出海 2025",
  "ToB SaaS PLG GTM 策略 2025",
];

// ---------- 陈皮硬核筛选 Prompt ----------
const SYSTEM_PROMPT = `你是一个极度挑剔的科技商业情报编辑，名为"陈皮"。

## 你的任务
从用户提供的搜索结果中，筛选出具备商业价值的硬核情报，并按照严格标准提炼。

## 正向聚焦（仅接受以下内容）
1. **ToC 知名科技品牌策略**：Apple, Tesla, Dyson, Anker, DJI 等品牌定位、发布会叙事、情绪价值、IMC 营销。
2. **ToB 科技与 AI 公司 GTM 策略**：OpenAI, Anthropic, Palantir, HubSpot 等 Demand Gen, PLG, Thought Leadership, ABM。
3. **具身智能与科技大厂动态**：智元机器人, 宇树科技, 逐际动力, 华为/Google 实验室。

## 绝对拦截（以下内容必须丢弃，不得输出）
- 跨境电商（Shopee/Lazada/Amazon）、东南亚/拉美/中东本土化选品
- 低价铺货、买量投流、TikTok 刷粉
- 泛泛而谈的公关软文或微观政策解读
- 与品牌策略/AI技术/具身智能无关的泛资讯

## 输出格式
返回 JSON 数组，每个元素代表一条通过筛选的情报：
\`\`\`json
[
  {
    "title": "简洁有力的标题（20字以内）",
    "category": "🤖 机器人/具身智能" | "💡 AI技术/大厂策略" | "📈 品牌策略/GTM干货",
    "summary": "陈皮式 100 字核心看点，必须包含商业价值提炼，不要泛泛而谈",
    "source_name": "数据来源（如：智元机器人官方 / 36Kr 深度）",
    "original_url": "原文链接",
    "tags": ["标签1", "标签2"]
  }
]
\`\`\`

如果搜索结果中没有通过筛选的硬核内容，返回空数组 \`[]\`。
不要输出任何其他文字，只返回 JSON。`;

// ---------- 搜索函数（Bing Search API 或降级 RSS） ----------
async function searchWeb(query: string): Promise<{ title: string; snippet: string; url: string; source: string }[]> {
  // 方案一：Bing Search API（如配置了 BING_API_KEY）
  const bingKey = process.env.BING_API_KEY;
  if (bingKey) {
    try {
      const res = await fetch(
        `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=5&mkt=zh-CN`,
        {
          headers: { "Ocp-Apim-Subscription-Key": bingKey },
        }
      );
      if (res.ok) {
        const data = await res.json();
        return (data.value || []).map((item: any) => ({
          title: item.name || "",
          snippet: item.description || "",
          url: item.url || "",
          source: item.provider?.[0]?.name || "Bing Search",
        }));
      }
    } catch {}
  }

  // 方案二：DuckDuckGo HTML 搜索（无需 API Key）
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " 2025")}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      }
    );
    if (res.ok) {
      const html = await res.text();
      const results: { title: string; snippet: string; url: string; source: string }[] = [];
      // 简易 HTML 解析提取结果
      const titleRegex = /<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/g;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      const urlRegex = /<a[^>]*class="result__a"[^>]*href="(.*?)"/g;

      const titles = [...html.matchAll(titleRegex)].map((m) => m[1].replace(/<[^>]*>/g, "").trim()).slice(0, 5);
      const snippets = [...html.matchAll(snippetRegex)].map((m) => m[1].replace(/<[^>]*>/g, "").trim()).slice(0, 5);
      const urls = [...html.matchAll(urlRegex)].map((m) => m[1]).slice(0, 5);

      for (let i = 0; i < Math.min(titles.length, snippets.length, urls.length); i++) {
        results.push({
          title: titles[i],
          snippet: snippets[i],
          url: urls[i] || "",
          source: "DuckDuckGo",
        });
      }
      return results;
    }
  } catch {}

  return [];
}

// ---------- AI 提炼函数 ----------
async function aiRefine(searchResults: { title: string; snippet: string; url: string; source: string }[]): Promise<RefinedItem[]> {
  if (!AI_CONFIG.apiKey) {
    console.log("[cron] AI API Key 未配置，跳过提炼");
    return [];
  }

  // 拼装搜索结果为文本
  const input = searchResults
    .map((r, i) => `[${i + 1}] 标题：${r.title}\n摘要：${r.snippet}\n链接：${r.url}\n来源：${r.source}`)
    .join("\n\n");

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
          { role: "user", content: `以下是搜索到的最新资讯，请筛选并提炼：\n\n${input}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      console.log("[cron] AI 调用失败:", res.status);
      return [];
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 提取 JSON 数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("[cron] AI 返回内容无 JSON 数组");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item: any) =>
        item.title &&
        item.category &&
        item.summary &&
        item.source_name &&
        item.original_url
    );
  } catch (err) {
    console.error("[cron] AI 提炼错误:", err);
    return [];
  }
}

type RefinedItem = {
  title: string;
  category: string;
  summary: string;
  source_name: string;
  original_url: string;
  tags: string[];
};

// ---------- 去重函数：检查已存在的情报 ----------
async function deduplicate(
  supabase: any,
  newItems: RefinedItem[]
): Promise<RefinedItem[]> {
  if (!supabase) return newItems;

  try {
    const { data } = await supabase
      .from("insights_hub")
      .select("title, original_url");

    if (!data) return newItems;

    const existingUrls = new Set(data.map((r: any) => r.original_url));
    const existingTitles = new Set(data.map((r: any) => r.title));

    return newItems.filter(
      (item) => !existingUrls.has(item.original_url) && !existingTitles.has(item.title)
    );
  } catch {
    return newItems;
  }
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

  // 1. 安全校验
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const querySecret = req.nextUrl.searchParams.get("secret") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (token !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json({ success: false, error: "未授权：CRON_SECRET 验证失败" }, { status: 401 });
    }
  }

  console.log("[cron/fetch-insights] 开始执行情报抓取流水线...");

  // 2. 执行搜索（取前 6 个查询，避免超时）
  const queries = SEARCH_QUERIES.slice(0, 6);
  let allResults: { title: string; snippet: string; url: string; source: string }[] = [];

  for (const query of queries) {
    try {
      const results = await searchWeb(query);
      allResults.push(...results);
      console.log(`[cron] 搜索 "${query}" → ${results.length} 条结果`);
    } catch (err) {
      console.log(`[cron] 搜索 "${query}" 失败:`, err);
    }
  }

  if (allResults.length === 0) {
    return NextResponse.json({
      success: true,
      message: "未搜索到任何结果",
      searched: queries.length,
      refined: 0,
      inserted: 0,
      duration: Date.now() - startedAt,
    });
  }

  // 3. AI 提炼
  const refined = await aiRefine(allResults);
  console.log(`[cron] AI 提炼完成 → ${refined.length} 条通过筛选`);

  if (refined.length === 0) {
    return NextResponse.json({
      success: true,
      message: "AI 筛选后无符合硬核标准的内容",
      searched: allResults.length,
      refined: 0,
      inserted: 0,
      duration: Date.now() - startedAt,
    });
  }

  // 4. 去重
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseClient =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const deduped = await deduplicate(supabaseClient, refined);
  console.log(`[cron] 去重后 → ${deduped.length} 条待写入（原 ${refined.length} 条）`);

  // 5. 写入数据库
  let inserted = 0;
  let errors: string[] = [];

  for (const item of deduped) {
    const result = await createInsightHubViaAPI({
      title: item.title,
      category: item.category,
      summary: item.summary,
      source_name: item.source_name,
      original_url: item.original_url,
      tags: item.tags || [],
    });

    if (result.success) {
      inserted++;
    } else {
      errors.push(`${item.title}: ${result.error}`);
    }
  }

  const duration = Date.now() - startedAt;
  console.log(`[cron/fetch-insights] 完成！写入 ${inserted} 条，耗时 ${duration}ms`);

  return NextResponse.json({
    success: true,
    message: `情报抓取完成：搜索 ${allResults.length} 条 → AI 筛选 ${refined.length} 条 → 去重 ${deduped.length} 条 → 写入 ${inserted} 条`,
    stats: {
      searched: allResults.length,
      refined: refined.length,
      deduplicated: deduped.length,
      inserted,
      errors: errors.slice(0, 5),
    },
    duration,
  });
}
