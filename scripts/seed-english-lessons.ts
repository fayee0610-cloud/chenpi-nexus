// ============================================================
// seed-english-lessons.ts — 跨境商务英文特训种子数据导入脚本
//
// 用法：
//   cd my-neural-hub
//   npx tsx scripts/seed-english-lessons.ts
//
// 幂等设计：基于 day_number 的 upsert，可重复执行
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { ENGLISH_LESSONS } from "../src/data/englishLessons";

// ---------- 手动加载 .env.local ----------
import fs from "fs";
import path from "path";
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

// ---------- Supabase Admin 客户端 ----------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  console.error("请确保 .env.local 已配置");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------- 日期生成：从今天开始递增 ----------
function generateDate(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ---------- 主函数 ----------
async function seed() {
  console.log(`🚀 开始导入 ${ENGLISH_LESSONS.length} 天课程数据...`);

  const today = new Date().toISOString().split("T")[0];
  let success = 0;
  let failed = 0;

  for (const lesson of ENGLISH_LESSONS) {
    const dateOffset = lesson.day - 1; // Day 1 = today
    const record = {
      id: `english-day-${String(lesson.day).padStart(2, "0")}`,
      date: generateDate(dateOffset),
      day_number: lesson.day,
      category: lesson.category,
      title: lesson.title,
      scene_context: lesson.sceneContext,
      audio_url: lesson.audioUrl || "",
      target_expression: lesson.targetExpression,
      alternative_expression: lesson.alternativeExpression,
      business_takeaway: lesson.businessTakeaway,
      shadowing_practice: lesson.shadowingPractice,
      glossary_items: lesson.glossaryItems,
      is_published: true,
    };

    const { error } = await supabase
      .from("english_daily_lessons")
      .upsert(record, { onConflict: "day_number" });

    if (error) {
      console.error(`❌ Day ${lesson.day} 导入失败:`, error.message);
      failed++;
    } else {
      console.log(`✅ Day ${lesson.day}: ${lesson.title}`);
      success++;
    }
  }

  console.log("\n========================================");
  console.log(`📊 导入完成: ${success} 成功, ${failed} 失败`);
  console.log(`📅 日期范围: ${today} ~ ${generateDate(ENGLISH_LESSONS.length - 1)}`);
  console.log("========================================\n");
}

seed().catch((err) => {
  console.error("💥 脚本执行异常:", err);
  process.exit(1);
});
