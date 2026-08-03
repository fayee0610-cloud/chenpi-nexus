import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createProject } from "@/lib/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/projects/create
// 新建作品案例，成功后触发前台缓存刷新
// 请求头：Authorization: Bearer <CR_API_SECRET>
// 请求体：{ title, subTitle?, category, role?, date?, image?, challenge?, metrics?, solutions? }
export async function POST(req: NextRequest) {
  try {
    // 1. Bearer Token 验证（未配置 CR_API_SECRET 则放行，本地开发友好）
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedSecret = process.env.CR_API_SECRET;
    if (expectedSecret && token !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Token 验证失败，无权创建" },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await req.json();
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "字段 title 必填且不能为空" },
        { status: 400 }
      );
    }
    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 category 必填" },
        { status: 400 }
      );
    }

    // 3. 调用创建函数
    const result = await createProject({
      title: body.title,
      subTitle: body.subTitle || "",
      category: body.category,
      role: body.role || "",
      date: body.date || "",
      image: body.image || "",
      challenge: body.challenge || "",
      metrics: Array.isArray(body.metrics) ? body.metrics : [],
      solutions: Array.isArray(body.solutions) ? body.solutions : [],
    });

    // 4. 触发前台缓存刷新（零延迟同步）
    try {
      revalidatePath("/");
      revalidatePath("/portfolio");
    } catch (revalidateErr) {
      console.warn("[api/projects/create] revalidatePath 失败（不影响数据创建）:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "作品案例已创建，前台缓存已刷新",
    });
  } catch (err: any) {
    console.error("[api/projects/create] 错误:", err);
    return NextResponse.json(
      { success: false, error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET 返回接口说明
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/projects/create",
    method: "POST",
    description: "作品案例创建 API，成功后自动触发前台缓存刷新",
    auth: "Bearer Token (CR_API_SECRET) - 未配置则放行",
    fields: {
      title: "string (必填) - 标题",
      subTitle: "string (可选) - 副标题",
      category: "string (必填) - 分类",
      role: "string (可选) - 角色",
      date: "string (可选) - 执行时间",
      image: "string (可选) - 封面图 URL",
      challenge: "string (可选) - 项目挑战",
      metrics: "array (可选) - 核心数据标尺",
      solutions: "array (可选) - 破局战术",
    },
    sideEffects: "成功后自动 revalidatePath('/', '/portfolio')",
  });
}
