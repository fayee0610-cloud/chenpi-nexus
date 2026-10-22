-- ============================================================
-- 每日打卡记录 daily_checkins 表
-- 供【马来语轻打卡】与【跨境商务英文】打卡模块使用
-- 进度推导：progressDay = 已打卡记录数 + 1（打卡即解锁下一课）
--
-- 身份模型：
--   - 登录用户：user_id 关联 auth.users（跨设备同步）
--   - 匿名访客：device_id（前端生成的 UUID，存 localStorage）
--   - 查询时二者取 OR（登录前匿名打卡的记录登录后依然可见）
--
-- 唯一索引说明：非部分索引（ON CONFLICT 需要精确匹配列）。
-- NULL 在 Postgres 唯一索引中互不冲突，故匿名行不会误撞 user 索引，反之亦然。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  device_id TEXT,
  module TEXT NOT NULL CHECK (module IN ('english', 'malay')),
  date_key TEXT NOT NULL,            -- 东八区日期 YYYY-MM-DD（打卡当日）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 幂等：同一身份 + 模块 + 日期 仅一条记录（重复打卡请求 DO NOTHING 去重）
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user
  ON public.daily_checkins (user_id, module, date_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_device
  ON public.daily_checkins (device_id, module, date_key);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_module_device
  ON public.daily_checkins (module, device_id);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- 读取：登录用户可读自己的记录（anon 走服务端 service_role，无需 anon 读策略）
DROP POLICY IF EXISTS "daily_checkins_select_own" ON public.daily_checkins;
CREATE POLICY "daily_checkins_select_own" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

-- 写入统一走 /api/checkins（service_role 绕过 RLS），防止 anon 直接刷表
