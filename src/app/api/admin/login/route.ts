// ============================================================
// /api/admin/login — 后台登录验证 API
// 密码通过服务端 ADMIN_PASSWORD 环境变量比对，不暴露到客户端
// ============================================================

import { NextResponse } from "next/server";

// 简单 token：Base64 编码 + 过期时间戳（非高安全场景，仅供单用户管理后台使用）
function generateToken(): string {
  const payload = {
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 8, // 8 小时过期
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "服务器未配置管理员密码 (ADMIN_PASSWORD)" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    const token = generateToken();
    // 同时设置 cookie，使所有 /api/admin/* 路由均可通过 req.cookies 读取鉴权
    const res = NextResponse.json({ success: true, token });
    res.cookies.set("admin_token", token, {
      httpOnly: false, // 允许客户端 JS 读取（与 localStorage 双写一致）
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 小时，与 token exp 一致
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "请求解析失败" },
      { status: 400 }
    );
  }
}
