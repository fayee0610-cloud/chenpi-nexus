// ============================================================
// Supabase Client 初始化
// 仅客户端使用；若环境变量未配置，则返回 null 由调用方降级
// ============================================================

/*
 * ===== Supabase 建表 SQL（复制到 SQL Editor 一键运行） =====
 *
 * -- 1. 作品集表
 * CREATE TABLE IF NOT EXISTS public.projects (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   sub_title TEXT,
 *   category TEXT NOT NULL,
 *   role TEXT,
 *   date TEXT,
 *   metrics JSONB DEFAULT '[]'::jsonb,
 *   challenge TEXT,
 *   strategy JSONB DEFAULT '[]'::jsonb,
 *   demo_url TEXT,
 *   image_url TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 2. 灵感文章表
 * CREATE TABLE IF NOT EXISTS public.insights (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   summary TEXT,
 *   category TEXT NOT NULL,
 *   read_time TEXT,
 *   date TEXT,
 *   author TEXT,
 *   content TEXT,
 *   audio_url TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 3. 庇护所互动帖子表
 * CREATE TABLE IF NOT EXISTS public.sanctuary_posts (
 *   id TEXT PRIMARY KEY,
 *   author TEXT NOT NULL,
 *   avatar TEXT,
 *   tag TEXT,
 *   content TEXT NOT NULL,
 *   likes INT DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- RLS 配置（允许公开读，写入通过 admin 后台）
 * ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.sanctuary_posts ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "projects are readable by everyone" ON public.projects
 *   FOR SELECT USING (true);
 * CREATE POLICY "insights are readable by everyone" ON public.insights
 *   FOR SELECT USING (true);
 * CREATE POLICY "sanctuary_posts are readable by everyone" ON public.sanctuary_posts
 *   FOR SELECT USING (true);
 *
 * -- 允许匿名插入庇护所帖子（访客发帖）
 * CREATE POLICY "anyone can post to sanctuary" ON public.sanctuary_posts
 *   FOR INSERT WITH CHECK (true);
 *
 * -- 4. 站点配置表（Feature Flags 模块显隐控制）
 * CREATE TABLE IF NOT EXISTS public.site_config (
 *   key TEXT PRIMARY KEY,
 *   value JSONB DEFAULT '{}'::jsonb
 * );
 * ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "site_config is readable by everyone" ON public.site_config
 *   FOR SELECT USING (true);
 * -- 写入通过 admin 后台（anon key 默认无写权限，可用 service_role 或单独 policy）
 * CREATE POLICY "anyone can upsert site_config" ON public.site_config
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update site_config" ON public.site_config
 *   FOR UPDATE USING (true);
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = !!supabase;
