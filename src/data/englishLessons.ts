// ============================================================
// 跨境商务英文特训（Global Business English Challenge）
// 7 天听口双轨特训种子库 —— 对标马来语轻打卡的舒适 UI 架构
//
// 设计原则：
//   1. 每条 lesson 均附带主打控场金句 + 备选变体句 + 连读/弱读/吞音拆解 + 商业控场心理
//   2. 种子数据覆盖跨境商务会议中的高频痛点（Clarify / Time-gain / Action-items / Pushback 等）
//   3. audio_url 预留真实录音接入位，空字符串时降级使用浏览器 TTS
//   4. glossary_items 提供当日高频商务缩写与黑话速查
// ============================================================

export type EnglishCategory = "Listening" | "Speaking";

export interface TargetExpression {
  english: string;
  phoneticAndLinking: string; // 连读/弱读/吞音提示
  chinese: string;
}

export interface GlossaryItem {
  term: string;        // 缩写/生词
  fullForm: string;    // 全称/原型
  meaning: string;     // 中文释义
  exampleScene: string; // 场景提示
}

export interface EnglishLesson {
  day: number;
  title: string;              // 当天特训主题
  category: EnglishCategory;  // Listening 听力驯化 / Speaking 口语护甲
  sceneContext: string;       // 商业场景描述
  audioUrl: string;           // 商务英文短音频路径（预留）
  targetExpression: TargetExpression;       // 主打控场金句
  alternativeExpression: TargetExpression;  // 备选/同义变体句
  businessTakeaway: string;   // 实战商业使用场景与控场心理指南
  shadowingPractice: string[]; // 1-2 句完整上下文例句，用于录音跟读
  glossaryItems: GlossaryItem[]; // 高频商务缩写与词汇速查
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
    alternativeExpression: {
      english: "Sorry to jump in — could you run that number by me one more time? I want to make sure I have it straight.",
      phoneticAndLinking:
        "Sor-ry-to-jump-in / could-you-run-that / num-ber-by-me / one-more-time / make-sure-I-have-it-straight → run-that 连读；make-sure 中 sure 弱读为 /ʃər/",
      chinese: "抱歉打断一下——您能再给我过一遍那个数字吗？我想确保自己记对了。",
    },
    businessTakeaway:
      "永远不要用 'I don't understand' 暴露弱点。用 'Just to be aligned' 先确立共识姿态，再具体指出模糊点（数字/时间/人名）。对方不仅不会觉得你不专业，反而会觉得你严谨。",
    shadowingPractice: [
      "Sorry to jump in — could you run that number by me one more time? I want to make sure I have it straight.",
      "Just to be aligned, we're looking at a thirty-day turnaround from the signed PO, correct?",
    ],
    glossaryItems: [
      { term: "PO", fullForm: "Purchase Order", meaning: "采购订单", exampleScene: "确认订单条款、交期、付款方式时高频出现" },
      { term: "turnaround", fullForm: "turnaround time", meaning: "交付周期 / 处理时间", exampleScene: "询问对方从签约到交付需要多久" },
      { term: "aligned", fullForm: "be aligned", meaning: "确认一致 / 对齐认知", exampleScene: "会议中确认双方理解无偏差" },
      { term: "shipment", fullForm: "shipment date", meaning: "装运/发货日期", exampleScene: "跨境物流与供应链沟通核心词汇" },
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
    alternativeExpression: {
      english: "Before we lock that in, I'd love to pressure-test it with our ops team and get back to you by EOD.",
      phoneticAndLinking:
        "Be-fore-we-lock-that-in / I'd-love-to / pres-sure-test-it / with-our-ops-team / get-back-to-you / by-E-O-D → lock-that-in 三词连读；pressure-test-it 中 test 的 /t/ 与 it 的 /ɪ/ 合并",
      chinese: "在敲定之前，我想先跟运营团队做个可行性压力测试，今天下班前回复您。",
    },
    businessTakeaway:
      "对方施压时，你的第一反应决定了气场。'That's a fair point' 先给面子（降低对抗），'map that against' 把问题拉回数据框架（拖延 + 控场）。切忌说 'I don't know' 或 'Let me think'。",
    shadowingPractice: [
      "That's a fair point — give me a second to map that against our current timeline and I'll circle back to you.",
      "Before we lock that in, I'd love to pressure-test it with our ops team and get back to you by EOD.",
    ],
    glossaryItems: [
      { term: "EOD", fullForm: "End of Day", meaning: "今天下班前 / 今日结束前", exampleScene: "承诺回复时间的商务高频缩写" },
      { term: "ops", fullForm: "Operations team", meaning: "运营/运维/后勤团队", exampleScene: "涉及落地执行时的内部协作方" },
      { term: "pressure-test", fullForm: "pressure-test", meaning: "压力测试 / 评估可行性与风险", exampleScene: "技术方案或商务条款的可行性验证" },
      { term: "circle back", fullForm: "circle back", meaning: "稍后回头讨论 / 回复", exampleScene: "暂时无法回答时承诺后续跟进" },
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
    alternativeExpression: {
      english: "Let's make sure we walk out of this room with three concrete next steps, each with a single owner.",
      phoneticAndLinking:
        "Let's-make-sure / we-walk-out / of-this-room / with-three-con-crete / next-steps / each-with-a / sin-gle-own-er → walk-out 连读；concrete 重音在第一个音节",
      chinese: "确保我们走出这间会议室时，带着三个具体的下一步，每个都有唯一的负责人。",
    },
    businessTakeaway:
      "跨国团队协作最大的成本是'会后遗忘'。用 'So to recap' 强势接管话语权，用 'who takes point' 和 'hard deadline' 把模糊承诺变成硬性契约。中方团队常因文化含蓄而不敢追问，这恰恰是控场能力的分水岭。",
    shadowingPractice: [
      "So to recap — who takes point on the vendor audit, and what's our hard deadline for the first draft?",
      "Let's make sure we walk out of this room with three concrete next steps, each with a single owner.",
    ],
    glossaryItems: [
      { term: "recap", fullForm: "recapitulate", meaning: "总结 / 回顾要点", exampleScene: "会议收尾时强势接管话语权的开场词" },
      { term: "takes point", fullForm: "take point", meaning: "主负责 / 牵头", exampleScene: "分配任务时明确唯一责任人" },
      { term: "hard deadline", fullForm: "hard deadline", meaning: "硬性截止日期（不可协商）", exampleScene: "与 soft deadline（弹性时间）区分，强调严肃性" },
      { term: "vendor audit", fullForm: "vendor audit", meaning: "供应商审计 / 资质审查", exampleScene: "跨境供应链合规核心环节" },
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
    alternativeExpression: {
      english: "I see where you're coming from, but our cash-flow cycle doesn't support net-ninety. Would net-forty-five with a volume rebate work for you?",
      phoneticAndLinking:
        "I-see-where / you're-com-ing-from / but-our-cash-flow / cy-cle-does-n'-sup-port / net-nine-ty / would-net-for-ty-five / with-a-vol-ume / re-bate-work-for-you → cash-flow 连读；doesn't 的 /t/ 失去爆破",
      chinese: "我理解您的立场，但我们的现金流周期不支持90天账期。45天加量价返利可以吗？",
    },
    businessTakeaway:
      "拒绝的公式：Acknowledge（认可对方需求）+ Barrier（客观陈述自身限制）+ Counter（抛替代方案）。永远不要说 'No' 开头，用 'That would stretch us' 把拒绝包装成客观限制，再用 'what if we' 把球踢回去。",
    shadowingPractice: [
      "That timeline would stretch us pretty thin — what if we split it into two milestones with a partial payment at thirty days?",
      "I see where you're coming from, but our cash-flow cycle doesn't support net-ninety. Would net-forty-five with a volume rebate work for you?",
    ],
    glossaryItems: [
      { term: "net-ninety", fullForm: "net 90 days", meaning: "90天账期（交货后90天付款）", exampleScene: "跨境贸易核心账期术语" },
      { term: "net-forty-five", fullForm: "net 45 days", meaning: "45天账期", exampleScene: "折中方案，平衡双方现金流" },
      { term: "volume rebate", fullForm: "volume rebate", meaning: "量价返利 / 按采购量返点", exampleScene: "大客户谈判常用筹码" },
      { term: "cash-flow cycle", fullForm: "cash-flow cycle", meaning: "现金流周期", exampleScene: "解释账期限制时的客观依据" },
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
    alternativeExpression: {
      english: "I wanna make sure we're all on the same page before we move forward with the rollout.",
      phoneticAndLinking:
        "I-wan-na / make-sure-we're / all-on-the / same-page / be-fore-we / move-for-ward / with-the-roll-out → wanna = want to；same-page 连读；rollout 重音在 roll",
      chinese: "在推进 rollout 之前，我想确保大家都在同一频道上。",
    },
    businessTakeaway:
      "听力驯化的核心不是'听懂每个词'，而是'抓骨架'。gonna / wanna / gotta 出现频率超过 70%。训练时先用 0.8x 慢速拆解，再切换到 1.0x 正常语速直到耳朵自动补全。这是真正的肌肉记忆。",
    shadowingPractice: [
      "We're gonna have to deal with it sooner rather than later, so let's get the ball rolling this week.",
      "I wanna make sure we're all on the same page before we move forward with the rollout.",
    ],
    glossaryItems: [
      { term: "gonna", fullForm: "going to", meaning: "将要（口语缩略）", exampleScene: "母语者日常对话中出现频率 >70%" },
      { term: "wanna", fullForm: "want to", meaning: "想要（口语缩略）", exampleScene: "表达意图时的自然缩略" },
      { term: "gotta", fullForm: "got to / have to", meaning: "必须（口语缩略）", exampleScene: "I've gotta go = 我得走了" },
      { term: "rollout", fullForm: "roll out", meaning: "产品/方案上线推广", exampleScene: "市场进入策略核心词汇" },
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
    alternativeExpression: {
      english: "To wrap this up — the consensus is to proceed with the tier-one cities first, with a go/no-go gate at the end of month one.",
      phoneticAndLinking:
        "To-wrap-this-up / the-con-sen-sus-is / to-pro-ceed-with / the-tier-one-cit-ies / first-with-a / go-no-go-gate / at-the-end-of / month-one → wrap-this-up 连读；consensus 重音在第二音节",
      chinese: "总结一下——共识是先推进一线城市，第一个月底设一个 go/no-go 决策门。",
    },
    businessTakeaway:
      "'Bottom line' 是高管英语中最有力的开场词之一，它瞬间告诉对方：前面所有讨论到此为止，以下是决策。后续跟 'green-light / capped budget / revisit' 三个动作，形成一个完整的决策闭环。中国出海人最需要补的就是这种'一句话总结'的能力。",
    shadowingPractice: [
      "Bottom line — we green-light the pilot with a capped budget and revisit full-scale rollout in Q3.",
      "To wrap this up — the consensus is to proceed with the tier-one cities first, with a go/no-go gate at the end of month one.",
    ],
    glossaryItems: [
      { term: "green-light", fullForm: "green-light (verb)", meaning: "批准 / 开绿灯", exampleScene: "正式决策用语，比 approve 更有力" },
      { term: "capped budget", fullForm: "capped budget", meaning: "预算封顶 / 上限预算", exampleScene: "控制试点风险的财务手段" },
      { term: "go/no-go gate", fullForm: "go/no-go decision gate", meaning: "继续/终止决策门", exampleScene: "项目管理中的关键里程碑评审" },
      { term: "tier-one cities", fullForm: "tier-one cities", meaning: "一线城市", exampleScene: "市场分层策略中的最高优先级" },
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
    alternativeExpression: {
      english: "If the timeline is the blocker, I'm happy to front-load the high-impact modules so you see ROI within the first thirty days.",
      phoneticAndLinking:
        "If-the-time-line / is-the-block-er / I'm-hap-py-to / front-load-the / high-im-pact-mod-ules / so-you-see-R-O-I / with-in-the-first / thir-ty-days → front-load 连读；ROI 逐字母发音",
      chinese: "如果排期是障碍，我很乐意把高影响力模块前置，让你在头30天内看到 ROI。",
    },
    businessTakeaway:
      "对方说 'budget is tight' 往往不是真没钱，而是在试探你的底线。'I totally understand' 先共情，'phased approach' 给台阶，'doesn't compromise the core deliverables' 守住你的价值底线。这三层结构是谈判中的黄金公式。",
    shadowingPractice: [
      "I totally understand budget is tight — let's figure out a phased approach that doesn't compromise the core deliverables.",
      "If the timeline is the blocker, I'm happy to front-load the high-impact modules so you see ROI within the first thirty days.",
    ],
    glossaryItems: [
      { term: "phased approach", fullForm: "phased approach", meaning: "分阶段推进策略", exampleScene: "预算有限时的标准谈判筹码" },
      { term: "core deliverables", fullForm: "core deliverables", meaning: "核心交付物", exampleScene: "谈判中不可让步的价值底线" },
      { term: "front-load", fullForm: "front-load", meaning: "前置 / 优先安排", exampleScene: "把高价值模块提前交付以建立信任" },
      { term: "ROI", fullForm: "Return on Investment", meaning: "投资回报率", exampleScene: "说服对方的最有力财务指标" },
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
