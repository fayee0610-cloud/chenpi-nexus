-- ============================================================
-- malaysia_intelligence 扩展：新增 category / tags 列 + 补齐 RLS UPDATE/DELETE 权限
-- 修复"刷新即丢失"根因：upsert onConflict source_url 需要 UPDATE 权限，
-- 滚动淘汰需要 DELETE 权限；旧迁移仅给了 INSERT，导致冲突更新静默失败。
-- 兼容旧表：全部用 IF NOT EXISTS，可重复执行。
-- ============================================================

-- 1. 补齐字段（旧表缺失时追加，不破坏现有数据）
ALTER TABLE public.malaysia_intelligence
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '宏观政策';
ALTER TABLE public.malaysia_intelligence
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 2. category 索引（加速按分类筛选）
CREATE INDEX IF NOT EXISTS idx_malaysia_intelligence_category
  ON public.malaysia_intelligence (category);

-- 3. 补齐 RLS UPDATE 权限（upsert 冲突更新必需）
DROP POLICY IF EXISTS "malaysia_intelligence_update_anon" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_update_anon"
  ON public.malaysia_intelligence
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. 补齐 RLS DELETE 权限（滚动淘汰保留最新 50 条必需）
DROP POLICY IF EXISTS "malaysia_intelligence_delete_anon" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_delete_anon"
  ON public.malaysia_intelligence
  FOR DELETE
  USING (true);

-- 5. 确认 SELECT 公共读权限仍在（幂等重建）
DROP POLICY IF EXISTS "malaysia_intelligence_select_public" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_select_public"
  ON public.malaysia_intelligence
  FOR SELECT
  USING (is_published = true);

-- 6. 确认 INSERT 权限仍在（幂等重建）
DROP POLICY IF EXISTS "malaysia_intelligence_insert_anon" ON public.malaysia_intelligence;
CREATE POLICY "malaysia_intelligence_insert_anon"
  ON public.malaysia_intelligence
  FOR INSERT
  WITH CHECK (true);
