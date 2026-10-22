// ============================================================
// intelDedup — 情报语义去重共享算法库（v2 实体感知版）
// 供 /api/cron/fetch-intelligence 管道 与 /api/admin/dedupe-intelligence 复用
//
// v2 改进：
//   1. 实体词重叠率（品牌/产品/型号）作为主信号，解决同一事件不同措辞漏判
//   2. 字符二元组 Jaccard 作为兜底信号，阈值下调
//   3. 聚类采用传递闭包（连通分量），避免 A~B、B~C 但 A、C 不同簇的碎片化
// ============================================================

// ---------- 英文停用词（语法词 + 通用特征词，不承载事件实体信息） ----------
// 品牌/产品/型号/地名等特定标识符不在此列，会被保留为实体
const STOPWORDS = new Set([
  // 语法虚词
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below",
  "from", "up", "down", "out", "off", "over", "under", "again", "further",
  "then", "once", "and", "but", "or", "nor", "not", "so", "yet", "both",
  "either", "neither", "each", "every", "all", "any", "few", "more", "most",
  "other", "some", "such", "no", "only", "own", "same", "than", "too", "very",
  "can", "will", "just", "should", "now", "here", "there", "when", "where",
  "why", "how", "what", "which", "who", "whom", "this", "that", "these", "those",
  "its", "as", "it", "he", "she", "they", "we", "you", "i", "me", "him", "her",
  "them", "us", "my", "your", "his", "their", "our", "also", "has", "have",
  "had", "do", "does", "did", "would", "could", "may", "might", "must", "shall",
  "new", "official", "officially", "first", "local", "launches", "launch",
  "launched", "arrives", "arrive", "arrived", "available", "now", "set",
  // 地理通用词
  "malaysia", "malaysian", "kuala", "lumpur", "kl", "global", "world",
  "asia", "southeast", "china", "chinese", "beijing", "shenzhen",
  // 月份/日期（纯数字已在 extractEntities 中排除）
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "today", "tomorrow", "yesterday", "week", "month", "year", "day",
  // 通用硬件/功能特征词（易造成不同产品误聚）
  "chip", "processor", "cpu", "gpu", "ram", "rom", "gb", "tb", "mp", "mah",
  "speaker", "speakers", "surround", "sound", "audio", "display", "screen",
  "camera", "battery", "batteries", "charging", "charger", "fast", "wireless",
  "price", "priced", "pricing", "cost", "cheap", "budget", "premium", "flagship",
  "series", "gen", "pro", "max", "mini", "plus", "ultra", "lite", "se", "air",
  "smart", "ai", "digital", "mobile", "app", "apps", "platform", "service",
  "support", "feature", "features", "tech", "technology", "model", "version",
  "update", "updates", "upgrade", "offers", "offer", "deal", "promo", "sale",
  "free", "bonus", "gift", "limited", "edition", "anniversary", "collection",
  "assembly", "partner", "partners", "dealership", "network", "system",
  "market", "markets", "industry", "sector", "business", "company", "firms",
  "group", "corp", "inc", "ltd", "sdn", "bhd", "official", "confirms",
  "announces", "reveals", "unveils", "introduces", "brings", "adds", "starts",
  "begins", "opens", "closes", "expands", "raises", "cuts", "slashes", "boosts",
  // 通用商业/金融词
  "fintech", "brand", "brands", "trade", "trading", "investment", "funding",
  "series", "raises", "raised", "million", "billion", "profit", "revenue",
  "growth", "expand", "expansion", "partnership", "collaboration", "deal",
  "agreement", "mou", "contract", "license", "licensing", "regulation",
  "policy", "bill", "act", "law", "government", "ministry", "minister",
  // 通用规格/时间词
  "hours", "hour", "minutes", "days", "months", "years", "hybrid", "anc",
  "noise", "cancelling", "waterproof", "resistant", "bluetooth", "wifi",
]);

// ---------- 字符二元组 ----------
export function bigramsOf(text: string): Set<string> {
  const clean = (text || "").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
  const set = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) {
    set.add(clean.slice(i, i + 2));
  }
  return set;
}

export function jaccardSim(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// ---------- 实体词抽取 ----------
// 从标题中提取品牌/产品/型号实体：
//   - 含字母的 token（长度≥2，且非停用词）：BYD / ShopeePay / 600S / Porta / Inokom
//   - 纯数字 token 不提取（年份/价格/日期太通用，易造成误判）
// 大小写归一，保留核心命名实体
export function extractEntities(text: string): Set<string> {
  const entities = new Set<string>();
  const tokens = (text || "").match(/[A-Za-z0-9][A-Za-z0-9+#.-]*/g) || [];
  for (const t of tokens) {
    const lower = t.toLowerCase();
    // 只保留含字母的 token（剔除纯数字）
    if (!/[a-z]/.test(lower)) continue;
    if (t.length < 2) continue;
    if (STOPWORDS.has(lower)) continue;
    // 按 - . 分割，若任一子词为停用词则丢弃整个 token
    // （如 "4-speaker" → 子词 "speaker" 是停用词 → 丢弃）
    const subParts = lower.split(/[.-]/);
    if (subParts.some((p) => STOPWORDS.has(p))) continue;
    entities.add(lower);
  }
  return entities;
}

export interface EventSig {
  titleZh: string;
  titleEn: string;
  summary: string;
}

// ---------- 同事件判定（多信号融合） ----------
// 主信号：共享特定实体（品牌+产品+型号）≥ 2 个 → 同事件
//   例：「比亚迪闪充站」vs「比亚迪大马首个闪充站」共享 byd/flash/charger/denza → 命中
//   反例：「Apple HomePod mini 2」vs「Apple TV 4K」仅共享 apple → 不命中
// 兜底信号：标题/摘要字符二元组相似度超阈值
export function isSameEvent(a: EventSig, b: EventSig): boolean {
  // 信号 1：特定实体重叠（品牌/产品/型号/地名，已剔除通用特征词）
  const aEnt = new Set([...extractEntities(a.titleZh), ...extractEntities(a.titleEn)]);
  const bEnt = new Set([...extractEntities(b.titleZh), ...extractEntities(b.titleEn)]);
  let shared = 0;
  for (const x of aEnt) if (bEnt.has(x)) shared++;
  if (shared >= 2) return true;

  // 信号 2：标题字符二元组（阈值适中——真同事件多由实体规则命中，bigram 仅兜底）
  if (jaccardSim(bigramsOf(a.titleZh), bigramsOf(b.titleZh)) > 0.4) return true;
  if (jaccardSim(bigramsOf(a.titleEn), bigramsOf(b.titleEn)) > 0.55) return true;

  // 信号 3：摘要字符二元组（弱兜底，阈值高——AI 生成摘要结构易撞车）
  if (
    jaccardSim(
      bigramsOf(a.summary.slice(0, 120)),
      bigramsOf(b.summary.slice(0, 120))
    ) > 0.6
  )
    return true;

  return false;
}

// ---------- 预 AI 阶段专用：原始英文标题 vs 库内事件签名 ----------
// 此时尚无 AI 中文标题，仅用原始英文标题 + 正文前 150 字比对
export function isSameEventRaw(enTitle: string, content: string, db: EventSig): boolean {
  const rawEnt = extractEntities(enTitle);
  const dbEnt = new Set([...extractEntities(db.titleZh), ...extractEntities(db.titleEn)]);
  let shared = 0;
  for (const x of rawEnt) if (dbEnt.has(x)) shared++;
  if (shared >= 2) return true;

  // 英文标题 bigram（阈值较高，避免通用特征词导致误判）
  if (jaccardSim(bigramsOf(enTitle), bigramsOf(db.titleEn)) > 0.5) return true;
  // 正文前 150 字 vs 摘要前 120 字 bigram（高阈值，降低误判）
  if (jaccardSim(bigramsOf(content.slice(0, 150)), bigramsOf(db.summary.slice(0, 120))) > 0.6) return true;
  return false;
}

// ---------- 历史数据聚类清洗 ----------
export interface DedupeRow {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  summary_zh: string | null;
  importance_score: number | null;
  is_featured: boolean | null;
  created_at: string;
}

function rowToSig(row: DedupeRow): EventSig {
  return {
    titleZh: row.title_zh || "",
    titleEn: row.title_en || "",
    summary: row.summary_zh || "",
  };
}

// 保留优先级：is_featured=true → importance_score 最高 → created_at 最新
function pickWinner(cluster: DedupeRow[]): DedupeRow {
  return [...cluster].sort((a, b) => {
    if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
    if ((b.importance_score || 3) !== (a.importance_score || 3)) {
      return (b.importance_score || 3) - (a.importance_score || 3);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}

// 聚类：构建同事件无向图，求连通分量（传递闭包）
// 解决 A~B、B~C 但 A、C 被判不同簇的碎片化问题
export function clusterAndPickLosers(rows: DedupeRow[]): {
  loserIds: string[];
  duplicateClusters: number;
} {
  const n = rows.length;
  if (n <= 1) return { loserIds: [], duplicateClusters: 0 };

  // 1. 构建邻接表（同事件即连边）
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isSameEvent(rowToSig(rows[i]), rowToSig(rows[j]))) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  // 2. BFS 求连通分量
  const visited = new Array(n).fill(false);
  const clusters: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const component: number[] = [];
    const queue = [i];
    visited[i] = true;
    while (queue.length) {
      const cur = queue.shift()!;
      component.push(cur);
      for (const nb of adj[cur]) {
        if (!visited[nb]) {
          visited[nb] = true;
          queue.push(nb);
        }
      }
    }
    clusters.push(component);
  }

  // 3. 每簇保留 1 条最优，其余为 loser
  const loserIds: string[] = [];
  let duplicateClusters = 0;
  for (const comp of clusters) {
    if (comp.length <= 1) continue;
    duplicateClusters++;
    const clusterRows = comp.map((idx) => rows[idx]);
    const winner = pickWinner(clusterRows);
    for (const r of clusterRows) {
      if (r.id !== winner.id) loserIds.push(r.id);
    }
  }
  return { loserIds, duplicateClusters };
}
