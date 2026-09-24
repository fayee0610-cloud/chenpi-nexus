"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

/**
 * 太阳 / 月亮 主题切换按钮
 * - 挂载前以透明占位渲染，避免 SSR 与客户端主题不一致导致的 hydration 闪烁
 * - 点击在 light <-> dark 之间切换；持久化由 next-themes 写入 localStorage
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  // mounted 前用中性 label，避免 SSR(theme=undefined) 与客户端(theme="dark") 的 hydration mismatch
  const label = !mounted ? "切换主题" : isDark ? "切换至亮色模式" : "切换至暗色模式";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 transition-all duration-300 hover:border-blue-500/60 hover:text-blue-400 hover:shadow-[0_0_16px_rgba(59,130,246,0.25)] ${className}`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[18px] w-[18px] transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-12" />
        )
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
