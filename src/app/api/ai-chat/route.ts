// ============================================================
// /api/ai-chat — 陈皮 AI 对话接口
// RAG Light：拉取 Supabase 全站内容作为知识库 + LLM 调用 + 本地降级
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 服务端 Supabase Client（复用 anon key，RLS 允许公开读）
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ---------- 拉取知识库上下文 ----------
async function fetchKnowledgeBase(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "（知识库暂未加载）";

  let kb = "【陈皮同学 · 全站知识库】\n\n";

  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("title, sub_title, category, challenge, strategy")
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
    kb += "（作品案例数据加载失败）\n\n";
  }

  try {
    const { data: insights } = await supabase
      .from("insights")
      .select("title, summary, category, content")
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
    kb += "（深度文章数据加载失败）\n";
  }

  return kb;
}

// ---------- System Prompt ----------
function buildSystemPrompt(kb: string): string {
  return `你是【陈皮同学】的赛博数字替身（Chenpi AI），一位精通品牌规划、海外市场策略、陶瓷外贸与 AI 自动化流程的超级个体（OPC）。

你的语气：专业、深刻、富有极客见解、接地气而不套路。

回答规则：
1. 优先根据下方背景知识库中的作品案例和深度文章回答用户的询问。
2. 在回答中精准提及相应的项目名称或文章标题，让用户感受到你真的"了解"陈皮同学的作品。
3. 若知识库中没有直接相关的内容，可结合陈皮同学的人设（品牌策略人 / AI+硬件探索者 / 脑洞创造者）给出有见地的回答。
4. 回答使用 Markdown 格式，适当使用粗体、列表、引用，让排版清晰。
5. 保持简洁有力，避免空话套话，每条回答控制在 300 字以内。

${kb}`;
}

// ---------- LLM 调用（OpenAI 兼容接口，支持 DeepSeek） ----------
async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("NO_API_KEY");

  // DeepSeek 指向专属 baseURL
  const baseURL = process.env.DEEPSEEK_API_KEY
    ? "https://api.deepseek.com/v1"
    : "https://api.openai.com/v1";
  const model = process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini";

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`LLM_ERROR_${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "（陈皮 AI 暂时失语，请稍后再试）";
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

  return "这个问题我还在沉淀中。你可以试试问我：\n\n- 陈皮的核心能力是什么？\n- 陶瓷品牌出海怎么做？\n- 什么是 OPC 超级个体？\n- 如何与陈皮合作？\n\n或者直接去「作品案例」「灵感文章」模块逛逛，那里有更系统的内容。";
}

// ---------- 主路由 ----------
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    // 1. 拉取知识库
    const kb = await fetchKnowledgeBase();
    const systemPrompt = buildSystemPrompt(kb);

    // 2. 尝试调用 LLM，失败则降级
    let reply: string;
    try {
      reply = await callLLM(systemPrompt, message);
    } catch (err) {
      console.log("[ai-chat] LLM 降级:", (err as Error).message);
      reply = fallbackReply(message);
    }

    return NextResponse.json({ reply, fallback: !process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY });
  } catch (err) {
    return NextResponse.json(
      { reply: fallbackReply(""), error: "内部错误" },
      { status: 500 }
    );
  }
}
