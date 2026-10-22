// ============================================================
// dump-intel.ts — 打印全表标题与摘要，人工排查重复
// ============================================================

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from("malaysia_intelligence")
    .select("id, title_zh, title_en, summary_zh, source_name, published_at, created_at")
    .order("published_at", { ascending: false })
    .limit(100);

  if (error || !data) { console.error(error?.message); process.exit(1); }

  console.log(`共 ${data.length} 条\n`);
  for (const r of data as any[]) {
    console.log(`[${r.source_name}] ${r.title_zh}`);
    console.log(`  EN: ${r.title_en?.slice(0, 90)}`);
    console.log(`  sum: ${r.summary_zh?.slice(0, 90)}`);
    console.log(`  pub: ${r.published_at}  created: ${r.created_at}`);
    console.log("");
  }
}
main().catch(e => { console.error(e); process.exit(1); });
