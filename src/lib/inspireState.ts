"use client";

// ============================================================
// 文章【激发灵感】点赞状态共享层
// 列表卡片 / 弹窗 / 独立详情页统一读取同一 localStorage 源，
// 确保跨页面「已点赞」状态与点赞数同步一致。
// ============================================================

// 规范 key：以 article_id 数组形式存储已激发灵感文章
const INSPIRED_KEY = "inspired_articles";
// 历史 key（迁移用，迁移后清空避免双写）
const LEGACY_KEYS = ["cp_inspired_insights", "cp_liked_insights"];

function readArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, arr: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // 隐私模式等写入失败，静默忽略
  }
}

// 一次性迁移历史 key 数据到规范 key（仅执行一次，幂等）
let migrated = false;
function migrateLegacy(): void {
  if (migrated || typeof window === "undefined") return;
  migrated = true;
  try {
    const current = new Set(readArray(INSPIRED_KEY));
    let changed = false;
    for (const k of LEGACY_KEYS) {
      const legacy = readArray(k);
      for (const id of legacy) {
        if (!current.has(id)) {
          current.add(id);
          changed = true;
        }
      }
      if (legacy.length > 0) {
        // 迁移后清空历史 key，避免双写割裂
        window.localStorage.removeItem(k);
      }
    }
    if (changed) writeArray(INSPIRED_KEY, [...current]);
  } catch {
    // 迁移失败静默
  }
}

/** 读取所有已激发灵感的文章 id */
export function getInspiredIds(): string[] {
  migrateLegacy();
  return readArray(INSPIRED_KEY);
}

/** 判断某篇文章是否已激发灵感 */
export function isInspired(id: string): boolean {
  if (!id) return false;
  migrateLegacy();
  return readArray(INSPIRED_KEY).includes(String(id));
}

/** 标记某篇文章为已激发（幂等，重复标记不产生重复项） */
export function markInspired(id: string): void {
  if (!id) return;
  migrateLegacy();
  const arr = readArray(INSPIRED_KEY);
  const sid = String(id);
  if (!arr.includes(sid)) {
    arr.push(sid);
    writeArray(INSPIRED_KEY, arr);
  }
}

/** 取消标记（用于持久化失败时回滚本地状态） */
export function unmarkInspired(id: string): void {
  if (!id) return;
  migrateLegacy();
  const arr = readArray(INSPIRED_KEY).filter((x) => x !== String(id));
  writeArray(INSPIRED_KEY, arr);
}
