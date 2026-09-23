-- ============================================================
-- malaysia_intelligence 修复：确保 id 列有 uuid 默认值 + source_url 唯一索引
-- 根因：writeIntelligence 之前传了 base36 文本 id，触发 22P02 (invalid input syntax for type uuid)。
-- 现代码已不再传 id，改由数据库 gen_random_uuid() 自动生成。本迁移确保默认值与唯一索引就位。
-- 全部幂等，可重复执行。
-- ============================================================

-- 1. 确保 id 列有 uuid 默认值（gen_random_uuid 需要 pgcrypto 扩展，Supabase 默认已装）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.malaysia_intelligence
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. 确保 source_url 唯一索引存在（upsert onConflict: source_url 依赖此索引）
-- 若已存在则跳过；若存在非唯一旧索引也不会冲突（CREATE UNIQUE INDEX IF NOT EXISTS 仅检查同名）
CREATE UNIQUE INDEX IF NOT EXISTS idx_malaysia_intelligence_source_url
  ON public.malaysia_intelligence (source_url);
