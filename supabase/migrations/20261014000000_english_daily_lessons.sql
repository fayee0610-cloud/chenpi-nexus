-- ============================================================
-- 跨境商务英文特训 english_daily_lessons 表
-- Day 1-30 每日打卡课程，支持前台读取 + 后台编辑
-- ============================================================

CREATE TABLE IF NOT EXISTS public.english_daily_lessons (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  day_number INT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Speaking',
  title TEXT NOT NULL,
  scene_context TEXT,
  audio_url TEXT,
  target_expression JSONB DEFAULT '{}'::jsonb,
  alternative_expression JSONB DEFAULT '{}'::jsonb,
  business_takeaway TEXT,
  shadowing_practice JSONB DEFAULT '[]'::jsonb,
  glossary_items JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS day_number INT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Speaking';
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS scene_context TEXT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS target_expression JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS alternative_expression JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS business_takeaway TEXT;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS shadowing_practice JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS glossary_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.english_daily_lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_english_lessons_day_number
  ON public.english_daily_lessons (day_number);
CREATE INDEX IF NOT EXISTS idx_english_lessons_date
  ON public.english_daily_lessons (date);

-- RLS
ALTER TABLE public.english_daily_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "english_lessons_select_all" ON public.english_daily_lessons;
DROP POLICY IF EXISTS "english_lessons_insert_all" ON public.english_daily_lessons;
DROP POLICY IF EXISTS "english_lessons_update_all" ON public.english_daily_lessons;
DROP POLICY IF EXISTS "english_lessons_delete_all" ON public.english_daily_lessons;
CREATE POLICY "english_lessons_select_all" ON public.english_daily_lessons FOR SELECT USING (true);
CREATE POLICY "english_lessons_insert_all" ON public.english_daily_lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "english_lessons_update_all" ON public.english_daily_lessons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "english_lessons_delete_all" ON public.english_daily_lessons FOR DELETE USING (true);
