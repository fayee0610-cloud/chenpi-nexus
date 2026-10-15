// ============================================================
// 跨境商务英文特训（Global Business English Challenge）
// 90 天听口双轨特训种子库 —— 对标马来语轻打卡的舒适 UI 架构
//
// 设计原则：
//   1. 每条 lesson 均附带主打控场金句 + 备选变体句 + 连读/弱读/吞音拆解 + 商业控场心理
//   2. 种子数据覆盖跨境商务会议中的高频痛点（Clarify / Time-gain / Action-items / Pushback 等）
//   3. audio_url 预留真实录音接入位，空字符串时降级使用浏览器 TTS
//   4. glossary_items 提供当日高频商务缩写与黑话速查
//   5. Day 31-90 拆分为独立文件，此处统一聚合导出
// ============================================================

import { ENGLISH_LESSONS_31_50 } from "./englishLessons31to50";
import { ENGLISH_LESSONS_51_70 } from "./englishLessons51to70";
import { ENGLISH_LESSONS_71_90 } from "./englishLessons71to90";

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
  {
    day: 8,
    title: "Pitching to Key Buyers at Malaysian Trade Shows",
    category: "Speaking",
    sceneContext:
      "MIHAS 或 BeautyExpo 展会现场，人群嘈杂，Key Buyer 只给你 30 秒。你需要用一句话点明核心价值，勾起对方停下来深聊的兴趣，而不是泛泛介绍公司历史。",
    audioUrl: "",
    targetExpression: {
      english: "We help Malaysian retailers cut sourcing costs by 20% through direct factory access — here's the one-pager.",
      phoneticAndLinking: "We-help-Ma-lay-sian / re-tail-ers-cut / sour-cing-costs / by-twen-ty-per-cent / through-di-rect / fac-tor-y-ac-cess → cut-sourcing 连读；twenty 弱读为 /ˈtweni/",
      chinese: "我们帮大马零售商通过工厂直采降低 20% 采购成本——这是一页纸简介。",
    },
    alternativeExpression: {
      english: "If you're looking for halal-certified OEM with a 30-day turnaround, we're the only factory in Johor that can do both.",
      phoneticAndLinking: "If-you're-look-ing-for / ha-lal-cer-ti-fied / O-E-M-with-a / thir-ty-day-turn-a-round / we're-the-on-ly / fac-tor-y-in-Jo-hor → halal-certified 连读；Johor 重音在第二音节",
      chinese: "如果您在找有清真认证且 30 天交付的 OEM，我们是柔佛唯一两者兼备的工厂。",
    },
    businessTakeaway:
      "展会 Pitch 的黄金结构：痛点数字 + 解决方案 + 差异化壁垒。'cut sourcing costs by 20%' 比 'we are a leading manufacturer' 有力 100 倍。30 秒内必须让对方知道：你能帮他赚多少钱或省多少钱。",
    shadowingPractice: [
      "We help Malaysian retailers cut sourcing costs by 20% through direct factory access — here's the one-pager.",
      "If you're looking for halal-certified OEM with a 30-day turnaround, we're the only factory in Johor that can do both.",
    ],
    glossaryItems: [
      { term: "OEM", fullForm: "Original Equipment Manufacturer", meaning: "贴牌代工", exampleScene: "大马买家寻找自有品牌供应商时的核心词汇" },
      { term: "one-pager", fullForm: "one-page summary", meaning: "一页纸简介", exampleScene: "展会高效沟通的必备物料" },
      { term: "sourcing", fullForm: "sourcing cost", meaning: "采购成本", exampleScene: "B2B 谈判中的核心痛点指标" },
      { term: "turnaround", fullForm: "turnaround time", meaning: "交付周期", exampleScene: "大马买家最关心的供应链指标之一" },
    ],
  },
  {
    day: 9,
    title: "Filtering High-Value Buyers & Declining Poor Fits",
    category: "Speaking",
    sceneContext:
      "展会第二天，你收到大量名片，但时间有限。需要快速识别谁是真实买家、谁是同行探价或学生调研，并优雅拒绝不匹配的低质询盘，把时间留给高价值客户。",
    audioUrl: "",
    targetExpression: {
      english: "I appreciate your interest — to make sure we're the right fit, could you share your monthly volume and target price range?",
      phoneticAndLinking: "I-ap-pre-ci-ate / your-in-ter-est / to-make-sure / we're-the-right-fit / could-you-share / your-month-ly-vol-ume / and-tar-get-price-range → appreciate 重音在第二音节；monthly 的 /θ/ 要咬舌",
      chinese: "感谢您的兴趣——为了确认我们是否匹配，您方便分享月采购量和目标价位吗？",
    },
    alternativeExpression: {
      english: "Our MOQ starts at five thousand units — if that's above your current scale, I'd hate to waste your time.",
      phoneticAndLinking: "Our-M-O-Q / starts-at-five-thou-sand / u-nits-if-that's / a-bove-your-cur-rent / scale-I'd-hate-to / waste-your-time → MOQ 逐字母发音；I'd-hate-to 连读",
      chinese: "我们的起订量是五千件——如果超出您目前的规模，我不想浪费您的时间。",
    },
    businessTakeaway:
      "筛选买家的黄金问题：月采购量 + 目标价位 + 决策周期。三个问题就能过滤掉 80% 的非目标客户。'I'd hate to waste your time' 是优雅拒绝的顶级话术——把拒绝包装成为对方着想。",
    shadowingPractice: [
      "I appreciate your interest — to make sure we're the right fit, could you share your monthly volume and target price range?",
      "Our MOQ starts at five thousand units — if that's above your current scale, I'd hate to waste your time.",
    ],
    glossaryItems: [
      { term: "MOQ", fullForm: "Minimum Order Quantity", meaning: "最小起订量", exampleScene: "筛选真实买家的第一道门槛" },
      { term: "right fit", fullForm: "the right fit", meaning: "匹配 / 合适", exampleScene: "委婉表达'可能不匹配'的商务用语" },
      { term: "target price range", fullForm: "target price range", meaning: "目标价位区间", exampleScene: "判断对方采购诚意和预算的关键问题" },
      { term: "volume", fullForm: "monthly volume", meaning: "月采购量", exampleScene: "评估买家实力的核心指标" },
    ],
  },
  {
    day: 10,
    title: "Capturing Decision-Maker Contacts & Locking Follow-up",
    category: "Speaking",
    sceneContext:
      "你与一位潜在买家聊了 10 分钟，感觉不错，但展会即将结束。你需要自然索要决策人联系方式，并当场锁定一个具体的 Follow-up 时间，避免'回头联系'变成永不联系。",
    audioUrl: "",
    targetExpression: {
      english: "I'd love to continue this — are you the one who signs off on supplier selection, or should I loop in your procurement lead?",
      phoneticAndLinking: "I'd-love-to-con-tin-ue / this-are-you / the-one-who / signs-off-on / sup-pli-er-se-lec-tion / or-should-I / loop-in-your / pro-cure-ment-lead → signs-off 连读；procurement 重音在第二音节",
      chinese: "我很想继续推进——供应商选择是您拍板，还是我需要拉上您的采购负责人？",
    },
    alternativeExpression: {
      english: "Before you go — can I WhatsApp you the catalog tonight, and would Thursday 2 PM work for a quick call?",
      phoneticAndLinking: "Be-fore-you-go / can-I-Whats-App / you-the-cat-a-log / to-night-and-would / Thurs-day-two-P-M / work-for-a-quick-call → WhatsApp 重音在第一个音节；2 PM 读作 two P M",
      chinese: "您走之前——今晚我能把目录发到您 WhatsApp 吗？周四下午两点通个短电话方便吗？",
    },
    businessTakeaway:
      "索要联系方式的公式：确认决策权 + 提供价值 + 锁定时间。'signs off on supplier selection' 直接问出决策链；'WhatsApp you the catalog tonight' 给出立即行动的理由；'Thursday 2 PM' 把模糊承诺变成日历上的具体事件。",
    shadowingPractice: [
      "I'd love to continue this — are you the one who signs off on supplier selection, or should I loop in your procurement lead?",
      "Before you go — can I WhatsApp you the catalog tonight, and would Thursday 2 PM work for a quick call?",
    ],
    glossaryItems: [
      { term: "signs off on", fullForm: "sign off on", meaning: "批准 / 拍板", exampleScene: "确认对方是否有最终决策权" },
      { term: "loop in", fullForm: "loop someone in", meaning: "拉某人进群 / 让某人参与", exampleScene: "需要引入第三方参与讨论时使用" },
      { term: "procurement lead", fullForm: "procurement lead", meaning: "采购负责人", exampleScene: "大马企业中的常见职位" },
      { term: "follow-up", fullForm: "follow-up call / email", meaning: "后续跟进", exampleScene: "展会后 48 小时内的黄金跟进窗口" },
    ],
  },
  {
    day: 11,
    title: "Negotiating Pop-up Store Rent & Revenue Share with Mall Management",
    category: "Speaking",
    sceneContext:
      "你计划在吉隆坡 Mid Valley 或 Pavilion 开设 2 周快闪店测试市场。Mall Management 报价 RM 15,000/周 + 15% 流水抽成，你需要谈到一个对新品牌更友好的结构。",
    audioUrl: "",
    targetExpression: {
      english: "Fifteen percent on gross is steep for an unproven brand — could we do a flat eight thousand weekly with a five percent kicker only if we hit fifty thousand in sales?",
      phoneticAndLinking: "Fif-teen-per-cent / on-gross-is-steep / for-an-un-proven / brand-could-we / do-a-flat-eight / thou-sand-week-ly / with-a-five-per-cent / kick-er-on-ly-if / we-hit-fif-ty-thou-sand / in-sales → gross-is 连读；unproven 重音在第二音节；kicker 是条件触发条款的行话",
      chinese: "对未经验证的新品牌来说，流水抽 15% 太高了——能否固定每周八千，只有销售额破五万才加 5% 的奖励抽成？",
    },
    alternativeExpression: {
      english: "What if we structure it as a two-week pilot at cost, with a revenue-share option kicking in only if we renew for month two?",
      phoneticAndLinking: "What-if-we / struc-ture-it-as / a-two-week-pi-lot / at-cost-with-a / rev-e-nue-share-op-tion / kick-ing-in-on-ly-if / we-re-new-for / month-two → structure-it-as 连读；revenue-share 重音在第一个音节",
      chinese: "要不这样：前两周按成本价做试点，只有我们续租第二个月才开始流水抽成？",
    },
    businessTakeaway:
      " Mall 谈判的核心是风险共担。新品牌没有历史数据，Mall 方用高抽成对冲风险。'pilot at cost + kicker if we hit target' 把风险从固定成本转为可变成本，双方都有动力把活动做成功。",
    shadowingPractice: [
      "Fifteen percent on gross is steep for an unproven brand — could we do a flat eight thousand weekly with a five percent kicker only if we hit fifty thousand in sales?",
      "What if we structure it as a two-week pilot at cost, with a revenue-share option kicking in only if we renew for month two?",
    ],
    glossaryItems: [
      { term: "gross", fullForm: "gross revenue", meaning: "流水 / 总销售额", exampleScene: "Mall 抽成计算的基数" },
      { term: "kicker", fullForm: "kicker clause", meaning: "条件触发的额外条款", exampleScene: "达到特定目标才生效的奖励机制" },
      { term: "pilot", fullForm: "pilot program", meaning: "试点项目", exampleScene: "降低双方风险的标准谈判策略" },
      { term: "revenue share", fullForm: "revenue share", meaning: "流水抽成", exampleScene: "快闪店与 Mall 的常见合作模式" },
    ],
  },
  {
    day: 12,
    title: "Pitching to Category Buyers at Watsons / Guardian / Jaya Grocer",
    category: "Speaking",
    sceneContext:
      "你带着新品来到 Watsons 总部，Category Buyer 只有 15 分钟。你需要快速证明：你的产品能帮他们提升品类坪效，而不是单纯'多一个 SKU'。",
    audioUrl: "",
    targetExpression: {
      english: "Your halal skincare shelf is growing 30% YoY but has no entry-price-point option — we fill that gap with a RM 39 hero SKU.",
      phoneticAndLinking: "Your-ha-lal-skin-care / shelf-is-grow-ing / thir-ty-per-cent-Y-o-Y / but-has-no-en-try / price-point-op-tion / we-fill-that-gap / with-a-R-M-thir-ty-nine / he-ro-S-K-U → YoY = Year over Year 逐字母；hero SKU 连读",
      chinese: "您的清真护肤品类年增长 30%，但缺少入门级价位——我们用一款 RM39 的明星单品填补这个空白。",
    },
    alternativeExpression: {
      english: "We're not asking for shelf space — we're bringing in a ready-made TikTok audience that already searches for this in Guardian.",
      phoneticAndLinking: "We're-not-ask-ing-for / shelf-space-we're / bring-ing-in-a / read-y-made-Tik-Tok / au-dience-that-al-read-y / search-es-for-this / in-Guard-ian → ready-made 连读；Guardian 重音在第一个音节",
      chinese: "我们不是来要货架的——我们自带 TikTok 现成流量，这些用户已经在 Guardian 搜索这类产品了。",
    },
    businessTakeaway:
      "Category Buyer 的 KPI 是坪效和品类增长。不要说'我的产品多好'，要说'你的品类缺什么，我帮你补上'。'entry-price-point gap' 和 'ready-made audience' 分别击中了品类管理和流量焦虑两大痛点。",
    shadowingPractice: [
      "Your halal skincare shelf is growing 30% YoY but has no entry-price-point option — we fill that gap with a RM 39 hero SKU.",
      "We're not asking for shelf space — we're bringing in a ready-made TikTok audience that already searches for this in Guardian.",
    ],
    glossaryItems: [
      { term: "YoY", fullForm: "Year over Year", meaning: "同比增长", exampleScene: "展示品类增长趋势的核心指标" },
      { term: "SKU", fullForm: "Stock Keeping Unit", meaning: "单品 / 库存单位", exampleScene: "零售渠道谈判的基础词汇" },
      { term: "hero SKU", fullForm: "hero SKU", meaning: "明星单品 / 引流款", exampleScene: "帮助渠道吸引客流的核心产品" },
      { term: "shelf space", fullForm: "shelf space", meaning: "货架空间", exampleScene: "线下零售最稀缺的资源" },
    ],
  },
  {
    day: 13,
    title: "High-Converting Follow-up Emails & WhatsApp Messages",
    category: "Speaking",
    sceneContext:
      "展会结束 24 小时内，你需要给 20 个潜在客户发送跟进信息。邮件要正式但不过长，WhatsApp 要亲切但不失专业，目标是把'一面之缘'推进到'样品测试'或'视频会议'。",
    audioUrl: "",
    targetExpression: {
      english: "Great meeting you at MIHAS — I've attached our halal cert and the RM39 pricing sheet we discussed. Does a 15-min call this week work?",
      phoneticAndLinking: "Great-meet-ing-you / at-M-I-H-A-S / I've-at-tached / our-ha-lal-cert / and-the-R-M-thir-ty-nine / pric-ing-sheet / we-dis-cussed / does-a-fif-teen-min / call-this-week-work → MIHAS 逐字母；RM39 读作 R M thirty-nine",
      chinese: "很高兴在 MIHAS 见到您——附件是我们讨论过的清真认证和 RM39 报价单。本周通个 15 分钟电话方便吗？",
    },
    alternativeExpression: {
      english: "Hi [Name], this is [You] from the halal skincare booth — sending over the samples info you asked for. Free to hop on a quick call Thursday?",
      phoneticAndLinking: "Hi-Name-this-is / You-from-the / ha-lal-skin-care-booth / send-ing-o-ver / the-sam-ples-in-fo / you-asked-for / free-to-hop / on-a-quick-call / Thurs-day → hop-on 连读；Thursday 弱读为 /ˈθɜːrzdeɪ/",
      chinese: "嗨 [名字]，我是清真护肤展位的 [你]——发您要的样品信息。周四能通个短电话吗？",
    },
    businessTakeaway:
      "跟进的黄金法则：24 小时内 + 提及具体细节 + 给出低门槛下一步。'the RM39 pricing sheet we discussed' 证明你记得对话内容；'15-min call' 比 'schedule a meeting' 的回复率高 3 倍。",
    shadowingPractice: [
      "Great meeting you at MIHAS — I've attached our halal cert and the RM39 pricing sheet we discussed. Does a 15-min call this week work?",
      "Hi [Name], this is [You] from the halal skincare booth — sending over the samples info you asked for. Free to hop on a quick call Thursday?",
    ],
    glossaryItems: [
      { term: "MIHAS", fullForm: "Malaysia International Halal Showcase", meaning: "马来西亚国际清真展", exampleScene: "东南亚最大的清真产品展会" },
      { term: "cert", fullForm: "certificate", meaning: "证书（口语缩写）", exampleScene: "商务沟通中的高频缩写" },
      { term: "hop on", fullForm: "hop on a call", meaning: "快速通话", exampleScene: "比 'schedule a meeting' 更轻量的表达" },
      { term: "pricing sheet", fullForm: "pricing sheet", meaning: "报价单", exampleScene: "展会后跟进的标准附件" },
    ],
  },
  {
    day: 14,
    title: "Cross-Cultural Business Communication with Malay / Chinese / Indian Buyers",
    category: "Speaking",
    sceneContext:
      "你在大马同时接触三大族群客户：马来买家重视宗教合规与长期关系，华裔买家关注价格与效率，印度裔买家注重细节与合同条款。你需要在同一套话术框架下灵活切换沟通策略。",
    audioUrl: "",
    targetExpression: {
      english: "For our Malay partners, halal integrity is non-negotiable — for our Chinese distributors, let's talk margins first. Same product, different priorities.",
      phoneticAndLinking: "For-our-Ma-lay / part-ners-ha-lal / in-teg-ri-ty-is / non-ne-go-tia-ble / for-our-Chi-nese / dis-tri-bu-tors-let's / talk-mar-gins-first / same-pro-duct / dif-fe-rent-pri-o-ri-ties → non-negotiable 重音在第三音节；margins 重音在第一个音节",
      chinese: "对马来伙伴，清真诚信不可妥协——对华裔经销商，我们先谈利润。同一产品，不同优先级。",
    },
    alternativeExpression: {
      english: "I respect that Friday prayers come first — shall we schedule our call for 3 PM instead, after your break?",
      phoneticAndLinking: "I-re-spect-that / Fri-day-pray-ers / come-first-shall-we / sched-ule-our-call / for-three-P-M / in-stead-af-ter / your-break → respect 重音在第二音节；schedule 美式发音 /ˈskedʒuːl/",
      chinese: "我尊重周五礼拜优先——我们把电话改到下午 3 点，等您休息完？",
    },
    businessTakeaway:
      "大马多元文化的核心是'尊重差异，但不失专业'。对马来客户，先提 JAKIM 认证和 prayer time 安排；对华裔客户，直接谈数字和账期；对印度裔客户，准备好详细合同条款。'Same product, different priorities' 是你在内部对齐时的万能句式。",
    shadowingPractice: [
      "For our Malay partners, halal integrity is non-negotiable — for our Chinese distributors, let's talk margins first. Same product, different priorities.",
      "I respect that Friday prayers come first — shall we schedule our call for 3 PM instead, after your break?",
    ],
    glossaryItems: [
      { term: "non-negotiable", fullForm: "non-negotiable", meaning: "不可妥协的", exampleScene: "表达底线时的强力词汇" },
      { term: "margins", fullForm: "profit margins", meaning: "利润率", exampleScene: "与经销商谈判的核心数字" },
      { term: "distributor", fullForm: "distributor", meaning: "经销商 / 分销商", exampleScene: "大马市场常见的渠道伙伴类型" },
      { term: "priorities", fullForm: "priorities", meaning: "优先级", exampleScene: "跨文化沟通中的关键差异点" },
    ],
  },
  {
    day: 15,
    title: "Live Crisis Control: Handling On-Site Customer Complaints",
    category: "Speaking",
    sceneContext:
      "展会现场，一位客户大声抱怨你们的产品在运输中损坏，周围人群开始围观。你需要在 60 秒内控制局面，把公开危机转化为展示专业度的机会。",
    audioUrl: "",
    targetExpression: {
      english: "I'm so sorry this happened — let me personally make sure you get a replacement shipped today, and I'll DM you my direct line right now.",
      phoneticAndLinking: "I'm-so-sor-ry / this-hap-pened / let-me-per-son-al-ly / make-sure-you-get / a-re-place-ment / shipped-to-day / and-I'll-D-M / you-my-di-rect / line-right-now → personally 重音在第一个音节；DM = Direct Message 逐字母",
      chinese: "非常抱歉发生这种事——我亲自确保今天给您发替换品，现在就私信您我的直线电话。",
    },
    alternativeExpression: {
      english: "You're absolutely right to expect better — can we step aside for two minutes so I can sort this out for you properly?",
      phoneticAndLinking: "You're-ab-so-lute-ly / right-to-ex-pect / bet-ter-can-we / step-a-side-for / two-min-utes-so / I-can-sort-this / out-for-you / prop-er-ly → absolutely 重音在第一音节；sort-this-out 连读",
      chinese: "您完全有理由期待更好的——我们能否到旁边两分钟，我好好帮您处理？",
    },
    businessTakeaway:
      "危机处理的三步公式：Acknowledge（承认情绪）+ Action（立即行动）+ Access（提供直接联系）。'step aside' 把公开冲突转为私下解决；'DM you my direct line' 把负面体验转化为个人信任。围观者看到的不是投诉，而是你的担当。",
    shadowingPractice: [
      "I'm so sorry this happened — let me personally make sure you get a replacement shipped today, and I'll DM you my direct line right now.",
      "You're absolutely right to expect better — can we step aside for two minutes so I can sort this out for you properly?",
    ],
    glossaryItems: [
      { term: "DM", fullForm: "Direct Message", meaning: "私信", exampleScene: "社交媒体时代的标准联系方式" },
      { term: "replacement", fullForm: "replacement unit", meaning: "替换品", exampleScene: "售后危机处理的标准解决方案" },
      { term: "direct line", fullForm: "direct line", meaning: "直线电话", exampleScene: "提供个人联系方式以建立信任" },
      { term: "sort out", fullForm: "sort out", meaning: "妥善处理", exampleScene: "危机处理中的高频动词短语" },
    ],
  },
  {
    day: 16,
    title: "Negotiating Exclusive vs. Non-Exclusive Distribution Terms",
    category: "Speaking",
    sceneContext:
      "大马代理商要求签独家代理（Exclusive），承诺首单 RM 500,000，但要求 3 年排他期 + 区域保护。你担心独家会限制未来渠道灵活性，需要谈到一个平衡点。",
    audioUrl: "",
    targetExpression: {
      english: "We love the commitment — instead of full exclusivity, what if we grant you priority rights for twelve months, renewable if you hit the RM 200K quarterly target?",
      phoneticAndLinking: "We-love-the-com-mit-ment / in-stead-of-full / ex-clu-si-vi-ty / what-if-we-grant / you-pri-o-ri-ty-rights / for-twelve-months / re-new-a-ble-if / you-hit-the-R-M / two-hun-dred-K / quar-ter-ly-tar-get → exclusivity 重音在第三音节；priority 重音在第二音节",
      chinese: "我们很欣赏这份承诺——与其签完全独家，不如给您 12 个月优先权，每季度做到 RM20 万就自动续签？",
    },
    alternativeExpression: {
      english: "Exclusive makes sense if the volume justifies it — can we start non-exclusive for six months, then upgrade based on actual sell-through data?",
      phoneticAndLinking: "Ex-clu-sive-makes-sense / if-the-vol-ume / jus-ti-fies-it / can-we-start / non-ex-clu-sive / for-six-months / then-up-grade / based-on-ac-tual / sell-through-da-ta → sell-through 连读；upgrade 重音在第一个音节",
      chinese: "如果销量支撑，独家才有意义——能否先非独家做六个月，再根据实际动销数据升级？",
    },
    businessTakeaway:
      "独家的本质是'用渠道灵活性换承诺'。如果代理商首单达不到你预期的 3 倍年销额，独家就是陷阱。'priority rights + quarterly target' 把一次性博弈变成持续激励，比全独家更安全。",
    shadowingPractice: [
      "We love the commitment — instead of full exclusivity, what if we grant you priority rights for twelve months, renewable if you hit the RM 200K quarterly target?",
      "Exclusive makes sense if the volume justifies it — can we start non-exclusive for six months, then upgrade based on actual sell-through data?",
    ],
    glossaryItems: [
      { term: "exclusive", fullForm: "exclusive distribution", meaning: "独家代理", exampleScene: "渠道谈判中的双刃剑" },
      { term: "priority rights", fullForm: "priority rights", meaning: "优先权", exampleScene: "比独家更灵活的替代方案" },
      { term: "sell-through", fullForm: "sell-through rate", meaning: "动销率", exampleScene: "评估代理商真实能力的核心数据" },
      { term: "quarterly target", fullForm: "quarterly sales target", meaning: "季度销售目标", exampleScene: "绑定独家权的绩效门槛" },
    ],
  },
  {
    day: 17,
    title: "MOQ & Payment Terms Negotiation (Net 30 / Net 60)",
    category: "Speaking",
    sceneContext:
      "代理商首单只想试 2,000 件（你的 MOQ 是 5,000），同时要求 Net 60 账期。你需要在保护现金流的前提下，给出一个让对方有安全感的首单方案。",
    audioUrl: "",
    targetExpression: {
      english: "I can flex to three thousand units for the trial order — but at Net 30, not Net 60. Once we see the sell-through, I'm happy to revisit both MOQ and terms.",
      phoneticAndLinking: "I-can-flex-to / three-thou-sand-u-nits / for-the-tri-al-or-der / but-at-Net-thir-ty / not-Net-six-ty / once-we-see / the-sell-through / I'm-hap-py-to / re-vis-it-both / M-O-Q-and-terms → flex-to 连读；Net 30/60 逐字母+数字",
      chinese: "首单我可以降到三千件——但账期是 Net 30，不是 Net 60。看到动销数据后，我很乐意重新谈 MOQ 和账期。",
    },
    alternativeExpression: {
      english: "Let's do twenty-five hundred with a fifty-percent deposit — the balance Net 30. That way your risk is capped, and our cash flow stays healthy.",
      phoneticAndLinking: "Let's-do-twen-ty-five / hun-dred-with-a / fif-ty-per-cent-de-pos-it / the-bal-ance-Net-thir-ty / that-way-your-risk / is-capped-and-our / cash-flow-stays / heal-thy → deposit 重音在第二音节；capped 失去爆破",
      chinese: "两千五百件，50% 定金——余款 Net 30。这样您的风险封顶，我们的现金流也健康。",
    },
    businessTakeaway:
      "首单谈判的核心是'风险共担'。降 MOQ 是你的让步，必须换到对方在账期或定金上的让步。'Once we see the sell-through' 把一次性谈判变成长期合作的数据驱动对话。",
    shadowingPractice: [
      "I can flex to three thousand units for the trial order — but at Net 30, not Net 60. Once we see the sell-through, I'm happy to revisit both MOQ and terms.",
      "Let's do twenty-five hundred with a fifty-percent deposit — the balance Net 30. That way your risk is capped, and our cash flow stays healthy.",
    ],
    glossaryItems: [
      { term: "flex", fullForm: "flexible / flex", meaning: "灵活调整", exampleScene: "谈判中表达让步意愿的动词" },
      { term: "trial order", fullForm: "trial order", meaning: "试单 / 首单", exampleScene: "新渠道合作的标准起点" },
      { term: "deposit", fullForm: "deposit payment", meaning: "定金", exampleScene: "降低买方风险同时保护卖方现金流" },
      { term: "revisit", fullForm: "revisit the terms", meaning: "重新谈判", exampleScene: "为未来谈判留有余地的表达" },
    ],
  },
  {
    day: 18,
    title: "MDF & Co-Marketing Fund Allocation Negotiation",
    category: "Speaking",
    sceneContext:
      "代理商要求你提供 MDF（Marketing Development Fund）支持他们做线下推广，但预算分配比例和效果追踪方式模糊。你需要谈到一个双方都能量化的方案。",
    audioUrl: "",
    targetExpression: {
      english: "We're prepared to allocate five percent of first-year revenue as MDF — but we need pre-approved campaign briefs and post-campaign sell-through reports to unlock the next quarter's fund.",
      phoneticAndLinking: "We're-pre-pared-to / al-lo-cate-five-per-cent / of-first-year-rev-e-nue / as-M-D-F / but-we-need / pre-ap-proved-cam-paign / briefs-and-post-cam-paign / sell-through-re-ports / to-un-lock-the / next-quar-ter's-fund → MDF 逐字母；pre-approved 连读",
      chinese: "我们准备把首年收入的 5% 作为 MDF——但需要提前审批 campaign brief 和事后动销报告，才能解锁下一季度的基金。",
    },
    alternativeExpression: {
      english: "Instead of a flat MDF percentage, let's tie it to performance — two percent baseline, plus one percent for every ten percent above the quarterly target.",
      phoneticAndLinking: "In-stead-of-a-flat / M-D-F-per-cent-age / let's-tie-it-to / per-form-ance / two-per-cent-base-line / plus-one-per-cent / for-ev-ery-ten-per-cent / a-bove-the-quar-ter-ly / tar-get → performance 重音在第二音节；baseline 连读",
      chinese: "与其固定 MDF 比例，不如与绩效挂钩——2% 保底，每超季度目标 10% 再加 1%。",
    },
    businessTakeaway:
      "MDF 谈判的核心是'可追踪性'。代理商希望'先拿钱后做事'，你希望'先看到效果再给钱'。'pre-approved briefs + post-campaign reports' 是标准的风控机制，既给了支持又保留了控制权。",
    shadowingPractice: [
      "We're prepared to allocate five percent of first-year revenue as MDF — but we need pre-approved campaign briefs and post-campaign sell-through reports to unlock the next quarter's fund.",
      "Instead of a flat MDF percentage, let's tie it to performance — two percent baseline, plus one percent for every ten percent above the quarterly target.",
    ],
    glossaryItems: [
      { term: "MDF", fullForm: "Marketing Development Fund", meaning: "市场发展基金", exampleScene: "品牌方支持渠道推广的专项预算" },
      { term: "campaign brief", fullForm: "campaign brief", meaning: "营销活动简报", exampleScene: "MDF 审批的必要文件" },
      { term: "unlock", fullForm: "unlock the fund", meaning: "解锁资金", exampleScene: "条件满足后才释放预算" },
      { term: "baseline", fullForm: "baseline percentage", meaning: "保底比例", exampleScene: "绩效挂钩机制中的最低保障" },
    ],
  },
  {
    day: 19,
    title: "After-Sales & RMA Responsibility Allocation",
    category: "Speaking",
    sceneContext:
      "代理商销售的产品出现批量质量问题，终端消费者要求退货。代理商希望品牌方承担全部 RMA 成本，你认为应该按责任比例分摊。需要明确 SLA 中的责任边界。",
    audioUrl: "",
    targetExpression: {
      english: "We'll cover manufacturing defects one hundred percent — but for cosmetic damage from local handling, we propose a fifty-fifty split on the RMA cost.",
      phoneticAndLinking: "We'll-cov-er-man-u-fac-tur-ing / de-fects-one-hun-dred / per-cent-but-for / cos-me-tic-dam-age / from-lo-cal-han-dling / we-pro-pose-a / fif-ty-fif-ty-split / on-the-R-M-A-cost → manufacturing 重音在第三音节；cosmetic 重音在第二音节",
      chinese: "制造缺陷我们 100% 承担——但本地搬运造成的外观损伤，建议 RMA 成本五五分摊。",
    },
    alternativeExpression: {
      english: "Our SLA covers DOA units within forty-eight hours of delivery — anything beyond that falls under the distributor's local warranty program.",
      phoneticAndLinking: "Our-S-L-A-cov-ers / D-O-A-u-nits / with-in-for-ty-eight / hours-of-de-liv-ery / an-y-thing-be-yond / that-falls-un-der / the-dis-tri-bu-tor's / lo-cal-war-ran-ty / pro-gram → DOA = Dead on Arrival 逐字母；SLA 逐字母",
      chinese: "我们的 SLA 覆盖到货 48 小时内的 DOA 产品——超出部分属于经销商本地保修范围。",
    },
    businessTakeaway:
      "RMA 谈判的核心是'责任前置'。在合同中明确区分：manufacturing defect（品牌方 100%）、DOA（48 小时内品牌方负责）、local handling damage（经销商负责）。'fifty-fifty split' 是双方都能接受的中间地带，但必须在 SLA 中白纸黑字。",
    shadowingPractice: [
      "We'll cover manufacturing defects one hundred percent — but for cosmetic damage from local handling, we propose a fifty-fifty split on the RMA cost.",
      "Our SLA covers DOA units within forty-eight hours of delivery — anything beyond that falls under the distributor's local warranty program.",
    ],
    glossaryItems: [
      { term: "RMA", fullForm: "Return Merchandise Authorization", meaning: "退货授权", exampleScene: "售后处理的标准流程" },
      { term: "SLA", fullForm: "Service Level Agreement", meaning: "服务水平协议", exampleScene: "明确双方责任边界的法律文件" },
      { term: "DOA", fullForm: "Dead on Arrival", meaning: "到货即损", exampleScene: "3C 产品售后高频术语" },
      { term: "warranty", fullForm: "local warranty program", meaning: "本地保修计划", exampleScene: "经销商承担的售后服务范围" },
    ],
  },
  {
    day: 20,
    title: "3PL Logistics & Customs Clearance Delay Accountability",
    category: "Speaking",
    sceneContext:
      "一批价值 RM 80,000 的货物在巴生港清关延误了 5 天，导致代理商错过促销窗口。3PL 和清关代理互相推诿，你需要在会议中明确责任归属和赔偿机制。",
    audioUrl: "",
    targetExpression: {
      english: "The delay cost our distributor a key promotional window — per our SLA, port congestion falls under force majeure, but documentation errors are on the 3PL. Let's separate the two and settle accordingly.",
      phoneticAndLinking: "The-de-lay-cost / our-dis-tri-bu-tor / a-key-pro-mo-tion-al / win-dow-per-our / S-L-A-port-con-ges-tion / falls-un-der-force / ma-jeure-but-doc-u-men-ta-tion / er-rors-are-on / the-three-P-L / let's-sep-a-rate / the-two-and-set-tle / ac-cord-ing-ly → force majeure 法语词，读作 /fɔːrs mɑːˈʒɜːr/",
      chinese: "这次延误让我们的经销商错过了关键促销窗口——按 SLA，港口拥堵属不可抗力，但文件错误在 3PL。我们把两者分开，分别追责。",
    },
    alternativeExpression: {
      english: "I'm not pointing fingers — I need a root-cause analysis by Friday, and a credit note covering the demurrage charges before we process the next shipment.",
      phoneticAndLinking: "I'm-not-point-ing / fin-gers-I-need / a-root-cause-an-al-y-sis / by-Fri-day-and / a-cred-it-note / cov-er-ing-the / de-mur-rage-charg-es / be-fore-we-pro-cess / the-next-ship-ment → root-cause 连读；demurrage 重音在第二音节",
      chinese: "我不是在指责——我需要在周五前拿到根因分析，以及覆盖滞港费的信用票据，然后我们才安排下一批货。",
    },
    businessTakeaway:
      "物流追责的核心是'区分不可抗力与人为失误'。港口拥堵（force majeure）双方共担，但文件错误、申报延误是 3PL 或清关代理的责任。'root-cause analysis + credit note' 把情绪冲突转化为流程改进和财务补偿。",
    shadowingPractice: [
      "The delay cost our distributor a key promotional window — per our SLA, port congestion falls under force majeure, but documentation errors are on the 3PL. Let's separate the two and settle accordingly.",
      "I'm not pointing fingers — I need a root-cause analysis by Friday, and a credit note covering the demurrage charges before we process the next shipment.",
    ],
    glossaryItems: [
      { term: "3PL", fullForm: "Third-Party Logistics", meaning: "第三方物流", exampleScene: "跨境供应链的标准外包模式" },
      { term: "force majeure", fullForm: "force majeure", meaning: "不可抗力", exampleScene: "合同中的免责条款" },
      { term: "demurrage", fullForm: "demurrage charges", meaning: "滞港费 / 滞期费", exampleScene: "货物在港口超期产生的罚款" },
      { term: "credit note", fullForm: "credit note", meaning: "信用票据 / 抵扣凭证", exampleScene: "供应商赔偿买方的财务工具" },
    ],
  },
  {
    day: 21,
    title: "TikTok Shop MY / Shopee Influencer Commission Negotiation",
    category: "Speaking",
    sceneContext:
      "你通过 TikTok Shop 大马站联系了一位 50 万粉丝的本地达人，对方报价 RM 8,000/条视频 + 15% 佣金。你需要谈到一个符合预算且能追踪 ROI 的合作结构。",
    audioUrl: "",
    targetExpression: {
      english: "We love your content style — instead of a flat fee plus commission, what if we do a three-video package at six thousand total, with a twelve-percent commission on tracked sales above twenty thousand?",
      phoneticAndLinking: "We-love-your-con-tent / style-in-stead-of / a-flat-fee-plus / com-mis-sion-what-if / we-do-a-three-vid-eo / pack-age-at-six / thou-sand-to-tal / with-a-twelve-per-cent / com-mis-sion-on / tracked-sales-a-bove / twen-ty-thou-sand → content 作名词时重音在第一个音节",
      chinese: "我们很喜欢您的内容风格——与其固定费用加佣金，不如三条视频打包六千，销售额超两万的部分给 12% 追踪佣金？",
    },
    alternativeExpression: {
      english: "For a first collab, let's do one video at two-five with a unique discount code — if it hits your average view count, we scale to a monthly retainer.",
      phoneticAndLinking: "For-a-first-col-lab / let's-do-one-vid-eo / at-two-five-with-a / u-nique-dis-count-code / if-it-hits-your / av-er-age-view-count / we-scale-to-a / month-ly-re-tain-er → collab = collaboration 口语缩写；retainer 重音在第二音节",
      chinese: "首次合作，我们先做一条两千五的视频配专属折扣码——如果达到您的平均播放量，我们就升级为月度框架合作。",
    },
    businessTakeaway:
      "达人谈判的核心是'把固定成本转为可变成本'。'flat fee + commission' 对新品风险极高；'package deal + tracked commission' 让达人有动力卖货，你只为结果付费。'unique discount code' 是追踪 ROI 的唯一可靠方式。",
    shadowingPractice: [
      "We love your content style — instead of a flat fee plus commission, what if we do a three-video package at six thousand total, with a twelve-percent commission on tracked sales above twenty thousand?",
      "For a first collab, let's do one video at two-five with a unique discount code — if it hits your average view count, we scale to a monthly retainer.",
    ],
    glossaryItems: [
      { term: "collab", fullForm: "collaboration", meaning: "合作（口语缩写）", exampleScene: "与达人沟通时的自然用语" },
      { term: "retainer", fullForm: "monthly retainer", meaning: "月度框架合作费", exampleScene: "长期达人合作的标准模式" },
      { term: "tracked sales", fullForm: "tracked sales", meaning: "可追踪销售额", exampleScene: "通过专属链接或折扣码归因的销售额" },
      { term: "discount code", fullForm: "unique discount code", meaning: "专属折扣码", exampleScene: "追踪达人带货效果的核心工具" },
    ],
  },
  {
    day: 22,
    title: "Distributor KPI Review & Termination Clause Setup",
    category: "Speaking",
    sceneContext:
      "代理商连续两个季度未达标（目标 RM 200K/季度，实际 RM 120K），你需要启动绩效审查，并讨论是否触发淘汰条款。对话要专业、数据驱动，同时保留关系修复的空间。",
    audioUrl: "",
    targetExpression: {
      english: "The numbers show we're at sixty percent of target for two consecutive quarters — per our agreement, that triggers a review. Let's diagnose the gap before we decide on next steps.",
      phoneticAndLinking: "The-num-bers-show / we're-at-six-ty / per-cent-of-tar-get / for-two-con-sec-u-tive / quar-ters-per-our / a-gree-ment-that / trig-gers-a-re-view / let's-di-ag-nose / the-gap-be-fore / we-de-cide-on / next-steps → consecutive 重音在第二音节；diagnose 重音在第一个音节",
      chinese: "数据显示我们连续两个季度只达到目标的 60%——按协议，这触发了审查机制。我们先诊断差距，再决定下一步。",
    },
    alternativeExpression: {
      english: "I'm not here to terminate — I'm here to understand what support you need to get back on track. But if Q3 also misses, we'll have to invoke the termination clause.",
      phoneticAndLinking: "I'm-not-here-to / ter-mi-nate-I'm / here-to-un-der-stand / what-sup-port-you / need-to-get-back / on-track-but-if / Q-three-al-so-miss-es / we'll-have-to / in-voke-the-ter-mi-na-tion / clause → terminate 重音在第一个音节；invoke 重音在第二音节",
      chinese: "我不是来终止合作的——我是来了解你需要什么支持才能重回正轨。但如果 Q3 也 miss，我们将不得不启动淘汰条款。",
    },
    businessTakeaway:
      "绩效审查的核心是'数据驱动 + 保留颜面'。'diagnose the gap' 把对抗变成共同解决问题；'invoke the termination clause' 用合同语言而非个人情绪表达后果。中方企业常因人情而拖延淘汰，这恰恰损害了整个渠道网络的信心。",
    shadowingPractice: [
      "The numbers show we're at sixty percent of target for two consecutive quarters — per our agreement, that triggers a review. Let's diagnose the gap before we decide on next steps.",
      "I'm not here to terminate — I'm here to understand what support you need to get back on track. But if Q3 also misses, we'll have to invoke the termination clause.",
    ],
    glossaryItems: [
      { term: "consecutive", fullForm: "consecutive quarters", meaning: "连续季度", exampleScene: "绩效评估的时间维度" },
      { term: "trigger", fullForm: "trigger a review", meaning: "触发审查机制", exampleScene: "合同条款中的自动启动条件" },
      { term: "terminate", fullForm: "terminate the agreement", meaning: "终止协议", exampleScene: "渠道管理中的最后手段" },
      { term: "invoke", fullForm: "invoke the clause", meaning: "启动条款", exampleScene: "正式启用合同中的惩罚机制" },
    ],
  },
  {
    day: 23,
    title: "Negotiating Integrated Marketing Plans with Local Agencies",
    category: "Speaking",
    sceneContext:
      "你与大马本地 Marketing Agency 洽谈 Q1 整合营销方案，对方报价 RM 120,000 覆盖 social + KOL + offline activation。你需要把方案拆成可量化的阶段，并绑定 ROI 指标。",
    audioUrl: "",
    targetExpression: {
      english: "The one-twenty package is comprehensive — but we need it broken into three phases with clear KPI gates. Phase one is social-only at forty K, and we unlock phase two only if we hit a three-x ROAS.",
      phoneticAndLinking: "The-one-twen-ty-pack-age / is-com-pre-hen-sive / but-we-need-it / bro-ken-in-to / three-phas-es-with / clear-K-P-I-gates / phase-one-is-so-cial / on-ly-at-for-ty-K / and-we-un-lock / phase-two-on-ly-if / we-hit-a-three-x / R-O-A-S → comprehensive 重音在第三音节；ROAS 逐字母",
      chinese: "十二万的方案很全面——但我们需要拆成三个阶段，每个阶段有明确的 KPI 门槛。第一阶段只做社交媒体，四万预算，只有达到 3 倍 ROAS 才解锁第二阶段。",
    },
    alternativeExpression: {
      english: "Instead of a retainer, let's do a pilot campaign at thirty K with a performance bonus — ten percent extra if you beat the engagement benchmark by twenty percent.",
      phoneticAndLinking: "In-stead-of-a-re-tain-er / let's-do-a-pi-lot / cam-paign-at-thir-ty-K / with-a-per-form-ance / bo-nus-ten-per-cent / ex-tra-if-you-beat / the-en-gage-ment / bench-mark-by-twen-ty / per-cent → benchmark 重音在第一个音节；engagement 重音在第二音节",
      chinese: "不做月度框架，我们先做三万试点 campaign 加绩效奖金——如果互动率超基准 20%，额外给 10%。",
    },
    businessTakeaway:
      " Agency 谈判的核心是'把大包拆成小步快跑'。'three phases with KPI gates' 让你在每个阶段都有退出权；'performance bonus' 把 Agency 的利益与你的 ROI 绑定。永远不要签没有退出条款的年度框架。",
    shadowingPractice: [
      "The one-twenty package is comprehensive — but we need it broken into three phases with clear KPI gates. Phase one is social-only at forty K, and we unlock phase two only if we hit a three-x ROAS.",
      "Instead of a retainer, let's do a pilot campaign at thirty K with a performance bonus — ten percent extra if you beat the engagement benchmark by twenty percent.",
    ],
    glossaryItems: [
      { term: "ROAS", fullForm: "Return on Ad Spend", meaning: "广告支出回报率", exampleScene: "效果营销的核心 KPI" },
      { term: "KPI gates", fullForm: "KPI gates", meaning: "KPI 门槛", exampleScene: "分阶段解锁预算的条件" },
      { term: "benchmark", fullForm: "engagement benchmark", meaning: "互动率基准", exampleScene: "评估 campaign 表现的参考值" },
      { term: "activation", fullForm: "offline activation", meaning: "线下活动 / 地推", exampleScene: "大马市场的重要触达方式" },
    ],
  },
  {
    day: 24,
    title: "JAKIM Halal Certification Process Clarification",
    category: "Speaking",
    sceneContext:
      "你的产品需要 JAKIM 清真认证才能进入马来主流渠道。认证代理告诉你需要 3-6 个月，但流程中有多个模糊环节。你需要逐项澄清，确保没有遗漏导致延误。",
    audioUrl: "",
    targetExpression: {
      english: "To make sure we don't hit any delays — can you walk me through the exact sequence from ingredient audit to the final JAKIM panel review, and flag any steps where foreign manufacturers typically get stuck?",
      phoneticAndLinking: "To-make-sure-we / don't-hit-an-y / de-lays-can-you / walk-me-through / the-ex-act-se-quence / from-in-gre-di-ent / au-dit-to-the / fi-nal-J-A-K-I-M / pan-el-re-view / and-flag-an-y / steps-where-for-eign / man-u-fac-tur-ers / typ-i-cal-ly-get-stuck → JAKIM 逐字母；typically 重音在第一个音节",
      chinese: "为了确保不延误——您能带我走一遍从原料审核到 JAKIM 终审的完整流程吗？并指出外国厂商通常卡在哪一步？",
    },
    alternativeExpression: {
      english: "I've read the JAKIM guidelines cover to cover — what I need from you is the practical timeline, including how long each sub-committee review actually takes, not the official estimate.",
      phoneticAndLinking: "I've-read-the-J-A-K-I-M / guide-lines-cov-er / to-cov-er-what-I / need-from-you / is-the-prac-ti-cal / time-line-in-clud-ing / how-long-each / sub-com-mit-tee / re-view-ac-tu-al-ly / takes-not-the / of-fi-cial-es-ti-mate → cover to cover 连读；practical 重音在第一个音节",
      chinese: "JAKIM 指南我通读了一遍——我需要您给的是实际时间线，包括每个小组委员会实际要审多久，而不是官方估计。",
    },
    businessTakeaway:
      "JAKIM 认证的核心是'流程透明化'。官方说 3-6 个月，但实际延误往往发生在原料来源证明和工厂审核环节。'walk me through the exact sequence' 和 'flag where foreign manufacturers get stuck' 是获取内部经验的最佳问法。",
    shadowingPractice: [
      "To make sure we don't hit any delays — can you walk me through the exact sequence from ingredient audit to the final JAKIM panel review, and flag any steps where foreign manufacturers typically get stuck?",
      "I've read the JAKIM guidelines cover to cover — what I need from you is the practical timeline, including how long each sub-committee review actually takes, not the official estimate.",
    ],
    glossaryItems: [
      { term: "JAKIM", fullForm: "Jabatan Kemajuan Islam Malaysia", meaning: "马来西亚伊斯兰发展局", exampleScene: "大马清真认证的唯一官方机构" },
      { term: "ingredient audit", fullForm: "ingredient audit", meaning: "原料审核", exampleScene: "清真认证的第一道关卡" },
      { term: "panel review", fullForm: "JAKIM panel review", meaning: "JAKIM 终审委员会", exampleScene: "认证流程的最后决策环节" },
      { term: "sub-committee", fullForm: "sub-committee review", meaning: "小组委员会审查", exampleScene: "认证流程中的中间环节" },
    ],
  },
  {
    day: 25,
    title: "SIRIM / KKM / NPRA Compliance Filing Progress",
    category: "Speaking",
    sceneContext:
      "你的产品需要同时推进 SIRIM（产品安全）、KKM（卫生部）和 NPRA（药品监管）三项备案。合规代理给了你一个 8 周的时间表，但第 4 周没有任何进展更新。你需要主动推进并问责。",
    audioUrl: "",
    targetExpression: {
      english: "We're at week four of an eight-week timeline with zero milestone updates — I need a status report by EOD today, and a revised critical path if any filing has hit a bottleneck.",
      phoneticAndLinking: "We're-at-week-four / of-an-eight-week / time-line-with-ze-ro / mile-stone-up-dates / I-need-a-stat-us / re-port-by-E-O-D / to-day-and-a-re-vised / crit-i-cal-path / if-an-y-fil-ing / has-hit-a-bot-tle-neck → critical path 连读；bottleneck 重音在第一个音节",
      chinese: "八周时间表已到第四周，零里程碑更新——我需要今天下班前拿到进度报告，如果有任何备案卡壳，需要修订关键路径。",
    },
    alternativeExpression: {
      english: "I'm not chasing — I'm managing risk. If SIRIM is delayed, I need to know now so I can adjust our KKM and NPRA submissions in parallel, not in sequence.",
      phoneticAndLinking: "I'm-not-chas-ing / I'm-man-ag-ing-risk / if-S-I-R-I-M / is-de-layed-I-need / to-know-now-so / I-can-ad-just / our-K-K-M-and / N-P-R-A-sub-mis-sions / in-par-al-lel / not-in-se-quence → SIRIM/KKM/NPRA 均逐字母；parallel 重音在第一个音节",
      chinese: "我不是在催——我是在管理风险。如果 SIRIM 延误，我现在就需要知道，这样我可以并行调整 KKM 和 NPRA 的提交，而不是串行等待。",
    },
    businessTakeaway:
      "合规推进的核心是'并行管理 + 关键路径'。三项备案如果串行，总时间可能超过 12 周；如果并行，可以压缩到 6-8 周。'managing risk, not chasing' 把问责包装成专业协作，对方更容易接受。",
    shadowingPractice: [
      "We're at week four of an eight-week timeline with zero milestone updates — I need a status report by EOD today, and a revised critical path if any filing has hit a bottleneck.",
      "I'm not chasing — I'm managing risk. If SIRIM is delayed, I need to know now so I can adjust our KKM and NPRA submissions in parallel, not in sequence.",
    ],
    glossaryItems: [
      { term: "SIRIM", fullForm: "SIRIM Berhad", meaning: "大马标准与工业研究院", exampleScene: "产品安全与质量认证机构" },
      { term: "KKM", fullForm: "Kementerian Kesihatan Malaysia", meaning: "马来西亚卫生部", exampleScene: "食品/化妆品/保健品监管机构" },
      { term: "NPRA", fullForm: "National Pharmaceutical Regulatory Agency", meaning: "国家药品监管局", exampleScene: "药品与医疗器械监管机构" },
      { term: "critical path", fullForm: "critical path", meaning: "关键路径", exampleScene: "项目管理中最长的依赖链" },
    ],
  },
  {
    day: 26,
    title: "LVG Tax & Cross-Border Duty Compliance Communication",
    category: "Speaking",
    sceneContext:
      "大马自 2024 年起对低价值进口商品（LVG）征收 10% 销售税，你的跨境电商客户对此困惑，担心影响定价竞争力。你需要清晰解释政策影响并提供合规方案。",
    audioUrl: "",
    targetExpression: {
      english: "The ten-percent LVG tax applies to all imports under five hundred ringgit — but since our average order value is two-twenty, we can absorb it and market 'tax-inclusive pricing' as a competitive advantage.",
      phoneticAndLinking: "The-ten-per-cent / L-V-G-tax-ap-plies / to-all-im-ports / un-der-five-hun-dred / ring-git-but-since / our-av-er-age-or-der / val-ue-is-two-twen-ty / we-can-ab-sorb-it / and-mar-ket-tax-in-clu-sive / pric-ing-as-a-com-pet-i-tive / ad-van-tage → LVG 逐字母；absorb 重音在第二音节",
      chinese: "10% 的 LVG 税适用于所有 500 令吉以下的进口商品——但我们的平均客单价是 220，我们可以自行消化，并把'含税价'作为竞争优势来营销。",
    },
    alternativeExpression: {
      english: "Instead of raising prices, let's restructure as a local entity — the LVG only applies to cross-border shipments, so a Malaysian fulfillment hub eliminates the tax entirely.",
      phoneticAndLinking: "In-stead-of-rais-ing / pric-es-let's-re-struc-ture / as-a-lo-cal-en-ti-ty / the-L-V-G-on-ly / ap-plies-to-cross-bor-der / ship-ments-so-a / Ma-lay-sian-ful-fill-ment / hub-e-lim-i-nates / the-tax-en-tire-ly → restructure 重音在第二音节；eliminates 重音在第二音节",
      chinese: "与其涨价，不如注册本地实体——LVG 只适用于跨境直邮，大马本地仓发货就完全免税。",
    },
    businessTakeaway:
      "LVG 税的核心是'转劣为优'。10% 的税对所有跨境卖家一视同仁，谁先解决谁就获得定价优势。'tax-inclusive pricing' 和 'local fulfillment hub' 是两个标准解法，前者短期，后者长期。",
    shadowingPractice: [
      "The ten-percent LVG tax applies to all imports under five hundred ringgit — but since our average order value is two-twenty, we can absorb it and market 'tax-inclusive pricing' as a competitive advantage.",
      "Instead of raising prices, let's restructure as a local entity — the LVG only applies to cross-border shipments, so a Malaysian fulfillment hub eliminates the tax entirely.",
    ],
    glossaryItems: [
      { term: "LVG", fullForm: "Low-Value Goods", meaning: "低价值商品", exampleScene: "大马 2024 年起新增的跨境电商税种" },
      { term: "ringgit", fullForm: "Malaysian Ringgit (MYR)", meaning: "马来西亚令吉", exampleScene: "大马法定货币" },
      { term: "fulfillment hub", fullForm: "fulfillment hub", meaning: "履约中心 / 本地仓", exampleScene: "规避跨境税的物流基础设施" },
      { term: "AOV", fullForm: "Average Order Value", meaning: "平均客单价", exampleScene: "电商运营的核心财务指标" },
    ],
  },
  {
    day: 27,
    title: "Cultural PR Mitigation: Addressing Religious & Cultural Sensitivities",
    category: "Speaking",
    sceneContext:
      "你的广告素材中出现了马来文化中的敏感元素（如不恰当的服饰或手势），本地社交媒体出现负面舆情。你需要在 24 小时内发布一份既真诚道歉又展示文化尊重的声明。",
    audioUrl: "",
    targetExpression: {
      english: "We sincerely apologize for the oversight — the visual in question did not reflect our respect for Malaysian cultural values. We've removed it immediately and are conducting a full cultural review of all campaign assets.",
      phoneticAndLinking: "We-sin-cere-ly-a-pol-o-gize / for-the-o-ver-sight / the-vis-u-al-in-ques-tion / did-not-re-flect / our-re-spect-for / Ma-lay-sian-cul-tur-al / val-ues-we've-re-moved / it-im-me-di-ate-ly / and-are-con-duct-ing / a-full-cul-tur-al / re-view-of-all / cam-paign-as-sets → oversight 重音在第一个音节；immediately 重音在第二音节",
      chinese: "我们真诚地为这一疏忽道歉——涉事视觉素材未能体现我们对大马文化价值观的尊重。我们已立即移除，并正在对所有 campaign 素材进行全面文化审查。",
    },
    alternativeExpression: {
      english: "We hear you, and we're sorry. This was never our intention — we're pausing all ads, bringing in a local cultural consultant, and will share our updated review process publicly.",
      phoneticAndLinking: "We-hear-you-and / we're-sor-ry-this / was-nev-er-our / in-ten-tion-we're / paus-ing-all-ads / bring-ing-in-a / lo-cal-cul-tur-al / con-sul-tant-and / will-share-our / up-dat-ed-re-view / pro-cess-pub-lic-ly → intention 重音在第二音节；publicly 重音在第一个音节",
      chinese: "我们听到了，也很抱歉。这绝非我们的本意——我们正在暂停所有广告，聘请本地文化顾问，并将公开我们的更新审查流程。",
    },
    businessTakeaway:
      "文化危机的核心是'速度 + 真诚 + 行动'。'We hear you' 比 'We apologize for any offense' 更有温度；'pausing all ads + cultural consultant' 展示的是行动而非空洞承诺。大马多元文化环境中，一次文化失误可能终结一个品牌。",
    shadowingPractice: [
      "We sincerely apologize for the oversight — the visual in question did not reflect our respect for Malaysian cultural values. We've removed it immediately and are conducting a full cultural review of all campaign assets.",
      "We hear you, and we're sorry. This was never our intention — we're pausing all ads, bringing in a local cultural consultant, and will share our updated review process publicly.",
    ],
    glossaryItems: [
      { term: "oversight", fullForm: "oversight", meaning: "疏忽 / 监督失误", exampleScene: "危机公关中的标准致歉用语" },
      { term: "campaign assets", fullForm: "campaign assets", meaning: "营销活动素材", exampleScene: "广告图片/视频/文案的总称" },
      { term: "cultural consultant", fullForm: "cultural consultant", meaning: "文化顾问", exampleScene: "跨文化营销中的专业第三方" },
      { term: "review process", fullForm: "review process", meaning: "审查流程", exampleScene: "预防文化风险的内部机制" },
    ],
  },
  {
    day: 28,
    title: "Product Recall & Quality Dispute Public Statement",
    category: "Speaking",
    sceneContext:
      "一批次产品被检测出某项指标超标，虽未造成健康危害，但已触发 KKM 通报。你需要在媒体问询和消费者恐慌之间，发布一份专业、透明、有行动方案的公开声明。",
    audioUrl: "",
    targetExpression: {
      english: "Out of an abundance of caution, we're voluntarily recalling batch two-four-zero-eight — independent lab tests confirm the issue is isolated, and replacement units are already en route to all affected retailers.",
      phoneticAndLinking: "Out-of-an-a-bun-dance / of-cau-tion-we're / vol-un-tar-i-ly / re-call-ing-batch / two-four-ze-ro-eight / in-de-pen-dent-lab / tests-con-firm / the-is-sue-is-i-so-lat-ed / and-re-place-ment / u-nits-are-al-read-y / en-route-to-all / af-fect-ed-re-tail-ers → abundance 重音在第二音节；voluntarily 重音在第一个音节",
      chinese: "出于高度谨慎，我们主动召回 2408 批次——独立实验室检测确认问题仅限该批次，替换产品已在发往所有受影响零售商的途中。",
    },
    alternativeExpression: {
      english: "We take full responsibility — no excuses. Here's what happened, what we're doing about it, and how we'll prevent it from happening again. Full transparency, starting now.",
      phoneticAndLinking: "We-take-full-re-spon-si-bil-i-ty / no-ex-cus-es / here's-what-hap-pened / what-we're-do-ing / a-bout-it-and-how / we'll-pre-vent-it / from-hap-pen-ing / a-gain-full-trans-par-en-cy / start-ing-now → responsibility 重音在第三音节；transparency 重音在第二音节",
      chinese: "我们承担全部责任——不找借口。以下是事情经过、我们的应对措施、以及如何预防再次发生。从现在开始，完全透明。",
    },
    businessTakeaway:
      "产品召回声明的核心是'主动 + 透明 + 行动'。'Out of an abundance of caution' 是国际标准召回开场白，既展示责任感又不承认重大过失；'isolated + replacement en route' 控制恐慌情绪。记住：隐瞒的代价永远大于召回的成本。",
    shadowingPractice: [
      "Out of an abundance of caution, we're voluntarily recalling batch two-four-zero-eight — independent lab tests confirm the issue is isolated, and replacement units are already en route to all affected retailers.",
      "We take full responsibility — no excuses. Here's what happened, what we're doing about it, and how we'll prevent it from happening again. Full transparency, starting now.",
    ],
    glossaryItems: [
      { term: "recall", fullForm: "product recall", meaning: "产品召回", exampleScene: "质量危机中的标准应对机制" },
      { term: "batch", fullForm: "production batch", meaning: "生产批次", exampleScene: "精准定位问题范围的关键信息" },
      { term: "en route", fullForm: "en route", meaning: "在途中", exampleScene: "物流状态的标准表达" },
      { term: "transparency", fullForm: "full transparency", meaning: "完全透明", exampleScene: "危机公关中的信任重建策略" },
    ],
  },
  {
    day: 29,
    title: "Compliance Defense Against Malicious Competitor Reports",
    category: "Speaking",
    sceneContext:
      "竞争对手向 KKM 恶意举报你的产品标签不合规，导致产品被临时下架。你需要与律师和合规团队开会，准备一份既强硬又专业的抗辩声明，同时防止事态升级为公关危机。",
    audioUrl: "",
    targetExpression: {
      english: "We've reviewed the complaint point by point — every claim is factually incorrect, and our NPRA registration and SIRIM test reports are publicly verifiable. We're requesting an expedited review to minimize market disruption.",
      phoneticAndLinking: "We've-re-viewed-the / com-plaint-point-by-point / ev-ery-claim-is / fac-tu-al-ly-in-cor-rect / and-our-N-P-R-A / reg-is-tra-tion-and / S-I-R-I-M-test-re-ports / are-pub-lic-ly-ver-i-fi-a-ble / we're-re-quest-ing / an-ex-pe-dit-ed / re-view-to-min-i-mize / mar-ket-dis-rup-tion → factually 重音在第一个音节；expedited 重音在第二音节",
      chinese: "我们逐点审查了投诉——每一项指控都与事实不符，我们的 NPRA 注册和 SIRIM 检测报告均可公开验证。我们正在申请加急审查，以最大限度减少市场干扰。",
    },
    alternativeExpression: {
      english: "This appears to be a coordinated smear campaign — we have documented evidence of the same complainant targeting three other foreign brands in the past six months. We're escalating to the Ministry's integrity unit.",
      phoneticAndLinking: "This-ap-pears-to-be / a-co-or-di-nat-ed / smear-cam-paign / we-have-doc-u-men-ted / ev-i-dence-of-the / same-com-plain-ant / tar-get-ing-three / oth-er-for-eign-brands / in-the-past-six / months-we're-es-ca-lat-ing / to-the-Min-is-try's / in-teg-ri-ty-u-nit → coordinated 重音在第二音节；escalating 重音在第一个音节",
      chinese: "这似乎是一场有组织的抹黑行动——我们有书面证据显示同一投诉人在过去六个月内还针对了另外三个外国品牌。我们正在向卫生部廉政部门上报。",
    },
    businessTakeaway:
      "应对恶意举报的核心是'事实 + 证据 + 升级'。'point by point' 展示专业态度；'publicly verifiable' 用可验证的事实反驳；'escalating to the integrity unit' 把商业纠纷转化为监管机构的公信力问题。同时准备 PR 预案，防止媒体提前曝光。",
    shadowingPractice: [
      "We've reviewed the complaint point by point — every claim is factually incorrect, and our NPRA registration and SIRIM test reports are publicly verifiable. We're requesting an expedited review to minimize market disruption.",
      "This appears to be a coordinated smear campaign — we have documented evidence of the same complainant targeting three other foreign brands in the past six months. We're escalating to the Ministry's integrity unit.",
    ],
    glossaryItems: [
      { term: "complaint", fullForm: "formal complaint", meaning: "正式投诉", exampleScene: "竞争对手攻击的常见手段" },
      { term: "verifiable", fullForm: "publicly verifiable", meaning: "可公开验证的", exampleScene: "反驳不实指控的关键证据属性" },
      { term: "expedited", fullForm: "expedited review", meaning: "加急审查", exampleScene: "减少市场损失的时间敏感请求" },
      { term: "smear campaign", fullForm: "smear campaign", meaning: "抹黑行动", exampleScene: "有组织的不正当竞争行为" },
    ],
  },
  {
    day: 30,
    title: "Strategic GTM Report to Board / Investors",
    category: "Speaking",
    sceneContext:
      "你需要向董事会或投资人做大马市场 GTM 出海战略汇报，涵盖市场机会、竞争格局、渠道策略、财务预测和风险控制。汇报要有数据支撑，同时展现战略深度和执行信心。",
    audioUrl: "",
    targetExpression: {
      english: "Malaysia is our beachhead for Southeast Asia — thirty-three million affluent consumers, a regulatory gateway to halal markets, and a logistics hub that cuts our regional shipping costs by forty percent. We're asking for two million to capture first-mover advantage in the RM 1.2 billion halal skincare segment.",
      phoneticAndLinking: "Ma-lay-sia-is-our / beach-head-for / South-east-A-sia / thir-ty-three-mil-lion / af-flu-ent-con-sum-ers / a-reg-u-la-tor-y / gate-way-to-ha-lal / mar-kets-and-a / lo-gis-tics-hub / that-cuts-our / re-gion-al-ship-ping / costs-by-for-ty / per-cent-we're-ask-ing / for-two-mil-lion / to-cap-ture-first-mov-er / ad-van-tage-in-the / R-M-one-point-two / bil-lion-ha-lal / skin-care-seg-ment → beachhead 重音在第一个音节；affluent 重音在第一个音节",
      chinese: "大马是我们进军东南亚的桥头堡——3300 万高消费力人口、通往清真市场的监管门户、以及能降低我们区域物流成本 40% 的枢纽。我们申请 200 万资金，以抢占 12 亿令吉清真护肤品类的先发优势。",
    },
    alternativeExpression: {
      english: "The risk-reward here is asymmetric — our downside is capped at the pilot budget, but the upside is a replicable playbook for Indonesia, Brunei, and the broader OIC market. That's a ten-x return on a two-million bet.",
      phoneticAndLinking: "The-risk-re-ward / here-is-a-sym-met-ric / our-down-side-is / capped-at-the / pi-lot-bud-get / but-the-up-side / is-a-rep-li-ca-ble / play-book-for / In-do-ne-sia-Bru-nei / and-the-broad-er / O-I-C-mar-ket / that's-a-ten-x / re-turn-on-a / two-mil-lion-bet → asymmetric 重音在第三音节；replicable 重音在第一个音节",
      chinese: "这里的风险回报是不对称的——我们的下行风险封顶在试点预算，但上行空间是一套可复制到印尼、文莱和更广泛 OIC 市场的打法。这是 200 万博 10 倍回报。",
    },
    businessTakeaway:
      "董事会汇报的核心是'战略高度 + 数据精度 + 风险可控'。'beachhead' 和 'gateway' 展示战略思维；'RM 1.2 billion segment' 和 'forty percent cost cut' 提供数据支撑；'asymmetric risk-reward' 和 'capped downside' 回应投资风险。结尾必须有明确的资金用途和里程碑。",
    shadowingPractice: [
      "Malaysia is our beachhead for Southeast Asia — thirty-three million affluent consumers, a regulatory gateway to halal markets, and a logistics hub that cuts our regional shipping costs by forty percent. We're asking for two million to capture first-mover advantage in the RM 1.2 billion halal skincare segment.",
      "The risk-reward here is asymmetric — our downside is capped at the pilot budget, but the upside is a replicable playbook for Indonesia, Brunei, and the broader OIC market. That's a ten-x return on a two-million bet.",
    ],
    glossaryItems: [
      { term: "beachhead", fullForm: "beachhead market", meaning: "桥头堡市场", exampleScene: "战略进入新区域的首个立足点" },
      { term: "GTM", fullForm: "Go-to-Market", meaning: "市场进入策略", exampleScene: "产品从0到1的商业化路径" },
      { term: "OIC", fullForm: "Organisation of Islamic Cooperation", meaning: "伊斯兰合作组织", exampleScene: "清真产品的全球性市场网络" },
      { term: "first-mover", fullForm: "first-mover advantage", meaning: "先发优势", exampleScene: "抢占市场空白期的战略价值" },
    ],
  },
];

// 聚合 Day 1-90 完整课程
ENGLISH_LESSONS.push(
  ...ENGLISH_LESSONS_31_50,
  ...ENGLISH_LESSONS_51_70,
  ...ENGLISH_LESSONS_71_90
);

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
