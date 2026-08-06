// ============================================================
// /api/ai-chat — 陈皮 AI 对话接口（流式版）
// OpenAI 兼容格式（DeepSeek / OpenRouter / SiliconFlow 通用）
// RAG Light：拉取 Supabase 全站内容作为知识库 + SSE 流式输出 + 本地降级
// ============================================================

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- 环境变量读取（统一 AI_ 前缀，兼容旧变量） ----------
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
  model: process.env.AI_MODEL_NAME || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini"),
};

// ---------- 服务端 Supabase Client ----------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ---------- 拉取知识库上下文 ----------
async function fetchKnowledgeBase(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "（知识库暂未加载，请以陈皮 AI 通用人设回复）";

  let kb = "【陈皮同学 · 全站知识库】\n\n";

  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("title, sub_title, category, challenge, strategy")
      .order("created_at", { ascending: false })
      .limit(20);
    if (projects && projects.length > 0) {
      kb += "## 作品案例\n";
      for (const p of projects) {
        kb += `- 《${p.title}》${p.sub_title ? `（${p.sub_title}）` : ""} | 分类：${p.category || "未分类"}\n`;
        if (p.challenge) kb += `  挑战：${p.challenge}\n`;
        if (p.strategy && Array.isArray(p.strategy)) {
          kb += `  策略：${p.strategy.map((s: any) => s.title || s).join("、")}\n`;
        }
      }
      kb += "\n";
    }
  } catch {
    kb += "（作品案例数据加载失败，跳过）\n\n";
  }

  try {
    const { data: insights } = await supabase
      .from("insights")
      .select("title, summary, category, content")
      .order("created_at", { ascending: false })
      .limit(20);
    if (insights && insights.length > 0) {
      kb += "## 深度文章\n";
      for (const i of insights) {
        kb += `- 《${i.title}》| 分类：${i.category || "未分类"}\n`;
        if (i.summary) kb += `  摘要：${i.summary}\n`;
        if (i.content) {
          const text = typeof i.content === "string" ? i.content.slice(0, 200) : "";
          if (text) kb += `  片段：${text}...\n`;
        }
      }
    }
  } catch {
    kb += "（深度文章数据加载失败，跳过）\n";
  }

  return kb;
}

// ---------- 陈皮 AI 核心人设 System Prompt ----------
const CHENPI_SYSTEM_PROMPT = `你叫"陈皮 AI"，是陈皮的数字分身。陈皮是一位专注于【品牌策略、跨境出海、AI+硬件/自动化实战】的策略人。
核心信念："人为本，AI 为杠杆，市场会有答案。"
职业底线："谋于策略，成于闭环，对结果负责。"
当前阶段：陈皮正在开放探索高价值的团队与战略协同机会（求职与面试阶段）。

【语言风格 (Tone of Voice)】：
- 犀利且务实：不堆砌"赋能/链路/闭环生态"等大词，少谈概念，多做落地。
- 平等且自信：以懂业务的战略伙伴视角对话，态度平实、真诚、有自信。
- 长短句结合：表达简洁利落，多用短句，富有逻辑敲击感。
- 彻底去 AI 腔：严禁使用"首先、其次、综上所述、总之"这类机械过渡词；禁止说"作为一个人工智能/语言模型"。

【核心知识与观点】：
- 关于 AI 与营销：AI 是"策略杠杆"，用极速完成数据结构化和流程自动化；但洞察人性的原点依然在人身上，算法买不到人心，策略才能穿透市场。
- 关于出海与 B2B/B2C：出海不是把产品搬到海外，而是从流量思维转向本地化心智穿透。尊重真实市场给出的反馈。
- 关于个人战术：既懂品牌的战略心智，又懂实操打法的落地闭环，具备从 0 到 1 的实操与 AI 自动化落地能力。

【边界控制与引导】：
- 拒绝接单腔：绝对不要说"欢迎找我接单/项目合作/付费咨询"。
- 面试与联系引导：若访客（特别是 HR 或业务 Leader）询问"如何联系陈皮"或"索取完整履历/约面试"，请自然引导对方点击页面上的【联系我】按钮，或提供邮箱/微信与陈皮取得联系。`;

// ---------- Few-Shot 示例（学习表达节奏） ----------
const FEW_SHOT_EXAMPLES = [
  {
    role: "user",
    content: "你怎么看现在 AI 在营销里的应用？",
  },
  {
    role: "assistant",
    content:
      "很多人把 AI 当作生成文案的工具，这其实把工具用小了。AI 真正的价值是'策略杠杆'——帮你极速完成数据结构化、多语种本地化和流程自动化。但洞察人性的那个'原点'，依然在人身上。算法买不到人心，策略才能穿透市场。",
  },
  {
    role: "user",
    content: "陈皮的主要背景是什么？",
  },
  {
    role: "assistant",
    content:
      "陈皮做过品牌策划，带过出海实战，也搞过 AI 自动化和硬件探索。简单来说，就是既懂品牌的战略心智，又懂实操打法的落地闭环。不空谈理论，只在真实的商业里见真章。",
  },
];

// ---------- 构建完整 System Prompt（人设 + 知识库补充） ----------
function buildSystemPrompt(kb: string): string {
  return `${CHENPI_SYSTEM_PROMPT}

【全站知识库（作为回答的事实依据，回答时可精准引用项目名/文章标题）】：
${kb}`;
}

// ---------- SSE 流式 LLM 调用（OpenAI 兼容格式，注入人设 + Few-Shot） ----------
async function streamLLM(
  systemPrompt: string,
  userMessage: string,
  controller: AbortController
): Promise<ReadableStream> {
  if (!AI_CONFIG.apiKey) throw new Error("NO_API_KEY");

  const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...FEW_SHOT_EXAMPLES,
        { role: "user", content: userMessage },
      ],
      temperature: 0.75,
      max_tokens: 1024,
    }),
    signal: controller.signal,
  });

  if (!res.ok) {
    throw new Error(`LLM_ERROR_${res.status}`);
  }

  if (!res.body) {
    throw new Error("NO_RESPONSE_BODY");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            } catch {
              // 跳过非 JSON 行
            }
          }
        }
        controller.close();
      } catch (err: any) {
        if (err.name === "AbortError") {
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return stream;
}

// ---------- 本地降级：基于关键词匹配的智能回复 ----------
function fallbackReply(message: string): string {
  const msg = message.toLowerCase();

  if (/背景|能力|核心|介绍|你是谁|陈皮/.test(msg)) {
    return "我是**陈皮同学**的赛博数字分身。陈皮的核心能力有三块：\n\n1. **品牌策略与市场冷启动** — 擅长从 0 到 1 搭建增长引擎\n2. **AI+硬件产品探索** — 关注交互体验与边缘智能\n3. **创意内容生产** — 用 AIGC 工作流提升 10 倍产能\n\n简单说：**把脑洞变成可落地的生意。**";
  }
  if (/陶瓷|出海|跨境|外贸|brand.*出海|海外/.test(msg)) {
    return "关于**陶瓷品牌出海与跨境营销**，陈皮有丰富的实战经验。\n\n- 深耕陶瓷品类的外贸品牌孵化\n- 搭建从选品、视觉、社媒到投放的完整跨境链路\n- 关注海外市场本地化与文化适配\n\n你可以去「作品案例」模块查看相关项目，或在「灵感文章」中找到深度拆解。";
  }
  if (/opc|自动化|流程|ai.*自动化|超级个体/.test(msg)) {
    return "**OPC（One Person Company）** 是陈皮同学的核心方法论。\n\n- 一个人就是一家公司，关键在于把碎片技能织成网络\n- 用 AI 自动化流程放大个人产能：内容生产、数据分析、客户沟通\n- 增长杠杆的本质：找到那个能被无限放大的微小动作\n\n推荐你去「灵感文章」模块翻阅相关深度长文。";
  }
  if (/合作|联系|项目|商务|怎么找|邮箱|微信|面试|履历/.test(msg)) {
    return "想直接联系陈皮？\n\n点击页面上的【**联系我**】按钮，或通过以下方式与陈皮取得联系：\n- **邮箱**：fayee0610@gmail.com\n- **微信**：CHENPI_MKT\n\n陈皮正在开放探索高价值的团队与战略协同机会，欢迎带上你的具体需求或面试邀约来聊。";
  }
  if (/灵感|创意|脑洞|想法/.test(msg)) {
    return "创意人的护城河：**把别人眼中的废话，炼成金句。**\n\n- 最好的创意，往往诞生于两个不相关概念的碰撞瞬间\n- AI 不是替代想象力，而是放大灵感的杠杆\n- 把限制当成创意的起跳板，约束越紧，破局越狠\n\n去「庇护所」抽一张今日赛博灵感签文？";
  }
  if (/文章|推荐|深度|长文|阅读/.test(msg)) {
    return "推荐你去「灵感文章」模块，那里有陈皮同学的深度输出：\n\n- 关于 **OPC 超级个体**的增长方法论\n- 关于 **AI 自动化流程**的实战拆解\n- 关于 **品牌策略**的反共识思考\n\n每篇都值得细读。";
  }

  return "陈皮 AI 正在充电中，请稍后再试或通过【联系我】直接与陈皮本人沟通。\n\n你也可以试试问我：\n- 陈皮的主要背景与实战项目经历？\n- 如何看待 AI 对营销流程的重塑？\n- 品牌出海如何做到战术级市场穿透？";
}

// ---------- 频次限制：未登录用户 3 次/天 ----------
const DAILY_LIMIT = 3;

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(req: NextRequest): { allowed: boolean; remaining: number } {
  // 已登录用户（admin token 有效）不限次
  const adminToken = req.cookies.get("admin_token")?.value;
  if (adminToken) {
    try {
      const payload = JSON.parse(atob(adminToken));
      if (payload.role === "admin" && payload.exp > Date.now()) {
        return { allowed: true, remaining: -1 };
      }
    } catch {}
  }

  // 未登录用户：基于 cookie 计数
  const usageCookie = req.cookies.get("ai_chat_usage")?.value;
  const today = getTodayStr();

  if (usageCookie) {
    try {
      const usage = JSON.parse(usageCookie);
      if (usage.date === today) {
        const count = usage.count || 0;
        if (count >= DAILY_LIMIT) {
          return { allowed: false, remaining: 0 };
        }
        return { allowed: true, remaining: DAILY_LIMIT - count };
      }
    } catch {}
  }

  return { allowed: true, remaining: DAILY_LIMIT };
}

function buildUsageCookie(currentCount: number): string {
  const today = getTodayStr();
  const value = JSON.stringify({ date: today, count: currentCount + 1 });
  return `ai_chat_usage=${encodeURIComponent(value)}; Path=/; Max-Age=86400; SameSite=Lax`;
}

// ---------- 主路由：SSE 流式响应 ----------
export async function POST(req: NextRequest) {
  const controller = new AbortController();
  // 客户端断开时中止请求
  req.signal.addEventListener("abort", () => controller.abort());

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "消息不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 频次限制检查
    const rateCheck = checkRateLimit(req);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "RATE_LIMIT_EXCEEDED", message: "今日对话次数已达上限（3次/天）" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 构建用量计数 Cookie（已登录用户不计数）
    const usageCookie = req.cookies.get("ai_chat_usage")?.value;
    const today = getTodayStr();
    let currentCount = 0;
    if (usageCookie) {
      try {
        const usage = JSON.parse(usageCookie);
        if (usage.date === today) currentCount = usage.count || 0;
      } catch {}
    }
    const setCookieHeader = rateCheck.remaining === -1
      ? ""
      : buildUsageCookie(currentCount);

    // 1. 拉取知识库
    const kb = await fetchKnowledgeBase();
    const systemPrompt = buildSystemPrompt(kb);

    // 2. 尝试流式调用 LLM
    try {
      const stream = await streamLLM(systemPrompt, message, controller);
      const headers: Record<string, string> = {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Stream-Mode": "llm",
      };
      if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
      return new Response(stream, { headers });
    } catch (err) {
      console.log("[ai-chat] LLM 降级:", (err as Error).message);
      const reply = fallbackReply(message);
      // 降级模式也用 SSE 推送，保持前端处理一致
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode(reply));
          ctrl.close();
        },
      });
      const headers: Record<string, string> = {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Stream-Mode": "fallback",
      };
      if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
      return new Response(stream, { headers });
    }
  } catch (err) {
    console.error("[ai-chat] 致命错误:", err);
    const reply = fallbackReply("");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(reply));
        ctrl.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Stream-Mode": "fallback",
      },
    });
  }
}
