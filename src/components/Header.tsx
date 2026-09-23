"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu, Radar, Sparkles, Package, MessageCircle, Briefcase, Mail } from "lucide-react";
import type { SiteConfig } from "@/lib/dataApi";
import AuthModal, { useAuthUser, UserMenu } from "@/components/AuthModal";

interface HeaderProps {
  config?: Partial<SiteConfig> | null;
}

// 全站导航 — 严格 6 模块统一顺序 + 锚点 id
// 顺序：东南亚实局 → 深度洞察 → 策略工具包 → 脑洞画布 → 实战案例 → 联系我
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  flag?: keyof SiteConfig;
  tagline: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "东南亚实局",
    href: "/#intelligence",
    icon: Radar,
    flag: "show_insights_hub",
    tagline: "⚡ 以马来西亚/东盟市场为绝对核心的即时商业情报",
  },
  {
    label: "深度洞察",
    href: "/#insights",
    icon: Sparkles,
    flag: "show_insights",
    tagline: "关于大马 GTM、清真 Halal 认证与品牌策略的硬核思考",
  },
  {
    label: "策略工具包",
    href: "/#toolkit",
    icon: Package,
    flag: "show_resources",
    tagline: "实战 SOP · 东南亚渠道指南 · AI 营销 Prompt 库 · 品牌策略模板",
  },
  {
    label: "脑洞画布",
    href: "/#canvas",
    icon: MessageCircle,
    flag: "show_sanctuary",
    tagline: "出海同行与大马本土商业探索者的互动交流与脑洞碰撞",
  },
  {
    label: "实战案例",
    href: "/#cases",
    icon: Briefcase,
    flag: "show_portfolio",
    tagline: "大马本土化渠道重构与商业交付落地案例",
  },
  {
    label: "联系我",
    href: "/#contact",
    icon: Mail,
    tagline: "预约大马出海策略咨询 / 商业合作对接",
  },
];

// 平滑滚动到锚点（兼容 SSR）
function smoothScrollTo(href: string) {
  if (typeof window === "undefined") return;
  const hash = href.split("#")[1];
  if (!hash) return;
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Header({ config }: HeaderProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuthUser();

  // 根据站点配置过滤导航项：无 flag 的项始终显示，有 flag 的项在 config[flag] !== false 时显示
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.flag) return true;
    return config?.[item.flag] !== false;
  });

  // 关闭 Drawer 时恢复背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 点击导航：平滑滚动 + 关闭 Drawer
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    smoothScrollTo(href);
  };

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

        {/* Desktop Nav - 悬浮玻璃拟态 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="group relative rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              {item.label}
              {/* 悬浮 tagline 微提示 */}
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900/95 px-3 py-1.5 text-[10px] font-normal text-zinc-400 shadow-lg group-hover:block">
                {item.tagline}
              </span>
            </Link>
          ))}
        </nav>

        {/* 右侧：登录/注册 或 用户菜单 */}
        <div className="hidden items-center gap-2 lg:flex">
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
          aria-label="菜单"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer - 微光抽屉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            {/* 抽屉面板 */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-full w-[85%] max-w-xs flex-col border-l border-zinc-800/60 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-900/95 shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
                <span className="text-sm font-bold text-zinc-100">导航菜单</span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="关闭菜单"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Nav Items - 触摸高度 ≥48px */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="group flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-50"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 group-hover:bg-purple-500/15 group-hover:text-purple-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="mt-0.5 line-clamp-1 text-[10px] font-normal text-zinc-500">
                            {item.tagline}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* 移动端登录按钮 */}
                {!user && (
                  <button
                    onClick={() => { setIsOpen(false); setAuthModalOpen(true); }}
                    className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-purple-500/40 hover:text-purple-300"
                  >
                    登录 / 注册
                  </button>
                )}
                {user && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <p className="text-xs text-zinc-500">已登录</p>
                    <p className="truncate text-sm font-medium text-zinc-200">{user.email}</p>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 登录/注册弹窗 */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
