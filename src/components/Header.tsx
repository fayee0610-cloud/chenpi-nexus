"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu } from "lucide-react";
import type { SiteConfig } from "@/lib/dataApi";

interface HeaderProps {
  config?: Partial<SiteConfig> | null;
}

// 全部导航项 + 对应的显隐开关 key（config 中对应字段为 false 时隐藏）
const ALL_NAV_ITEMS: { label: string; href: string; flag?: keyof SiteConfig }[] = [
  { label: "作品集", href: "/portfolio", flag: "show_portfolio" },
  { label: "情报站", href: "/hub", flag: "show_insights_hub" },
  { label: "灵感点", href: "/insights", flag: "show_insights" },
  { label: "资源包", href: "/resources", flag: "show_resources" },
  { label: "庇护所", href: "/sanctuary", flag: "show_sanctuary" },
  { label: "联系我", href: "/#connect" },
];

export default function Header({ config }: HeaderProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  // 根据站点配置过滤导航项：无 flag 的项始终显示，有 flag 的项在 config[flag] !== false 时显示
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.flag) return true;
    return config?.[item.flag] !== false;
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-100">
            陈皮同学
          </span>
          <span className="hidden text-xs font-medium text-zinc-500 sm:inline">
            My Neural Hub
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100">
            登录
          </button>
          <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200">
            注册
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-zinc-800/60 bg-zinc-950 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3 border-t border-zinc-800/60 pt-4">
                <button className="flex-1 rounded-lg py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100">
                  登录
                </button>
                <button className="flex-1 rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-950 hover:bg-zinc-200">
                  注册
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
