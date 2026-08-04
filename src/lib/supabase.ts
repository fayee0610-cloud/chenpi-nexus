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
 *   is_published BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在，补加 is_published 列：
 * -- ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
 *
 * -- 2. 灵感文章表
 * CREATE TABLE IF NOT EXISTS public.insights (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   summary TEXT,
 *   category TEXT NOT NULL,
 *   tags TEXT,                -- 硬核结构化标签池（JSON 字符串数组）
 *   read_time TEXT,
 *   date TEXT,
 *   author TEXT,
 *   content TEXT,
 *   audio_url TEXT,
 *   is_published BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在，补加标签字段：
 * -- ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS tags TEXT;
 * -- ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
 *
 * -- 8. 灵感文章评论表（读者战术讨论区，带防垃圾策略）
 * -- 注意：id 使用 UUID 类型，由 Supabase 自动生成（gen_random_uuid()），前端不传 id
 * CREATE TABLE IF NOT EXISTS public.article_comments (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   article_id TEXT NOT NULL,           -- 关联 insights.id
 *   nickname TEXT NOT NULL,             -- 评论昵称（必填）
 *   email TEXT,                         -- 邮箱（选填，用于后续联系/通知）
 *   content TEXT NOT NULL,              -- 正文（存储时已做 HTML 转义，防 XSS）
 *   ip_hash TEXT,                       -- 提交 IP 的 SHA-256 哈希（用于 60s 防刷，不存明文）
 *   user_agent TEXT,
 *   has_links BOOLEAN DEFAULT FALSE,    -- 是否包含外链
 *   status TEXT DEFAULT 'approved',     -- approved | pending_review | rejected（外链默认 pending_review）
 *   parent_id UUID,                     -- 回复某条评论（层级）
 *   delete_token TEXT,                  -- 用户自主删除凭证（随机字符串，前端 localStorage 保存）
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在但 id 为 TEXT 类型，执行以下迁移：
 * -- ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS delete_token TEXT;
 * CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments (article_id, created_at DESC);
 * CREATE INDEX IF NOT EXISTS idx_article_comments_parent ON public.article_comments (parent_id);
 * -- RLS：仅公开读已批准内容，写入通过服务端 API（service_role 绕过 RLS），避免 anon 直接刷
 * ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "article_comments public read approved only" ON public.article_comments
 *   FOR SELECT USING (status = 'approved');
 *
 * -- 5. 资源包表（PDF 资源管理）
 * CREATE TABLE IF NOT EXISTS public.resources (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   excerpt TEXT,
 *   outline TEXT,
 *   file_url TEXT,
 *   file_size TEXT,
 *   category TEXT DEFAULT '指南',
 *   require_login BOOLEAN DEFAULT FALSE,
 *   is_published BOOLEAN DEFAULT TRUE,
 *   download_count INT DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在，补加 is_published 列：
 * -- ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
 * ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "resources are readable by everyone" ON public.resources
 *   FOR SELECT USING (true);
 * CREATE POLICY "anyone can insert resources" ON public.resources
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update resources" ON public.resources
 *   FOR UPDATE USING (true);
 * CREATE POLICY "anyone can delete resources" ON public.resources
 *   FOR DELETE USING (true);
 *
 * -- 6. 线索/邮箱订阅表（资源下载获客）
 * CREATE TABLE IF NOT EXISTS public.leads (
 *   id TEXT PRIMARY KEY,
 *   email TEXT NOT NULL,
 *   resource_id TEXT,
 *   resource_title TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "leads are readable by everyone" ON public.leads
 *   FOR SELECT USING (true);
 * CREATE POLICY "anyone can submit lead" ON public.leads
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can delete leads" ON public.leads
 *   FOR DELETE USING (true);
 *
 * -- 7. 情报站 (Information Hub) 表
 * CREATE TABLE IF NOT EXISTS public.insights_hub (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   summary TEXT,
 *   source_name TEXT,
 *   original_url TEXT,
 *   published_at TEXT,
 *   is_published BOOLEAN DEFAULT TRUE,
 *   is_featured BOOLEAN DEFAULT FALSE,
 *   api_source TEXT DEFAULT 'manual',
 *   tags JSONB DEFAULT '[]'::jsonb,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在，补加新字段：
 * -- ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS api_source TEXT DEFAULT 'manual';
 * -- ALTER TABLE public.insights_hub ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
 * ALTER TABLE public.insights_hub ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "insights_hub are readable by everyone" ON public.insights_hub
 *   FOR SELECT USING (true);
 * -- 允许 Admin 后台（anon key）写入/修改/删除情报站内容
 * CREATE POLICY "anyone can insert insights_hub" ON public.insights_hub
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update insights_hub" ON public.insights_hub
 *   FOR UPDATE USING (true);
 * CREATE POLICY "anyone can delete insights_hub" ON public.insights_hub
 *   FOR DELETE USING (true);
 *
 * -- 3. 庇护所互动帖子表
 * CREATE TABLE IF NOT EXISTS public.sanctuary_posts (
 *   id TEXT PRIMARY KEY,
 *   author TEXT NOT NULL,
 *   avatar TEXT,
 *   tag TEXT,
 *   content TEXT NOT NULL,
 *   likes INT DEFAULT 0,
 *   is_published BOOLEAN DEFAULT TRUE,
 *   delete_token TEXT,                  -- 用户自主删除凭证（随机十六进制字符串，前端 localStorage 保存）
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 若表已存在，补加 is_published 列：
 * -- ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
 * -- 若表已存在，补加 delete_token 列：
 * -- ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS delete_token TEXT;
 *
 * -- RLS 配置（允许公开读 + Admin 后台 anon key 写入）
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
 * -- 允许 Admin 后台（anon key）写入/修改/删除作品案例
 * CREATE POLICY "anyone can insert projects" ON public.projects
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update projects" ON public.projects
 *   FOR UPDATE USING (true);
 * CREATE POLICY "anyone can delete projects" ON public.projects
 *   FOR DELETE USING (true);
 *
 * -- 允许 Admin 后台（anon key）写入/修改/删除灵感文章
 * CREATE POLICY "anyone can insert insights" ON public.insights
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update insights" ON public.insights
 *   FOR UPDATE USING (true);
 * CREATE POLICY "anyone can delete insights" ON public.insights
 *   FOR DELETE USING (true);
 *
 * -- 允许匿名插入庇护所帖子（访客发帖）
 * CREATE POLICY "anyone can post to sanctuary" ON public.sanctuary_posts
 *   FOR INSERT WITH CHECK (true);
 * CREATE POLICY "anyone can update sanctuary_posts" ON public.sanctuary_posts
 *   FOR UPDATE USING (true);
 * CREATE POLICY "anyone can delete sanctuary_posts" ON public.sanctuary_posts
 *   FOR DELETE USING (true);
 *
 * -- 9. 庇护所统计：全网累计上香次数（asylum_stats）
 * CREATE TABLE IF NOT EXISTS public.asylum_stats (
 *   id TEXT PRIMARY KEY,
 *   incense_count BIGINT NOT NULL DEFAULT 0,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * -- 初始化默认行（id='main'）：如果不存在就插一行
 * INSERT INTO public.asylum_stats (id, incense_count)
 *   VALUES ('main', 0)
 *   ON CONFLICT (id) DO NOTHING;
 * -- RLS：公开可读，写入仅允许服务端（service_role 绕过 RLS），防止 anon 直接刷 count
 * ALTER TABLE public.asylum_stats ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "asylum_stats is readable by everyone" ON public.asylum_stats
 *   FOR SELECT USING (true);
 * -- 为了让 /api/asylum/incense 的降级路径在使用 service_role 时依然能写入，此处无需 anon 写 policy；
 * -- 若未来想允许 anon 直接写，可再加以下 POLICY（不推荐，应通过 API）：
 * -- CREATE POLICY "service can update asylum_stats" ON public.asylum_stats
 * --   FOR UPDATE USING (true) WITH CHECK (true);
 *
 * -- 10. 原子递增 incense_count 的 Postgres 函数（推荐使用，真正原子）
 * CREATE OR REPLACE FUNCTION public.asylum_incense_increment(row_id TEXT DEFAULT 'main')
 * RETURNS BIGINT
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = public
 * AS $$
 * DECLARE
 *   new_count BIGINT;
 * BEGIN
 *   -- 1) 若行不存在则插入，然后对目标行加 FOR UPDATE 锁
 *   INSERT INTO public.asylum_stats (id, incense_count)
 *   VALUES (row_id, 1)
 *   ON CONFLICT (id) DO NOTHING;
 *
 *   -- 2) 原子递增 incense_count + 返回最新值
 *   UPDATE public.asylum_stats
 *   SET incense_count = incense_count + 1,
 *       updated_at    = NOW()
 *   WHERE id = row_id
 *   RETURNING incense_count
 *   INTO new_count;
 *
 *   RETURN new_count;
 * END;
 * $$;
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
 *
 * -- 8. Storage Bucket: portfolio-covers（作品集封面图公开存储桶）
 * -- 【必须在 Supabase Dashboard → SQL Editor 中运行以下 SQL 才能生效】
 * -- Step 1: 创建 Public Bucket
 * INSERT INTO storage.buckets (id, name, public)
 * VALUES ('portfolio-covers', 'portfolio-covers', true)
 * ON CONFLICT (id) DO NOTHING;
 *
 * -- Step 2: 允许匿名读取（前台展示封面图）
 * CREATE POLICY IF NOT EXISTS "portfolio-covers public read"
 *   ON storage.objects FOR SELECT
 *   USING (bucket_id = 'portfolio-covers');
 *
 * -- Step 3: 允许匿名上传（admin 后台使用 anon key 直传）
 * CREATE POLICY IF NOT EXISTS "portfolio-covers anon upload"
 *   ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'portfolio-covers');
 *
 * -- Step 4: 允许匿名更新（admin 后台替换封面图）
 * CREATE POLICY IF NOT EXISTS "portfolio-covers anon update"
 *   ON storage.objects FOR UPDATE
 *   USING (bucket_id = 'portfolio-covers');
 *
 * -- ============================================================
 * -- 9. Storage Bucket: resources（资源包 PDF 公开存储桶）
 * -- 【必须在 Supabase Dashboard → SQL Editor 中运行以下 SQL 才能生效】
 * -- Step 1: 创建 Public Bucket
 * INSERT INTO storage.buckets (id, name, public)
 * VALUES ('resources', 'resources', true)
 * ON CONFLICT (id) DO NOTHING;
 *
 * -- Step 2: 允许匿名读取（前台展示/下载 PDF）
 * CREATE POLICY IF NOT EXISTS "resources public read"
 *   ON storage.objects FOR SELECT
 *   USING (bucket_id = 'resources');
 *
 * -- Step 3: 允许匿名上传（admin 后台使用 anon key 直传 PDF）
 * CREATE POLICY IF NOT EXISTS "resources anon upload"
 *   ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'resources');
 *
 * -- Step 4: 允许匿名更新/删除（admin 后台替换/删除 PDF）
 * CREATE POLICY IF NOT EXISTS "resources anon update"
 *   ON storage.objects FOR UPDATE
 *   USING (bucket_id = 'resources');
 * CREATE POLICY IF NOT EXISTS "resources anon delete"
 *   ON storage.objects FOR DELETE
 *   USING (bucket_id = 'resources');
 * ============================================================
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL 格式校验：必须是合法的 https URL，且包含 supabase.co 域名
// 防止误配置（如带 /rest/v1/ 路径、缺少协议头、空字符串）导致客户端 fetch 失败
function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // 必须以 https:// 开头
  if (!/^https:\/\/.+\.supabase\.(co|in)/i.test(trimmed)) return false;
  // 必须能被 URL 构造器解析
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 初始化 Supabase 客户端
// - URL 格式不合法或 key 缺失时返回 null（调用方返回空数组，无 Mock 降级）
// - 启动时打印一次诊断日志，方便排查配置问题
// 使用 SupabaseClient<any, "public", any> 显式指定泛型，
// 避免 ReturnType<typeof createClient> 在新版 supabase-js 中将表行类型推断为 never
let supabaseClient: SupabaseClient<any, "public", any> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  if (isValidSupabaseUrl(supabaseUrl)) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn("[supabase] 客户端初始化失败，数据将返回空数组:", err);
      supabaseClient = null;
    }
  } else {
    console.warn(
      `[supabase] NEXT_PUBLIC_SUPABASE_URL 格式不合法（应为 https://xxxxx.supabase.co），数据将返回空数组。当前值: "${supabaseUrl}"`
    );
  }
}

export const supabase = supabaseClient;

export const isSupabaseConfigured = !!supabase;
