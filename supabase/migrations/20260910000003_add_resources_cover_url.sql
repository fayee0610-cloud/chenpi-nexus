-- 为 resources 表添加封面图 URL 列（后台 CMS 编辑功能所需）
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS cover_url TEXT;
