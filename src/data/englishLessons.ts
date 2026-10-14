// ============================================================
// 跨境商务英文特训（Global Business English Challenge）
// 7 天听口双轨特训种子库 —— 对标马来语轻打卡的舒适 UI 架构
//
// 设计原则：
//   1. 每条 lesson 均附带核心句型 + 连读/弱读/吞音拆解 + 商业控场心理
//   2. 种子数据覆盖跨境商务会议中的高频痛点（Clarify / Time-gain / Action-items / Pushback 等）
//   3. audio_url 预留真实录音接入位，空字符串时降级使用浏览器 TTS
// ============================================================

export type EnglishCategory = "Listening" | "Speaking";

export interface TargetExpression {
  english: string;
  phoneticAndLinking: string; // 连读/弱读/吞音提示
  chinese: string;
}

export interface EnglishLesson {
  day: number;
  title: string;              // 当天特训主题
  category: EnglishCategory;  // Listening 听力驯化 / Speaking 口语护甲
  sceneContext: string;       // 商业场景描述
  audioUrl: string;           // 商务英文短音频路径（预留）
  targetExpression: TargetExpression;
  businessTakeaway: string;   // 实战商业使用场景与控场心理指南
  shadowingPractice: string[]; // 1-2 句完整上下文例句，用于录音跟读
}

// ---------- 7 天初始特训内容库 ----------
export const ENGLISH_LESSONS: EnglishLesson[] = [
  {
    day: 1,
    title: "How to Gracefully Interrupt and Clarify in High-Stakes Meetings",
    category: "Speaking",
    sceneContext:
      "跨国会议中对方语速极快且吞音，你完全没听懂关键数字或时间点，需要优雅打断并要求对方澄清，避免尴尬卡壳或假装听懂导致后续动作偏差。",
    audioUrl: "",
    targetExpression: {
      english: "Just to be aligned — did you say the shipment is due on the 15th or the 50th?",
      phoneticAndLinking:
        "Just-to-be-aligned / dɪd-jə-seɪ / due-on-the / fif-teenth-or-the / fif-teenth → 注意 fif-teenth / fif-tieth 尾音 -teenth 与 -tieth 的舌位差异",
      chinese: "为了确认一致——您说的是货物15号还是50号到港？",
    },
    businessTakeaway:
      "永远不要用 'I don't understand' 暴露弱点。用 'Just to be aligned' 先确立共识姿态，再具体指出模糊点（数字/时间/人名）。对方不仅不会觉得你不专业，反而会觉得你严谨。",
    shadowingPractice: [
      "Sorry to jump in — could you run that number by me one more time? I want to make sure I have it straight.",
      "Just to be aligned, we're looking at a thirty-day turnaround from the signed PO, correct?",
    ],
  },
  {
    day: 2,
    title: "To Gain Time & Reframe the Conversation",
    category: "Speaking",
    sceneContext:
      "对方突然抛出一个你未预料到的复杂问题或苛刻条款，你需要争取思考时间，同时把话题引向你准备好的框架，避免现场被逼入死角。",
    audioUrl: "",
    targetExpression: {
      english: "That's a fair point — give me a second to map that against our current timeline.",
      phoneticAndLinking:
        "That's-a-fair-point / gim-me-a-sec-ond / map-that-a-gainst / cur-rent-time-line → gim-me 是 give me 的快速连读；map-that-a-gainst 中 against 弱读为 /əˈɡenst/",
      chinese: "说得在理——给我点时间对照一下我们现有的排期。",
    },
    businessTakeaway:
      "对方施压时，你的第一反应决定了气场。'That's a fair point' 先给面子（降低对抗），'map that against' 把问题拉回数据框架（拖延 + 控场）。切忌说 'I don't know' 或 'Let me think'。",
    shadowingPractice: [
      "That's a fair point — give me a second to map that against our current timeline and I'll circle back to you.",
      "Before we lock that in, I'd love to pressure-test it with our ops team and get back to you by EOD.",
    ],
  },
  {
    day: 3,
    title: "Aligning & Locking Action Items",
    category: "Speaking",
    sceneContext:
      "会议尾声，各方讨论了一大堆方向但没人总结。你需要强势收尾，把散落的讨论点转化为具体的 Action Items，并锁定 Owner 和 Deadline，防止会后扯皮。",
    audioUrl: "",
    targetExpression: {
      english: "So to recap — who takes point on the vendor audit, and what's our hard deadline for the first draft?",
      phoneticAndLinking:
        "So-to-re-cap / who-takes-point / on-the-ven-dor-au-dit / hard-dead-line / first-draft → takes-point 连读；vendor 的 /v/ 与 audit 的 /ɔː/ 之间不要断开",
      chinese: "那我来总结一下——供应商审计谁主负责？第一版初稿的硬性 deadline 是哪天？",
    },
    businessTakeaway:
      "跨国团队协作最大的成本是‘会后遗忘’。用 'So to recap' 强势接管话语权，用 'who takes point' 和 'hard deadline' 把模糊承诺变成硬性契约。中方团队常因文化含蓄而不敢追问，这恰恰是控场能力的分水岭。",
    shadowingPractice: [
      "So to recap — who takes point on the vendor audit, and what's our hard deadline for the first draft?",
      "Let's make sure we walk out of this room with three concrete next steps, each with a single owner.",
    ],
  },
  {
    day: 4,
    title: "Polite Pushback & Counter-proposal",
    category: "Speaking",
    sceneContext:
      "对方提出了一个明显对你方不利的条款（比如账期从 30 天改成 90 天），你需要委婉但坚定地拒绝，并立即抛出一个替代方案，既守住底线又保留合作空间。",
    audioUrl: "",
    targetExpression: {
      english: "That timeline would stretch us pretty thin — what if we split it into two milestones with a partial payment at thirty days?",
      phoneticAndLinking:
        "That-time-line / would-stretch-us / pret-ty-thin / split-it-in-to / par-tial-pay-ment / at-thir-ty-days → would-stretch-us 快速连读；split-it-in-to 三个词几乎合并成一个节奏",
      chinese: "那个时间线会把我们拉得很紧——要不拆成两个里程碑，30 天先付一部分？",
    },
    businessTakeaway:
      "拒绝的公式：Acknowledge（认可对方需求）+ Barrier（客观陈述自身限制）+ Counter（抛替代方案）。永远不要说 'No' 开头，用 'That would stretch us' 把拒绝包装成客观限制，再用 'what if we' 把球踢回去。",
    shadowingPractice: [
      "That timeline would stretch us pretty thin — what if we split it into two milestones with a partial payment at thirty days?",
      "I see where you're coming from, but our cash-flow cycle doesn't support net-ninety. Would net-forty-five with a volume rebate work for you?",
    ],
  },
  {
    day: 5,
    title: "Decoding Fast-Paced Business Speech",
    category: "Listening",
    sceneContext:
      "东南亚商务沟通中对方母语者语速极快，大量使用 wanna / gonna / gotta / deal-with-it 等口语缩略，你只听清了碎片词汇，需要训练耳朵识别这些高频吞音模式。",
    audioUrl: "",
    targetExpression: {
      english: "We're gonna have to deal with it sooner rather than later.",
      phoneticAndLinking:
        "We're-gon-na / have-ta / deal-with-it / soon-er-ra-ther-than / la-ter → gonna = going to；have-ta = have to；deal-with-it 三个词连成 /diːlwɪðɪt/；rather than 弱读为 /ˈræðərðən/",
      chinese: "我们迟早得处理这件事。",
    },
    businessTakeaway:
      "听力驯化的核心不是‘听懂每个词’，而是‘抓骨架’。gonna / wanna / gotta 出现频率超过 70%。训练时先用 0.8x 慢速拆解，再切换到 1.0x 正常语速直到耳朵自动补全。这是真正的肌肉记忆。",
    shadowingPractice: [
      "We're gonna have to deal with it sooner rather than later, so let's get the ball rolling this week.",
      "I wanna make sure we're all on the same page before we move forward with the rollout.",
    ],
  },
  {
    day: 6,
    title: "Executive Summary & Next Steps",
    category: "Speaking",
    sceneContext:
      "会议或邮件收尾时，你需要用一句话概括整场讨论的核心结论，并清晰列出下一步，让各方（尤其是母语为英语的高管）感受到你的结构化思维和领导力。",
    audioUrl: "",
    targetExpression: {
      english: "Bottom line — we green-light the pilot with a capped budget and revisit full-scale rollout in Q3.",
      phoneticAndLinking:
        "Bot-tom-line / green-light-the / pi-lot-with-a / capped-bud-get / re-visit-full-scale / roll-out-in-Q-three → green-light 动词化连读；capped budget 的 /pt/ 与 /b/ 发生轻微失去爆破",
      chinese: "底线——我们批准试点，预算封顶，Q3 再评估全面推广。",
    },
    businessTakeaway:
      "'Bottom line' 是高管英语中最有力的开场词之一，它瞬间告诉对方：前面所有讨论到此为止，以下是决策。后续跟 'green-light / capped budget / revisit' 三个动作，形成一个完整的决策闭环。中国出海人最需要补的就是这种‘一句话总结’的能力。",
    shadowingPractice: [
      "Bottom line — we green-light the pilot with a capped budget and revisit full-scale rollout in Q3.",
      "To wrap this up — the consensus is to proceed with the tier-one cities first, with a go/no-go gate at the end of month one.",
    ],
  },
  {
    day: 7,
    title: "Handling Objections in Negotiations",
    category: "Listening",
    sceneContext:
      "谈判中对方以预算不足、排期冲突或需要内部审批为由拖延或压价，你需要听懂这些 objection 背后的真实信号，并用标准话术把对话拉回成交轨道。",
    audioUrl: "",
    targetExpression: {
      english: "I totally understand budget is tight — let's figure out a phased approach that doesn't compromise the core deliverables.",
      phoneticAndLinking:
        "I-to-tal-ly-un-der-stand / bud-get-is-tight / let's-fig-ure-out / phased-ap-proach / does-n'-com-pro-mise / core-de-liv-er-a-bles → budget-is-tight 几乎连成一个词；doesn't 的 /t/ 失去爆破；deliverables 四个音节拆分记忆",
      chinese: "我完全理解预算紧张——咱们看看能不能分阶段推进，同时不牺牲核心交付物。",
    },
    businessTakeaway:
      "对方说 'budget is tight' 往往不是真没钱，而是在试探你的底线。'I totally understand' 先共情，'phased approach' 给台阶，'doesn't compromise the core deliverables' 守住你的价值底线。这三层结构是谈判中的黄金公式。",
    shadowingPractice: [
      "I totally understand budget is tight — let's figure out a phased approach that doesn't compromise the core deliverables.",
      "If the timeline is the blocker, I'm happy to front-load the high-impact modules so you see ROI within the first thirty days.",
    ],
  },
];

// ============================================================
// 课程查找（进度驱动，非全局 hash）
// ============================================================
export function getEnglishLessonByDay(day: number): EnglishLesson {
  if (!day || typeof day !== "number" || !Number.isFinite(day) || day < 1) {
    return ENGLISH_LESSONS[0];
  }
  const idx = Math.min(day - 1, ENGLISH_LESSONS.length - 1);
  return ENGLISH_LESSONS[idx];
}

// 复用马来语打卡的日期工具（避免重复代码）
export { getUTC8DateKey, getYesterdayDateKey } from "./malayLessons";
