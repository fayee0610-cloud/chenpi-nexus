import { NextRequest, NextResponse } from "next/server";
import { createInsightHubViaAPI } from "@/lib/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/insights/create
// 自动化写入情报数据（供 Coze/n8n 等第三方工具调用）
// 请求头：Authorization: Bearer <CR_API_SECRET>
// 请求体：{ title, category, summary, source_name, original_url, tags? }
export async function POST(req: NextRequest) {
  try {
    // 1. Bearer Token 验证
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedSecret = process.env.CR_API_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { success: false, error: "服务端未配置 CR_API_SECRET 环境变量" },
        { status: 500 }
      );
    }

    if (token !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Token 验证失败，无权写入" },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await req.json();
    const { title, category, summary, source_name, original_url, tags } = body;

    // 3. 必填字段校验
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "字段 title 必填且不能为空" },
        { status: 400 }
      );
    }
    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 category 必填" },
        { status: 400 }
      );
    }
    if (!summary || typeof summary !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 summary 必填" },
        { status: 400 }
      );
    }
    if (!source_name || typeof source_name !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 source_name 必填" },
        { status: 400 }
      );
    }
    if (!original_url || typeof original_url !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 original_url 必填" },
        { status: 400 }
      );
    }

    // 4. URL 防空保护：补全协议头
    let safeUrl = original_url.trim();
    if (!safeUrl || safeUrl === "#" || safeUrl === "/") {
      safeUrl = source_name.trim();
    }
    if (!/^https?:\/\//.test(safeUrl)) {
      safeUrl = `https://${safeUrl}`;
    }

    // 5. 调用服务端写入函数（含分类白名单 + 品牌策略内容过滤）
    const result = await createInsightHubViaAPI({
      title: title.trim(),
      category: category.trim(),
      summary: summary.trim(),
      source_name: source_name.trim(),
      original_url: safeUrl,
      tags: Array.isArray(tags) ? tags : [],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "写入失败" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "情报已自动写入并发布",
    });
  } catch (err: any) {
    console.error("[api/insights/create] 错误:", err);
    return NextResponse.json(
      { success: false, error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET 返回接口说明
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/insights/create",
    method: "POST",
    description: "情报站自动化写入 API（供 Coze/n8n 等工具调用）",
    auth: "Bearer Token (CR_API_SECRET)",
    fields: {
      title: "string (必填) - 资讯标题",
      category: "string (必填) - 分类：🤖 机器人/具身智能 | ⚡ AI技术/大厂策略 | 📈 品牌策略/GTM干货",
      summary: "string (必填) - 陈皮式 100 字核心看点",
      source_name: "string (必填) - 数据来源",
      original_url: "string (必填) - 原文链接",
      tags: "string[] (可选) - 标签数组",
    },
  });
}
