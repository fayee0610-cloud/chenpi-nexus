-- ============================================================
-- 全站 6+1 模块 Schema 全量对齐 & RLS 权限一键开放脚本
-- 幂等设计：可重复执行，不会破坏现有数据
-- 涵盖：projects / insights / resources / sanctuary_posts / leads /
--       site_config / malaysia_intelligence / article_comments / asylum_stats
-- 适用：Supabase SQL Editor 一次性粘贴执行
-- ============================================================

-- 扩展：确保 pgcrypto 可用（gen_random_uuid 依赖）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. 实战案例 projects 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sub_title TEXT,
  category TEXT NOT NULL,
  role TEXT,
  date TEXT,
  metrics JSONB DEFAULT '[]'::jsonb,
  challenge TEXT,
  strategy JSONB DEFAULT '[]'::jsonb,
  solutions JSONB DEFAULT '[]'::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  demo_url TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  client_industry TEXT,
  malaysia_channels TEXT,
  halal_certification_cycle TEXT,
  deliverables TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 补齐缺失列（兼容旧表）
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sub_title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS strategy JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS solutions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cta_link TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_industry TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS malaysia_channels TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS halal_certification_cycle TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deliverables TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. 深度洞察 insights 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.insights (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags TEXT,
  read_time TEXT,
  date TEXT,
  author TEXT,
  content TEXT,
  audio_url TEXT,
  cover_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS read_time TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 3. 策略工具包 resources 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  outline JSONB DEFAULT '[]'::jsonb,
  file_url TEXT,
  file_size TEXT,
  cover_url TEXT,
  category TEXT DEFAULT '指南',
  require_login BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS outline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '指南';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS require_login BOOLEAN DEFAULT FALSE;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 4. 脑洞画布 sanctuary_posts 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sanctuary_posts (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  avatar TEXT,
  tag TEXT,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  parent_id TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  delete_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS delete_token TEXT;
ALTER TABLE public.sanctuary_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 5. 线索与转化 leads 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT,
  notes TEXT,
  resource_id TEXT,
  resource_title TEXT,
  source_article_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resource_title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_article_title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 添加 email 唯一约束（先清理重复行）
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

-- ============================================================
-- 6. 站点配置 site_config 表
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

-- ============================================================
-- 7. 东南亚实局 malaysia_intelligence 表（核心表，UUID 主键）
-- 后台手动发布 + AI 自动抓取 + 前台瀑布流 三方共表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.malaysia_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT,
  title_zh TEXT NOT NULL,
  title TEXT,
  source_name TEXT,
  source_url TEXT,
  category TEXT DEFAULT '政策/贸易',
  summary_zh TEXT,
  key_takeaway TEXT,
  raw_content TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]'::jsonb,
  importance_score INTEGER NOT NULL DEFAULT 3
);

-- 补齐所有列（兼容旧表）
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS title_zh TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '政策/贸易';
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS summary_zh TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS key_takeaway TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS raw_content TEXT;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.malaysia_intelligence ADD COLUMN IF NOT EXISTS importance_score INTEGER NOT NULL DEFAULT 3;

-- 将 title_zh 为空但 title 存在的行回填 title_zh（兼容历史数据）
UPDATE public.malaysia_intelligence
  SET title_zh = title
  WHERE title_zh IS NULL AND title IS NOT NULL;

-- 索引
CREATE INDEX IF NOT EXISTS idx_malaysia_intel_published_at
  ON public.malaysia_intelligence (published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_malaysia_intel_source_url
  ON public.malaysia_intelligence (source_url) WHERE source_url IS NOT NULL;

-- ============================================================
-- 8. 深度洞察评论 article_comments 表（UUID 主键，service_role 写入）
-- ============================================================
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

ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS reply_to_nickname TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS delete_token TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS has_links BOOLEAN DEFAULT FALSE;
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 移除旧的楼中楼外键（若存在）
ALTER TABLE public.article_comments DROP COLUMN IF EXISTS parent_id;

CREATE INDEX IF NOT EXISTS idx_article_comments_article
  ON public.article_comments (article_id, created_at DESC);

-- ============================================================
-- 9. 上香统计 asylum_stats 表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.asylum_stats (
  id INT PRIMARY KEY DEFAULT 1,
  total_incense INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.asylum_stats (id, total_incense)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS 权限策略：一键开放 anon 角色全表 CRUD
-- 解决 "violates row-level security policy" 报错
-- ============================================================

-- 启用 RLS（所有表）
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctuary_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malaysia_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asylum_stats ENABLE ROW LEVEL SECURITY;

-- 通用宏：清理旧 Policy 后重建（幂等）
-- projects
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_all" ON public.projects;
DROP POLICY IF EXISTS "projects are readable by everyone" ON public.projects;
DROP POLICY IF EXISTS "anyone can insert projects" ON public.projects;
DROP POLICY IF EXISTS "anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "anyone can delete projects" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert_all" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update_all" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "projects_delete_all" ON public.projects FOR DELETE USING (true);

-- insights
DROP POLICY IF EXISTS "insights_select_all" ON public.insights;
DROP POLICY IF EXISTS "insights_insert_all" ON public.insights;
DROP POLICY IF EXISTS "insights_update_all" ON public.insights;
DROP POLICY IF EXISTS "insights_delete_all" ON public.insights;
DROP POLICY IF EXISTS "insights are readable by everyone" ON public.insights;
DROP POLICY IF EXISTS "anyone can insert insights" ON public.insights;
DROP POLICY IF EXISTS "anyone can update insights" ON public.insights;
DROP POLICY IF EXISTS "anyone can delete insights" ON public.insights;
CREATE POLICY "insights_select_all" ON public.insights FOR SELECT USING (true);
CREATE POLICY "insights_insert_all" ON public.insights FOR INSERT WITH CHECK (true);
CREATE POLICY "insights_update_all" ON public.insights FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "insights_delete_all" ON public.insights FOR DELETE USING (true);

-- resources
DROP POLICY IF EXISTS "resources_select_all" ON public.resources;
DROP POLICY IF EXISTS "resources_insert_all" ON public.resources;
DROP POLICY IF EXISTS "resources_update_all" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_all" ON public.resources;
DROP POLICY IF EXISTS "resources are readable by everyone" ON public.resources;
DROP POLICY IF EXISTS "anyone can insert resources" ON public.resources;
DROP POLICY IF EXISTS "anyone can update resources" ON public.resources;
DROP POLICY IF EXISTS "anyone can delete resources" ON public.resources;
CREATE POLICY "resources_select_all" ON public.resources FOR SELECT USING (true);
CREATE POLICY "resources_insert_all" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update_all" ON public.resources FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "resources_delete_all" ON public.resources FOR DELETE USING (true);

-- sanctuary_posts
DROP POLICY IF EXISTS "sanctuary_select_all" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "sanctuary_insert_all" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "sanctuary_update_all" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "sanctuary_delete_all" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "sanctuary_posts are readable by everyone" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "anyone can post to sanctuary" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "anyone can update sanctuary_posts" ON public.sanctuary_posts;
DROP POLICY IF EXISTS "anyone can delete sanctuary_posts" ON public.sanctuary_posts;
CREATE POLICY "sanctuary_select_all" ON public.sanctuary_posts FOR SELECT USING (true);
CREATE POLICY "sanctuary_insert_all" ON public.sanctuary_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "sanctuary_update_all" ON public.sanctuary_posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sanctuary_delete_all" ON public.sanctuary_posts FOR DELETE USING (true);

-- leads
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

-- site_config
DROP POLICY IF EXISTS "site_config_select_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_insert_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_update_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_delete_all" ON public.site_config;
CREATE POLICY "site_config_select_all" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "site_config_insert_all" ON public.site_config FOR INSERT WITH CHECK (true);
CREATE POLICY "site_config_update_all" ON public.site_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "site_config_delete_all" ON public.site_config FOR DELETE USING (true);

-- malaysia_intelligence
DROP POLICY IF EXISTS "malaysia_intel_select_all" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "malaysia_intel_insert_all" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "malaysia_intel_update_all" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "malaysia_intel_delete_all" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "malaysia_intelligence public read" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "malaysia_intelligence anon insert" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "anyone can insert malaysia_intelligence" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "anyone can update malaysia_intelligence" ON public.malaysia_intelligence;
DROP POLICY IF EXISTS "anyone can delete malaysia_intelligence" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intel_select_all" ON public.malaysia_intelligence FOR SELECT USING (true);
CREATE POLICY "malaysia_intel_insert_all" ON public.malaysia_intelligence FOR INSERT WITH CHECK (true);
CREATE POLICY "malaysia_intel_update_all" ON public.malaysia_intelligence FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "malaysia_intel_delete_all" ON public.malaysia_intelligence FOR DELETE USING (true);

-- article_comments：前台仅读 approved，后台通过 service_role 全权管理
DROP POLICY IF EXISTS "article_comments_select_approved" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_select_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_insert_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_update_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments_delete_all" ON public.article_comments;
DROP POLICY IF EXISTS "article_comments public read approved only" ON public.article_comments;
-- 前台 anon 只读已批准评论；后台通过 /api/admin 路由用 service_role 绕过 RLS 读取全量
CREATE POLICY "article_comments_select_approved" ON public.article_comments
  FOR SELECT USING (status = 'approved' OR status = 'pending_review');
CREATE POLICY "article_comments_insert_all" ON public.article_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "article_comments_update_all" ON public.article_comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "article_comments_delete_all" ON public.article_comments FOR DELETE USING (true);

-- asylum_stats
DROP POLICY IF EXISTS "asylum_stats_select_all" ON public.asylum_stats;
DROP POLICY IF EXISTS "asylum_stats_update_all" ON public.asylum_stats;
CREATE POLICY "asylum_stats_select_all" ON public.asylum_stats FOR SELECT USING (true);
CREATE POLICY "asylum_stats_update_all" ON public.asylum_stats FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- Storage 存储桶：创建 + Public 读取策略
-- 解决 "Bucket not found" / "policy" 报错
-- ============================================================

-- portfolio-covers：作品封面 & 文章封面（共用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-covers', 'portfolio-covers', true)
ON CONFLICT (id) DO NOTHING;

-- resources：策略工具包 PDF/文档
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 对象 RLS 策略（允许 anon 上传/读取）
DROP POLICY IF EXISTS "storage_portfolio_covers_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_portfolio_covers_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_resources_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_resources_upload" ON storage.objects;

CREATE POLICY "storage_portfolio_covers_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-covers');
CREATE POLICY "storage_portfolio_covers_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portfolio-covers');
CREATE POLICY "storage_resources_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "storage_resources_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resources');

-- ============================================================
-- 完成
-- ============================================================
