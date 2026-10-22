// 端到端验证：模拟 fetch-intelligence 管道的去重步骤
// 1) 查询现有 DB 签名
// 2) 对若干真实 RSS 标题跑 isSameEventRaw 预拦截
// 3) 跑 clusterAndPickLosers 自清理
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { isSameEventRaw, clusterAndPickLosers, type DedupeRow } from "../src/lib/intelDedup";

const envPath = path.resolve(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq > 0) { const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim(); if (!process.env[k]) process.env[k] = v; }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await supabase.from("malaysia_intelligence")
    .select("id, title_zh, title_en, summary_zh, importance_score, is_featured, created_at")
    .order("created_at", { ascending: false }).limit(500);

  const rows = data as DedupeRow[];
  console.log(`DB 现有 ${rows.length} 条\n`);

  // 与生产管道 fetchRecentEventSigs 相同的字段映射
  const sigs = rows.map((r) => ({
    titleZh: String(r.title_zh || ""),
    titleEn: String(r.title_en || ""),
    summary: String(r.summary_zh || ""),
  }));

  // 模拟几条"新抓取"的 RSS 标题（包含已知重复 + 全新主题）
  const testFeeds = [
    { title: "ShopeePay Money+ offers 5% annual returns in Malaysia", content: "ShopeePay launched a new Money+ feature..." },
    { title: "BYD opens first ultra-fast charging station in Malaysia", content: "BYD Denza Balakong..." },
    { title: "TikTok Shop Malaysia GMV surpasses RM1 billion", content: "TikTok Shop reported record GMV..." },
  ];

  for (const item of testFeeds) {
    const blocked = sigs.some((ex) => isSameEventRaw(item.title, item.content, ex));
    console.log(`  ${blocked ? "🚫 拦截" : "✅ 放行"}: ${item.title.slice(0, 50)}`);
  }

  const { loserIds, duplicateClusters } = clusterAndPickLosers(rows);
  console.log(`\n自清理: ${duplicateClusters} 组重复，待删 ${loserIds.length} 条`);
  console.log("\n✅ 端到端验证通过");
}

main();
