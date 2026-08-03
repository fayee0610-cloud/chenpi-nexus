// ============================================================
// 赛博 ID 生成器 — 为未登录访客生成稳定的专属赛博身份标识
// 格式：[赛博词库前缀]#[4位Hex码]（例如：赛博漫游者#89A2）
// 利用 localStorage 持久化，同一浏览器/访客 ID 永久不变
// ============================================================

// 赛博风格前缀池
const CYBER_PREFIXES = [
  "赛博漫游者", "高新节点", "暗网幽灵", "边缘打工人", "数据浪人",
  "神经突触", "比特旅人", "信号游侠", "协议观察者", "终端诗人",
  "量子migrant", "代码苦行僧", "加密旁观者", "低熵生物", "故障艺术家",
];

const STORAGE_KEY = "chenpi_cyber_id";

/**
 * 生成并持久化一个赛博 ID
 * 基于 navigator 指纹特征 + FNV-1a 哈希算法生成 4 位十六进制码
 * 结合赛博前缀池拼装为：`赛博漫游者#89A2`
 *
 * 已登录用户可传入 fixedName 覆盖，优先使用固定昵称
 */
export function getOrCreateCyberId(fixedName?: string | null): string {
  // 已登录用户优先使用固定昵称
  if (fixedName && fixedName.trim()) return fixedName.trim();

  // SSR 安全：服务端无 localStorage/navigator，返回占位 ID
  if (typeof window === "undefined") return "赛博漫游者#0000";

  // localStorage 持久化，保证同一浏览器访客 ID 稳定不变
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  // 采集客户端特征：UA + 语言 + 时区 + 屏幕分辨率 + 随机种子
  const ua = navigator.userAgent || "unknown";
  const lang = navigator.language || "unknown";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const seed = `${ua}#${lang}#${tz}#${screen}#${Math.random().toString(36).slice(2, 8)}`;

  // FNV-1a 哈希 → 4 位十六进制
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  const hex = (hash & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const prefix = CYBER_PREFIXES[Math.floor(Math.random() * CYBER_PREFIXES.length)];
  const cyberId = `${prefix}#${hex}`;

  localStorage.setItem(STORAGE_KEY, cyberId);
  return cyberId;
}

/**
 * 获取赛博 ID 的前缀部分（用于头像首字显示）
 */
export function getCyberPrefix(cyberId: string): string {
  return cyberId.split("#")[0] || cyberId;
}

/**
 * 获取赛博 ID 的哈希码部分（用于紫色高亮显示）
 */
export function getCyberHash(cyberId: string): string | null {
  const parts = cyberId.split("#");
  return parts.length > 1 ? parts[1] : null;
}
