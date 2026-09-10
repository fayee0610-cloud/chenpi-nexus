-- ============================================================
-- 20260910000001_fix_types_and_rpc.sql
-- 修复：increment_incense 返回值 + incense_stats 统一读取 + parent_id 类型兼容
-- ============================================================

-- 1. 修复 increment_incense RPC：返回 INT8 (最新 count) 而非 VOID
-- 前端需要拿到递增后的最新值来更新 UI
CREATE OR REPLACE FUNCTION increment_incense(incense_id TEXT)
RETURNS INT8 AS $$
DECLARE
  new_count INT8;
BEGIN
  INSERT INTO public.incense_stats (id, name, count)
  VALUES (incense_id, incense_id, 1)
  ON CONFLICT (id)
   DO UPDATE SET count = incense_stats.count + 1
   RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 兼容：如果 sanctuary_incense 表也存在，为它补同样的 RPC 逻辑
-- （让前端无论读哪张表都能拿到正确 count）
CREATE OR REPLACE FUNCTION increment_incense_pillar(incense_id TEXT)
RETURNS INT8 AS $$
DECLARE
  new_count INT8;
BEGIN
  INSERT INTO public.sanctuary_incense (incense_id, count)
  VALUES (incense_id, 1)
  ON CONFLICT (incense_id)
   DO UPDATE SET count = sanctuary_incense.count + 1
   RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 兼容：asylum_stats 表的原子递增（若表存在）
CREATE OR REPLACE FUNCTION asylum_incense_increment(row_id TEXT DEFAULT 'main')
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  INSERT INTO public.asylum_stats (id, incense_count)
  VALUES (row_id, 1)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.asylum_stats
  SET incense_count = incense_count + 1,
      updated_at    = NOW()
  WHERE id = row_id
  RETURNING incense_count
  INTO new_count;

  RETURN new_count;
END;
$$;

-- 4. 修复 sanctuary_posts.parent_id 类型：改为 TEXT 以兼容现有 TEXT 主键
-- 先删除旧的 UUID 类型列（若存在），再用 TEXT 类型重建
ALTER TABLE public.sanctuary_posts DROP COLUMN IF EXISTS parent_id;
ALTER TABLE public.sanctuary_posts
  ADD COLUMN IF NOT EXISTS parent_id TEXT;

-- 重建索引（TEXT 类型）
DROP INDEX IF EXISTS idx_sanctuary_posts_parent_id;
CREATE INDEX IF NOT EXISTS idx_sanctuary_posts_parent_id
  ON public.sanctuary_posts(parent_id);
