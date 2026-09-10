-- ============================================================
-- 20260910000000_canvas_and_incense.sql
-- 脑洞画布 + 一起上上香：数据库表结构、RLS 策略与并发安全 RPC
-- ============================================================

-- 1. 脑洞与吐槽画布表（树状回复：parent_id 自引用）
CREATE TABLE IF NOT EXISTS public.canvas_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '出海同行',
  parent_id UUID REFERENCES public.canvas_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 RLS 并允许匿名读写
ALTER TABLE public.canvas_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select and insert" ON public.canvas_posts
  FOR ALL USING (true) WITH CHECK (true);

-- 2. 上上香全局数据表
CREATE TABLE IF NOT EXISTS public.incense_stats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  count INT8 NOT NULL DEFAULT 0
);

ALTER TABLE public.incense_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select and update" ON public.incense_stats
  FOR ALL USING (true) WITH CHECK (true);

-- 3. 创建并发安全的原子递增函数 (RPC)
-- 使用 ON CONFLICT 实现 upsert + 原子递增，彻底解决并发覆盖问题
-- SECURITY DEFINER 绕过 RLS，确保匿名用户也能安全调用
CREATE OR REPLACE FUNCTION increment_incense(incense_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.incense_stats (id, name, count)
  VALUES (incense_id, incense_id, 1)
  ON CONFLICT (id)
   DO UPDATE SET count = incense_stats.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 兼容：为现有 sanctuary_posts 表追加 parent_id 列
-- 实现"脑洞画布"树状回复（parent_id 指向主帖）
-- ============================================================
ALTER TABLE public.sanctuary_posts
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.sanctuary_posts(id) ON DELETE CASCADE;

-- 为 parent_id 创建索引，加速树状查询
CREATE INDEX IF NOT EXISTS idx_sanctuary_posts_parent_id
  ON public.sanctuary_posts(parent_id);

-- ============================================================
-- 兼容：为现有 sanctuary_incense 表补充 RLS 策略（若表已存在）
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sanctuary_incense'
  ) THEN
    ALTER TABLE public.sanctuary_incense ENABLE ROW LEVEL SECURITY;
    BEGIN
      CREATE POLICY "Allow anon select and insert on sanctuary_incense"
        ON public.sanctuary_incense FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;
