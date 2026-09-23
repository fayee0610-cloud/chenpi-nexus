// ============================================================
// webSearch.ts — Web Search API 抽象层（Tavily / Serper 可插拔）
//
// 设计目的：
//   当 RSS 源无法覆盖「本地品牌营销案例 / Pop-up / 展会商会」等
//   grassroots 实时动态时，通过 Web Search API 主动检索全网补充。
//
// 接入方式（站长后续提供 API Key 即可启用）：
//   方案 A（推荐 Tavily）：在 .env.local 配置 TAVILY_API_KEY
//   方案 B（Serper）：在 .env.local 配置 SERPER_API_KEY
//
// 未配置 Key 时，searchWeb() 直接返回空数组，流水线自动降级为纯 RSS 模式。
// ============================================================

export interface WebSearchResult {
  title: string;
  link: string;
  content: string; // 摘要片段
  sourceName: string;
  pubDate: string; // ISO 时间，缺失则用当前
}

// ---------- 检索关键词矩阵（50/30/20 权重） ----------
// 每次感知时按权重抽取对应数量的 query 发起搜索
export const SEARCH_QUERY_MATRIX: { topic: string; weight: number; queries: string[] }[] = [
  {
    topic: "品牌营销",
    weight: 50,
    queries: [
      'Malaysia "brand campaign" 2026',
      "马来西亚 品牌营销 案例 2026",
      "site:campaignasia.com Malaysia",
      "Malaysia pop-up store launch",
      "Malaysia FMCG brand collaboration",
    ],
  },
  {
    topic: "展会商会",
    weight: 30,
    queries: [
      '"MIECC" OR "MITEC" exhibition 2026 Malaysia',
      "马来西亚 商业博览会 2026",
      "Malaysia trade fair Chinese brands",
      "Malaysia chamber of commerce youth",
    ],
  },
  {
    topic: "宏观政策",
    weight: 20,
    queries: [
      "Malaysia MIDA investment incentive 2026",
      "Malaysia halal certification JAKIM 2026",
      "Malaysia cross-border e-commerce policy",
    ],
  },
];

// ---------- 按权重挑选本次要执行的 query（总数 ≤ maxQueries） ----------
export function pickQueriesByWeight(maxQueries = 6): string[] {
  // 按权重比例分配名额（50/30/20 → 3/2/1 = 6 条）
  const allocation: Record<string, number> = { 品牌营销: 0, 展会商会: 0, 宏观政策: 0 };
  let remaining = maxQueries;
  // 先按权重整数比例分
  const totalWeight = SEARCH_QUERY_MATRIX.reduce((s, g) => s + g.weight, 0);
  for (const g of SEARCH_QUERY_MATRIX) {
    allocation[g.topic] = Math.round((g.weight / totalWeight) * maxQueries);
  }
  // 修正取整误差
  const allocated = Object.values(allocation).reduce((s, n) => s + n, 0);
  if (allocated < remaining) allocation["品牌营销"] += remaining - allocated;
  if (allocated > remaining) allocation["品牌营销"] -= allocated - remaining;

  const picked: string[] = [];
  for (const g of SEARCH_QUERY_MATRIX) {
    const n = allocation[g.topic] || 0;
    // 打乱并取前 n 条，避免每次都搜同一批
    const shuffled = [...g.queries].sort(() => Math.random() - 0.5);
    picked.push(...shuffled.slice(0, n));
  }
  return picked.slice(0, maxQueries);
}

// ---------- Tavily 搜索 ----------
async function searchWithTavily(apiKey: string, query: string): Promise<WebSearchResult[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[webSearch] Tavily HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map((r: any) => ({
      title: String(r.title || "").slice(0, 300),
      link: String(r.url || ""),
      content: String(r.content || "").slice(0, 1500),
      sourceName: extractDomain(r.url),
      pubDate: new Date().toISOString(),
    })).filter((r: WebSearchResult) => r.link);
  } catch (err: any) {
    console.warn(`[webSearch] Tavily 异常: ${err?.message || err}`);
    return [];
  }
}

// ---------- Serper 搜索 ----------
async function searchWithSerper(apiKey: string, query: string): Promise<WebSearchResult[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({ q: query, num: 5 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[webSearch] Serper HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const organic = Array.isArray(data?.organic) ? data.organic : [];
    return organic.map((r: any) => ({
      title: String(r.title || "").slice(0, 300),
      link: String(r.link || ""),
      content: String(r.snippet || "").slice(0, 1500),
      sourceName: extractDomain(r.link),
      pubDate: new Date().toISOString(),
    })).filter((r: WebSearchResult) => r.link);
  } catch (err: any) {
    console.warn(`[webSearch] Serper 异常: ${err?.message || err}`);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Web Search";
  }
}

// ---------- 统一入口：自动选择已配置的 provider ----------
// 未配置任何 Key → 返回空数组，流水线自动降级为纯 RSS
export async function searchWeb(queries: string[]): Promise<WebSearchResult[]> {
  if (!queries.length) return [];

  const tavilyKey = process.env.TAVILY_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!tavilyKey && !serperKey) {
    console.log("[webSearch] 未配置 TAVILY_API_KEY / SERPER_API_KEY，跳过 Web 搜索（纯 RSS 模式）");
    return [];
  }

  const provider = tavilyKey ? "tavily" : "serper";
  console.log(`[webSearch] 使用 ${provider} 检索 ${queries.length} 条 query`);

  // 并发上限 3，避免触发限流
  const MAX_CONCURRENT = 3;
  const all: WebSearchResult[] = [];
  for (let i = 0; i < queries.length; i += MAX_CONCURRENT) {
    const batch = queries.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.all(
      batch.map((q) => (tavilyKey ? searchWithTavily(tavilyKey, q) : searchWithSerper(serperKey!, q)))
    );
    for (const r of results) all.push(...r);
  }

  console.log(`[webSearch] 合计检索 ${all.length} 条结果`);
  return all;
}
