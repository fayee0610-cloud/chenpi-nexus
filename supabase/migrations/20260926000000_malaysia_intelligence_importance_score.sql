-- malaysia_intelligence 新增 importance_score 列
-- 用于 AI 评估情报价值（1-5 整数），前端按分降序排列 + 高价值徽章
-- 幂等可重复执行

ALTER TABLE public.malaysia_intelligence
  ADD COLUMN IF NOT EXISTS importance_score INTEGER NOT NULL DEFAULT 3;

-- 回填：旧数据无打分，默认 3（常规动态）
-- 新写入由 /api/cron/fetch-intelligence 的 writeIntelligence payload 提供
