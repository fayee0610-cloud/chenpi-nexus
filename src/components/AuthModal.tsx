"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Loader2, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (!supabase) {
      setError("认证服务未配置，请稍后再试");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        setSuccess("登录成功");
        setTimeout(() => onClose(), 800);
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess("注册成功！请检查邮箱完成验证（如已开启邮箱验证）");
      }
    } catch (err: any) {
      setError(err?.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            {/* 头部 */}
            <div className="relative border-b border-zinc-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    {mode === "login" ? "登录通行证" : "注册通行证"}
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    登录后可下载专属资源包
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 表单 */}
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                  邮箱
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400">
                  <Lock className="h-3.5 w-3.5" />
                  密码
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="至少 6 位"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/50"
                />
              </label>

              {/* 状态提示 */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !email.trim() || !password.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> 处理中...</>
                ) : mode === "login" ? (
                  "登录"
                ) : (
                  "注册"
                )}
              </button>

              {/* 切换登录/注册 */}
              <div className="text-center text-xs text-zinc-500">
                {mode === "login" ? (
                  <>
                    还没有通行证？{" "}
                    <button
                      onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                      className="font-medium text-purple-400 hover:text-purple-300"
                    >
                      注册
                    </button>
                  </>
                ) : (
                  <>
                    已有通行证？{" "}
                    <button
                      onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                      className="font-medium text-purple-400 hover:text-purple-300"
                    >
                      登录
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 用户状态 Hook（供 Header 使用）
export function useAuthUser() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // 获取当前 session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // 监听 auth 状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}

// 已登录用户头像/下拉菜单
export function UserMenu({ user, onSignOut }: { user: SupabaseUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white transition-transform hover:scale-105"
      >
        {initial}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="truncate text-xs font-medium text-zinc-200">{email}</p>
                <p className="text-[10px] text-zinc-500">已登录</p>
              </div>
              <button
                onClick={() => { onSignOut(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出登录
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
