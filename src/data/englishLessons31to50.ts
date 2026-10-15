// 跨境商务英文特训 Day 31-50 —— 高级商业博弈与财法合规
import type { EnglishLesson } from "./englishLessons";

export const ENGLISH_LESSONS_31_50: EnglishLesson[] = [
  {
    day: 31,
    title: "Capping Liquidated Damages Before They Cap You",
    category: "Speaking",
    sceneContext:
      "KL 客户发来的采购合同里写着延迟交货每天罚合同额 2%、无上限，一批 RM 800,000 的货延三周就能把你利润罚光。你接受违约责任，但必须把费率和上限压回市场惯例。",
    audioUrl: "",
    targetExpression: {
      english: "We'll stand behind our delivery dates — but two percent a day with no cap is a penalty, not compensation. Half a percent per day, capped at ten percent of the contract value, is the market standard.",
      phoneticAndLinking: "We'll-stand-behind / our-de-liv-er-y-dates / but-two-per-cent-a-day / with-no-cap / is-a-pe-nal-ty / not-com-pen-sa-tion / half-a-per-cent / per-day / capped-at-ten-per-cent / of-the-con-tract-val-ue / is-the-mar-ket-stand-ard → penalty 重音在第一音节；capped-at 连读，cap 的 p 失爆",
      chinese: "我们愿意为交期负责——但每天 2% 无上限是惩罚，不是赔偿。每天 0.5%、上限为合同额 10%，这才是市场标准。",
    },
    alternativeExpression: {
      english: "Happy to pay liquidated damages if we genuinely delay — but the clause has to be a genuine pre-estimate of your loss, or it's unenforceable anyway. Let's fix it at ten percent of the delayed shipment's value.",
      phoneticAndLinking: "Hap-py-to-pay / li-qui-da-ted-dam-a-ges / if-we-gen-uine-ly-de-lay / but-the-clause-has-to-be / a-gen-uine-pre-es-ti-mate / of-your-loss / or-it's-un-en-force-a-ble / an-y-way / let's-fix-it / at-ten-per-cent / of-the-de-layed-ship-ment's-val-ue → liquidated 重音在第一音节；unenforceable 重音在 -force-",
      chinese: "真延误了我们乐意赔——但条款必须是对你损失的合理预估，否则本身就不可执行。就定为延迟货值的 10%。",
    },
    businessTakeaway:
      "违约金谈判的核心是把'惩罚'还原成'赔偿'。马来西亚合同法承袭普通法，penalty clause 本身可被判无效——这是你压价的法律底气。先认责、再砍费率、最后锁上限，三步缺一不可。无上限的 LD 条款签了就等于给对方一张空白支票。",
    shadowingPractice: [
      "We'll stand behind our delivery dates — but two percent a day with no cap is a penalty, not compensation. Half a percent per day, capped at ten percent of the contract value, is the market standard.",
      "Happy to pay liquidated damages if we genuinely delay — but the clause has to be a genuine pre-estimate of your loss, or it's unenforceable anyway. Let's fix it at ten percent of the delayed shipment's value.",
    ],
    glossaryItems: [
      { term: "LD", fullForm: "liquidated damages", meaning: "违约金（预定损害赔偿）", exampleScene: "合同谈判中必须封顶的第一条款" },
      { term: "cap", fullForm: "liability cap", meaning: "赔偿上限", exampleScene: "锁定总赔付不超过合同额的 10-20%" },
      { term: "penalty clause", fullForm: "penalty clause", meaning: "惩罚性条款", exampleScene: "普通法下可被法院判无效" },
      { term: "pre-estimate", fullForm: "genuine pre-estimate of loss", meaning: "损失的合理预估", exampleScene: "证明 LD 合法性的法律标准" },
    ],
  },
  {
    day: 32,
    title: "Stress-Testing a Force Majeure Claim from Your Supplier",
    category: "Listening",
    sceneContext:
      "槟城供应商来电，长篇大论援引不可抗力条款：洪水淹了厂房、政府封路、原料断供，要求免责延期 60 天。你必须从他的话里听出三样东西：有没有正式通知、影响的是哪几张 PO、有没有补救方案。",
    audioUrl: "",
    targetExpression: {
      english: "I hear the flood photos — but a force majeure claim needs the official notice within seven days, the affected PO numbers, and your mitigation plan. Send those three, then we'll talk revised dates.",
      phoneticAndLinking: "I-hear-the-flood-pho-tos / but-a-force-ma-jeure-claim / needs-the-of-fi-cial-no-tice / with-in-sev-en-days / the-af-fect-ed-P-O-num-bers / and-your-mi-ti-ga-tion-plan / send-those-three / then-we'll-talk / re-vised-dates → force majeure 读 /ˌfɔːrs mɑːˈʒɜːr/；affected 重音在第二音节",
      chinese: "洪水照片我看到了——但主张不可抗力需要七天内正式通知、受影响的 PO 编号、以及你们的补救方案。这三样发过来，我们再谈新交期。",
    },
    alternativeExpression: {
      english: "Force majeure covers the flood itself, not the stockout you were already sitting on — show me which delays started on which date, and we'll separate what's excusable from what isn't.",
      phoneticAndLinking: "Force-ma-jeure-cov-ers / the-flood-it-self / not-the-stock-out / you-were-al-read-y / sit-ting-on / show-me-which-de-lays / start-ed-on-which-date / and-we'll-sep-a-rate / what's-ex-cus-a-ble / from-what-is-n't → stockout 连读成 /ˈstɒkaʊt/；excusable 重音在第二音节",
      chinese: "不可抗力只覆盖洪水本身，不覆盖你早就存在的缺货——给我看哪些延误从哪天开始，咱们把可免责的和不可免责的分开。",
    },
    businessTakeaway:
      "东南亚雨季年年有，不可抗力是供应商最爱滥用的挡箭牌。听的时候抓三个硬指标：通知时限（合同一般写 7 天内）、因果范围（只覆盖直接受影响的订单）、减损义务（对方必须证明尽力补救）。听不全就别松口，一句 'send those three' 把举证责任踢回去。",
    shadowingPractice: [
      "I hear the flood photos — but a force majeure claim needs the official notice within seven days, the affected PO numbers, and your mitigation plan. Send those three, then we'll talk revised dates.",
      "Force majeure covers the flood itself, not the stockout you were already sitting on — show me which delays started on which date, and we'll separate what's excusable from what isn't.",
    ],
    glossaryItems: [
      { term: "FM", fullForm: "force majeure", meaning: "不可抗力", exampleScene: "洪水、疫情、政府禁令下的免责条款" },
      { term: "mitigation", fullForm: "duty to mitigate", meaning: "减损义务", exampleScene: "对方必须证明已尽力减少损失" },
      { term: "notice period", fullForm: "written notice period", meaning: "书面通知期限", exampleScene: "逾期通知即丧失援引资格" },
      { term: "stockout", fullForm: "stockout / out of stock", meaning: "缺货断供", exampleScene: "区分 FM 与自身库存管理不善的关键" },
    ],
  },
  {
    day: 33,
    title: "Moving the Battlefield: Arbitration Seat and Governing Law",
    category: "Speaking",
    sceneContext:
      "与雅加达伙伴的合资协议谈到最后一条：对方坚持争议由印尼法院管辖、适用印尼法。你在印尼法院毫无胜算，必须把战场拉到中立地——新加坡 SIAC 或吉隆坡 AIAC 仲裁。",
    audioUrl: "",
    targetExpression: {
      english: "Neither of our home courts is neutral ground — let's seat the arbitration at SIAC in Singapore, under Singapore law, one arbitrator, English language. That's a clause both our lawyers can live with.",
      phoneticAndLinking: "Nei-ther-of-our / home-courts-is / neu-tral-ground / let's-seat-the-ar-bi-tra-tion / at-S-I-A-C / in-Sin-ga-pore / un-der-Sin-ga-pore-law / one-ar-bi-tra-tor / Eng-lish-lang-uage / that's-a-clause / both-our-law-yers / can-live-with → arbitration 重音在 -tra-；neutral 重音在第一音节",
      chinese: "咱俩谁的本国法院都不是中立地——就把仲裁地定在新加坡 SIAC，适用新加坡法，一名仲裁员，英文进行。这条双方律师都能接受。",
    },
    alternativeExpression: {
      english: "If Jakarta courts are non-negotiable for you, then AIAC in Kuala Lumpur works for us — but litigation in either of our home jurisdictions is off the table, because neither of us would ever sign that.",
      phoneticAndLinking: "If-Ja-kar-ta-courts / are-non-ne-go-tia-ble / for-you / then-A-I-A-C / in-Kua-la-Lum-pur / works-for-us / but-lit-i-ga-tion / in-ei-ther-of-our / home-ju-ris-dic-tions / is-off-the-ta-ble / be-cause-nei-ther-of-us / would-ev-er-sign-that → non-negotiable 重音在 -go-；jurisdiction 重音在 -dic-",
      chinese: "如果雅加达法院你绝不退让，那吉隆坡 AIAC 我们能接受——但在任何一方本国诉讼都免谈，因为那种条款谁都不会签。",
    },
    businessTakeaway:
      "争议解决条款是'平时没用、出事救命'的条款，签合同时不让步就是给未来埋雷。仲裁优先于诉讼：跨境可执行（纽约公约）、保密、可选专家仲裁员。仲裁地比仲裁机构更重要——seat 决定了哪个法院监督程序。先抛首选 SIAC，备好 AIAC 当让步筹码。",
    shadowingPractice: [
      "Neither of our home courts is neutral ground — let's seat the arbitration at SIAC in Singapore, under Singapore law, one arbitrator, English language. That's a clause both our lawyers can live with.",
      "If Jakarta courts are non-negotiable for you, then AIAC in Kuala Lumpur works for us — but litigation in either of our home jurisdictions is off the table, because neither of us would ever sign that.",
    ],
    glossaryItems: [
      { term: "SIAC", fullForm: "Singapore International Arbitration Centre", meaning: "新加坡国际仲裁中心", exampleScene: "东南亚跨境合同首选仲裁机构" },
      { term: "AIAC", fullForm: "Asian International Arbitration Centre", meaning: "亚洲国际仲裁中心（吉隆坡，原 KLRCA）", exampleScene: "大马本土仲裁地，成本更低" },
      { term: "seat", fullForm: "arbitration seat", meaning: "仲裁地", exampleScene: "决定程序法与司法监督法院" },
      { term: "governing law", fullForm: "governing law clause", meaning: "适用法律条款", exampleScene: "合同实体权利义务依哪国法律解释" },
    ],
  },
  {
    day: 34,
    title: "Fighting Over Termination for Convenience Rights",
    category: "Speaking",
    sceneContext:
      "大马分销商要求在经销协议里加 30 天无理由解约权（termination for convenience），却同时要求你备足三个月库存。一旦他拍屁股走人，RM 600,000 的库存全砸在你手里。这条必须谈下来。",
    audioUrl: "",
    targetExpression: {
      english: "Termination for convenience with thirty days' notice kills any incentive to invest in your market — if you want that right, it's one hundred eighty days' notice, and you buy back the unsold inventory at landed cost.",
      phoneticAndLinking: "Ter-mi-na-tion-for-con-ve-nience / with-thir-ty-days'-no-tice / kills-an-y / in-cen-tive-to-in-vest / in-your-mar-ket / if-you-want-that-right / it's-one-hun-dred-eigh-ty / days'-no-tice / and-you-buy-back / the-un-sold-in-ven-to-ry / at-land-ed-cost → termination 重音在 -na-；buy-back 连读",
      chinese: "30 天通知就无理由解约，等于掐死我投资你市场的动力——如果你坚持要这个权利，那就 180 天通知期，外加按到岸成本回购未售库存。",
    },
    alternativeExpression: {
      english: "We can give you an exit — but convenience has a price: you take the remaining stock, you settle all open invoices within fourteen days, and the marketing fees we prepaid get refunded pro rata.",
      phoneticAndLinking: "We-can-give-you / an-ex-it / but-con-ve-nience / has-a-price / you-take-the-re-main-ing-stock / you-set-tle-all / o-pen-in-voi-ces / with-in-four-teen-days / and-the-mar-ke-ting-fees / we-pre-paid / get-re-fun-ded / pro-ra-ta → pro rata 读 /ˌprəʊ ˈrɑːtɑː/；invoices 重音在第一音节",
      chinese: "退出通道可以给——但'方便'是有价的：剩余库存你吃下、未结发票 14 天内付清、我们预付的市场费用按比例退还。",
    },
    businessTakeaway:
      "无理由解约权本身不是毒药，裸奔的解约权才是。谈判公式永远是：right + notice period + settlement package 三件事打包谈。对方每缩短一天通知期，你就往结算包里加一项——库存回购、预付费用摊销、订单取消费。让他意识到'方便'是付费服务，条款自然回归理性。",
    shadowingPractice: [
      "Termination for convenience with thirty days' notice kills any incentive to invest in your market — if you want that right, it's one hundred eighty days' notice, and you buy back the unsold inventory at landed cost.",
      "We can give you an exit — but convenience has a price: you take the remaining stock, you settle all open invoices within fourteen days, and the marketing fees we prepaid get refunded pro rata.",
    ],
    glossaryItems: [
      { term: "T4C", fullForm: "termination for convenience", meaning: "无理由解约权", exampleScene: "强势甲方最爱的条款，必须搭配补偿机制" },
      { term: "T4Cause", fullForm: "termination for cause", meaning: "因故解约（违约解约）", exampleScene: "对方重大违约时的合法退出通道" },
      { term: "landed cost", fullForm: "landed cost", meaning: "到岸总成本", exampleScene: "库存回购计价基准：货值+运费+关税" },
      { term: "pro rata", fullForm: "pro rata refund", meaning: "按比例分摊/退还", exampleScene: "预付费用的公平结算方式" },
    ],
  },
  {
    day: 35,
    title: "Stripping the Hidden Non-Compete Out of an NDA",
    category: "Listening",
    sceneContext:
      "KL 潜在客户发来一份'标准 NDA'，电话里他们的法务轻描淡写地逐条解释。你必须听出藏在第三条里的杀招：五年竞业禁止，覆盖整个东南亚，外加一个 residuals 条款允许他们'记住'你的技术信息。",
    audioUrl: "",
    targetExpression: {
      english: "Let's slow down on clause three — a five-year non-compete covering all of Southeast Asia isn't confidentiality, it's a restraint of trade. We sign a three-year NDA on project information; the non-compete comes out.",
      phoneticAndLinking: "Let's-slow-down / on-clause-three / a-five-year-non-com-pete / cov-er-ing-all-of / South-east-A-sia / is-n't-con-fi-den-ti-a-li-ty / it's-a-re-straint / of-trade / we-sign-a-three-year-N-D-A / on-pro-ject-in-for-ma-tion / the-non-com-pete / comes-out → confidentiality 重音在 -a-；restraint 重音在第二音节",
      chinese: "第三条咱们慢一点——五年竞业禁止覆盖整个东南亚，这不叫保密，这叫限制贸易。项目信息我们签三年 NDA；竞业禁止必须删掉。",
    },
    alternativeExpression: {
      english: "The residuals clause is a deal-breaker as drafted — your team can't 'retain in unaided memory' our formulations. Happy to narrow it to general skills and know-how, but technical specifics stay protected.",
      phoneticAndLinking: "The-re-si-du-als-clause / is-a-deal-break-er / as-drafted / your-team-can't / re-tain-in-un-aid-ed-mem-o-ry / our-for-mu-la-tions / hap-py-to-nar-row-it / to-gen-er-al-skills / and-know-how / but-tech-ni-cal-spe-ci-fics / stay-pro-tec-ted → residuals 重音在 -si-；deal-breaker 连读，k 失爆",
      chinese: "残留条款按现在的写法就是交易破坏者——你们团队不能靠'无辅助记忆'留存我们的配方。可以收窄到通用技能与know-how，但技术细节必须受保护。",
    },
    businessTakeaway:
      "NDA 里的竞业禁止是'用保密的外衣偷你的市场'。听对方解释条款时，警惕三个信号：年限超过两年、地域超过单一国家、范围写成'相关业务'而非'本项目信息'。residuals 条款更阴——它让'记住'变成合法泄露。逐条复述确认（slow down on clause X）是你最便宜的排雷工具。",
    shadowingPractice: [
      "Let's slow down on clause three — a five-year non-compete covering all of Southeast Asia isn't confidentiality, it's a restraint of trade. We sign a three-year NDA on project information; the non-compete comes out.",
      "The residuals clause is a deal-breaker as drafted — your team can't 'retain in unaided memory' our formulations. Happy to narrow it to general skills and know-how, but technical specifics stay protected.",
    ],
    glossaryItems: [
      { term: "NDA", fullForm: "non-disclosure agreement", meaning: "保密协议", exampleScene: "商务接触第一步，常藏附加条款" },
      { term: "non-compete", fullForm: "non-compete clause", meaning: "竞业禁止条款", exampleScene: "限制你未来经营自由的高危条款" },
      { term: "residuals", fullForm: "residuals clause", meaning: "残留条款", exampleScene: "允许对方'记忆留存'你的机密信息" },
      { term: "deal-breaker", fullForm: "deal-breaker", meaning: "交易破坏者（不可接受条款）", exampleScene: "谈判中表明底线的强硬措辞" },
    ],
  },
  {
    day: 36,
    title: "Explaining Cross-Border Remittance Friction Under FX Controls",
    category: "Speaking",
    sceneContext:
      "大马客户催你发货，但 Bank Negara Malaysia 的外汇申报要求卡住了他那笔 RM 350,000 的付款——银行要底层贸易单据。中国工厂又只认到账才排产。你得把两边的规矩一次说清楚，让付款节奏和文件流对齐。",
    audioUrl: "",
    targetExpression: {
      english: "For anything above two hundred thousand ringgit, Bank Negara needs the underlying invoice and contract before the remittance goes out — so let's align the payment schedule with the documentation, not the other way round.",
      phoneticAndLinking: "For-an-y-thing-a-bove / two-hun-dred-thou-sand-ring-git / Bank-Ne-ga-ra / needs-the-un-der-ly-ing / in-voice-and-con-tract / be-fore-the-re-mit-tance / goes-out / so-let's-a-lign / the-pay-ment-sched-ule / with-the-doc-u-men-ta-tion / not-the-oth-er-way-round → remittance 重音在第二音节；underlying 重音在 -ly-",
      chinese: "超过 20 万令吉的汇款，国行要求先有底层发票和合同才放行——所以付款节奏要跟文件流对齐，而不是反过来。",
    },
    alternativeExpression: {
      english: "The delay isn't us sitting on your order — it's compliance. Get your bank the proforma invoice today, the TT clears in three working days, and my factory locks your production slot the day funds land.",
      phoneticAndLinking: "The-de-lay / is-n't-us / sit-ting-on-your-or-der / it's-com-pli-ance / get-your-bank / the-pro-for-ma-in-voice / to-day / the-T-T-clears / in-three-work-ing-days / and-my-fac-to-ry / locks-your-pro-duc-tion-slot / the-day-funds-land → TT 读字母 /ˌtiːˈtiː/；sit-ting 闪音 t",
      chinese: "延误不是我们压着订单——是合规流程。今天把形式发票给你银行，电汇三个工作日到账，资金一到我工厂就锁你的生产排期。",
    },
    businessTakeaway:
      "跨境收付款的卡点 90% 不是外汇'管制'而是'申报'——文件齐全就能走，文件不齐就无限循环。主动把合规逻辑讲给客户听，既化解'你不信任我'的情绪，又把催款压力转成催文件压力。记住顺序：先单据、后汇款、再排产，谁打乱顺序谁承担延误。",
    shadowingPractice: [
      "For anything above two hundred thousand ringgit, Bank Negara needs the underlying invoice and contract before the remittance goes out — so let's align the payment schedule with the documentation, not the other way round.",
      "The delay isn't us sitting on your order — it's compliance. Get your bank the proforma invoice today, the TT clears in three working days, and my factory locks your production slot the day funds land.",
    ],
    glossaryItems: [
      { term: "BNM", fullForm: "Bank Negara Malaysia", meaning: "马来西亚国家银行（央行）", exampleScene: "外汇申报与大额汇出的监管方" },
      { term: "TT", fullForm: "telegraphic transfer", meaning: "电汇", exampleScene: "跨境贸易主流付款方式" },
      { term: "proforma", fullForm: "proforma invoice", meaning: "形式发票", exampleScene: "银行合规与预付定金的触发单据" },
      { term: "underlying", fullForm: "underlying trade documents", meaning: "底层贸易单据", exampleScene: "外汇合规审查的核心材料" },
    ],
  },
  {
    day: 37,
    title: "Pushing Back on Withholding Tax Deductions",
    category: "Listening",
    sceneContext:
      "马来客户财务来电解释：按 LHDN 要求，你的服务费要扣 10% 预提税再付，RM 480,000 的账单直接少了 48,000。你要听懂他援引的是国内法还是税收协定，再用中马 DTA 条款把钱要回来。",
    audioUrl: "",
    targetExpression: {
      english: "Under the Malaysia–China double tax agreement, our service fees are taxable only in China — so the ten percent withholding doesn't apply. If LHDN insists, we'll have to gross up the invoice.",
      phoneticAndLinking: "Un-der-the / Ma-lay-sia-Chi-na / dou-ble-tax-a-gree-ment / our-ser-vice-fees / are-tax-a-ble / on-ly-in-Chi-na / so-the-ten-per-cent / with-hold-ing / does-n't-ap-ply / if-L-H-D-N-in-sists / we'll-have-to-gross-up / the-in-voice → withholding 重音在 -hold-；gross-up 连读",
      chinese: "根据中马双边税收协定，我们的服务费仅在中国纳税——所以 10% 预提税不适用。如果 LHDN 坚持，我们只能把发票价税分离上调。",
    },
    alternativeExpression: {
      english: "If you're going to withhold anyway, then the contract price is net to us — every ringgit you deduct gets added back on top. That's standard practice, and your tax team knows it.",
      phoneticAndLinking: "If-you're-go-ing-to / with-hold-an-y-way / then-the-con-tract-price / is-net-to-us / ev-ery-ring-git / you-de-duct / gets-add-ed-back / on-top / that's-stand-ard-prac-tice / and-your-tax-team-knows-it → added-back 连读，d 失爆；net 重读强调",
      chinese: "如果你们执意要扣，那合同价就是我们的净到手价——你扣的每一令吉都得加回去。这是国际惯例，你们税务团队心知肚明。",
    },
    businessTakeaway:
      "预提税争议的关键是分清'国内法'与'税收协定'的优先级——DTA 高于国内法，但对方财务往往只按 LHDN 的内部指引操作。听出他援引的依据后，你有两张牌：出示中国税收居民身份证明（CoR）适用协定税率，或者启动 gross-up 条款把税负转嫁回去。前者省钱，后者省心，先礼后兵。",
    shadowingPractice: [
      "Under the Malaysia–China double tax agreement, our service fees are taxable only in China — so the ten percent withholding doesn't apply. If LHDN insists, we'll have to gross up the invoice.",
      "If you're going to withhold anyway, then the contract price is net to us — every ringgit you deduct gets added back on top. That's standard practice, and your tax team knows it.",
    ],
    glossaryItems: [
      { term: "WHT", fullForm: "withholding tax", meaning: "预提税", exampleScene: "跨境付款时付款方代扣的税种" },
      { term: "DTA", fullForm: "double tax agreement", meaning: "双边税收协定", exampleScene: "降低或免除预提税的法律依据" },
      { term: "gross-up", fullForm: "gross-up clause", meaning: "价税分离上调条款", exampleScene: "保证收款方净额到手的合同安排" },
      { term: "LHDN", fullForm: "Lembaga Hasil Dalam Negeri", meaning: "马来西亚内陆税收局", exampleScene: "大马税务征管与稽查机构" },
    ],
  },
  {
    day: 38,
    title: "Surviving a Transfer Pricing Audit Interview",
    category: "Listening",
    sceneContext:
      "LHDN 转让定价审计会上，审计官语速很快地连环发问：为什么中国母公司收马来子公司 8% 的服务费？基准分析在哪里？同期资料准备了没有？你必须听懂每个问题背后的合规要求，答错一句就是补税加罚款。",
    audioUrl: "",
    targetExpression: {
      english: "Our intercompany service fees follow the arm's length principle, benchmarked against comparable third-party rates — we'll submit the contemporaneous TP documentation and the benchmarking study to your team within thirty days.",
      phoneticAndLinking: "Our-in-ter-com-pa-ny / ser-vice-fees-fol-low / the-arm's-length-prin-ci-ple / bench-marked-a-gainst / com-pa-ra-ble / third-par-ty-rates / we'll-sub-mit / the-con-tem-po-ra-ne-ous / T-P-doc-u-men-ta-tion / and-the-bench-mark-ing-stud-y / to-your-team / with-in-thir-ty-days → arm's length 连读；contemporaneous 重音在 -ne-",
      chinese: "我们的关联交易服务费遵循独立交易原则，以可比第三方费率为基准——30 天内向贵团队提交同期转让定价文档和基准分析报告。",
    },
    alternativeExpression: {
      english: "The eight percent charge covers procurement, quality control and technical support rendered from Shanghai — each service is itemised in the intercompany agreement, and the benefit test is documented in the TP file.",
      phoneticAndLinking: "The-eight-per-cent-charge / cov-ers-pro-cure-ment / qual-i-ty-con-trol / and-tech-ni-cal-sup-port / ren-dered-from-Shang-hai / each-ser-vice / is-i-tem-ised / in-the-in-ter-com-pa-ny / a-gree-ment / and-the-bene-fit-test / is-doc-u-men-ted / in-the-T-P-file → itemised 重音在第一音节；rendered 重音在第一音节",
      chinese: "8% 的收费覆盖上海提供的采购、质检与技术支持——每项服务在关联交易协议里逐条列明，受益性测试在转让定价文档中有完整记录。",
    },
    businessTakeaway:
      "TP 审计不是查你'有没有做'，而是查你'有没有写下来'。审计官的每个问题都对应一份文档：费率问的是基准分析，服务真实性问的是受益性测试，时点问的是同期资料（当年准备、非事后补造）。听不清就要求书面问询清单，口头应答只承诺提交期限，绝不在现场拍脑袋解释数字。",
    shadowingPractice: [
      "Our intercompany service fees follow the arm's length principle, benchmarked against comparable third-party rates — we'll submit the contemporaneous TP documentation and the benchmarking study to your team within thirty days.",
      "The eight percent charge covers procurement, quality control and technical support rendered from Shanghai — each service is itemised in the intercompany agreement, and the benefit test is documented in the TP file.",
    ],
    glossaryItems: [
      { term: "TP", fullForm: "transfer pricing", meaning: "转让定价", exampleScene: "关联企业间交易定价的税务合规核心" },
      { term: "ALP", fullForm: "arm's length principle", meaning: "独立交易原则", exampleScene: "关联交易须按独立第三方价格进行" },
      { term: "CTPD", fullForm: "contemporaneous TP documentation", meaning: "同期转让定价文档", exampleScene: "交易当年准备的书面抗辩材料" },
      { term: "benchmarking", fullForm: "benchmarking study", meaning: "基准分析", exampleScene: "用可比公司数据证明费率合理" },
    ],
  },
  {
    day: 39,
    title: "Pitching for MIDA Pioneer Status and Investment Incentives",
    category: "Speaking",
    sceneContext:
      "你计划投 RM 12 million 在雪兰莪建组装厂，雇 60 名本地员工。与 MIDA 官员的会谈只有 30 分钟——你必须用就业、技术转移和供应链本地化三张牌，换到先锋地位或投资税减免，还要问出真实审批周期。",
    audioUrl: "",
    targetExpression: {
      english: "We're committing twelve million ringgit and sixty local jobs in Selangor — what pioneer status or investment tax allowance can MIDA support on that basis, and what's the realistic approval timeline we should build into our plan?",
      phoneticAndLinking: "We're-com-mit-ting / twelve-mil-lion-ring-git / and-six-ty-lo-cal-jobs / in-Se-lang-or / what-pi-o-neer-sta-tus / or-in-vest-ment-tax-al-low-ance / can-M-I-D-A-sup-port / on-that-ba-sis / and-what's-the-rea-lis-tic / ap-prov-al-time-line / we-should-build-in-to / our-plan → pioneer 重音在 -neer；allowance 重音在第二音节",
      chinese: "我们承诺在雪兰莪投 1200 万令吉、创造 60 个本地岗位——基于此 MIDA 能支持先锋地位还是投资税减免？我们该按多长的真实审批周期做计划？",
    },
    alternativeExpression: {
      english: "If pioneer status is off the table for our industry, we'd look at the investment tax allowance route — sixty percent on qualifying capital expenditure over five years. Which box does our project actually fit?",
      phoneticAndLinking: "If-pi-o-neer-sta-tus / is-off-the-ta-ble / for-our-in-dus-try / we'd-look-at / the-in-vest-ment-tax / al-low-ance-route / six-ty-per-cent / on-qual-i-fy-ing / cap-i-tal-ex-pen-di-ture / o-ver-five-years / which-box / does-our-pro-ject / ac-tual-ly-fit → off-the-table 连读；qualifying 重音在第一音节",
      chinese: "如果我们行业拿不到先锋地位，那就走投资税减免路线——五年内合格资本支出抵扣 60%。我们的项目到底适用哪一档？",
    },
    businessTakeaway:
      "向政府机构要优惠，姿态不是'求补贴'而是'给政绩'：先说投资额和就业数，再问对应工具。MIDA 的核心产品是 Pioneer Status（5-10 年免 70%-100% 所得税）和 ITA（资本支出 60% 抵扣），二者通常不可兼得。最后必须钉死审批时间表——官员口头说的 'fast track' 不换算成周数就没有意义。",
    shadowingPractice: [
      "We're committing twelve million ringgit and sixty local jobs in Selangor — what pioneer status or investment tax allowance can MIDA support on that basis, and what's the realistic approval timeline we should build into our plan?",
      "If pioneer status is off the table for our industry, we'd look at the investment tax allowance route — sixty percent on qualifying capital expenditure over five years. Which box does our project actually fit?",
    ],
    glossaryItems: [
      { term: "MIDA", fullForm: "Malaysian Investment Development Authority", meaning: "马来西亚投资发展局", exampleScene: "制造业投资优惠的审批机构" },
      { term: "PS", fullForm: "pioneer status", meaning: "先锋地位（所得税减免）", exampleScene: "高附加值产业 5-10 年免税期" },
      { term: "ITA", fullForm: "investment tax allowance", meaning: "投资税减免", exampleScene: "按合格资本支出比例抵税" },
      { term: "CapEx", fullForm: "capital expenditure", meaning: "资本支出", exampleScene: "ITA 抵扣的计算基数" },
    ],
  },
  {
    day: 40,
    title: "Answering an Auditor's Challenge on Suspicious Payments",
    category: "Listening",
    sceneContext:
      "JV 年度审计现场，对方派来的审计师突然发难：两笔合计 RM 160,000 的'咨询费'没有合同、收款方是你朋友的公司。会议室空气凝固——你必须听清他质疑的准确性质：是程序瑕疵，还是暗示利益输送。",
    audioUrl: "",
    targetExpression: {
      english: "Both payments are backed by signed engagement letters and delivered reports — walk me through exactly which line items you want vouched, and the supporting documents will be on your desk by Friday.",
      phoneticAndLinking: "Both-pay-ments / are-backed-by / signed-en-gage-ment-let-ters / and-de-liv-ered-re-ports / walk-me-through / ex-act-ly-which / line-i-tems / you-want-vouched / and-the-sup-por-ting-doc-u-ments / will-be-on-your-desk / by-Fri-day → vouched 重读；engagement 重音在第二音节",
      chinese: "两笔付款都有签署的服务协议和交付的报告支撑——请明确指出你们要核验哪些具体行项，证明文件周五前放到你桌上。",
    },
    alternativeExpression: {
      english: "If the question is whether this is a related-party transaction, say it plainly — the vendor is independent, the pricing was benchmarked against two other quotes, and I'm happy to put that in writing for your working papers.",
      phoneticAndLinking: "If-the-ques-tion-is / whe-ther-this-is / a-re-la-ted-par-ty / trans-ac-tion / say-it-plain-ly / the-ven-dor-is-in-de-pen-dent / the-pric-ing-was / bench-marked-a-gainst / two-oth-er-quotes / and-I'm-hap-py-to / put-that-in-writ-ing / for-your-work-ing-pa-pers → related-party 连读；working papers 重音在 work-",
      chinese: "如果你问的是这是不是关联交易，请直说——供应商是独立第三方，定价对标过另外两家报价，我很乐意把这一切书面化放进你的工作底稿。",
    },
    businessTakeaway:
      "审计质疑分三层：缺文件（程序问题）、定价异常（估值问题）、关系存疑（诚信问题）。层数越深越危险。听出对方在暗示哪一层之前，不要过度自辩——只承诺提供凭证、明确时限。若对方影射关联交易，立刻逼他摆到台面上（say it plainly），暗示见光就死，书面化是你的最佳护身符。",
    shadowingPractice: [
      "Both payments are backed by signed engagement letters and delivered reports — walk me through exactly which line items you want vouched, and the supporting documents will be on your desk by Friday.",
      "If the question is whether this is a related-party transaction, say it plainly — the vendor is independent, the pricing was benchmarked against two other quotes, and I'm happy to put that in writing for your working papers.",
    ],
    glossaryItems: [
      { term: "vouching", fullForm: "vouching", meaning: "凭证核验", exampleScene: "审计师从账面追到原始单据的程序" },
      { term: "RPT", fullForm: "related-party transaction", meaning: "关联交易", exampleScene: "审计与税务的重点盯防对象" },
      { term: "engagement letter", fullForm: "engagement letter", meaning: "业务约定书/服务协议", exampleScene: "证明服务真实性的第一手文件" },
      { term: "materiality", fullForm: "audit materiality", meaning: "审计重要性水平", exampleScene: "低于此金额的错报可忽略" },
    ],
  },
  {
    day: 41,
    title: "Structuring Around the Bumiputera Equity Requirement",
    category: "Speaking",
    sceneContext:
      "竞标雪州政府关联公司（GLC）的供货项目，资格门槛写明 30% 土著持股。有'顾问'暗示可以找个名义股东挂名。你知道 nominee 结构尽调一戳就破，必须向客户与伙伴解释合规路径。",
    audioUrl: "",
    targetExpression: {
      english: "We respect the thirty percent Bumiputera equity requirement — our proposal is a genuine local partner holding that stake under a proper shareholders agreement, not a nominee arrangement, because nominees never survive due diligence.",
      phoneticAndLinking: "We-re-spect / the-thir-ty-per-cent / Bu-mi-pu-te-ra / eq-ui-ty-re-quire-ment / our-pro-po-sal-is / a-gen-uine-lo-cal-part-ner / hold-ing-that-stake / un-der-a-prop-er / share-hold-ers-a-gree-ment / not-a-nom-i-nee / ar-range-ment / be-cause-nom-i-nees / nev-er-sur-vive / due-dil-i-gence → Bumiputera 重音在 -te-；nominee 重音在 -nee",
      chinese: "我们尊重 30% 土著持股要求——方案是由真实本地伙伴在正式股东协议下持有该股权，而不是名义股东安排，因为代持永远过不了尽职调查。",
    },
    alternativeExpression: {
      english: "A nominee structure might get you past the tender gate, but it collapses the moment anyone checks the funding trail — and when it collapses, the contract, the licence and your reputation go with it.",
      phoneticAndLinking: "A-nom-i-nee-struc-ture / might-get-you-past / the-ten-der-gate / but-it-col-lap-ses / the-mo-ment-an-y-one / checks-the-fund-ing-trail / and-when-it-col-lap-ses / the-con-tract / the-li-cence / and-your-rep-u-ta-tion / go-with-it → nominee 重音在 -nee；collapses 重音在第二音节",
      chinese: "代持结构也许能帮你混过投标门槛，但任何人一查资金流水就会崩盘——崩盘的时候，合同、牌照和你的声誉会一起陪葬。",
    },
    businessTakeaway:
      "Bumiputera 政策是大马公共采购的硬门槛，30% 持股必须真实出资、真实持股、真实参与。代持（nominee）在大马虽常见但违法风险极高：资金回流痕迹、董事会缺席、分红去向都是尽调死穴。正确路径是找有行业资源的土著伙伴做真实股东，用股东协议锁定双方权责——合规成本远低于穿仓代价。",
    shadowingPractice: [
      "We respect the thirty percent Bumiputera equity requirement — our proposal is a genuine local partner holding that stake under a proper shareholders agreement, not a nominee arrangement, because nominees never survive due diligence.",
      "A nominee structure might get you past the tender gate, but it collapses the moment anyone checks the funding trail — and when it collapses, the contract, the licence and your reputation go with it.",
    ],
    glossaryItems: [
      { term: "Bumiputera", fullForm: "Bumiputera equity policy", meaning: "土著持股政策", exampleScene: "政府与 GLC 招标的硬性资格门槛" },
      { term: "nominee", fullForm: "nominee shareholder", meaning: "名义股东/代持人", exampleScene: "高危违规结构，尽调必查" },
      { term: "GLC", fullForm: "government-linked company", meaning: "政府关联公司", exampleScene: "执行 Bumiputera 门槛的采购主体" },
      { term: "DD", fullForm: "due diligence", meaning: "尽职调查", exampleScene: "戳破代持结构的标准程序" },
    ],
  },
  {
    day: 42,
    title: "Negotiating Board Seats in a 60/40 Joint Venture",
    category: "Speaking",
    sceneContext:
      "与大马伙伴成立 60/40 合资公司，你持 40%。对方拿出章程草案：董事会 5 席他占 4 席，理由是'大股东控制'。你的技术和品牌都要授权给这家 JV——董事会被碾压等于净身出户。",
    audioUrl: "",
    targetExpression: {
      english: "A four-to-one board on a sixty-forty JV makes us a passenger, not a partner — three-to-two keeps day-to-day control with you, while our two seats protect the technology and the brand we're putting in.",
      phoneticAndLinking: "A-four-to-one-board / on-a-six-ty-for-ty-J-V / makes-us-a-pas-sen-ger / not-a-part-ner / three-to-two / keeps-day-to-day / con-trol-with-you / while-our-two-seats / pro-tect-the-tech-no-lo-gy / and-the-brand / we're-put-ting-in → passenger 重音在第一音节；three-to-two 连读成 /θriːtətuː/",
      chinese: "60/40 的合资公司配 4:1 的董事会，我们就成了乘客而不是伙伴——3:2 让日常控制权归你，我们的两席用来保护投入的技术和品牌。",
    },
    alternativeExpression: {
      english: "Board seats track contribution, not just shareholding — you bring capital and distribution, we bring the IP this whole venture is built on. Three-two, or we revisit whether this should be a JV at all.",
      phoneticAndLinking: "Board-seats-track / con-tri-bu-tion / not-just-share-hold-ing / you-bring-cap-i-tal / and-dis-tri-bu-tion / we-bring-the-I-P / this-whole-ven-ture / is-built-on / three-two / or-we-re-vis-it / whe-ther-this-should-be / a-J-V-at-all → contribution 重音在 -bu-；revisit 重音在 -vi-",
      chinese: "董事会席位对应的是贡献，不只是股比——你出资本和渠道，我们出整个合资赖以存在的技术。3:2，否则我们重新讨论这事到底该不该做成合资。",
    },
    businessTakeaway:
      "董事会席位谈判的核心论点是'控制权与贡献匹配'，不是与股比机械挂钩。4:1 意味着对方可以合法地通过任何决议，包括稀释你、换掉管理层、把 JV 的技术转走。3:2 + 关键事项保留条款是少数股东的标准防线。必要时放出'那就不做 JV 做授权'的替代方案——BATNA 一亮，对方才知道你不好吞。",
    shadowingPractice: [
      "A four-to-one board on a sixty-forty JV makes us a passenger, not a partner — three-to-two keeps day-to-day control with you, while our two seats protect the technology and the brand we're putting in.",
      "Board seats track contribution, not just shareholding — you bring capital and distribution, we bring the IP this whole venture is built on. Three-two, or we revisit whether this should be a JV at all.",
    ],
    glossaryItems: [
      { term: "JV", fullForm: "joint venture", meaning: "合资公司", exampleScene: "东南亚落地的常见股权结构" },
      { term: "board seat", fullForm: "board seat allocation", meaning: "董事会席位分配", exampleScene: "公司治理控制权的直接体现" },
      { term: "casting vote", fullForm: "chairman's casting vote", meaning: "主席决定票", exampleScene: "平票时打破僵局的机制，必须争" },
      { term: "BATNA", fullForm: "best alternative to a negotiated agreement", meaning: "谈判破裂时的最佳替代方案", exampleScene: "所有强势谈判的底气来源" },
    ],
  },
  {
    day: 43,
    title: "Securing Veto Rights on Reserved Matters",
    category: "Speaking",
    sceneContext:
      "JV 章程谈崩在细节：对方承认你 40% 股比和两席董事，却拒绝给任何否决权，说'少数股东不该挡大股东的路'。没有否决权，他明天就能增资稀释你、把核心资产卖给自家亲戚。",
    audioUrl: "",
    targetExpression: {
      english: "We're not asking to run the company — but on four things we need a veto: new share issuance, sale of core assets, related-party transactions, and any change to the business scope. Everything else is majority rule.",
      phoneticAndLinking: "We're-not-ask-ing / to-run-the-com-pa-ny / but-on-four-things / we-need-a-ve-to / new-share-is-su-ance / sale-of-core-as-sets / re-la-ted-par-ty / trans-ac-tions / and-an-y-change / to-the-busi-ness-scope / ev-ery-thing-else / is-ma-jor-i-ty-rule → veto 重音在第一音节 /ˈviːtəʊ/；issuance 重音在第一音节",
      chinese: "我们不是要经营公司——但四件事必须有一票否决：增发新股、出售核心资产、关联交易、变更经营范围。其余一切服从多数决。",
    },
    alternativeExpression: {
      english: "Call it a veto or call it supermajority consent — the substance is the same: those four resolutions don't pass without our signature. That protects your investment as much as ours.",
      phoneticAndLinking: "Call-it-a-ve-to / or-call-it-su-per-ma-jor-i-ty / con-sent / the-sub-stance / is-the-same / those-four-res-o-lu-tions / don't-pass / with-out-our-sig-na-ture / that-pro-tects / your-in-vest-ment / as-much-as-ours → supermajority 重音在 -jor-；substance 重音在第一音节",
      chinese: "叫一票否决也好，叫绝对多数同意权也好——实质相同：那四项决议没有我们签字就过不了。这既保护你的投资，也同样保护我们的。",
    },
    businessTakeaway:
      "否决权谈判的精髓是'清单收窄、立场放宽'：列 4-6 项真正致命的事项，其余全部让给对方，显得你极度讲道理。措辞上用 'supermajority consent'（如 75% 特别决议）比 'veto' 更容易被接受，法律效力一样。最后一句'保护双方'是钩子——把单边防御说成共同利益，对方律师就找不到反对的理由。",
    shadowingPractice: [
      "We're not asking to run the company — but on four things we need a veto: new share issuance, sale of core assets, related-party transactions, and any change to the business scope. Everything else is majority rule.",
      "Call it a veto or call it supermajority consent — the substance is the same: those four resolutions don't pass without our signature. That protects your investment as much as ours.",
    ],
    glossaryItems: [
      { term: "veto", fullForm: "veto power / veto right", meaning: "一票否决权", exampleScene: "少数股东的终极防御武器" },
      { term: "reserved matters", fullForm: "reserved matters", meaning: "保留事项", exampleScene: "须特别多数或全体同意的重大事项清单" },
      { term: "supermajority", fullForm: "supermajority consent", meaning: "绝对多数同意权", exampleScene: "否决权的温和版表述（如 75% 通过）" },
      { term: "share issuance", fullForm: "new share issuance", meaning: "增发新股", exampleScene: "稀释少数股东的经典手法，必须设防" },
    ],
  },
  {
    day: 44,
    title: "Locking In Pre-Emptive Rights Before the Next Round Dilutes You",
    category: "Listening",
    sceneContext:
      "投资人电话会上随口提到：明年 A 轮计划按新估值发 20% 新股，你的股比将从 40% 摊薄到 32%。他语速很快地保证'dilution is normal, everyone gets diluted'。你必须听出条款漏洞，当场锁定优先跟投权。",
    audioUrl: "",
    targetExpression: {
      english: "Dilution we can live with — being shut out of the next round we can't. We want pre-emptive rights, pro rata, on any new issuance, in the shareholders agreement, not in a side letter.",
      phoneticAndLinking: "Di-lu-tion / we-can-live-with / be-ing-shut-out / of-the-next-round / we-can't / we-want-pre-emp-tive-rights / pro-ra-ta / on-an-y-new / is-su-ance / in-the-share-hold-ers / a-gree-ment / not-in-a / side-let-ter → pre-emptive 重音在 -emp-；shut-out 连读",
      chinese: "稀释我们能接受——被关在下一轮融资门外不能接受。任何增发我们都要按比例的优先跟投权，写进股东协议，不要侧函。",
    },
    alternativeExpression: {
      english: "If the next round prices lower than this one, we need weighted-average anti-dilution protection — nobody's asking for a full ratchet, but we won't absorb the down round alone.",
      phoneticAndLinking: "If-the-next-round / prices-low-er / than-this-one / we-need-weight-ed-av-er-age / an-ti-di-lu-tion / pro-tec-tion / no-bod-y's-ask-ing / for-a-full-ratch-et / but-we-won't / ab-sorb-the-down-round / a-lone → anti-dilution 重音在 -lu-；ratchet 重音在第一音节",
      chinese: "如果下轮估值比这轮低，我们需要加权平均反稀释保护——没人要求完全棘轮，但下行轮的损失不能由我们独吞。",
    },
    businessTakeaway:
      "投资人最爱用'稀释很正常'偷换概念：比例稀释正常，但剥夺你跟投资格不正常。听懂他的话术重点——'everyone gets diluted' 掩盖的是谁能以低价补回股比。两个硬要求：pre-emptive right 进股东协议（侧函效力弱）、反稀释选加权平均（full ratchet 过分贪婪反而谈崩）。当场听懂了就要当场钉死。",
    shadowingPractice: [
      "Dilution we can live with — being shut out of the next round we can't. We want pre-emptive rights, pro rata, on any new issuance, in the shareholders agreement, not in a side letter.",
      "If the next round prices lower than this one, we need weighted-average anti-dilution protection — nobody's asking for a full ratchet, but we won't absorb the down round alone.",
    ],
    glossaryItems: [
      { term: "dilution", fullForm: "equity dilution", meaning: "股权稀释", exampleScene: "增发新股导致持股比例下降" },
      { term: "pre-emptive right", fullForm: "pre-emptive right", meaning: "优先认购/跟投权", exampleScene: "按比例优先认购新股的法定或约定权利" },
      { term: "down round", fullForm: "down round", meaning: "下行轮（估值缩水融资）", exampleScene: "新轮估值低于上一轮" },
      { term: "ratchet", fullForm: "full ratchet anti-dilution", meaning: "完全棘轮反稀释", exampleScene: "最激进的反稀释条款，慎提" },
    ],
  },
  {
    day: 45,
    title: "Fixing the Buyback Formula Before the Partnership Breaks",
    category: "Speaking",
    sceneContext:
      "与大马伙伴的合作出现裂痕，双方都动了退出念头。股东协议里回购条款只写了'按公允价值'四个字——没有估值方法、没有付款安排。趁关系还没彻底撕破，必须把回购公式钉死。",
    audioUrl: "",
    targetExpression: {
      english: "If either of us walks, the buyback price can't be a number we fight over in a bad year — let's fix the formula now: independent valuation, or three times trailing EBITDA, whichever is higher, payable over twelve months.",
      phoneticAndLinking: "If-ei-ther-of-us-walks / the-buy-back-price / can't-be-a-num-ber / we-fight-o-ver / in-a-bad-year / let's-fix-the-for-mu-la / now / in-de-pen-dent / val-u-a-tion / or-three-times-trail-ing / E-B-I-T-D-A / which-ev-er-is-high-er / pay-a-ble / o-ver-twelve-months → EBITDA 读字母 /ˌiːbɪtˈdɑː/；trailing 重音在第一音节",
      chinese: "如果我们任何一方退出，回购价不能是等到光景差的年份再吵出来的数字——现在就把公式定死：独立估值或过去十二个月 EBITDA 的三倍，取高者，分 12 个月支付。",
    },
    alternativeExpression: {
      english: "Whoever triggered the breakdown shouldn't get to set the price — the exiting party sells at the formula, no control premium, no discount for a quick exit. That's the only version both of us can sign today.",
      phoneticAndLinking: "Who-ev-er-trig-gered / the-break-down / should-n't-get / to-set-the-price / the-ex-it-ing-par-ty / sells-at-the-for-mu-la / no-con-trol-pre-mi-um / no-dis-count / for-a-quick-ex-it / that's-the-on-ly / ver-sion-both-of-us / can-sign-to-day → triggered 重音在第一音节；premium 重音在第一音节",
      chinese: "谁先挑起的破裂，谁就没资格定价——退出方按公式出售，没有控制权溢价，也没有快速退出折扣。这是今天双方唯一能签的版本。",
    },
    businessTakeaway:
      "退出条款只能在'关系尚可'时谈，撕破脸后任何公式都会被解读为阴谋。公式设计三要素：估值锚（独立评估或 EBITDA 倍数，取高防贱卖）、付款期（12 个月防现金流猝死）、无溢价无折扣（防止任何一方借退出套利）。把'whichever is higher'塞进去，等于给双方各买一份保险。",
    shadowingPractice: [
      "If either of us walks, the buyback price can't be a number we fight over in a bad year — let's fix the formula now: independent valuation, or three times trailing EBITDA, whichever is higher, payable over twelve months.",
      "Whoever triggered the breakdown shouldn't get to set the price — the exiting party sells at the formula, no control premium, no discount for a quick exit. That's the only version both of us can sign today.",
    ],
    glossaryItems: [
      { term: "buyback", fullForm: "share buyback clause", meaning: "股权回购条款", exampleScene: "合作破裂时的退出定价机制" },
      { term: "EBITDA", fullForm: "earnings before interest, taxes, depreciation and amortization", meaning: "息税折旧摊销前利润", exampleScene: "企业估值最常用的倍数基数" },
      { term: "control premium", fullForm: "control premium", meaning: "控制权溢价", exampleScene: "控股股权比少数股权多出的溢价" },
      { term: "trailing", fullForm: "trailing twelve months (TTM)", meaning: "过去十二个月", exampleScene: "估值计算的财务数据窗口" },
    ],
  },
  {
    day: 46,
    title: "Decoding a Cease & Desist Letter Over a Squatted Trademark",
    category: "Listening",
    sceneContext:
      "你的品牌刚在 Lazada 起量，就发现大马代理商偷偷在 MyIPO 把商标注册到自己公司名下。你的律师念完警告信草稿，又用极快的语速解释对抗路径：异议、无效、passing off 诉讼各自的成功率与成本。你必须全部听懂并拍板。",
    audioUrl: "",
    targetExpression: {
      english: "The letter goes out today: your registration of our mark was filed in bad faith while you were our distributor — withdraw it and assign it to us within fourteen days, or we file an opposition and a passing-off claim in the same week.",
      phoneticAndLinking: "The-let-ter-goes-out / to-day / your-reg-is-tra-tion / of-our-mark / was-filed / in-bad-faith / while-you-were / our-dis-tri-bu-tor / with-draw-it / and-as-sign-it / to-us / with-in-four-teen-days / or-we-file / an-op-po-si-tion / and-a-pass-ing-off-claim / in-the-same-week → bad faith 重读 faith；opposition 重音在 -si-",
      chinese: "警告信今天发出：你在担任我们经销商期间恶意抢注我们的商标——14 天内撤回并转让给我们，否则我们同一周内提起异议和仿冒诉讼。",
    },
    alternativeExpression: {
      english: "Before we litigate, put a number on the table: the distributor agreement says all IP stays ours, so every ringgit you've made under our mark is arguably account of profits — settle the transfer now, and we won't look backwards.",
      phoneticAndLinking: "Be-fore-we-lit-i-gate / put-a-num-ber / on-the-ta-ble / the-dis-tri-bu-tor / a-gree-ment-says / all-I-P-stays-ours / so-ev-ery-ring-git / you've-made / un-der-our-mark / is-ar-gu-a-bly / ac-count-of-prof-its / set-tle-the-trans-fer-now / and-we-won't / look-back-wards → arguably 重音在第一音节；litigate 重音在第一音节",
      chinese: "诉讼之前，先把数字摆上桌：经销协议写明所有知识产权归我们——所以你打着我们商标赚的每一令吉，理论上都可被追缴利润。现在办转让，我们既往不咎。",
    },
    businessTakeaway:
      "警告信的目的不是打赢官司，是用最小的成本让对方算账后认怂。听律师方案时抓三件事：法律抓手（经销协议里的 IP 归属条款是最锋利的）、时限压力（14 天回应期）、胡萝卜（settle 后既往不咎）。account of profits 是杀手锏——追缴全部利润比损害赔偿更疼。信一定要律师发，自己发威胁信反而可能被反告。",
    shadowingPractice: [
      "The letter goes out today: your registration of our mark was filed in bad faith while you were our distributor — withdraw it and assign it to us within fourteen days, or we file an opposition and a passing-off claim in the same week.",
      "Before we litigate, put a number on the table: the distributor agreement says all IP stays ours, so every ringgit you've made under our mark is arguably account of profits — settle the transfer now, and we won't look backwards.",
    ],
    glossaryItems: [
      { term: "C&D", fullForm: "cease and desist letter", meaning: "停止侵权警告函", exampleScene: "商标维权的标准第一步" },
      { term: "bad faith", fullForm: "bad faith registration", meaning: "恶意注册", exampleScene: "撤销抢注商标的核心法律依据" },
      { term: "passing off", fullForm: "passing off", meaning: "仿冒（普通法侵权）", exampleScene: "未注册商标也能主张的普通法权利" },
      { term: "MyIPO", fullForm: "Intellectual Property Corporation of Malaysia", meaning: "马来西亚知识产权局", exampleScene: "商标异议与无效程序的受理机构" },
    ],
  },
  {
    day: 47,
    title: "Keeping SIRIM and NPRA Registration Ownership in Your Hands",
    category: "Speaking",
    sceneContext:
      "产品进大马必须过 SIRIM 认证和 NPRA 备案，本地代理提议'用我们公司名义注册，走件快'。听上去很省事——但一旦分手，证在他手里，你的产品在他地盘上就永远是他的摇钱树。",
    audioUrl: "",
    targetExpression: {
      english: "The registration can sit under your entity for speed to market — but the certificate, the test reports and the product files stay our property, and the agreement states it all transfers back to us within thirty days of termination.",
      phoneticAndLinking: "The-reg-is-tra-tion / can-sit-un-der / your-en-ti-ty / for-speed-to-mar-ket / but-the-cer-ti-fi-cate / the-test-re-ports / and-the-pro-duct-files / stay-our-prop-er-ty / and-the-a-gree-ment-states / it-all-trans-fers-back / to-us / with-in-thir-ty-days / of-ter-mi-na-tion → certificate 重音在第二音节；entity 重音在第一音节",
      chinese: "备案可以挂在你公司名下以求上市速度——但证书、检测报告和产品档案都是我们的财产，协议写明合作终止后 30 天内全部转回我们。",
    },
    alternativeExpression: {
      english: "Speed is a fair point, so here's the compromise: you hold the licence as our registered agent, the engagement letter says you're a custodian, not an owner — and we get read access to the regulator's portal at all times.",
      phoneticAndLinking: "Speed-is-a-fair-point / so-here's-the-com-pro-mise / you-hold-the-li-cence / as-our-reg-is-tered-a-gent / the-en-gage-ment-let-ter / says-you're-a-cus-to-di-an / not-an-own-er / and-we-get-read-ac-cess / to-the-reg-u-la-tor's-por-tal / at-all-times → custodian 重音在第二音节；registered agent 连读",
      chinese: "求快有道理，所以折中方案是：你以我们注册代理的名义持证，委托书写明你是保管人不是所有人——而且我们要随时拥有监管平台的查看权限。",
    },
    businessTakeaway:
      "SIRIM/NPRA 备案是产品在大马的'准生证'，谁持证谁就有卡脖子的能力——换代理商时对方不配合转证，你的货就得重新排队 6-12 个月。最优结构是注册在你自己的大马实体名下；若必须挂代理名下，三件套不能少：custodian 定性、30 天回转条款、监管平台实时查看权。省一周走件时间，赌上整个市场主权，不值。",
    shadowingPractice: [
      "The registration can sit under your entity for speed to market — but the certificate, the test reports and the product files stay our property, and the agreement states it all transfers back to us within thirty days of termination.",
      "Speed is a fair point, so here's the compromise: you hold the licence as our registered agent, the engagement letter says you're a custodian, not an owner — and we get read access to the regulator's portal at all times.",
    ],
    glossaryItems: [
      { term: "SIRIM", fullForm: "SIRIM Berhad (Standards of Malaysia)", meaning: "大马标准与工业研究院认证", exampleScene: "电子电器等产品准入强制认证" },
      { term: "NPRA", fullForm: "National Pharmaceutical Regulatory Agency", meaning: "国家药品监管局", exampleScene: "保健品化妆品上市备案机构" },
      { term: "custodian", fullForm: "custodian arrangement", meaning: "保管人安排", exampleScene: "持证但无所有权的法律定性" },
      { term: "registration holder", fullForm: "product registration holder", meaning: "产品注册持有人", exampleScene: "监管系统中备案的法律主体" },
    ],
  },
  {
    day: 48,
    title: "Pricing an IP Licence and Defending the Royalty Base",
    category: "Speaking",
    sceneContext:
      "授权品牌与配方给莎阿南的工厂做本地生产，对方把 royalty 从净销售额 5% 一路砍，还要把'净销售额'定义成扣除营销费、渠道返点和坏账之后的数字。基数一烂，费率再高也是白搭。",
    audioUrl: "",
    targetExpression: {
      english: "The royalty is five percent of net sales, paid quarterly in US dollars — and net sales means gross invoiced sales minus freight and taxes only. Your marketing costs and rebates stay on your side of the ledger.",
      phoneticAndLinking: "The-roy-al-ty-is / five-per-cent / of-net-sales / paid-quar-ter-ly / in-U-S-dol-lars / and-net-sales-means / gross-in-voiced-sales / mi-nus-freight / and-tax-es-on-ly / your-mar-ke-ting-costs / and-re-bates / stay-on-your-side / of-the-led-ger → royalty 重音在第一音节；ledger 重音在第一音节",
      chinese: "版税按净销售额 5%、按季度以美元支付——净销售额指开票总额仅减运费和税费。你的营销费用和返点，留在你自己的账上。",
    },
    alternativeExpression: {
      english: "A lower rate with a clean base beats a high rate with a leaky base — and we keep the right to audit your books once a year, with an independent accountant, at our cost unless the shortfall exceeds five percent.",
      phoneticAndLinking: "A-low-er-rate / with-a-clean-base / beats-a-high-rate / with-a-leak-y-base / and-we-keep-the-right / to-au-dit-your-books / once-a-year / with-an-in-de-pen-dent / ac-coun-tant / at-our-cost / un-less-the-short-fall / ex-ceeds-five-per-cent → leaky 连读；shortfall 重音在第一音节",
      chinese: "干净的基数配低费率，胜过漏水的基数配高费率——我们保留每年一次的查账权，由独立会计师执行，费用我们出，除非短付超过 5%。",
    },
    businessTakeaway:
      "IP 授权谈判的真战场不是费率，是 royalty base 的定义。对方每往扣减项里塞一个词，你的实际收入就削掉一层。铁律：净销售额 = 开票额 - 运费 - 税，其余一概不减。审计条款要埋一个钩子——短付超 5% 则审计费转嫁给对方，被许可方自然不敢乱来。",
    shadowingPractice: [
      "The royalty is five percent of net sales, paid quarterly in US dollars — and net sales means gross invoiced sales minus freight and taxes only. Your marketing costs and rebates stay on your side of the ledger.",
      "A lower rate with a clean base beats a high rate with a leaky base — and we keep the right to audit your books once a year, with an independent accountant, at our cost unless the shortfall exceeds five percent.",
    ],
    glossaryItems: [
      { term: "royalty", fullForm: "royalty fee", meaning: "版税/特许权使用费", exampleScene: "IP 授权的核心收入条款" },
      { term: "net sales", fullForm: "net sales definition", meaning: "净销售额（计费基数）", exampleScene: "授权合同里被抠字眼最狠的定义" },
      { term: "audit right", fullForm: "right to audit", meaning: "查账权", exampleScene: "确保版税如实申报的监督机制" },
      { term: "shortfall", fullForm: "royalty shortfall", meaning: "版税短付", exampleScene: "触发审计费用转移的临界值" },
    ],
  },
  {
    day: 49,
    title: "Building a Firewall Against IP Filings by Your Own Agent",
    category: "Speaking",
    sceneContext:
      "上一家代理商抢注商标的教训还在流血，新签的泰国与马来经销协议里，你要亲手把防护条款钉进去：禁止越权申请、违约即回转、配合义务到人。对方抗议说'这是不信任的表现'。",
    audioUrl: "",
    targetExpression: {
      english: "This clause isn't about trust — it's standard hygiene: all IP, registered or not, stays ours; any filing you make without written consent is a material breach, and you assign it back to us for one ringgit the day we ask.",
      phoneticAndLinking: "This-clause / is-n't-a-bout-trust / it's-stand-ard-hy-giene / all-I-P / reg-is-tered-or-not / stays-ours / an-y-fil-ing / you-make / with-out-writ-ten / con-sent / is-a-ma-te-ri-al-breach / and-you-as-sign-it / back-to-us / for-one-ring-git / the-day-we-ask → hygiene 重音在第一音节；material breach 连读",
      chinese: "这条不是信不信任——这是标准卫生条款：所有知识产权无论注册与否都归我们；未经书面同意任何申请都构成重大违约，我们要求当天你就得以一令吉转让回来。",
    },
    alternativeExpression: {
      english: "You get full protection for your market investment in the term and territory clauses — the IP clause is one-way by design, because the brand was ours before this deal and stays ours after it ends.",
      phoneticAndLinking: "You-get-full-pro-tec-tion / for-your-mar-ket / in-vest-ment / in-the-term / and-ter-ri-to-ry-claus-es / the-I-P-clause / is-one-way / by-de-sign / be-cause-the-brand / was-ours / be-fore-this-deal / and-stays-ours / af-ter-it-ends → territory 重音在第一音节；one-way 重读强调",
      chinese: "你的市场投入在期限和区域条款里得到了充分保护——知识产权条款故意做成单向的，因为品牌在合作之前是我们的，结束之后还是我们的。",
    },
    businessTakeaway:
      "代理商抢注的成本几乎为零，你跨国追索的成本是六位数美金起——不对称博弈必须用合同前置解决。三件套缺一不可：权属宣示（registered or not 都归你）、违约定性（material breach 可立即解约）、回转机制（一令吉名义对价强制转让）。对方说'不信任'时，用'hygiene'定性反击：刷牙不是不信任牙医。",
    shadowingPractice: [
      "This clause isn't about trust — it's standard hygiene: all IP, registered or not, stays ours; any filing you make without written consent is a material breach, and you assign it back to us for one ringgit the day we ask.",
      "You get full protection for your market investment in the term and territory clauses — the IP clause is one-way by design, because the brand was ours before this deal and stays ours after it ends.",
    ],
    glossaryItems: [
      { term: "material breach", fullForm: "material breach", meaning: "重大违约", exampleScene: "触发立即解约权的违约等级" },
      { term: "IP assignment", fullForm: "IP assignment clause", meaning: "知识产权转让条款", exampleScene: "强制越权方回转权利的合同机制" },
      { term: "nominal consideration", fullForm: "nominal consideration (e.g. RM1)", meaning: "名义对价", exampleScene: "一令吉转让：让回转可执行的技术设计" },
      { term: "territory clause", fullForm: "territory and term clause", meaning: "区域与期限条款", exampleScene: "平衡代理商利益、换取 IP 单向保护的筹码" },
    ],
  },
  {
    day: 50,
    title: "Emergency Legal Moves When a Trade Secret Walks Out the Door",
    category: "Listening",
    sceneContext:
      "周五晚上九点，你的生产主管辞职，下周一入职竞争对手，而他电脑里的配方文件三天前有批量外发记录。律师用极快的英语布置 24 小时行动清单：证据保全、单方禁令、法院排期。每个字都值钱，你必须全部接住。",
    audioUrl: "",
    targetExpression: {
      english: "So the sequence is: forensic image of his laptop tonight, preserve the mail server logs, then we file for an ex parte injunction before Monday — what exactly do you need from my side in the next twenty-four hours?",
      phoneticAndLinking: "So-the-se-quence-is / fo-ren-sic-im-age / of-his-lap-top / to-night / pre-serve-the-mail / ser-ver-logs / then-we-file / for-an-ex-par-te / in-junc-tion / be-fore-Mon-day / what-ex-act-ly / do-you-need / from-my-side / in-the-next / twen-ty-four-hours → ex parte 读 /ˌeks ˈpɑːti/；forensic 重音在第二音节",
      chinese: "所以顺序是：今晚对他笔记本做司法镜像取证、保全邮件服务器日志、然后周一前申请单方临时禁令——未来 24 小时你具体需要我方提供什么？",
    },
    alternativeExpression: {
      english: "Speed matters more than perfection here — if the injunction lands before he starts the new job, the files stay frozen; if we're a week late, the recipe is in production at a factory we'll never find.",
      phoneticAndLinking: "Speed-mat-ters / more-than-per-fec-tion / here / if-the-in-junc-tion-lands / be-fore-he-starts / the-new-job / the-files-stay-fro-zen / if-we're-a-week-late / the-rec-i-pe / is-in-pro-duc-tion / at-a-fac-to-ry / we'll-nev-er-find → injunction 重音在 -junc-；frozen 重音在第一音节",
      chinese: "这里速度比完美重要——禁令在他入职前落地，文件就被冻结；我们晚一周，配方就会在某个我们永远找不到的工厂里投产。",
    },
    businessTakeaway:
      "商业机密泄露的抢救窗口以小时计。听懂律师方案时记住黄金顺序：先固证（forensic image 必须在对方知情前完成，防止灭失反咬）、再冻结（ex parte 单方禁令无需通知对方，防止他转移文件）、后谈判。你在电话里唯一要确认的是'what do you need from my side'——把执行责任钉到具体材料与时点上。这一仗打赢靠速度，打输全因犹豫。",
    shadowingPractice: [
      "So the sequence is: forensic image of his laptop tonight, preserve the mail server logs, then we file for an ex parte injunction before Monday — what exactly do you need from my side in the next twenty-four hours?",
      "Speed matters more than perfection here — if the injunction lands before he starts the new job, the files stay frozen; if we're a week late, the recipe is in production at a factory we'll never find.",
    ],
    glossaryItems: [
      { term: "trade secret", fullForm: "trade secret protection", meaning: "商业机密保护", exampleScene: "配方、工艺、客户名单的法律护甲" },
      { term: "injunction", fullForm: "interim injunction", meaning: "临时禁令", exampleScene: "法院强制冻结行为的紧急救济" },
      { term: "ex parte", fullForm: "ex parte application", meaning: "单方申请（不通知对方）", exampleScene: "防止对方毁灭证据的程序设计" },
      { term: "forensic image", fullForm: "forensic disk image", meaning: "司法取证镜像", exampleScene: "法庭认可的电子证据固定方式" },
    ],
  },
];
