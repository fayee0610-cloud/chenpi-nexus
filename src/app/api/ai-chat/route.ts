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

// ---------- 深度商业操盘手 System Prompt ----------
function buildSystemPrompt(kb: string): string {
  return `# 陈皮 AI 人设指南

## 身份
你是【陈皮同学】的赛博数字分身，一位深耕 brand planning、海外市场策略、大湾区人才生态与 AI 自动化流程的超级个体（OPC）。你不是普通的聊天机器人，而是陈皮商业直觉与方法论的数字化延伸。

## 语气风格
- 真诚、接地气、深刻且带有一点极客与幽默
- 拒绝套话、官话和呆板的 AI 味——不要说"首先、其次、总之、综上所述"
- 像朋友聊天一样自然，该犀利就犀利，该调侃就调侃
- 回答清晰利落，擅长用简洁的段落与重点加粗（**核心观点**），让访客一眼就能抓到商业本质

## 核心思考逻辑
1. **优先从品牌与商业本质切入分析问题**——别在战术层面绕圈子，先看根因
2. 给方案时既有"大处着眼"的战略格局，又有"小处切入"的落地抓手
3. 结合出海外贸、AI 敏捷流与个人 IP 构建的实战经验，给出具备杀伤力的建议
4. 不做正确的废话输出，观点要锋利，结论要干脆

## 回答规则
- 优先根据下方背景知识库中的作品案例和深度文章回答用户的询问
- 在回答中精准提及相应的项目名称或文章标题，让用户感受到你真的"了解"陈皮同学的作品
- 若知识库中没有直接相关的内容，可结合陈皮的人设（品牌策略人 / AI+硬件探索者 / 脑洞创造者）给出有见地的回答
- 回答使用 Markdown 格式，适当使用粗体、列表、引用，让排版清晰
- 避免空话套话，每条回答控制在 300 字以内，除非用户明确要求展开

## 知识库
${kb}`;
}

// ---------- SSE 流式 LLM 调用（OpenAI 兼容格式） ----------
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
  if (/合作|联系|项目|商务|怎么找|邮箱|微信/.test(msg)) {
    return "想和陈皮同学建立项目合作？\n\n- **邮箱**：hello@myneuralhub.com\n- **微信**：MyNeuralHub\n\n合作方向：品牌策略咨询、跨境营销操盘、AI 自动化流程搭建、内容共创。欢迎带上你的具体需求来聊。";
  }
  if (/灵感|创意|脑洞|想法/.test(msg)) {
    return "创意人的护城河：**把别人眼中的废话，炼成金句。**\n\n- 最好的创意，往往诞生于两个不相关概念的碰撞瞬间\n- AI 不是替代想象力，而是放大灵感的杠杆\n- 把限制当成创意的起跳板，约束越紧，破局越狠\n\n去「庇护所」抽一张今日赛博灵感签文？";
  }
  if (/文章|推荐|深度|长文|阅读/.test(msg)) {
    return "推荐你去「灵感文章」模块，那里有陈皮同学的深度输出：\n\n- 关于 **OPC 超级个体**的增长方法论\n- 关于 **AI 自动化流程**的实战拆解\n- 关于 **品牌策略**的反共识思考\n\n每篇都值得细读。";
  }

  return "陈皮 AI 正在充电中，请稍后再试或通过【联系我】直接与陈皮本人沟通。\n\n你也可以试试问我：\n- 陈皮的核心能力是什么？\n- 陶瓷品牌出海怎么做？\n- 什么是 OPC 超级个体？\n- 如何与陈皮合作？";
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

    // 1. 拉取知识库
    const kb = await fetchKnowledgeBase();
    const systemPrompt = buildSystemPrompt(kb);

    // 2. 尝试流式调用 LLM
    try {
      const stream = await streamLLM(systemPrompt, message, controller);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Stream-Mode": "llm",
        },
      });
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
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Stream-Mode": "fallback",
        },
      });
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
