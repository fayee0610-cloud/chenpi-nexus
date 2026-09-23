// /api/admin/generate-summary — AI 一键提炼 GEO 摘要
// 复用项目现有 DeepSeek API（AI_API_KEY / AI_BASE_URL / AI_MODEL_NAME）
// 返回：{ summary }（100-150 字高信息密度 GEO 摘要）

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- 环境变量（与 ai-format 路由同源） ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 管理员鉴权 ----------
function isAdmin(req: NextRequest): boolean {
  let token = req.cookies.get("admin_token")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return payload?.role === "admin" && typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- System Prompt ----------
const SYSTEM_PROMPT = `你是一位专精于 GEO（AI 搜索引擎优化）的内容专家。请根据以下文章标题和正文，提炼一段 100-150 字的高信息密度 GEO 摘要。要求：语言干练严肃，包含核心事实与战略观点，适合作为 JSON-LD Schema 中的 description 供 Perplexity/SearchGPT 提炼引用。`;

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
    const { title, content } = await req.json();
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
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `文章标题：${title || "（未提供）"}\n\n正文内容：\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LLM_ERROR_${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content;
    if (!summary) throw new Error("LLM 返回空内容");

    // 清洗：去除可能的 markdown 代码块包裹与多余引号
    let cleaned = summary.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    cleaned = cleaned.replace(/^["'\u201c\u201d]|["'\u201c\u201d]$/g, "").trim();

    return NextResponse.json({
      success: true,
      summary: cleaned.slice(0, 300), // 上限保护
    });
  } catch (err: any) {
    console.error("[admin/generate-summary] 失败:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "AI 摘要生成失败，请稍后再试" },
      { status: 500 }
    );
  }
}
