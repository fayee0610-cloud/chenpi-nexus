// ============================================================
// cleanup-intel-dupes.ts — 执行历史情报去重清理
// 复用 intelDedup.clusterAndPickLosers，删除同事件重复行
// 用法：cd my-neural-hub && npx tsx scripts/cleanup-intel-dupes.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { clusterAndPickLosers, type DedupeRow } from "../src/lib/intelDedup";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase
    .from("malaysia_intelligence")
    .select("id, title_zh, title_en, summary_zh, importance_score, is_featured, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) { console.error("查询失败:", error?.message); process.exit(1); }

  console.log(`\n📊 表内总记录数: ${data.length}\n`);
  const rows = data as DedupeRow[];

  const { loserIds, duplicateClusters } = clusterAndPickLosers(rows);
  console.log(`🧹 判定: ${duplicateClusters} 组重复，待删除 ${loserIds.length} 条\n`);

  if (loserIds.length === 0) {
    console.log("✅ 无重复数据，无需清理");
    return;
  }

  // 打印待删除明细
  const loserSet = new Set(loserIds);
  for (const r of rows) {
    if (loserSet.has(r.id)) {
      console.log(`  ❌ 删除: [${r.title_zh?.slice(0, 40)}] (score=${r.importance_score})`);
    }
  }

  // 分批删除
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < loserIds.length; i += BATCH) {
    const batch = loserIds.slice(i, i + BATCH);
    const { error: delErr } = await supabase
      .from("malaysia_intelligence")
      .delete()
      .in("id", batch);
    if (delErr) {
      console.error(`❌ 删除失败: ${delErr.message}`);
      process.exit(1);
    }
    deleted += batch.length;
  }

  console.log(`\n✅ 清理完成: 删除 ${deleted} 条重复记录，表内剩余 ${data.length - deleted} 条`);
}

main().catch((e) => { console.error(e); process.exit(1); });
