// ============================================================
// checkinProgress — 打卡进度的确定性派生库（前后端共用）
//
// 核心原则：进度不是可变状态，而是从打卡记录推导的派生值
//   progressDay = min(已打卡天数 + 1, MAX_DAY)
//
// 这样从根源上消除旧版 localStorage 状态机的全部边界 bug：
//   - 断签冻结（lastDate 永远落后于 yesterday → Day 永不推进）
//   - React StrictMode 双跑重复推进（需要 dayResolvedDate 锁）
//   - 打卡后当天不推进（旧版要等次日）
//   - 换设备/清缓存进度丢失（进度改由数据库打卡记录派生）
// ============================================================

export const MAX_DAY = 90;

/** 东八区日期 key（YYYY-MM-DD），offsetDays = -1 即昨天 */
export function getUTC8DateKey(offsetDays = 0): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000 + offsetDays * 86400000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc8.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface DerivedProgress {
  /** 当前应学天数 = 已打卡天数 + 1（完成今日打卡即解锁下一课） */
  progressDay: number;
  /** 连续打卡天数（今天或昨天起往回数的连续日期链） */
  streak: number;
  /** 今日是否已打卡 */
  checkedInToday: boolean;
}

/**
 * 从打卡日期集合派生进度与连续天数
 * @param dates 已打卡日期 key 集合（东八区 YYYY-MM-DD）
 * @param todayKey 当前东八区日期（默认实时计算，测试可注入）
 */
export function deriveProgress(
  dates: Iterable<string>,
  todayKey: string = getUTC8DateKey()
): DerivedProgress {
  const set = new Set(dates);
  const count = set.size;

  // 进度 = 打卡次数 + 1，封顶 MAX_DAY（按顺序打卡，断签不跳课也不冻结）
  const progressDay = Math.min(count + 1, MAX_DAY);

  // Streak：从今天往回数连续日期；今天未打卡则从昨天起数（不断签）
  let streak = 0;
  let cursor = set.has(todayKey) ? 0 : -1;
  while (set.has(getUTC8DateKey(cursor))) {
    streak++;
    cursor--;
  }

  return {
    progressDay,
    streak,
    checkedInToday: set.has(todayKey),
  };
}
