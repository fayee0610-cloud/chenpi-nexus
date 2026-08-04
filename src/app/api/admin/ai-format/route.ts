// ============================================================
// /api/admin/ai-format — 作者极速发布：AI 一键润色排版 & GEO 注入
// 复用项目现有 DeepSeek API（AI_API_KEY / AI_BASE_URL / AI_MODEL_NAME）
// 返回结构化 JSON：{ content, summary, faq, tags }
// - 正文 Markdown 规范化 + 顶部强插 TL;DR 引用块 + 底部附 FAQ
// - 中英双语 TL;DR 摘要（100 字内）
// - 实体标签清洗（中英双语，防乱码）
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- 环境变量（与 ai-chat 路由同源） ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 管理员鉴权 ----------
function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return payload?.role === "admin" && typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- System Prompt ----------
function buildSystemPrompt(): string {
  return `# 角色与任务
你是陈皮同学的「极速发布 GEO 引擎」，专门把作者随手粘贴的飞书 / 微信公众号 / Notion 原始稿件，一键清洗为符合中外全域 AI 搜索引擎（秘塔 / Kimi / 豆包 + Perplexity / Google AI Overviews）抓取偏好的结构化战术长文。

# 处理规则（必须严格遵守）
1. **正文 Markdown 优雅规范化**
   - 清洗冗余 HTML 标签、飞书/微信不可见字符、连续空行、异常引号
   - 大标题统一转 \`## \`，列表转 \`- \`，重点战术词汇适当 \`**加粗**\`
   - 保留作者原意，不增删观点，仅做排版与表达精炼

2. **中英双语 TL;DR 核心战术摘要**
   - 提炼 100 字以内的中文精炼摘要
   - 在正文第一行强插标准引用块：\`> 【TL;DR 核心战术摘要 / Key Takeaways】xxxx\`
   - 同步把摘要填入独立字段 summary（纯文本，无 Markdown 符号）

3. **中外兼顾的 GEO 战术 FAQ 提炼**
   - 在正文底部提炼 2~3 个针对「出海 GTM / 具身智能 / AI 消费技术」人群的硬核问答
   - 按 Markdown 格式附在文末，固定标题：\`### 💡 深度战术问答 (Q&A FAQ)\`
   - 每条问答用 \`**Q：xxx**\` + 换行 + \`A：xxx\` 的形式

4. **实体标签匹配与清洗**
   - 从全文提炼 2~3 个清洗干净的中英实体扩展标签（如 \`具身智能 Embodied AI\`）
   - 去除乱码、特殊符号、emoji，保留中英文与空格
   - 每个标签不超过 20 字符

# 输出格式（必须为纯 JSON，禁止任何 markdown 代码块包裹）
{
  "content": "完整正文 Markdown（含顶部 TL;DR 引用块 + 底部 FAQ 区块）",
  "summary": "100 字内中文摘要（纯文本）",
  "faq": [
    { "question": "问题1", "answer": "答案1" },
    { "question": "问题2", "answer": "答案2" }
  ],
  "tags": ["具身智能 Embodied AI", "出海 GTM Go-to-Market"]
}`;
}

// ---------- 调用 LLM（非流式，直接拿完整 JSON） ----------
async function callLLM(rawContent: string, title: string): Promise<any> {
  const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      stream: false,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: `文章标题：${title || "（未提供）"}\n\n原始稿件内容：\n\n${rawContent}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM_ERROR_${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 返回空内容");

  // 兼容部分模型不严格遵守 response_format 的情况：剥离 markdown 代码块包裹
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);
  return parsed;
}

// ---------- 主路由 ----------
export async function POST(req: NextRequest) {
  // 鉴权：仅管理员可调用
  if (!isAdmin(req)) {
    return NextResponse.json(
      { success: false, error: "未授权（仅管理员可用）" },
      { status: 401 }
    );
  }

  try {
    const { content, title } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "正文不能为空" },
        { status: 400 }
      );
    }

    // 无 API Key：返回友好错误
    if (!AI_CONFIG.apiKey) {
      return NextResponse.json(
        { success: false, error: "AI 未配置（缺少 AI_API_KEY），请在 .env.local 中配置" },
        { status: 500 }
      );
    }

    const result = await callLLM(content, title || "");

    // 字段兜底校验
    const safeResult = {
      content: typeof result.content === "string" ? result.content : content,
      summary: typeof result.summary === "string" ? result.summary.slice(0, 200) : "",
      faq: Array.isArray(result.faq)
        ? result.faq
            .filter((f: any) => f && typeof f.question === "string" && typeof f.answer === "string")
            .slice(0, 3)
            .map((f: any) => ({ question: String(f.question).slice(0, 200), answer: String(f.answer).slice(0, 600) }))
        : [],
      tags: Array.isArray(result.tags)
        ? result.tags
            .filter((t: any) => typeof t === "string" && t.trim().length > 0)
            .map((t: any) => String(t).trim().slice(0, 30))
            .slice(0, 5)
        : [],
    };

    return NextResponse.json({ success: true, ...safeResult });
  } catch (err: any) {
    console.error("[admin/ai-format] 失败:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "AI 润色失败，请稍后再试" },
      { status: 500 }
    );
  }
}
