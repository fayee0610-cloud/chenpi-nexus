"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * 全站主题 Provider —— 驱动亮色 / 暗色自由切换
 * 默认跟随系统偏好，用户手动切换后持久化至 localStorage。
 * 通过 class 属性写入 .dark / .light 到 <html>，由 Tailwind v4 + globals.css 变量接管渲染。
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
