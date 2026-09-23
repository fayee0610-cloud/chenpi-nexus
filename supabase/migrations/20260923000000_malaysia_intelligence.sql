-- ============================================================
-- Malaysia Intelligence 表：马来西亚商业情报全自动聚合
-- 字段对应 MalaysiaIntelligence 类型定义
-- ============================================================

CREATE TABLE IF NOT EXISTS public.malaysia_intelligence (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',          -- 原始英文标题
  title_zh TEXT NOT NULL DEFAULT '',          -- AI 翻译中文标题
  source_name TEXT NOT NULL DEFAULT '',       -- 来源媒体（如 The Edge Malaysia）
  source_url TEXT NOT NULL DEFAULT '',        -- 原文链接（去重依据）
  summary_zh TEXT NOT NULL DEFAULT '',        -- AI 100字中文摘要
  key_takeaway TEXT NOT NULL DEFAULT '',      -- 一句话商业启示
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 原文发布时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- 入库时间
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE
);

-- source_url 唯一索引，加速去重查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_malaysia_intelligence_source_url
  ON public.malaysia_intelligence (source_url);

-- published_at 倒序索引，加速最新情报查询
CREATE INDEX IF NOT EXISTS idx_malaysia_intelligence_published_at
  ON public.malaysia_intelligence (published_at DESC);

-- 启用 RLS
ALTER TABLE public.malaysia_intelligence ENABLE ROW LEVEL SECURITY;

-- 前台可读（is_published = true）
DROP POLICY IF EXISTS "malaysia_intelligence_select_public" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_select_public"
  ON public.malaysia_intelligence
  FOR SELECT
  USING (is_published = true);

-- Service Role 绕过 RLS（通过 supabaseAdmin 写入）
-- Anon Key 写入策略（如果没有配置 service_role key 时使用）
DROP POLICY IF EXISTS "malaysia_intelligence_insert_anon" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_insert_anon"
  ON public.malaysia_intelligence
  FOR INSERT
  WITH CHECK (true);
