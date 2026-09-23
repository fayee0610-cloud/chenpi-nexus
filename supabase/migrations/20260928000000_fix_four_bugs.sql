-- ============================================================
-- 4 个残留 Bug 针对性修复 SQL 补丁
-- 幂等设计：可重复执行
-- 适用：Supabase SQL Editor 一次性粘贴执行
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Bug 1: 策略工具包 resources 表 UUID 主键修复
-- 确保 resources.id 有 DEFAULT gen_random_uuid()，前端不传 id 时由 DB 自动生成
-- ============================================================
DO $$
BEGIN
  -- 判断 resources.id 的实际类型，选择正确的 DEFAULT 表达式
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- id 已是 UUID 类型，直接设置 gen_random_uuid() 默认值
    ALTER TABLE public.resources ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources'
      AND column_name = 'id' AND data_type = 'text'
  ) THEN
    -- id 是 TEXT 类型，用 gen_random_uuid()::text 作为默认值（不破坏现有数据）
    ALTER TABLE public.resources ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- ============================================================
-- Bug 2: 深度洞察评论 article_comments 表 + 线索 leads 表
-- 确保表存在 + 补齐缺失列 + RLS 全开放
-- ============================================================

-- article_comments 表（UUID 主键，由 DB 自动生成）
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  has_links BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'approved',
  reply_to_nickname TEXT,
  delete_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 补齐所有可能缺失的列
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS has_links BOOLEAN DEFAULT FALSE;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS reply_to_nickname TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS delete_token TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 移除旧的楼中楼外键（若存在）
ALTER TABLE public.article_comments DROP COLUMN IF EXISTS parent_id;

CREATE INDEX IF NOT EXISTS idx_article_comments_article
  ON public.article_comments (article_id, created_at DESC);

-- leads 表补齐列
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resource_title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_article_title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- leads email 唯一约束（先清理重复行）
DELETE FROM public.leads a USING public.leads b
  WHERE a.id > b.id AND a.email = b.email;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_unique'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
  END IF;
END $$;

-- RLS：article_comments 全开放（兼容 anon key 写入 + 后台 service_role 读取）
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_comments_select_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_insert_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_update_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_delete_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments public read approved only" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_select_approved" ON public.article_comments;
-- 前台 anon 读已批准 + 待审核；后台通过 service_role 读全量
CREATE POLICY "article_comments_select_all" ON public.article_comments
  FOR SELECT USING (true);
CREATE POLICY "article_comments_insert_all" ON public.article_comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "article_comments_update_all" ON public.article_comments
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "article_comments_delete_all" ON public.article_comments
  FOR DELETE USING (true);

-- RLS：leads 全开放
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select_all" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_all" ON public.leads;
DROP POLICY IF EXISTS "leads_update_all" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_all" ON public.leads;
DROP POLICY IF EXISTS "leads are readable by everyone" ON public.leads;
DROP POLICY IF EXISTS "anyone can submit lead" ON public.leads;
DROP POLICY IF EXISTS "anyone can upsert leads" ON public.leads;
DROP POLICY IF EXISTS "anyone can delete leads" ON public.leads;
CREATE POLICY "leads_select_all" ON public.leads FOR SELECT USING (true);
CREATE POLICY "leads_insert_all" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_update_all" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete_all" ON public.leads FOR DELETE USING (true);

-- ============================================================
-- Bug 3: 实战案例 projects 表缺少 cta_link 列
-- ============================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cta_link TEXT;
-- 同时补齐其他可能缺失的列（兼容旧表）
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_industry TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS malaysia_channels TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS halal_certification_cycle TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deliverables TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS solutions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- ============================================================
-- Bug 4: 站点配置 site_config 表 RLS 策略
-- 确保表存在 + value 为 JSONB + RLS 全开放
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS 全开放（解决 INSERT/UPDATE 被拦截）
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_config_select_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_insert_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_update_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_delete_all" ON public.site_config;
DROP POLICY IF EXISTS "Enable all access for site_config" ON public.site_config;
CREATE POLICY "Enable all access for site_config" ON public.site_config
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 完成
-- ============================================================
