// ============================================================
// /api/cron/fetch-intelligence — 马来西亚商业情报全自动聚合
//
// 流水线：RSS 抓取 → source_url 去重 → 预AI同事件拦截 → 行业配额选取
//        → AI 中文摘要+商业启示（按真实行业） → 批次内合并 → 类目配平 → 写入
//
// 触发方式：
//   1. Vercel Cron（每天 UTC 00:00 = 北京时间 08:00）
//   2. 前台【⚡ 实时感知】按钮手动触发
//   3. Admin 后台手动触发
//
// 防护机制：
//   - 超时防护：AbortController 50s 超时
//   - 权限放行：x-vercel-cron 头 / CRON_SECRET 双重校验
//   - 去重：对比 malaysia_intelligence 表的 source_url
//   - 行业配额：预 AI 单桶 ≤40%，写入前单分类 ≤6 条，防单一行业刷屏
//   - 写入兜底：Service Role → Anon Key 降级写入
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";
import { searchWeb, pickQueriesByWeight } from "@/lib/webSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------- AI 配置 ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 东南亚实局 RSS 源矩阵（v6 双轨制版） ----------
// 双轨架构：主轨道（权威战略源，约 70%）+ 次轨道（贴地舆情源，约 30% 配额）
// 可用性实测（2026-10-22/28）：
//   直连 RSS 死链：MATRADE / Bernama / The Edge / The Star / Malay Mail / CosmeticsDesign-Asia / FoodNavigator-Asia / NST商业频道
//   解法：官方与垂直赛道统一用 Google News RSS 聚合检索间接覆盖（when:Nd 限定近 N 天）
//   次轨道：Reddit 官方 .rss（低风险防爬）+ Lowyat 论坛 GN site: 适配器（绕开 403）+ GN 社媒趋势适配器
// 行业配额：预 AI 单桶 ≤40% + 缺失保底类目预留名额 + 写入前单分类 ≤6 条 + 社区轨道 ≤30%

// 行业赛道八分类（与 AI category 输出、前端分类 Tab 三方对齐）
export const INDUSTRY_BUCKETS = [
  "政策/贸易", "渠道/电商", "清真/食品", "美妆/消费",
  "农业/B2B", "3C数码", "金融/科技", "展会/活动",
] as const;
type IndustryBucket = (typeof INDUSTRY_BUCKETS)[number];
// 内部伪桶：仅用于预 AI 配额选取（社区无关键词命中帖），AI 输出与前端不使用
type QuotaBucket = IndustryBucket | "本地舆情";

// 类目保底清单：近 60 条中数量 <2 的保底类目，预 AI 各预留 2 个名额（兜底抓取）
const QUOTA_CATS: IndustryBucket[] = ["政策/贸易", "清真/食品", "美妆/消费", "农业/B2B", "3C数码", "渠道/电商"];

// 来源轨道（前端卡片属性标签：🏛️ 官方政策 / 📊 财经主流 / 💬 本地舆情）
type SourceTrack = "official" | "business" | "community";
export const TRACK_LABEL: Record<SourceTrack, string> = {
  official: "🏛️ 官方政策",
  business: "📊 财经主流",
  community: "💬 本地舆情",
};

// Google News RSS 聚合检索（my 区域，when:Nd 限定近 N 天）
const GN_MY = (query: string, days = 2) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${days}d`)}&hl=en-MY&gl=MY&ceid=MY:en`;

const RSS_FEEDS = [
  // ===== 主轨道 · 官方与政策 =====
  { name: "MIDA", url: "https://www.mida.gov.my/feed/", topic: "政策/贸易", weight: 40, bucket: "政策/贸易", track: "official" },
  { name: "Google News Policy", url: GN_MY('Malaysia MIDA OR MATRADE OR "trade policy"'), topic: "政策/贸易", weight: 35, bucket: "政策/贸易", track: "official" },
  // ===== 主轨道 · 宏观财经大报（覆盖面广，靠关键词分桶）=====
  { name: "FMT Business", url: "https://www.freemalaysiatoday.com/category/business/feed/", topic: "宏观财经", weight: 35, track: "business" },
  { name: "Google News Business", url: GN_MY("Malaysia business"), topic: "宏观财经", weight: 35, track: "business" },
  { name: "Google News Economy", url: GN_MY("Malaysia economy trade investment"), topic: "宏观经济", weight: 30, track: "business" },
  { name: "Business Today MY", url: "https://www.businesstoday.com.my/feed/", topic: "本土商业", weight: 30, track: "business" },
  { name: "Vulcan Post", url: "https://vulcanpost.com/feed/", topic: "创业科技", weight: 25, track: "business" },
  // ===== 主轨道 · 垂直行业（Google News 聚合检索，补齐缺失赛道）=====
  { name: "Google News Halal", url: GN_MY("Malaysia halal JAKIM certification"), topic: "清真产业", weight: 30, bucket: "清真/食品", track: "business" },
  { name: "Google News Food", url: GN_MY("Malaysia food beverage FMCG brand"), topic: "食品饮料", weight: 30, bucket: "清真/食品", track: "business" },
  { name: "Google News Beauty", url: GN_MY("Malaysia cosmetics beauty skincare brand"), topic: "美妆护肤", weight: 30, bucket: "美妆/消费", track: "business" },
  { name: "Google News AgriB2B", url: GN_MY("Malaysia agriculture agritech export manufacturing"), topic: "农业/B2B", weight: 30, bucket: "农业/B2B", track: "business" },
  { name: "Google News Commerce", url: GN_MY("Malaysia Shopee TikTok Shop Lazada retail"), topic: "电商渠道", weight: 30, bucket: "渠道/电商", track: "business" },
  // ===== 主轨道 · 社媒趋势适配器（间接监听 TikTok/FB 社媒爆点舆情）=====
  { name: "Google News Social", url: GN_MY('Malaysia (TikTok Shop OR "viral product" OR bestseller)'), topic: "社媒趋势", weight: 25, track: "business" },
  // ===== 主轨道 · 零售与创投 =====
  { name: "Inside Retail Asia", url: "https://insideretail.asia/category/malaysia/feed/", topic: "零售/商超", weight: 35, bucket: "渠道/电商", track: "business" },
  { name: "TechInAsia Malaysia", url: "https://www.techinasia.com/tag/malaysia/feed", topic: "创投科技", weight: 25, bucket: "金融/科技", track: "business" },
  // ===== 次轨道 · 贴地舆情（≤30% 配额，AI 降噪后入库）=====
  { name: "Reddit r/malaysia", url: "https://www.reddit.com/r/malaysia/top/.rss?t=day", topic: "本地舆情", weight: 18, track: "community" },
  { name: "Reddit MalaysianPF", url: "https://www.reddit.com/r/MalaysianPF/top/.rss?t=day", topic: "本地舆情", weight: 18, track: "community" },
  // Reddit 原生 RSS 在数据中心出口 IP（Vercel AWS / 本地代理）易被 403 反爬，
  // 用 GN site: 适配器做同主题兜底（与 Lowyat 同一模式，GN 出口已验证稳定）
  { name: "Google News Reddit MY", url: GN_MY("site:reddit.com/r/malaysia OR site:reddit.com/r/MalaysianPF", 3), topic: "论坛舆情", weight: 15, track: "community" },
  { name: "Google News Lowyat", url: GN_MY("site:forum.lowyat.net", 7), topic: "论坛舆情", weight: 15, track: "community" },
  // ===== 次轨道 · 3C 数码（降权限流：仅作配额桶内的补充信源）=====
  { name: "SoyaCincau", url: "https://soyacincau.com/feed/", topic: "3C数码", weight: 12, bucket: "3C数码", track: "business" },
  { name: "Lowyat.NET", url: "https://www.lowyat.net/feed/", topic: "3C数码", weight: 12, bucket: "3C数码", track: "business" },
] as const;

// 源权重映射（Web Search 结果无固定源，用默认权重 25）
const SOURCE_WEIGHT = new Map<string, number>(RSS_FEEDS.map((f) => [f.name, f.weight]));

// ---------- AI 候选优先级评分：新鲜度优先 + 源权重加权 ----------
// 保障「实时感知」优先提炼 24h 内的新鲜情报，而非高权重源的旧闻
function candidateScore(item: RawFeedItem): number {
  const w = SOURCE_WEIGHT.get(item.sourceName) ?? 25;
  const ageH = item.pubDate
    ? (Date.now() - new Date(item.pubDate).getTime()) / 3600000
    : 72; // 无发布时间视为旧闻
  const freshness = ageH < 24 ? 30 : ageH < 48 ? 15 : 0;
  return w + freshness;
}

// ---------- 关键词预过滤：客户端硬性丢弃无关新闻 ----------
// 命中标题/内容任一关键词即丢弃，不进入 AI 提炼环节（节省 Token）
const IRRELEVANT_KEYWORDS = [
  // 房地产
  "property", "real estate", "housing", "condo", "apartment", "property market",
  "house price", "property developer", "landed property",
  // 股市大盘
  "stock market", "bursa", "kuala lumpur stock", "stock index", "share price",
  "equity market", "ipo ", "stock close", "market close",
  // 大宗商品
  "crude oil", "oil price", "palm oil", "crude palm", "cpo price", "rubber price",
  "gold price", "commodity prices",
  // 国外巨头人事
  "tesla ceo", "apple ceo", "tata group", "elon musk", "netflix", "disney",
  // ===== 阶段三新增：强制剔除宏观政务类 =====
  // 航天/航空基建
  "aerospace", "spaceport", "satellite launch", "rocket launch", "national space",
  "aerospace industry blueprint",
  // 人才新政/博士引进
  "talent", "talentcorp", "phd", "doctorate", "scholarship", "research grant",
  "talent recruitment", "skilled worker visa",
  // 数据中心/算力基建
  "data center", "data centre", "ai computing", "hyperscale", "gpu cluster",
  "cloud region", "green data center",
  // 军事
  "military", "defence ministry", "armed forces", "naval", "air force base",
  "defence procurement",
  // 官员任免/政务新闻
  "minister appoints", "cabinet reshuffle", "sworn in", "takes office",
  "minister resigns", "official appointment",
  // 通用社会新闻
  "haze", "traffic accident", "murder", "court case", "election",
  // ===== 通稿类剔除：例行财报 / 常规公告（产品召回交由 AI 判定合规价值） =====
  "quarterly results", "quarterly profit", "earnings report", "net profit rose",
  "dividend declared", "annual general meeting", "agm ",
  "appoints new", "new ceo", "new cfo", "board appointment",
  // ===== 泛财经/大宗商品/无实操价值 =====
  "usd/myr", "forex", "currency exchange rate",
  "overnight policy rate", "interest rate hike",
  "gdp growth", "gdp forecast", "economic outlook", "budget deficit",
  "government revenue", "fiscal deficit", "public debt",
  "flood", "flood victims", "landslide", "earthquake", "extreme weather",
  // ===== 无大马市场关联的跨国科技巨头新闻 =====
  "apple launches", "google announces", "meta reveals", "microsoft unveils",
  "samsung galaxy", "iphone ", "ipad ", "pixel ", "galaxy s",
  // ===== 游戏硬件/娱乐硬件（非商业情报）=====
  "playstation", "xbox", "nintendo", "rtx", "geforce", "radeon", "gaming laptop", "console",
  // ===== 国际时政/体育赛事（非商业情报）=====
  "football", "badminton", "premier league", "la liga", "olympic", "world cup",
  "parliament", "protest", "riot", "court ruling", "arrested",
] as const;

function isIrrelevant(item: RawFeedItem): boolean {
  const text = `${item.title} ${item.content}`.toLowerCase();
  return IRRELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

// ---------- 行业分桶（预 AI 配额用） ----------
// 优先级：标题关键词 > 源级 bucket 提示 > 轨道默认（社区→本地舆情伪桶，其余→政策/贸易）
// 关键词顺序即判定优先级：行业专属词（3C 品牌/清真/美妆）先于泛商业词
const BUCKET_KEYWORDS: Array<[QuotaBucket, string[]]> = [
  ["3C数码", ["smartphone", "phone ", "smartwatch", "wearable", "earbuds", "tablet", "laptop", "gadget", "drone", "5g", "headphone", "iphone", "android", "oppo", "xiaomi", "samsung", "vivo", "honor", "huawei", "dji", "coros", "garmin", "g-shock", "power bank", "smart ring", "router", "notebook"]],
  ["清真/食品", ["halal", "jakim", "food ", "beverage", "snack", "coffee", "restaurant", "f&b", "foodpanda", "kitchen", "grocer", "durian", "spice"]],
  ["美妆/消费", ["cosmetic", "beauty", "skincare", "makeup", "fragrance", "personal care", "fashion", "apparel", "furniture", "toy", "baby ", "k-beauty", "jewellery", "watch brand"]],
  ["农业/B2B", ["agriculture", "agritech", "farm", "plantation", "manufactur", "factory", "semiconductor", "machinery", "steel", "cement", "industrial", "oem", "odm", "e&e", "chemical"]],
  ["金融/科技", ["fintech", "payment", "e-wallet", "ewallet", "digital bank", "banking", "insurance", "takaful", "startup", "funding", "venture", "saas", "bnpl", "capital", "ai "]],
  ["渠道/电商", ["shopee", "lazada", "tiktok shop", "e-commerce", "ecommerce", "retail", "supermarket", "hypermarket", "mall", "watsons", "guardian", "aeon", "7-eleven", "logistics", "delivery", "warehouse", "store"]],
  ["展会/活动", ["exhibition", "expo", "trade fair", "conference", "summit", "pop-up", "showcase"]],
  ["政策/贸易", ["mida", "matrade", "miti", "ministry", "government", "tariff", "tax incentive", "investment", "rcep", "cptpp", "trade", "export", "budget", "subsidy", "regulation", "policy"]],
];

// 源名 → 源级 bucket 提示（仅垂直/官方源配置，宏观大报留空靠关键词）
const FEED_BUCKET = new Map<string, IndustryBucket>(
  RSS_FEEDS.filter((f) => "bucket" in f).map((f) => [f.name, f.bucket as IndustryBucket])
);

function classifyBucket(item: RawFeedItem): QuotaBucket {
  const text = ` ${item.title.toLowerCase()} `;
  for (const [bucket, kws] of BUCKET_KEYWORDS) {
    if (kws.some((kw) => text.includes(kw))) return bucket;
  }
  return FEED_BUCKET.get(item.sourceName) || (item.track === "community" ? "本地舆情" : "政策/贸易");
}

// ---------- 类目配额选取：双轨制 + 行业桶双重配额，防单一行业霸屏 ----------
// 主轨道 ≥70%（社区轨道 ≤30%）；单桶占比上限 40%；保底类目预留名额优先入选取
const BUCKET_SHARE_CAP = 0.4;
const COMMUNITY_SHARE_CAP = 0.3;

function selectBalancedCandidates(
  items: RawFeedItem[],
  cap: number,
  reservedMin: Map<IndustryBucket, number> = new Map()
): RawFeedItem[] {
  const sorted = [...items].sort((a, b) => candidateScore(b) - candidateScore(a));
  if (sorted.length <= cap) return sorted;
  const bucketCap = Math.max(4, Math.ceil(cap * BUCKET_SHARE_CAP));
  const trackCap = Math.ceil(cap * COMMUNITY_SHARE_CAP); // 30 条 → 社区 ≤9 条

  const result: RawFeedItem[] = [];
  const usedPerBucket = new Map<QuotaBucket, number>();
  const used = (b: QuotaBucket) => usedPerBucket.get(b) || 0;
  let communityUsed = 0;
  const push = (item: RawFeedItem) => {
    result.push(item);
    const b = classifyBucket(item);
    usedPerBucket.set(b, used(b) + 1);
    if (item.track === "community") communityUsed++;
  };

  // 一轮：保底类目预留名额（近 60 条缺失的类目，各优先选入 2 条）
  for (const item of sorted) {
    if (result.length >= cap) break;
    const bucket = classifyBucket(item);
    if (bucket === "本地舆情") continue;
    const reserve = reservedMin.get(bucket as IndustryBucket) || 0;
    if (reserve > 0 && used(bucket) < reserve) push(item);
  }
  // 一轮半：社区轨道保底预留（在 30% 上限内优先保证贴地舆情进入 AI 提炼，
  // 防止 Reddit/Lowyat 因权重 18 低于主流源 25-40 而被系统性挤出候选池）
  const COMMUNITY_FLOOR = Math.min(trackCap, Math.floor(cap * 0.2)); // 30 候选 → 保底 6 条
  if (communityUsed < COMMUNITY_FLOOR) {
    for (const item of sorted) {
      if (communityUsed >= COMMUNITY_FLOOR || result.length >= cap) break;
      if (item.track !== "community" || result.includes(item)) continue;
      push(item);
    }
    console.log(`[cron] 社区轨道保底预留：${COMMUNITY_FLOOR} 条（Reddit/Lowyat 优先进入 AI 提炼）`);
  }
  // 二轮：全局按分数填充，尊重单桶 40% + 社区轨道 30% 上限
  for (const item of sorted) {
    if (result.length >= cap) break;
    if (result.includes(item)) continue;
    const bucket = classifyBucket(item);
    if (used(bucket) >= bucketCap) continue;
    if (item.track === "community" && communityUsed >= trackCap) continue;
    push(item);
  }
  // 三轮：桶枯竭时按分数补齐保底（社区轨道仍受 30% 上限约束）
  if (result.length < cap) {
    for (const item of sorted) {
      if (result.length >= cap) break;
      if (result.includes(item)) continue;
      if (item.track === "community" && communityUsed >= trackCap) continue;
      push(item);
    }
  }
  const dist = new Map<string, number>();
  for (const item of result) {
    const b = classifyBucket(item);
    dist.set(b, (dist.get(b) || 0) + 1);
  }
  console.log(`[cron] 行业配额选取：${sorted.length} → ${result.length} 条，桶分布：${[...dist].map(([b, n]) => `${b}:${n}`).join(" ")}，社区轨道 ${communityUsed} 条`);
  return result;
}

// ---------- 批次内类目配平：写入前单分类最多 N 条，超出按打分淘汰 ----------
// 保证滚动窗口内行业均衡，严禁单一分类（如 3C 数码）刷屏
const CATEGORY_BATCH_CAP = 6;

function enforceCategoryBalance<T extends AiResult>(items: T[]): { kept: T[]; dropped: T[] } {
  if (items.length === 0) return { kept: items, dropped: [] };
  const byCat = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0))) {
    const arr = byCat.get(item.category) || [];
    if (arr.length < CATEGORY_BATCH_CAP) {
      arr.push(item);
      byCat.set(item.category, arr);
    }
  }
  const keptSet = new Set([...byCat.values()].flat());
  const kept = items.filter((i) => keptSet.has(i));
  const dropped = items.filter((i) => !keptSet.has(i));
  if (dropped.length > 0) {
    console.log(`[cron] 批次类目配平：${items.length} → ${kept.length} 条（单分类上限 ${CATEGORY_BATCH_CAP}，配额淘汰 ${dropped.length} 条）`);
  }
  return { kept, dropped };
}

// ---------- AI 中文提炼 Prompt（四大核心偏好 + 信息差深度 + 商业启示） ----------
const AI_SYSTEM_PROMPT = `你是一位专精于【大马 GTM 策略 / B2B 品牌出海 / 清真 Halal 准入 / 本土零售与电商渠道】的资深商业分析师。

【目标读者】中国 B2B 品牌出海决策者、大马 GTM 咨询客户、清真市场准入企业、本地营销操盘手。

【四大核心偏好维度（按权重降序）】

1.【本土文化与消费】40% 最高优先
   - 大马三大族群（马来/华裔/印度）消费心理差异、文化禁忌、宗教节日营销节点
   - 本土消费习惯变迁：如移动支付渗透率、清真包装要求、社区商超 vs 购物中心行为差异
   - 新兴消费品类趋势：美妆/食品/家居/3C 在大马市场的本土化适配案例

2.【渠道与商超平台】30% 次优先
   - 线下重点渠道动态：Watsons/Guardian/Lotus's/AEON/FamilyMart 等商超药妆的选品规则、上架门槛、SKU 变动
   - 线上平台规则与算法：TikTok Shop MY 官方活动与流量分配规则、Shopee/Lazada 大马站大促节奏与佣金调整
   - 全渠道趋势：O2O 融合、直播带货 GMV 数据、社交电商新玩法落地实况

3.【中企出海大马】20% 重要
   - 中国企业/品牌在大马的最新落地动作：建厂、合资、渠道签约、品牌营销战役
   - 竞争态势：中国品牌在大马各品类的市场份额、与日韩/本土品牌的竞争格局
   - 踩坑实况：合规失误、文化冲突、渠道选择失败案例（高信息差价值）

4.【高价值信息差】10% 兜底但关键
   - 能帮助咨询师对中国企业主建立「认知壁垒」的深度商业动态
   - 政策窗口期、牌照发放、关税变动等非公开/半公开信息
   - 行业拐点信号：如某品类突然爆发、某渠道规则即将变更的前瞻线索

【相关性判定标准（relevant: true 的条件）】
满足以下任一条件即为相关，可生成摘要：
- 涉及马来西亚的零售/商超/电商平台/消费品牌动态
- 涉及马来西亚的政策/贸易/投资/Halal 认证/关税变动
- 涉及马来西亚的科技/互联网/创业/投融资动态
- 涉及马来西亚的消费者行为/族群文化/节庆营销趋势
- 涉及中国企业/品牌在马来西亚的落地动作
- 涉及东南亚区域（含大马）的商业趋势，可推断对大马市场的影响

【强制剔除规则】（命中任一即返回 {"relevant": false}）
- 航天 / 航空 / 卫星发射 / 太空基建
- 人才新政 / 博士引进 / 研究生奖学金 / 学术拨款
- 数据中心 / 算力基建 / GPU 集群 / 云区域
- 军事 / 国防采购 / 武装部队
- 官员任免 / 内阁改组 / 政务人事
- 房地产开发 / 房价 / 楼盘
- 股市大盘 / 股票涨跌 / 指数收盘
- 原油 / 棕榈油 / 橡胶等大宗商品价格波动
- 国外无关巨头人事变动（Tesla / Apple / Tata 等）
- 通用社会新闻（天气 / 交通 / 犯罪 / 选举 / 水灾 / 体育赛事 / 娱乐八卦）
- 产品召回公告（除非涉及大马市场准入合规启示）

【marketing_takeaway 硬约束】
- 严格聚焦于「该动态对中国企业/品牌进入大马市场的直接商业启示或防坑提示」
- 必须给出可落地建议（如：渠道选择、认证周期、品类机会、避坑点、可借鉴的营销手法、平台规则利用）
- 禁止空话套话（如"建议持续关注""未来可期""值得关注"）
- 必须包含至少 1 个具体动作或数字（如渠道名称、周期天数、成本区间、平台名）
- 即使原文未直接提及中国，也要主动推断对中企出海大马的启示

【行业绑定铁律（反模板）】
- 必须基于文章真实的所属行业来分析商业启示，category 归入哪个行业，启示就必须围绕该行业的渠道、认证、供应链与合规抓手展开
- 严禁对所有行业套用 3C 数码模板：非数码行业禁止输出"中国 3C 品牌可借鉴""消费电子品牌应……"类措辞
- 各行业启示必须使用该行业的专属抓手，参考抓手库：
  * 清真/食品 → JAKIM 认证周期与互认、清真包装与仓储、清真专用货架与商超渠道、中东/东盟清真出口
  * 美妆/消费 → NPRA 告知、Watsons/Guardian 选品与进场、KOL 种草、Shopee/TikTok 美妆大促节点
  * 农业/B2B → MATRADE INSP 采购商对接、SIRIM 标准认证、OEM/ODM 工厂落地、原料采购与供应链
  * 政策/贸易 → MIDA 税务优惠与 Principal Hub、RCEP 原产地累积、关税窗口期、牌照与合规时限
  * 渠道/电商 → 平台佣金与流量规则、本土仓与物流时效、线下进场费与 SKU 上架、大促节奏
  * 3C数码 → SIRIM 认证、经销商与授权维修体系、本土电商首发、配件生态捆绑
  * 金融/科技 → BNM 牌照门槛、支付合规、BNPL 监管、与银行/钱包的合作模式
- 示例（非 3C 行业正确示范）："出海食品品牌应以此为契机申请 JAKIM 清真认证（周期 45-90 天），借大马互认体系打通印尼与中东市场，并优先进驻 Lotus's 清真专区货架。"

【本地舆情源降噪（来源标签为 💬 本地舆情 时生效）】
- 来源标签为「💬 本地舆情」（Reddit / 论坛帖子）时，先执行降噪过滤再判定相关性：
  * 直接剔除：纯个人吐槽、二手买卖、求职招聘、水帖灌水、无商业价值的情绪宣泄
  * 仅保留四类有效信号：消费趋势观察、品牌口碑反馈、物价/政策感受、渠道购物体验
  * 默认从严：信号模糊或仅个人琐事时返回 {"relevant": false}
- 通过降噪的帖子：summary_zh 末尾追加「（社区舆情，建议交叉验证）」；importance_score 上限 4（社区帖不评 5 分）

【输出格式】
若相关，必须输出以下完整 JSON（缺一不可）：
{
  "relevant": true,
  "title_zh": "中文标题20字内",
  "summary_zh": "100字高密度中文摘要，直击核心事实与关键数据",
  "category": "政策/贸易 | 渠道/电商 | 清真/食品 | 美妆/消费 | 农业/B2B | 3C数码 | 金融/科技 | 展会/活动（八选一）",
  "marketing_takeaway": "该动态对中国企业/品牌进入大马市场的直接商业启示或防坑提示，必须可执行、有具体抓手，50-120字",
  "tags": ["2-4个标签，如 JAKIM清真 / FMCG / TikTok Shop / 达人营销 / 线下渠道"],
  "importance_score": 1到5的整数,
  "published_at": "ISO 8601 格式的新闻真实发布时间，如 2026-09-15T08:30:00Z"
}

【category 判定（行业赛道八分类，按文章真实所属行业归类）】
- 政策/贸易：MIDA/MATRADE 投资与贸易政策、关税、认证准入、中马产业合作、政府激励
- 渠道/电商：零售渠道（Watsons/Guardian/Lotus's/AEON）、分销商、电商平台（Shopee/TikTok Shop/Lazada）、物流仓储、门店拓展
- 清真/食品：Halal 产业、JAKIM 认证、食品饮料品牌、餐饮、农产品食品加工
- 美妆/消费：美妆护肤、个护日化、服饰家居、母婴玩具等消费品行业动态
- 农业/B2B：农业科技、种植养殖、制造业、工业品、大宗供应链、OEM/ODM
- 3C数码：手机/穿戴/电脑/配件/智能家居等消费电子行业动态
- 金融/科技：支付、数字银行、金融科技、SaaS、数字经济、创投融资
- 展会/活动：展会、博览会、Pop-up 快闪、行业对接会、商会活动

【importance_score 判定（1-5 整数）】
- 5 分：头部品牌出海战役 / 重大政策落地 / 首个案例（极稀缺，每日≤1 条）
- 4 分：有具体可复用营销手法或渠道打法的案例，或含高信息差（如平台规则变动、渠道准入门槛变化）
- 3 分：行业趋势或常规政策动态
- 2 分：边缘相关或数据较弱
- 1 分：仅背景参考价值

【published_at 提取】
- 优先从网页正文/元数据中提取新闻真实发布日期，输出 ISO 8601（含时区）
- 若完全无法判断，输出空字符串 ""，由后端降级使用抓取时间
- 严禁把今天日期当作发布时间填入旧闻

【通稿合并】
- 若本条内容明显是某事件的公关通稿/转载（与已知热点高度重合），在 summary_zh 末尾追加「（同类报道较多）」以便后端去重

若不相关，输出：{"relevant": false}

严格输出纯 JSON 对象，禁止使用 \`\`\`json 或任何 markdown 代码块包裹，禁止在 JSON 前后添加任何解释性文字。`;

// ---------- 超时控制 ----------
function createTimeoutController(ms: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, cleanup: () => clearTimeout(timer) };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- 伪装浏览器请求头 ----------
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
  "Cache-Control": "no-cache",
};

// ---------- 高可用兜底情报（所有 RSS 源失败时注入） ----------
// 严格对齐站长定位：大马 GTM / 清真 Halal / B2B 品牌出海 / 零售电商 / 中马合作
const FALLBACK_INTELLIGENCE: Array<RawFeedItem & AiResult> = [
  {
    title: "Malaysia Halal Industry Master Plan 2030: JAKIM Certification Goes Global",
    link: "https://www.mida.gov.my/halal-master-plan-2030",
    pubDate: new Date().toISOString(),
    content: "Malaysia launches Halal Industry Master Plan 2030, targeting RM150 billion halal export. JAKIM signs mutual recognition agreements with 12 countries including Saudi Arabia, UAE and Indonesia.",
    sourceName: "MIDA Official",
    track: "official",
    titleZh: "大马清真产业 2030 总规划：JAKIM 认证国际化互认加速",
    summaryZh: "马来西亚发布清真产业 2030 总规划，目标清真出口突破 1500 亿令吉。JAKIM 已与沙特、阿联酋、印尼等 12 国签署清真认证互认协议，大马成为全球清真市场准入枢纽。",
    keyTakeaway: "建议出海消费品牌提前布局 JAKIM 清真认证（周期 45-90 天），借力大马互认体系一键打通东盟与中东 57 亿清真消费市场。",
    category: "政策/贸易",
    tags: ["JAKIM清真", "Halal认证", "中马合作"],
    importanceScore: 5,
  },
  {
    title: "MIDA Principal Hub: 45-Day Fast Track for Chinese Brands Entering Malaysia",
    link: "https://www.mida.gov.my/principal-hub-fast-track",
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    content: "MIDA streamlines Principal Hub approval for foreign brands, cutting processing time from 6 months to 45 days. Qualified companies enjoy 10-year tax holiday.",
    sourceName: "MIDA Official",
    track: "official",
    titleZh: "MIDA Principal Hub 绿色通道：中国品牌落地大马 45 天审批",
    summaryZh: "MIDA 将 Principal Hub 外资审批从 6 个月压缩至 45 天，符合资质的出海企业可享 10 年免税期。政策重点吸引 B2B 消费品牌、数字服务和 SaaS 企业落地大马作为东盟总部。",
    keyTakeaway: "年营收 >RM 500 万的 B2B 出海品牌建议申请 Principal Hub 资质，享受 10 年免税 + 100% 外资持股，审批窗口已大幅缩短。",
    category: "政策/贸易",
    tags: ["MIDA政策", "Principal Hub", "B2B出海"],
    importanceScore: 4,
  },
  {
    title: "TikTok Shop Malaysia GMV Surges 280%: Cross-Border Brands Dominate FMCG",
    link: "https://www.thestar.com.my/business/tiktok-shop-gmv-surge",
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    content: "TikTok Shop Malaysia reports 280% GMV growth YoY, with cross-border Chinese FMCG brands capturing 45% market share in beauty and snacks categories.",
    sourceName: "The Star Business",
    track: "business",
    titleZh: "TikTok Shop 大马 GMV 暴涨 280%：跨境中国品牌主导 FMCG",
    summaryZh: "TikTok Shop 大马 GMV 同比增长 280%，中国跨境美妆、零食品牌占据 45% 市场份额。直播带货 + 本土仓发货模式成为 FMCG 品牌快速验证大马市场的核心渠道。",
    keyTakeaway: "建议美妆/零食出海品牌优先布局 TikTok Shop 大马本土店 + MFP 计划（马来西亚跨境合作伙伴），3 个月可验证市场需求，初期试错成本 <RM 5 万。",
    category: "美妆/消费",
    tags: ["TikTok Shop", "FMCG", "达人营销", "跨境电商"],
    importanceScore: 4,
  },
  {
    title: "China-Malaysia Trade Hits Record USD 200 Billion: Manufacturing & E-Commerce Lead",
    link: "https://www.bernama.com/en/general/china-malaysia-trade-2030",
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    content: "China-Malaysia bilateral trade reaches USD 200 billion in 2025, with manufacturing components and cross-border e-commerce as top growth drivers. RCEP tariff cuts boost Chinese brands entering Malaysia.",
    sourceName: "Bernama Business",
    track: "business",
    titleZh: "中马贸易破 2000 亿美元：制造业与跨境电商双轮驱动",
    summaryZh: "中马双边贸易额 2025 年突破 2000 亿美元，制造业零部件和跨境电商成为核心增长引擎。RCEP 关税削减政策红利释放，中国品牌进入大马的关税成本平均下降 15-20%。",
    keyTakeaway: "出海制造与消费品牌可借力 RCEP 原产地累积规则，在大马设区域分拨中心，享受关税减免 + 东盟 6 亿市场一体化流通红利。",
    category: "政策/贸易",
    tags: ["中马贸易", "RCEP", "跨境电商", "供应链"],
    importanceScore: 3,
  },
  {
    title: "Shopee Malaysia Launches China Cross-Border Incubation: Zero Commission for 6 Months",
    link: "https://www.nst.com.my/business/shopee-china-incubation",
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    content: "Shopee Malaysia launches China Cross-Border Incubation Program, offering zero commission for first 6 months and dedicated traffic support for new Chinese FMCG brands entering the Malaysian market.",
    sourceName: "New Straits Times Biz",
    track: "business",
    titleZh: "Shopee 大马启动中国跨境孵化计划：新品牌前 6 月零佣金",
    summaryZh: "Shopee 大马推出中国跨境品牌孵化计划，新入驻中国 FMCG 品牌享前 6 个月零佣金 + 专属流量扶持 + 本土运营顾问。目标 2026 年引入 500 个优质中国品牌。",
    keyTakeaway: "建议新锐消费品牌（美妆/家居/3C 配件）优先申请 Shopee 跨境孵化计划，6 个月零成本验证大马市场 PMF，再决定是否长期投入本土化运营。",
    category: "渠道/电商",
    tags: ["Shopee", "跨境电商", "FMCG", "孵化计划"],
    importanceScore: 4,
  },
  {
    title: "MATRADE Export Promotion 2026: 15 Trade Missions Targeting Chinese Brands",
    link: "https://matrade.gov.my/export-mission-2026",
    pubDate: new Date(Date.now() - 18000000).toISOString(),
    content: "MATRADE announces 15 outbound trade missions for 2026, with China as priority market. Malaysian distributors actively seeking Chinese FMCG, beauty and halal-certified food brands for exclusive partnerships.",
    sourceName: "MATRADE News",
    track: "official",
    titleZh: "MATRADE 2026 出口促进：15 场贸易展会锁定中国品牌",
    summaryZh: "马来西亚贸易发展局（MATRADE）公布 2026 年 15 场对外贸易展会，中国为核心目标市场。大马本土分销商正主动寻找中国 FMCG、美妆和清真食品品牌开展独家代理合作。",
    keyTakeaway: "出海品牌可关注 MATRADE 官网贸易展会日程，通过 INternational Sourcing Programme (INSP) 对接大马本土分销商，省去 BD 成本，30 天内可签下区域独家代理协议。",
    category: "展会/活动",
    tags: ["MATRADE", "贸易展会", "渠道对接", "B2B出海"],
    importanceScore: 3,
  },
];

// ---------- RSS 抓取 ----------
type RawFeedItem = {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  sourceName: string;
  track: SourceTrack;
};

// ---------- 独立 fetch 单个 RSS 源（错误隔离） ----------
async function fetchSingleFeed(feed: { name: string; url: string; track: SourceTrack }): Promise<RawFeedItem[]> {
  try {
    const parser = new Parser({
      timeout: 12000, // 并行抓取，单源 12s 足够；压缩最坏尾部延迟
      headers: BROWSER_HEADERS,
    });
    // Google News 需走独立 fetch：parseURL 基于 http 模块不感知系统代理，
    // 且 GN 返回量大，fetch + parseString 可精确控制超时
    let feedData;
    const isGoogleNews = feed.url.includes("news.google.com");
    if (isGoogleNews) {
      const { controller, cleanup } = createTimeoutController(12000);
      try {
        const res = await fetch(feed.url, { headers: BROWSER_HEADERS, signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        feedData = await parser.parseString(await res.text());
      } finally {
        cleanup();
      }
    } else {
      feedData = await parser.parseURL(feed.url);
    }
    const items = (feedData.items || [])
      .slice(0, 20)
      .map((item) => ({
        // GN 标题统一带「 - 媒体名」后缀，剥离（仅对 GN 源执行，避免误截普通标题）
        title: isGoogleNews
          ? (item.title || "").replace(/\s+-\s+[^-]+$/, "").trim()
          : item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        content: item.contentSnippet || item.content || item["content:encoded"] || "",
        sourceName: feed.name,
        track: feed.track,
      }))
      .filter((item) => item.title && item.link);
    console.log(`[cron] RSS 抓取 ${feed.name}：${items.length} 条`);
    return items;
  } catch (err: any) {
    console.warn(`[cron] RSS 抓取失败 ${feed.name}：${err?.message || err}`);
    return [];
  }
}

async function fetchAllFeeds(): Promise<RawFeedItem[]> {
  // 每个 RSS 源独立 try-catch，绝不因单源报错影响其他源
  const results = await Promise.all(RSS_FEEDS.map((feed) => fetchSingleFeed(feed)));
  const allItems: RawFeedItem[] = [];
  for (const items of results) {
    allItems.push(...items);
  }

  // 关键词预过滤：硬性丢弃地产/股市/油价/棕油等无关新闻
  const filtered = allItems.filter((item) => {
    if (isIrrelevant(item)) {
      console.log(`[cron] 预过滤丢弃（无关关键词）：${item.title}`);
      return false;
    }
    return true;
  });
  console.log(`[cron] 关键词预过滤：${allItems.length} → ${filtered.length} 条`);
  return filtered;
}

// ---------- 去重：对比 malaysia_intelligence 表的 source_url ----------
async function deduplicateBySourceUrl(
  client: any,
  items: RawFeedItem[]
): Promise<{ deduped: RawFeedItem[]; duplicatesRemoved: number }> {
  if (!client || items.length === 0) return { deduped: items, duplicatesRemoved: 0 };

  try {
    const urls = items.map((i) => i.link);
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("source_url")
      .in("source_url", urls);

    if (error) {
      console.warn("[cron] 去重查询失败，全量写入:", error.message);
      return { deduped: items, duplicatesRemoved: 0 };
    }

    const existingUrls = new Set((data || []).map((r: any) => String(r.source_url || "").trim().toLowerCase()));

    let duplicatesRemoved = 0;
    const deduped = items.filter((item) => {
      const url = item.link.trim().toLowerCase();
      if (existingUrls.has(url)) {
        duplicatesRemoved++;
        return false;
      }
      return true;
    });

    console.log(`[cron] source_url 去重：${items.length} → ${deduped.length} 条（跳过 ${duplicatesRemoved} 条重复）`);
    return { deduped, duplicatesRemoved };
  } catch (err) {
    console.warn("[cron] 去重异常，全量写入:", err);
    return { deduped: items, duplicatesRemoved: 0 };
  }
}

// ---------- 相似度工具：复用共享算法库（与 /api/admin/dedupe-intelligence 同一套判定） ----------
import { isSameEvent, isSameEventRaw, clusterAndPickLosers, type EventSig } from "@/lib/intelDedup";

// ---------- 近 N 小时库内已有事件签名（预抓取，一次查询多处复用） ----------
async function fetchRecentEventSigs(client: any, hours: number): Promise<EventSig[]> {
  if (!client) return [];
  try {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("title_zh, title_en, summary_zh")
      .gte("created_at", since.toISOString())
      .limit(150);
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      titleZh: String(r.title_zh || ""),
      titleEn: String(r.title_en || ""),
      summary: String(r.summary_zh || ""),
    }));
  } catch {
    return [];
  }
}

// ---------- 保底类目配额：查库内近 60 条的类目分布，缺失保底类目 → 预 AI 各预留 2 个名额 ----------
// 解决「金融/科技霸屏、政策/清真/美妆等板块为 0」的类目倾斜：缺失类目在候选选取阶段获得优先名额（兜底抓取）
const QUOTA_POOL_SIZE = 60;
async function fetchQuotaReserved(client: any): Promise<Map<IndustryBucket, number>> {
  const reserved = new Map<IndustryBucket, number>();
  if (!client) return reserved;
  try {
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("category")
      .order("created_at", { ascending: false })
      .limit(QUOTA_POOL_SIZE);
    if (error || !data) return reserved;
    const counts = new Map<string, number>();
    for (const r of data as any[]) {
      const c = String(r.category || "");
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    for (const cat of QUOTA_CATS) {
      if ((counts.get(cat) || 0) < 2) reserved.set(cat, 2);
    }
    if (reserved.size > 0) {
      console.log(`[cron] 保底配额：近 ${data.length} 条缺 [${[...reserved.keys()].join("、")}]，预 AI 各预留 2 个名额`);
    }
  } catch (err) {
    console.warn("[cron] 保底配额查询异常（跳过预留）：", err);
  }
  return reserved;
}

// ---------- 预 AI 拦截：调用 DeepSeek 前，用原始英文标题与库内近 72h 事件比对 ----------
// 命中同事件直接丢弃，不消耗 AI Token、不产生重复数据
function prefilterRawAgainstDb(
  rawItems: RawFeedItem[],
  existing: EventSig[]
): { kept: RawFeedItem[]; preBlocked: number } {
  if (existing.length === 0) return { kept: rawItems, preBlocked: 0 };
  let preBlocked = 0;
  const kept = rawItems.filter((item) => {
    const dup = existing.some((ex) =>
      // 实体词重叠为主信号，英文标题/正文 bigram 为兜底（与库内同事件判定同一套算法）
      isSameEventRaw(item.title, item.content, ex)
    );
    if (dup) {
      preBlocked++;
      console.log(`[cron] 预AI同事件拦截（库内 72h 已有）：${item.title.slice(0, 60)}`);
    }
    return !dup;
  });
  if (preBlocked > 0) {
    console.log(`[cron] 预AI同事件拦截：${rawItems.length} → ${kept.length} 条（节省 ${preBlocked} 次 AI 调用）`);
  }
  return { kept, preBlocked };
}

// ---------- 语义/标题相似度去重（同事件通稿合并，批次内）----------
// 对本批次已 AI 摘要的情报做同事件聚类，合并为 1 条（保留 importance_score 更高者）
function dedupByTitleSimilarity<T extends AiResult & { title: string }>(
  items: T[]
): { deduped: T[]; mergedCount: number } {
  if (items.length <= 1) return { deduped: items, mergedCount: 0 };

  const kept: T[] = [];
  let mergedCount = 0;
  for (const item of items) {
    const idx = kept.findIndex((k) =>
      isSameEvent(
        { titleZh: k.titleZh, titleEn: k.title, summary: k.summaryZh },
        { titleZh: item.titleZh, titleEn: item.title, summary: item.summaryZh }
      )
    );
    if (idx >= 0) {
      // 命中重复：保留打分更高者（同分保留先到者）
      mergedCount++;
      if ((item.importanceScore || 0) > (kept[idx].importanceScore || 0)) {
        kept[idx] = item;
      }
    } else {
      kept.push(item);
    }
  }
  if (mergedCount > 0) {
    console.log(`[cron] 批次内同事件合并：${items.length} → ${kept.length} 条（合并 ${mergedCount} 条通稿）`);
  }
  return { deduped: kept, mergedCount };
}

// ---------- 写入前二次校验：AI 产出后与预抓取的库内事件签名比对 ----------
function deduplicateAgainstDbSigs<T extends AiResult & { title: string }>(
  items: T[],
  existing: EventSig[]
): { deduped: T[]; removed: number } {
  if (existing.length === 0 || items.length === 0) return { deduped: items, removed: 0 };
  let removed = 0;
  const deduped = items.filter((item) => {
    const dup = existing.some((ex) =>
      isSameEvent(ex, { titleZh: item.titleZh, titleEn: item.title, summary: item.summaryZh })
    );
    if (dup) {
      removed++;
      console.log(`[cron] 写入前同事件拦截（库内已有）：${item.titleZh}`);
    }
    return !dup;
  });
  if (removed > 0) {
    console.log(`[cron] 写入前二次校验：${items.length} → ${deduped.length} 条（拦截 ${removed} 条同事件）`);
  }
  return { deduped, removed };
}

// ---------- 自愈式历史清理：每次管道运行后自动执行 ----------
// 扫描全表同事件重复数据，保留最优 1 条（featured → 高分 → 最新），物理删除其余
// 幂等：无重复时 0 删除，可安全反复运行
async function autoCleanIntelligence(client: any): Promise<{ scanned: number; deleted: number; clusters: number }> {
  if (!client) return { scanned: 0, deleted: 0, clusters: 0 };
  try {
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("id, title_zh, title_en, summary_zh, importance_score, is_featured, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !data || data.length === 0) return { scanned: 0, deleted: 0, clusters: 0 };

    const { loserIds, duplicateClusters } = clusterAndPickLosers(data as any[]);
    if (loserIds.length === 0) {
      console.log(`[cron] 自愈清理：扫描 ${data.length} 条，无重复，跳过删除`);
      return { scanned: data.length, deleted: 0, clusters: 0 };
    }

    let deleted = 0;
    const BATCH = 100;
    for (let i = 0; i < loserIds.length; i += BATCH) {
      const batch = loserIds.slice(i, i + BATCH);
      const { error: delErr } = await client
        .from("malaysia_intelligence")
        .delete()
        .in("id", batch);
      if (delErr) {
        console.warn(`[cron] 自愈清理删除失败：${delErr.message}`);
        break;
      }
      deleted += batch.length;
    }
    console.log(
      `[cron] 自愈清理完成：扫描 ${data.length} 条 → 合并 ${duplicateClusters} 组同事件 → 自动删除 ${deleted} 条重复历史数据`
    );
    return { scanned: data.length, deleted, clusters: duplicateClusters };
  } catch (err: any) {
    console.warn(`[cron] 自愈清理异常（不影响主流程）：${err?.message || err}`);
    return { scanned: 0, deleted: 0, clusters: 0 };
  }
}

// ---------- AI 摘要：单条调用 ----------
type AiResult = {
  titleZh: string;
  summaryZh: string;
  keyTakeaway: string; // 映射 DB key_takeaway 列（语义=marketing_takeaway 营销启示）
  category: string; // 行业赛道八分类：政策/贸易 | 渠道/电商 | 清真/食品 | 美妆/消费 | 农业/B2B | 3C数码 | 金融/科技 | 展会/活动
  tags: string[]; // 结构化标签
  importanceScore: number; // 1-5 商业价值打分
  publishedAt?: string; // AI 提取的真实发布时间（ISO），空则由后端降级
};

// 返回值三态：AiResult（提炼成功）/ "rejected"（AI 判定不相关，降噪生效）/ null（调用失败）
async function summarizeWithAI(item: RawFeedItem): Promise<AiResult | "rejected" | null> {
  if (!AI_CONFIG.apiKey) return null;

  const { controller, cleanup } = createTimeoutController(18000); // 单条上限 18s，防挂起拖垮整体预算

  try {
    const contentPreview = item.content.slice(0, 1500);
    const userPrompt = `英文标题：${item.title}\n\n原文摘要：${contentPreview}\n\n来源：${item.sourceName}（${TRACK_LABEL[item.track]}）`;

    const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[cron] AI 摘要 HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    // 剥离代码块包裹
    const stripped = content.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // AI 相关性过滤：不相关新闻直接丢弃，不生成卡片
    if (parsed.relevant === false) {
      console.log(`[cron] AI 过滤丢弃（不相关）：${item.title}`);
      return "rejected";
    }

    // 归一化 category：行业八分类，非法值兜底为「政策/贸易」
    const rawCat = String(parsed.category || "").trim();
    const validCats: string[] = [...INDUSTRY_BUCKETS];
    const category = validCats.includes(rawCat) ? rawCat : "政策/贸易";
    // 归一化 tags：必须是字符串数组
    let tags: string[] = [];
    if (Array.isArray(parsed.tags)) {
      tags = parsed.tags.map((t: any) => String(t || "").trim()).filter(Boolean).slice(0, 6);
    }
    // marketing_takeaway 优先，回退旧字段 key_takeaway
    const takeaway = String(parsed.marketing_takeaway || parsed.key_takeaway || "").trim();
    // importance_score：1-5 整数，非法值兜底为 3
    let importanceScore = 3;
    const rawScore = Number(parsed.importance_score);
    if (Number.isFinite(rawScore) && rawScore >= 1 && rawScore <= 5) {
      importanceScore = Math.round(rawScore);
    }
    // published_at：AI 提取的真实发布时间（ISO），无效则留空由后端降级
    let publishedAt: string | undefined;
    const rawPub = String(parsed.published_at || "").trim();
    if (rawPub) {
      const d = new Date(rawPub);
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    return {
      titleZh: String(parsed.title_zh || "").trim().slice(0, 200),
      summaryZh: String(parsed.summary_zh || "").trim().slice(0, 500),
      keyTakeaway: takeaway.slice(0, 300),
      category,
      tags,
      importanceScore,
      publishedAt,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn(`[cron] AI 摘要超时：${item.title}`);
    } else {
      console.warn(`[cron] AI 摘要异常：${err?.message}`);
    }
    return null;
  } finally {
    cleanup();
  }
}

// ---------- 写入 malaysia_intelligence：Service Role → Anon Key 降级 ----------
// 使用 upsert（依据 source_url 唯一索引），实现增量更新而非重复插入
async function writeIntelligence(
  items: Array<RawFeedItem & AiResult>
): Promise<{ inserted: number; errors: string[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const errors: string[] = [];
  let inserted = 0;

  const client: any = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
  if (!client) {
    return { inserted: 0, errors: ["Supabase 未配置"] };
  }

  for (const item of items) {
    const payload = {
      // 不传 id：malaysia_intelligence.id 是 uuid 类型（Supabase 默认 gen_random_uuid()），
      // 由数据库自动生成。upsert 冲突目标是 source_url 唯一索引，无需 id 参与。
      // 之前传 genId()（base36 文本）会触发 22P02: invalid input syntax for type uuid。
      // title：线上表有 NOT NULL 的 title 列（迁移文件未体现，属表结构漂移），
      // 用中文标题填充，避免 23502 null violation。
      title: item.titleZh || item.title,
      title_en: item.title,
      title_zh: item.titleZh,
      source_name: item.sourceName,
      source_url: item.link,
      summary_zh: item.summaryZh,
      key_takeaway: item.keyTakeaway,
      category: item.category || "政策/贸易",
      tags: Array.isArray(item.tags) ? item.tags : [],
      // 优先 AI 提取的真实发布时间，降级用 RSS pubDate / 当前时间，避免旧闻标为最新
      published_at: item.publishedAt || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
      importance_score: item.importanceScore || 3,
      is_published: true,
      is_featured: false,
    };

    try {
      // upsert：source_url 已存在则更新，不存在则插入
      const { error } = await client
        .from("malaysia_intelligence")
        .upsert([payload], { onConflict: "source_url" });
      if (!error) {
        inserted++;
      } else {
        // 显式打印完整 Supabase 错误，定位 RLS / 列缺失 / 类型不匹配等根因
        console.error("[cron] Supabase write error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          sourceUrl: item.link,
        });
        errors.push(`${item.title}: ${error.message}`);
      }
    } catch (e: any) {
      console.error("[cron] writeIntelligence 异常:", e);
      errors.push(`${item.title}: ${e?.message || "写入异常"}`);
    }
  }

  return { inserted, errors };
}

// ---------- 滚动淘汰：保留最新 50 条，删除 is_featured=false 的旧数据 ----------
async function rollOutdatedData(client: any): Promise<{ deleted: number }> {
  if (!client) return { deleted: 0 };
  try {
    // 查询第 50 条之后的非 featured 记录的 id
    const { data: outdated, error: queryErr } = await client
      .from("malaysia_intelligence")
      .select("id", { count: "exact" })
      .eq("is_featured", false)
      .order("published_at", { ascending: false })
      .range(50, 1000);

    if (queryErr || !outdated || outdated.length === 0) {
      return { deleted: 0 };
    }

    const idsToDelete = outdated.map((r: any) => r.id);
    const { error: delErr } = await client
      .from("malaysia_intelligence")
      .delete()
      .in("id", idsToDelete);

    if (delErr) {
      console.warn(`[cron] 滚动淘汰删除失败：${delErr.message}`);
      return { deleted: 0 };
    }

    console.log(`[cron] 滚动淘汰：删除 ${idsToDelete.length} 条旧数据（保留最新 50 条）`);
    return { deleted: idsToDelete.length };
  } catch (err: any) {
    console.warn(`[cron] 滚动淘汰异常：${err?.message || err}`);
    return { deleted: 0 };
  }
}

// ---------- 冷却检查：返回最近一条记录的 created_at ----------
async function getLatestRecordTime(): Promise<{ createdAt: string | null; client: any }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const client: any = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
  if (!client) return { createdAt: null, client: null };

  try {
    const { data, error } = await client
      .from("malaysia_intelligence")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return { createdAt: null, client };
    return { createdAt: data.created_at, client };
  } catch {
    return { createdAt: null, client };
  }
}

// ---------- 权限校验 ----------
function isAuthorized(req: NextRequest): boolean {
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1" || vercelCronHeader === "true") return true;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const querySecret = req.nextUrl.searchParams.get("secret") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret || querySecret === cronSecret) return true;
    return false;
  }
  return true;
}

// ---------- 主路由 ----------
export async function GET(req: NextRequest) {
  try {
    return await handleCron(req);
  } catch (err: any) {
    console.error("[cron] GET 未捕获异常:", err);
    return NextResponse.json(
      { success: false, error: "感知服务异常", detail: String(err?.message || err).slice(0, 300) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleCron(req);
  } catch (err: any) {
    console.error("[cron] POST 未捕获异常:", err);
    return NextResponse.json(
      { success: false, error: "感知服务异常", detail: String(err?.message || err).slice(0, 300) },
      { status: 500 }
    );
  }
}

async function handleCron(req: NextRequest) {
  const startedAt = Date.now();

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "未授权：CRON_SECRET 验证失败" }, { status: 401 });
  }

  // 检查查询参数中是否有 cooldown=1 标记（前台主动感知时携带）
  const wantsCooldownCheck = req.nextUrl.searchParams.get("cooldown") === "1";

  // 0. 冷却检查：距离最近一次写入 <3 分钟则直接返回，防止 DeepSeek Token 浪费
  if (wantsCooldownCheck) {
    const { createdAt, client: coolClient } = await getLatestRecordTime();
    if (createdAt) {
      const elapsed = Date.now() - new Date(createdAt).getTime();
      const COOLDOWN_MS = 3 * 60 * 1000; // 3 分钟
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000 / 60);
        return NextResponse.json({
          success: false,
          cooldown: true,
          message: `⏳ 刚刚已更新过最新情报，请 ${remaining} 分钟后再试`,
        });
      }
    }
  }

  console.log("[cron] 开始执行马来西亚商业情报抓取流水线...");

  // 1. RSS 抓取
  const rawItems = await fetchAllFeeds();
  console.log(`[cron] RSS 抓取合计：${rawItems.length} 条`);

  // 1.5 Web Search 补充（Tavily/Serper，未配置 Key 时静默跳过）
  // 用 50/30/20 权重矩阵抽取 query，检索全网品牌营销/展会/政策动态
  try {
    const queries = pickQueriesByWeight(4);
    const webResults = await searchWeb(queries);
    if (webResults.length > 0) {
      // WebSearchResult 与 RawFeedItem 结构兼容（补 track），直接合并
      rawItems.push(...webResults.map((w) => ({ ...w, track: "business" as const })));
      console.log(`[cron] Web 搜索补充 ${webResults.length} 条，合并后 ${rawItems.length} 条`);
    }
  } catch (webErr: any) {
    console.warn(`[cron] Web 搜索异常（不影响主流程）：${webErr?.message || webErr}`);
  }

  if (rawItems.length === 0) {
    // 高可用兜底：所有 RSS 源失败时注入预设大马商业情报
    console.warn("[cron] 所有 RSS 源抓取失败，注入兜底情报数据...");
    const { inserted: fbInserted } = await writeIntelligence(FALLBACK_INTELLIGENCE);
    const fbData = FALLBACK_INTELLIGENCE.map((item) => ({
      id: genId(),
      titleEn: item.title,
      titleZh: item.titleZh,
      sourceName: item.sourceName,
      sourceUrl: item.link,
      summaryZh: item.summaryZh,
      keyTakeaway: item.keyTakeaway,
      category: item.category,
      tags: item.tags,
      publishedAt: item.pubDate,
      createdAt: new Date().toISOString(),
      isPublished: true,
      isFeatured: false,
    }));
    return NextResponse.json({
      success: true,
      message: `⚡ 已加载 ${FALLBACK_INTELLIGENCE.length} 条大马商业情报`,
      stats: { fetched: 0, afterDedup: 0, aiSummarized: 0, inserted: fbInserted, fallback: true },
      data: fbData,
      duration: Date.now() - startedAt,
    });
  }

  // 2. source_url 去重
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dedupClient =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const { deduped, duplicatesRemoved } = await deduplicateBySourceUrl(dedupClient, rawItems);

  if (deduped.length === 0) {
    // 即使无新情报，也执行一次自愈清理，保证历史重复数据被自动清除
    const earlyClean = await autoCleanIntelligence(supabaseAdmin || dedupClient);
    return NextResponse.json({
      success: true,
      message: `无新情报（${duplicatesRemoved} 条重复已跳过）${earlyClean.deleted > 0 ? `，已自动清理 ${earlyClean.deleted} 条历史重复` : ""}`,
      stats: { fetched: rawItems.length, afterDedup: 0, aiSummarized: 0, inserted: 0, autoCleanDeleted: earlyClean.deleted },
      duration: Date.now() - startedAt,
    });
  }

  // 2.5 预抓取库内近 72h 事件签名（一次查询，预AI拦截 + 写入前校验两处复用）
  const sigClient = supabaseAdmin || dedupClient;
  const recentSigs = await fetchRecentEventSigs(sigClient, 72);

  // 2.6 预 AI 同事件拦截：调用 DeepSeek 前直接丢弃库内已有同事件，节省 Token
  const { kept: preFiltered, preBlocked } = prefilterRawAgainstDb(deduped, recentSigs);

  if (preFiltered.length === 0) {
    // 同事件全部被拦截时，也执行自愈清理
    const earlyClean = await autoCleanIntelligence(sigClient);
    return NextResponse.json({
      success: true,
      message: `无新情报（URL 去重 ${duplicatesRemoved} 条 + 同事件拦截 ${preBlocked} 条）${earlyClean.deleted > 0 ? `，已自动清理 ${earlyClean.deleted} 条历史重复` : ""}`,
      stats: { fetched: rawItems.length, afterDedup: 0, preBlocked, aiSummarized: 0, inserted: 0, autoCleanDeleted: earlyClean.deleted },
      duration: Date.now() - startedAt,
    });
  }

  // 2.8 延迟预算 + 行业配额控制：候选按「新鲜度+源权重」打分后，按行业桶配额选取
  // （单桶 ≤40%），既控 60s 预算，又防 3C 数码等单一行业霸占 AI 提炼名额；
  // 未处理的候选留待下一轮抓取（URL 去重天然保证不重复）。
  const AI_CANDIDATE_CAP = 30;
  // 2.7 保底类目配额：近 60 条缺失的保底类目，预 AI 各预留 2 个名额（缺失分类触发兜底优先抓取）
  const quotaReserved = await fetchQuotaReserved(sigClient);
  const aiCandidates = selectBalancedCandidates(preFiltered, AI_CANDIDATE_CAP, quotaReserved);

  // 3. AI 中文摘要（并发 6 + 截止时间护栏，确保总耗时确定性落在 Vercel 60s 之内）
  const AI_CONCURRENCY = 6;
  const AI_DEADLINE_MS = 36000; // AI 阶段截止线（自函数启动起算），预留 ~20s 给写入+滚动淘汰+自愈清理
  const summarized: Array<RawFeedItem & AiResult> = [];
  let aiRejected = 0; // AI 判定不相关（含社区降噪剔除）
  let aiFailed = 0; // AI 调用失败（超时/HTTP 错误/解析异常）

  for (let i = 0; i < aiCandidates.length; i += AI_CONCURRENCY) {
    // 截止护栏：超预算立即收尾，剩余候选交给下一轮（宁缺毋超时）
    if (Date.now() - startedAt > AI_DEADLINE_MS) {
      console.warn(`[cron] AI 阶段达到延迟预算 ${AI_DEADLINE_MS}ms，提前收尾：已处理 ${i}/${aiCandidates.length} 条`);
      break;
    }
    const batch = aiCandidates.slice(i, i + AI_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (item) => {
        const r = await summarizeWithAI(item);
        if (r === "rejected") {
          aiRejected++;
          return null;
        }
        if (!r) {
          aiFailed++;
          return null;
        }
        return { ...item, ...r };
      })
    );
    for (const r of results) {
      if (r) summarized.push(r);
    }
  }

  console.log(`[cron] AI 摘要完成：${summarized.length}/${preFiltered.length} 条（降噪剔除 ${aiRejected}，调用失败 ${aiFailed}）`);

  // 3.5 批次内同事件合并：同一事件被多源报道时仅保留打分最高的 1 条
  const { deduped: titleDeduped, mergedCount } = dedupByTitleSimilarity(summarized);

  // 3.6 写入前二次校验：AI 产出后与库内近 72h 事件签名比对（三维相似度）
  const { deduped: dbDeduped, removed: dbDupRemoved } = deduplicateAgainstDbSigs(
    titleDeduped,
    recentSigs
  );

  // 3.7 低价值过滤：importance_score <= 1 的情报不入库（避免低质通稿稀释内容质量）
  const lowValueFiltered = dbDeduped.filter((item) => {
    if ((item.importanceScore || 3) <= 1) {
      console.log(`[cron] 低价值过滤丢弃（score<=1）：${item.titleZh}`);
      return false;
    }
    return true;
  });

  // 3.8 批次内类目配平：写入前单分类最多 6 条，严禁单一行业（如 3C 数码）刷屏
  const { kept: finalItems, dropped: quotaDropped } = enforceCategoryBalance(lowValueFiltered);

  if (summarized.length === 0) {
    // AI 摘要全部失败时，注入兜底情报确保前台有内容
    console.warn("[cron] AI 摘要全部失败，注入兜底情报数据...");
    const { inserted: fbInserted } = await writeIntelligence(FALLBACK_INTELLIGENCE);
    const fbData = FALLBACK_INTELLIGENCE.map((item) => ({
      id: genId(),
      titleEn: item.title,
      titleZh: item.titleZh,
      sourceName: item.sourceName,
      sourceUrl: item.link,
      summaryZh: item.summaryZh,
      keyTakeaway: item.keyTakeaway,
      category: item.category,
      tags: item.tags,
      publishedAt: item.pubDate,
      createdAt: new Date().toISOString(),
      isPublished: true,
      isFeatured: false,
    }));
    return NextResponse.json({
      success: true,
      message: `⚡ 已加载 ${FALLBACK_INTELLIGENCE.length} 条大马商业情报`,
      stats: {
        fetched: rawItems.length,
        afterDedup: deduped.length,
        aiSummarized: 0,
        aiRejected,
        aiFailed,
        communityFetched: rawItems.filter((i) => i.track === "community").length,
        communityCandidates: aiCandidates.filter((i) => i.track === "community").length,
        inserted: fbInserted,
        fallback: true,
      },
      data: fbData,
      duration: Date.now() - startedAt,
    });
  }

  // 4. 写入数据库
  const { inserted, errors } = await writeIntelligence(finalItems);

  // 5. 滚动淘汰：写入成功后删除超过 50 条的旧数据（is_featured=false）
  if (inserted > 0) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const rollClient = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
    const { deleted } = await rollOutdatedData(rollClient);
    if (deleted > 0) {
      console.log(`[cron] 滚动淘汰完成：删除 ${deleted} 条旧数据`);
    }
  }

  // 6. 自愈式历史清理：每次管道运行后自动扫描全表，合并同事件重复数据
  // 保留最优 1 条（featured → 高分 → 最新），物理删除其余；幂等，无重复时 0 删除
  // 时间护栏：临近 60s 上限时跳过本轮（清理幂等，下一轮自动补做），确保响应必达
  const cleanClient = supabaseAdmin || sigClient;
  const cleanResult =
    Date.now() - startedAt < 50000
      ? await autoCleanIntelligence(cleanClient)
      : { scanned: 0, deleted: 0, clusters: 0 };

  // 双轨制观测指标：来源分布 + 社区轨道计数 + 保底类目缺失清单
  const sourceCounts: Record<string, number> = {};
  for (const it of finalItems) {
    sourceCounts[it.sourceName] = (sourceCounts[it.sourceName] || 0) + 1;
  }
  const communityCount = finalItems.filter((it) => it.track === "community").length;
  const finalCatCounts = new Map<string, number>();
  for (const it of finalItems) finalCatCounts.set(it.category, (finalCatCounts.get(it.category) || 0) + 1);
  const missingQuotaCats = QUOTA_CATS.filter((c) => (finalCatCounts.get(c) || 0) === 0);

  const duration = Date.now() - startedAt;
  console.log(
    `[cron] 完成！RSS ${rawItems.length} → URL去重 ${deduped.length} → 预AI拦截 ${preBlocked} → AI摘要 ${summarized.length} → 批次内合并 ${titleDeduped.length} → 写入前校验 ${dbDeduped.length}（拦截 ${dbDupRemoved}）→ 类目配平淘汰 ${quotaDropped.length} → 写入 ${inserted} → 自愈清理删除 ${cleanResult.deleted}，耗时 ${duration}ms`
  );
  console.log(
    `[cron] 双轨观测：社区舆情 ${communityCount} 条（配额 ≤30%）；本轮保底类目缺 [${missingQuotaCats.join("、") || "无"}]；来源分布 ${JSON.stringify(sourceCounts)}`
  );

  // 构建内存数据（无论 DB 写入是否成功，都返回给前端渲染）
  const memItems = finalItems.map((item) => ({
    id: genId(),
    titleEn: item.title,
    titleZh: item.titleZh,
    sourceName: item.sourceName,
    sourceUrl: item.link,
    summaryZh: item.summaryZh,
    keyTakeaway: item.keyTakeaway,
    category: item.category,
    tags: item.tags,
    importanceScore: item.importanceScore,
    // 优先使用 AI 提取的真实发布时间，降级用 RSS pubDate / 当前时间
    publishedAt: item.publishedAt || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
    createdAt: new Date().toISOString(),
    isPublished: true,
    isFeatured: false,
  }));

  if (inserted > 0) {
    return NextResponse.json({
      success: true,
      persisted: true,
      message: `⚡ 抓取 ${rawItems.length} 条 → AI 摘要 ${summarized.length} 条 → 去重 ${finalItems.length} 条 → 写入 ${inserted} 条大马商业情报`,
      stats: {
        fetched: rawItems.length,
        afterDedup: deduped.length,
        preBlocked,
        aiSummarized: summarized.length,
        titleDedupMerged: mergedCount,
        dbDupRemoved,
        quotaDropped: quotaDropped.length,
        autoCleanDeleted: cleanResult.deleted,
        inserted,
        sourceCounts,
        communityCount,
        missingQuotaCats,
        communityFetched: rawItems.filter((i) => i.track === "community").length,
        communityCandidates: aiCandidates.filter((i) => i.track === "community").length,
        aiRejected,
        aiFailed,
      },
      data: memItems,
      errors: errors.slice(0, 10),
      duration,
    });
  }

  // DB 写入失败时优雅降级：返回 success + 内存数据，前台直接渲染
  console.warn("[cron] DB 写入失败，返回内存数据供前台直接渲染。写入错误样本:", errors.slice(0, 3));
  return NextResponse.json({
    success: true,
    persisted: false,
    message: `⚡ 成功抓取 ${summarized.length} 条大马商业情报（内存模式，DB 未持久化）`,
    stats: {
      fetched: rawItems.length,
      afterDedup: deduped.length,
      aiSummarized: summarized.length,
      inserted: 0,
    },
    data: memItems,
    duration,
  });
}
