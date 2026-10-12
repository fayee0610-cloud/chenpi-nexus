// ============================================================
// intelDedup — 情报语义去重共享算法库
// 供 /api/cron/fetch-intelligence 管道 与 /api/admin/dedupe-intelligence 复用
//
// 核心思路：同一事件常被多家媒体报道，source_url 去重无法拦截。
// 通过「中文标题 + 英文标题 + 摘要」三维字符 bigram Jaccard 相似度
// 判定是否为同一事件，任一维度命中即视为重复。
// ============================================================

// 提取字符 bigram 集合：保留中英数字（品牌名如 Ninja Mart / TikTok 是事件核心实体），
// 仅剔除空白、标点与符号，统一小写
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

export interface EventSig {
  titleZh: string;
  titleEn: string;
  summary: string;
}

// 三维相似度综合判定：中文标题 >0.5 / 英文标题 >0.55 / 摘要前120字 >0.55
export function isSameEvent(a: EventSig, b: EventSig): boolean {
  if (jaccardSim(bigramsOf(a.titleZh), bigramsOf(b.titleZh)) > 0.5) return true;
  if (jaccardSim(bigramsOf(a.titleEn), bigramsOf(b.titleEn)) > 0.55) return true;
  if (
    jaccardSim(
      bigramsOf(a.summary.slice(0, 120)),
      bigramsOf(b.summary.slice(0, 120))
    ) > 0.55
  )
    return true;
  return false;
}

// ---------- 历史数据聚类清洗 ----------
// 输入全表行（按 created_at DESC），输出每簇应删除的 id 列表
// 每簇保留优先级：is_featured=true → importance_score 最高 → created_at 最新
export interface DedupeRow {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  summary_zh: string | null;
  importance_score: number | null;
  is_featured: boolean | null;
  created_at: string;
}

export function clusterAndPickLosers(rows: DedupeRow[]): {
  loserIds: string[];
  duplicateClusters: number;
} {
  const clusters: DedupeRow[][] = [];
  for (const row of rows) {
    const sig: EventSig = {
      titleZh: row.title_zh || "",
      titleEn: row.title_en || "",
      summary: row.summary_zh || "",
    };
    const hit = clusters.find((cluster) =>
      isSameEvent(sig, {
        titleZh: cluster[0].title_zh || "",
        titleEn: cluster[0].title_en || "",
        summary: cluster[0].summary_zh || "",
      })
    );
    if (hit) hit.push(row);
    else clusters.push([row]);
  }

  const loserIds: string[] = [];
  let duplicateClusters = 0;
  for (const cluster of clusters) {
    if (cluster.length === 1) continue;
    duplicateClusters++;
    const sorted = [...cluster].sort((a, b) => {
      if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
      if ((b.importance_score || 3) !== (a.importance_score || 3)) {
        return (b.importance_score || 3) - (a.importance_score || 3);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    for (const loser of sorted.slice(1)) {
      loserIds.push(loser.id);
    }
  }
  return { loserIds, duplicateClusters };
}
