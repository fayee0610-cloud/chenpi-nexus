// 独立 AI 情报生成脚本：调用 DeepSeek 生成真实硬核情报
// 用法：node scripts/fetch-insights.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com/v1",
  model: process.env.AI_MODEL_NAME || "deepseek-chat",
};

const SYSTEM_PROMPT = `你是一个极度挑剔的科技商业情报编辑，名为"陈皮"。

## 你的任务
基于你所掌握的最新知识（截至 2025 年），生成 9 条具备商业价值的硬核情报，每个分类 3 条。

## 正向聚焦（仅接受以下内容）
1. **ToC 知名科技品牌策略**：Apple, Tesla, Dyson, Anker, DJI 等品牌定位、发布会叙事、情绪价值、IMC 营销。
2. **ToB 科技与 AI 公司 GTM 策略**：OpenAI, Anthropic, Palantir, HubSpot 等 Demand Gen, PLG, Thought Leadership, ABM。
3. **具身智能与科技大厂动态**：智元机器人, 宇树科技, 逐际动力, 华为/Google 实验室。

## 绝对拦截（以下内容必须丢弃，不得输出）
- 跨境电商（Shopee/Lazada/Amazon）、东南亚/拉美/中东本土化选品
- 低价铺货、买量投流、TikTok 刷粉
- 泛泛而谈的公关软文或微观政策解读
- 与品牌策略/AI技术/具身智能无关的泛资讯

## 输出格式
返回 JSON 数组，包含 9 条情报（每个分类 3 条）：
\`\`\`json
[
  {
    "title": "简洁有力的标题（20字以内）",
    "category": "🤖 机器人/具身智能" | "⚡ AI技术/大厂策略" | "📈 品牌策略/GTM干货",
    "summary": "陈皮式 100 字核心看点，必须包含商业价值提炼，不要泛泛而谈",
    "source_name": "数据来源（如：智元机器人官方 / 36Kr 深度 / 华为开发者大会）",
    "original_url": "真实可访问的原文链接",
    "tags": ["标签1", "标签2"],
    "is_featured": true或false
  }
]
\`\`\`

注意：
- original_url 必须是真实存在的 URL（如官方网站、新闻报道网站）
- 每个分类的前 1 条设为 is_featured: true
- 不要输出任何其他文字，只返回 JSON。`;

async function main() {
  if (!AI_CONFIG.apiKey) {
    console.error("❌ AI_API_KEY 未配置");
    process.exit(1);
  }

  console.log("🤖 调用 DeepSeek API 生成真实情报...");

  const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "请生成 9 条最新的硬核科技商业情报，每个分类 3 条。" },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    console.error(`❌ AI 调用失败: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.error(text);
    process.exit(1);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  console.log("✅ AI 返回内容，正在解析 JSON...");

  // 提取 JSON 数组
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("❌ AI 返回内容无 JSON 数组");
    console.error(content);
    process.exit(1);
  }

  const items = JSON.parse(jsonMatch[0]);
  console.log(`✅ 解析成功，共 ${items.length} 条情报`);

  // 输出到文件
  const outputPath = path.join(__dirname, "insights-output.json");
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), "utf-8");
  console.log(`✅ 结果已写入: ${outputPath}`);

  // 同时输出为 siteData.ts 格式
  const tsItems = items.map((item, i) => `  {
    id: "hub-${i + 1}",
    title: ${JSON.stringify(item.title)},
    category: ${JSON.stringify(item.category)},
    summary: ${JSON.stringify(item.summary)},
    sourceName: ${JSON.stringify(item.source_name)},
    originalUrl: ${JSON.stringify(item.original_url)},
    publishedAt: "2025.07.${String(20 - i * 2).padStart(2, "0")}",
    isPublished: true,
    isFeatured: ${item.is_featured || false},
    apiSource: "auto_bot",
    tags: ${JSON.stringify(item.tags || [])},
  }`);

  const tsOutput = `// ========== 8. 情报站 (Information Hub) 数据 ==========
// 由 AI (DeepSeek) 自动生成，基于最新科技商业动态

export const insightsHub: InsightHubItem[] = [
${tsItems.join(",\n")},
];
`;

  const tsPath = path.join(__dirname, "insights-siteData.txt");
  fs.writeFileSync(tsPath, tsOutput, "utf-8");
  console.log(`✅ siteData 格式已写入: ${tsPath}`);
}

main().catch((err) => {
  console.error("❌ 脚本执行错误:", err);
  process.exit(1);
});
