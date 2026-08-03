// ============================================================
// /api/intelligence/generate — AI 情报自动生成接口
// 结合 DeepSeek/AI 模型，根据预设关键词自动分析生成结构化情报列表
// 返回格式：[{ title, category, summary, source_name, original_url, published_at, tags }]
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------- AI 配置 ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com/v1",
  model: process.env.AI_MODEL_NAME || "deepseek-chat",
};

// ---------- 预设关键词主题 ----------
const INTELLIGENCE_TOPICS = [
  {
    category: "🤖 机器人/具身智能",
    keywords: "人形机器人、具身智能、AI硬件、机器人商业化落地、特斯拉Optimus、宇树科技、智元机器人",
  },
  {
    category: "💡 AI技术/大厂策略",
    keywords: "大模型、AGI、OpenAI、DeepSeek、字节跳动AI、百度文心、AI Agent、MCP协议、RAG、多模态",
  },
  {
    category: "📈 品牌策略/GTM干货",
    keywords: "品牌出海、跨境电商、DTC品牌、GTM策略、私域运营、内容营销、大湾区创业、人才生态",
  },
];

// ---------- AI 情报生成 Prompt ----------
function buildPrompt(topic: { category: string; keywords: string }) {
  return `你是一位资深的科技与商业情报分析师。请根据以下关键词主题，生成 3 条最新的结构化情报。

【主题分类】${topic.category}
【关键词】${topic.keywords}

要求：
1. 每条情报必须包含：title（标题）、summary（核心看点提炼，50-100字）、source_name（来源名称，如"36氪"、"机器之心"等真实媒体）、original_url（来源链接，使用真实URL）、published_at（发布日期，格式YYYY-MM-DD）、tags（2-3个标签数组）
2. 内容必须真实、有洞察力，聚焦该领域最新趋势和商业化进展
3. summary 要提炼核心价值，避免空洞描述
4. 严格输出 JSON 数组格式，不要包含任何其他文字

输出格式示例：
[
  {
    "title": "xxx公司发布新一代人形机器人",
    "summary": "该机器人采用xxx技术，在xxx场景实现突破...",
    "source_name": "36氪",
    "original_url": "https://36kr.com/p/xxx",
    "published_at": "2025-01-15",
    "tags": ["人形机器人", "商业化"]
  }
]`;
}

// ---------- 调用 AI API ----------
async function callAI(prompt: string): Promise<string> {
  const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        { role: "system", content: "你是一位专业的科技商业情报分析师，擅长提炼核心信息和趋势洞察。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API 请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------- 解析 AI 返回的 JSON ----------
function parseAIResponse(content: string): any[] {
  // 尝试提取 JSON 数组
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item.title && item.summary
    );
  } catch {
    return [];
  }
}

// ---------- URL 协议校验 ----------
function ensureValidUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function POST(request: NextRequest) {
  try {
    // 检查 AI API 配置
    if (!AI_CONFIG.apiKey) {
      return NextResponse.json(
        { success: false, error: "AI API 未配置，请设置 AI_API_KEY 环境变量", items: [] },
        { status: 500 }
      );
    }

    // 可选：从请求体获取指定主题（默认生成全部三大主题）
    let topics = INTELLIGENCE_TOPICS;
    try {
      const body = await request.json();
      if (body.topic) {
        const matched = INTELLIGENCE_TOPICS.find((t) => t.category === body.topic);
        if (matched) topics = [matched];
      }
    } catch {
      // 无 body 时使用默认全部主题
    }

    // 并行调用 AI 生成各主题情报
    const results = await Promise.allSettled(
      topics.map(async (topic) => {
        const prompt = buildPrompt(topic);
        const aiContent = await callAI(prompt);
        const items = parseAIResponse(aiContent);
        // 数据清洗 + 统一格式
        return items.map((item: any) => ({
          title: String(item.title || "").slice(0, 200),
          category: topic.category,
          summary: String(item.summary || "").slice(0, 500),
          source_name: String(item.source_name || "AI生成"),
          original_url: ensureValidUrl(String(item.original_url || "")),
          published_at: String(item.published_at || new Date().toISOString().slice(0, 10)),
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [],
          api_source: "ai_generated",
        }));
      })
    );

    // 合并所有成功的结果
    const allItems: any[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allItems.push(...result.value);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI 生成内容为空，请稍后重试", items: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: allItems,
      count: allItems.length,
    });
  } catch (err: any) {
    console.error("[intelligence/generate] 错误:", err);
    return NextResponse.json(
      { success: false, error: err.message || "AI 情报生成失败", items: [] },
      { status: 500 }
    );
  }
}

// ---------- GET：快速生成并预览（不写入数据库） ----------
export async function GET() {
  return POST(new NextRequest("http://localhost/api/intelligence/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }));
}
