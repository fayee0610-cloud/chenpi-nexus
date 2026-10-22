// ============================================================
// diag-intel-dedup.ts — 东南亚实局情报去重诊断
// 拉取全表数据，跑现有 clusterAndPickLosers，输出重复聚类详情
// 用法：cd my-neural-hub && npx tsx scripts/diag-intel-dedup.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { clusterAndPickLosers, bigramsOf, jaccardSim, isSameEvent, type DedupeRow } from "../src/lib/intelDedup";

// ---------- 手动加载 .env.local ----------
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase
    .from("malaysia_intelligence")
    .select("id, title_zh, title_en, summary_zh, importance_score, is_featured, created_at, published_at, source_name")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    console.error("查询失败:", error?.message);
    process.exit(1);
  }

  console.log(`\n📊 表内总记录数: ${data.length}\n`);

  const rows = data as DedupeRow[];

  // 1. 现有算法判定
  const { loserIds, duplicateClusters } = clusterAndPickLosers(rows);
  console.log(`🧹 现有算法判定: ${duplicateClusters} 组重复，待删除 ${loserIds.length} 条\n`);

  // 2. 输出每个重复聚类的详情
  const clusters: DedupeRow[][] = [];
  for (const row of rows) {
    const sig = {
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

  let clusterIdx = 0;
  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;
    clusterIdx++;
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━ 重复组 #${clusterIdx} (${cluster.length} 条) ━━━━━━━━━━━━━━━━━━━━━━━`);
    for (const r of cluster) {
      const any = r as any;
      console.log(`  • [${any.source_name}] ${r.title_zh}`);
      console.log(`    EN: ${r.title_en?.slice(0, 80)}`);
      console.log(`    score=${r.importance_score} featured=${r.is_featured} pub=${any.published_at}`);
    }
    // 打印组内两两相似度
    if (cluster.length === 2) {
      const a = cluster[0], b = cluster[1];
      const simZh = jaccardSim(bigramsOf(a.title_zh || ""), bigramsOf(b.title_zh || ""));
      const simEn = jaccardSim(bigramsOf(a.title_en || ""), bigramsOf(b.title_en || ""));
      const simSum = jaccardSim(bigramsOf((a.summary_zh || "").slice(0, 120)), bigramsOf((b.summary_zh || "").slice(0, 120)));
      console.log(`    相似度: titleZh=${simZh.toFixed(3)} titleEn=${simEn.toFixed(3)} summary=${simSum.toFixed(3)}`);
    }
    console.log("");
  }

  // 3. 检查潜在漏判：找 title_zh 中包含相同实体词但没被判为同事件的对
  console.log("\n🔍 潜在漏判检测（标题含共同高频词但未聚类）...");
  const wordCount = new Map<string, number>();
  for (const r of rows) {
    const zh = r.title_zh || "";
    // 简单按标点切词
    const tokens = zh.split(/[\s，。、：；！？""''（）()【】\[\]·\-]+/).filter(t => t.length >= 2);
    for (const t of tokens) wordCount.set(t, (wordCount.get(t) || 0) + 1);
  }
  // 找出现 >=2 次的实体词
  const frequentEntities = [...wordCount.entries()].filter(([_, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
  console.log(`  高频实体词 Top 10: ${frequentEntities.slice(0, 10).map(([w, c]) => `${w}(${c})`).join(", ")}\n`);

  console.log(`\n✅ 诊断完成。总记录 ${data.length}，重复组 ${duplicateClusters}，待删 ${loserIds.length}`);
}

main().catch((err) => {
  console.error("💥 脚本异常:", err);
  process.exit(1);
});
