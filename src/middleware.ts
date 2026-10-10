// ============================================================
// middleware.ts — 服务端路由级鉴权
//
// 保护 /admin 及其所有子路径：
//   未登录或 token 无效 → 302 重定向至首页 /
//   登录且 token 有效 → 放行
//
// token 格式：Base64(JSON({ role: "admin", exp: timestamp }))
// 由 /api/admin/login 下发，同时写入 cookie + localStorage
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 仅保护 /admin 页面（不拦截 /api/admin/* API 路由，它们自行校验）
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = req.cookies.get("admin_token")?.value;
    if (!isValidAdminToken(token)) {
      const loginUrl = new URL("/", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // 匹配 /admin 开头所有路径，排除 API 路由
  matcher: ["/admin", "/admin/:path*"],
};
