"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu } from "lucide-react";
import type { SiteConfig } from "@/lib/dataApi";
import AuthModal, { useAuthUser, UserMenu } from "@/components/AuthModal";

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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuthUser();

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

        {/* Desktop Nav - 居中平衡排版 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：登录/注册 或 用户菜单 */}
        <div className="hidden items-center gap-2 md:flex">
          {authLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
          ) : !user ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              登录 / 注册
            </button>
          ) : (
            <UserMenu user={user} onSignOut={signOut} />
          )}
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
              {!user && (
                <button
                  onClick={() => { setIsOpen(false); setAuthModalOpen(true); }}
                  className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录/注册弹窗 */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
