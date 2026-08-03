import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateProject } from "@/lib/dataApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/projects/update
// 编辑作品案例（无限次修改），成功后触发前台缓存刷新
// 请求头：Authorization: Bearer <CR_API_SECRET>
// 请求体：{ id, title?, subTitle?, category?, role?, date?, image?, challenge?, metrics?, solutions? }
export async function POST(req: NextRequest) {
  try {
    // 1. Bearer Token 验证
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedSecret = process.env.CR_API_SECRET;

    // 若配置了 CR_API_SECRET 则校验，未配置则放行（本地开发友好）
    if (expectedSecret && token !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Token 验证失败，无权修改" },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "字段 id 必填且必须为字符串" },
        { status: 400 }
      );
    }

    // 3. 调用更新函数
    const result = await updateProject(id, updateFields);

    // 4. 触发前台缓存刷新（零延迟同步）
    try {
      revalidatePath("/");
      revalidatePath("/portfolio");
      revalidatePath(`/portfolio/${id}`);
    } catch (revalidateErr) {
      console.warn("[api/projects/update] revalidatePath 失败（不影响数据更新）:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "作品案例已更新，前台缓存已刷新",
    });
  } catch (err: any) {
    console.error("[api/projects/update] 错误:", err);
    return NextResponse.json(
      { success: false, error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET 返回接口说明
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/projects/update",
    method: "POST",
    description: "作品案例编辑更新 API（支持无限次修改）",
    auth: "Bearer Token (CR_API_SECRET) - 未配置则放行",
    fields: {
      id: "string (必填) - 作品 ID",
      title: "string (可选) - 标题",
      subTitle: "string (可选) - 副标题",
      category: "string (可选) - 分类",
      role: "string (可选) - 角色",
      date: "string (可选) - 执行时间",
      image: "string (可选) - 封面图 URL",
      challenge: "string (可选) - 项目挑战",
      metrics: "array (可选) - 核心数据标尺",
      solutions: "array (可选) - 破局战术",
    },
    sideEffects: "成功后自动 revalidatePath('/', '/portfolio', '/portfolio/[id]')",
  });
}
