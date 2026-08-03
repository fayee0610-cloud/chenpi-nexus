// ============================================================
// siteData.ts — 全站统一配置与 Mock 数据中心
// 所有静态文本、作品、灵感文章、庇护所初始数据集中于此
// ============================================================

// ========== 类型定义 ==========

export interface ContentBlock {
  type: "paragraph" | "blockquote" | "code" | "heading" | "list";
  text?: string;
  items?: string[];
  lang?: string;
}

export interface Metric {
  value: string;
  label: string;
}

export interface Solution {
  title: string;
  detail: string;
}

export interface PortfolioProject {
  id: number;
  title: string;
  subTitle: string;
  image: string;
  date: string;
  role: string;
  metrics: Metric[];
  tags: string[];
  tab: "brand" | "ai" | "experiment";
  category: string;
  challenge: string;
  solutions: Solution[];
  demoUrl?: string;
}

export interface InsightItem {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  type: "all" | "featured" | "article" | "short" | "podcast";
  category: string;
  readTime?: string;
  listenTime?: string;
  isFeatured?: boolean;
  date: string;
  author: string;
  views: string;
  likes: number;
  content: ContentBlock[];
}

export interface SanctuaryComment {
  author: string;
  text: string;
  time: string;
}

export interface SanctuaryPost {
  id: number;
  content: string;
  tag: string;
  tagColor: string;
  author: string;
  time: string;
  likes: number;
  reactions: { cool: number; biz: number; hard: number; fake: number };
  comments: SanctuaryComment[];
  isNew?: boolean;
}

export interface Incense {
  id: string;
  emoji: string;
  name: string;
  color: string;
  glowClass: string;
  borderClass: string;
  count: number;
}

export interface ResourceItem {
  id: string;
  title: string;
  excerpt: string;
  outline: string[];
  fileUrl?: string;
  fileSize?: string;
  category: string;
  requireLogin: boolean;
  isPublished: boolean;
  downloadCount: number;
  date: string;
}

export type InsightHubCategory = "🤖 机器人/具身智能" | "⚡ AI技术/大厂策略" | "📈 品牌策略/GTM干货";

export interface InsightHubItem {
  id: string;
  title: string;
  category: InsightHubCategory;
  summary: string;
  sourceName: string;
  originalUrl: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured?: boolean;
  apiSource?: string; // 标识来源：'manual' | 'auto_bot'
  tags?: string[]; // 标签数组，如 ['ToB营销', 'GTM策略', '品牌定位']
}

// ========== 1. 个人简介与 Hero 区 ==========

export const profile = {
  name: "陈皮同学",
  nameEn: "My Neural Hub",
  title: "这里，连接创意、AI 与市场",
  subTitle: "品牌策略人 / AI+硬件探索者 / 脑洞创造者",
  status: "正在探索：AI 硬件 / 品牌策略",
  avatarUrl: "/avatar.png",
  tags: ["新马 / 香港 / 深圳", "品牌战术", "超级个体"],
  quote: "就探索点什么，从一件小事开始。",
};

// ========== 2. 联系方式 ==========

export const contact = {
  email: "fayee0610@gmail.com",
  wechatId: "CHENPI_MKT",
  copyright: "© 2025 陈皮同学 My Neural Hub",
};

// ========== 3. 作品集 ==========

export const portfolio = {
  categories: [
    { key: "brand" as const, label: "品牌与市场战术" },
    { key: "ai" as const, label: "AI 与硬件探索" },
    { key: "experiment" as const, label: "阶段性创意实验" },
  ],
  projects: [
    {
      id: 1,
      title: "新马 & 跨境品牌全球化定位与 DTC 独立站增长路线",
      subTitle: "从 0 到 1 搭建跨境品牌定位体系，驱动 DTC 独立站增长飞轮",
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=600&fit=crop",
      date: "2024.03 - 2024.09",
      role: "品牌策略总监",
      metrics: [
        { value: "GMV +180%", label: "海外独立站季度增长" },
        { value: "100k+", label: "搜索品牌词曝光突破" },
        { value: "3.2%", label: "独立站转化率" },
      ],
      tags: ["品牌战术", "跨境出海", "独立站"],
      tab: "brand" as const,
      category: "品牌与市场战术",
      challenge: "新马地区消费电子品牌面临出海定位模糊、DTC 独立站流量结构单一、品牌词搜索量近乎为零的困境。传统铺货模式遭遇平台流量红利见顶，亟需建立品牌侧护城河与独立增长通道。",
      solutions: [
        { title: "品牌定位与视觉体系重塑", detail: "基于东南亚 + 欧美双市场调研，提炼品牌核心价值主张，重构视觉识别系统（VI），建立跨市场统一的品牌叙事框架。" },
        { title: "DTC 独立站增长飞轮搭建", detail: "搭建 Shopify 独立站 + Google Ads + Meta Ads 投放体系，配合 SEO 内容矩阵与 KOL 合作，实现自然流量占比从 5% 提升至 35%。" },
        { title: "数据驱动的用户留存策略", detail: "部署 GA4 + Mixpanel 事件追踪，构建用户分层 RFM 模型，通过 EDM 与再营销广告将复购率提升至 42%。" },
      ],
      demoUrl: "https://example.com/demo-brand",
    },
    {
      id: 2,
      title: "AI Agent 赋能硬件选型与自动化市场情报系统",
      subTitle: "搭建多 Agent 协作系统，实现硬件选型与市场情报的全自动化",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
      date: "2024.06 - 至今",
      role: "AI 硬件探索者 & 架构设计",
      metrics: [
        { value: "效率 +400%", label: "情报收集效率提升" },
        { value: "10+", label: "自动化 Workflow" },
        { value: "24/7", label: "全天候市场监控" },
      ],
      tags: ["AI 硬件", "Coze/OpenClaw", "自动化"],
      tab: "ai" as const,
      category: "AI 与硬件探索",
      challenge: "硬件选型需跨数十个供应商比对参数与价格，市场情报依赖人工爬取与整理，效率低、覆盖窄、延迟高。团队需要一个能 7×24 自动运转的情报系统来支撑快速决策。",
      solutions: [
        { title: "多 Agent 协作架构设计", detail: "基于 Coze / OpenClaw 搭建「采集 Agent → 分析 Agent → 决策 Agent」三层架构，自动抓取供应商数据、比对参数、生成选型报告。" },
        { title: "10+ 自动化 Workflow 编排", detail: "覆盖价格监控、竞品分析、供应链预警、需求趋势预测等场景，情报产出从人工 3 天压缩至自动 15 分钟。" },
        { title: "硬件选型知识图谱", detail: "构建设备参数知识图谱与供应商评分模型，结合 AI 推荐引擎，将选型决策准确率提升至 92%。" },
      ],
      demoUrl: "https://example.com/demo-ai",
    },
    {
      id: 3,
      title: "「湾区博聘」超级个体多平台内容与灵感测试",
      subTitle: "以超级个体身份搭建多平台内容矩阵，验证冷启动方法论",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
      date: "2024.01 - 2024.06",
      role: "脑洞创造者 & 独立运营",
      metrics: [
        { value: "4000+", label: "冷启动高粘性读者" },
        { value: "20w+", label: "矩阵曝光量" },
        { value: "12%", label: "互动率（行业均值 3%）" },
      ],
      tags: ["创意实验", "内容矩阵", "极客尝试"],
      tab: "experiment" as const,
      category: "阶段性创意实验",
      challenge: "以一人之力验证「超级个体」内容矩阵的可行性——在没有团队、没有预算的前提下，能否通过多平台内容分发与精准话题运营，在 6 个月内建立高粘性读者群？",
      solutions: [
        { title: "多平台内容矩阵搭建", detail: "同步运营公众号、小红书、即刻、少数派 4 个平台，针对不同平台调性定制内容切片策略，单篇内容复用率达到 300%。" },
        { title: "热点话题雷达与快速创作", detail: "搭建基于 RSS + AI 摘要的话题监控系统，从热点发现到内容发布平均周期 < 4 小时，抢占了多个行业话题首发窗口。" },
        { title: "读者社群与反馈飞轮", detail: "通过「内容 → 评论区互动 → 社群沉淀 → 下期选题」的闭环，将读者互动率稳定在 12%，远超行业 3% 均值。" },
      ],
    },
  ] as PortfolioProject[],
};

// ========== 4. 灵感点文章 ==========

export const insights: InsightItem[] = [
  {
    id: 1,
    title: "从品牌战术到超级个体：AI 时代下 B2B 营销人的「第二曲线」",
    excerpt: "当 AI 工具爆发的当下，如何将传统品牌策略与自动化 Workflow 结合，重塑个人生产力，找到属于你的第二增长曲线。",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    type: "article",
    category: "✦ 深度长文",
    readTime: "5 min",
    isFeatured: true,
    date: "2024.07.15",
    author: "陈述中马 / 策略探索者",
    views: "3,247",
    likes: 186,
    content: [
      { type: "paragraph", text: "过去十年，B2B 营销人的核心能力是「信息差」——你知道客户不知道的渠道、工具和打法。但 AI 工具的爆发正在以前所未有的速度抹平这个差值。当你的客户也能用 ChatGPT 写出像样的品牌方案时，你的价值锚点在哪里？" },
      { type: "blockquote", text: "真正的壁垒不再是「知道什么」，而是「能把知道的东西系统化地执行出来」。" },
      { type: "heading", text: "第一曲线：品牌战术的存量价值" },
      { type: "paragraph", text: "传统品牌策略的核心是定位、视觉、传播三件套。这套体系不会失效，但它的边际收益正在递减。客户越来越不愿意为一份 PPT 付费，他们要的是「能落地的增长」。" },
      { type: "heading", text: "第二曲线：AI 工作流 + 超级个体" },
      { type: "paragraph", text: "我自己的实践路径是：把品牌策略的每个环节拆解成可自动化的 Workflow。竞品分析交给爬虫 Agent，内容初稿交给 LLM，数据监控交给自动化看板。人的精力聚焦在「判断」和「创意」这两个 AI 替代不了的环节。" },
      { type: "code", lang: "workflow", text: "# 超级个体工作流示例\n竞品监控 Agent → 数据清洗 → 趋势分析 Agent\n    ↓\n内容生成 Agent → 人工审核 → 多平台分发\n    ↓\n效果追踪 Agent → ROI 报告 → 策略迭代" },
      { type: "heading", text: "落地建议" },
      { type: "list", items: ["先选一个你最擅长的环节，用 AI 工具将其效率提升 3 倍以上", "把节省的时间投入到客户关系和创意决策中，而非接更多项目", "逐步搭建个人品牌资产，让「你」本身成为可被搜索到的品牌词"] },
      { type: "blockquote", text: "AI 不会取代营销人，但会用 AI 的营销人一定会取代不用的人。关键是：你愿意花多少时间把自己的工作流「拆解重装」？" },
    ],
  },
  {
    id: 2,
    title: "为什么大部分「AI 硬件脑洞」都死在了伪需求与供应链？",
    excerpt: "从深圳硬件供应链视角与产品落地逻辑，拆解真正有价值的 AI 硬件切入点。不是加了 LLM 就是好产品。",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop",
    type: "short",
    category: "短观点",
    readTime: "2 min",
    isFeatured: true,
    date: "2024.07.08",
    author: "陈述中马 / 策略探索者",
    views: "1,892",
    likes: 143,
    content: [
      { type: "paragraph", text: "在深圳待了三年，见过太多 AI 硬件项目的起落。大部分「AI 硬件脑洞」的死法惊人地一致：PPT 阶段让人眼前一亮，打样阶段发现问题一堆，量产阶段供应链直接教你做人。" },
      { type: "blockquote", text: "AI 硬件的核心矛盾：软件可以快速迭代，但硬件一旦开模就是百万级的沉没成本。" },
      { type: "heading", text: "三种典型的伪需求" },
      { type: "list", items: ["「加了语音助手的 XX」——如果没有解决交互效率问题，语音只是噱头", "「AI 儿童/老人陪伴机器人」——情感需求很难被机器满足，复购率极低", "「AI + 某个小家电」——用户只为功能付费，不为 AI 溢价买单"] },
      { type: "heading", text: "真正有价值的切入点" },
      { type: "paragraph", text: "好的 AI 硬件应该是「减少决策」而非「增加功能」。比如：能自动识别食材并推荐菜谱的智能秤，能根据睡眠数据自动调节温度的温控器。核心逻辑是——让 AI 在后台工作，用户感受到的是「更省心」而非「更智能」。" },
    ],
  },
  {
    id: 3,
    title: "[Podcast Ep.04] 聊聊吉隆坡与大湾区：跨境出海的文化场与市场破局",
    excerpt: "15 分钟音频对话与文字整理摘要，探讨东南亚市场的真实机会、文化适配与渠道选择。",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=800&h=500&fit=crop",
    type: "podcast",
    category: "🎙️ 音频思考",
    listenTime: "15 min",
    isFeatured: true,
    date: "2024.06.28",
    author: "陈述中马 / 策略探索者",
    views: "967",
    likes: 78,
    content: [
      { type: "paragraph", text: "这期播客录制于吉隆坡一间老茶室。和一位在东南亚做了 5 年跨境品牌的朋友聊了聊真实的出海体验——不是 PPT 上的「人口红利」，而是踩过坑之后的复盘。" },
      { type: "blockquote", text: "东南亚不是一个市场，是十个截然不同的市场。用一套打法通吃，是出海最大的幻觉。" },
      { type: "heading", text: "关键话题时间线" },
      { type: "list", items: ["02:30 — 为什么选吉隆坡作为东南亚测试起点", "05:15 — 新马 vs 印尼：华人文化圈的共性差异", "08:40 — 大湾区供应链优势在出海中的角色", "11:20 — 渠道选择：Shopee、Lazada 还是独立站？", "13:45 — 给首次出海的品牌的三条避坑建议"] },
      { type: "heading", text: "核心观点摘要" },
      { type: "paragraph", text: "新马市场虽然体量不如印尼，但华人占比高、消费习惯接近国内，是最低成本的出海测试场。验证完产品-市场匹配后，再向印尼、泰国扩展。大湾区的供应链优势在出海中不仅是成本优势，更是「快速迭代」的能力——这点很多人低估了。" },
      { type: "code", lang: "strategy", text: "# 出海测试路径\n吉隆坡 MVP 测试 (2-3 月)\n    ↓\n新马全渠道铺开 (3-6 月)\n    ↓\n印尼/泰国 扩展 (6-12 月)\n    ↓\n东南亚全域品牌建设 (12 月+)" },
      { type: "blockquote", text: "出海不是翻译网站，是重新理解一群人的生活方式。先去当地住一个月，比看一百份报告都有用。" },
    ],
  },
  {
    id: 4,
    title: "营销自动化工具的选型陷阱与避坑指南",
    excerpt: "市面上 80% 的 MarTech 工具都在贩卖焦虑，真正有价值的只有这三类。",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    type: "article",
    category: "图文长文",
    readTime: "8 min",
    date: "2024.06.20",
    author: "陈述中马 / 策略探索者",
    views: "2,103",
    likes: 95,
    content: [
      { type: "paragraph", text: "每次参加 MarTech 大会，都能看到几百个新工具。但真正用过之后你会发现，80% 的工具解决的是「不存在的问题」。" },
      { type: "blockquote", text: "选工具的第一原则：先明确痛点，再找工具。而不是反过来。" },
      { type: "heading", text: "真正值得投入的三类工具" },
      { type: "list", items: ["数据层：统一客户数据平台（CDP），打通多触点行为数据", "自动化层：能编排多步骤工作流的引擎（如 n8n / Coze）", "分析层：能归因到渠道 ROI 的分析工具（如 GA4 + Mixpanel）"] },
    ],
  },
  {
    id: 5,
    title: "短观点：内容复利 > 流量赌博",
    excerpt: "可持续的内容资产才是长期 ROI 的来源。",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    type: "short",
    category: "短观点",
    readTime: "1 min",
    date: "2024.06.15",
    author: "陈述中马 / 策略探索者",
    views: "1,456",
    likes: 67,
    content: [
      { type: "paragraph", text: "很多人把内容营销当成「买流量」的替代品——发一篇帖子，看阅读量，算 ROI。但内容真正的价值是复利。" },
      { type: "blockquote", text: "一篇深度文章发布 6 个月后还在带来搜索流量，这才是内容资产的真正回报周期。" },
    ],
  },
  {
    id: 6,
    title: "播客 EP.03 | 品牌人如何与 AI 协作而不被取代",
    excerpt: "28 分钟对话，聊聊 AI 时代品牌人的生存策略与工具链。",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop",
    type: "podcast",
    category: "🎙️ 音频思考",
    listenTime: "28 min",
    date: "2024.06.10",
    author: "陈述中马 / 策略探索者",
    views: "823",
    likes: 54,
    content: [
      { type: "paragraph", text: "这期聊了一个很实际的问题：品牌团队应该怎么引入 AI 工具，而不只是停留在「用 ChatGPT 写文案」的层面。" },
      { type: "blockquote", text: "AI 协作的关键不是「让 AI 做更多」，而是「让人做更对的事」。" },
    ],
  },
];

// ========== 5. 庇护所 ==========

export const sanctuary = {
  initialEnergy: 1842,

  incenseBuffs: [
    "功德 +1",
    "运势 +100",
    "甲方沟通顺畅度 +50%",
    "Bug 自动消失 +1",
    "发量 +1",
    "脑洞清晰度 +200%",
    "✨ 欧气爆棚：方案一次过审！",
    "灵感涌入速度 +300%",
    "下班准时率 +99%",
  ],

  fortunes: [
    "今日宜：开始一件小事，去写下一个不成熟的脑洞",
    "今日宜：大胆提案，甲方今天心情不错",
    "今日宜：和 AI 聊聊，它会给你意想不到的灵感",
    "今日宜：整理旧作品，会有新的发现",
    "今日宜：休息一下，最好的创意往往在放松时降临",
    "今日宜：把那个疯狂的念头说出来，也许有人懂",
  ],

  // 分类金句库：基于情绪分类，每条为固定 3 行语意数组
  fortuneLibrary: {
    inspiration: {
      label: "灵感爆棚",
      icon: "💡",
      color: "text-purple-400 border-purple-500/40 bg-purple-500/10",
      themeColor: "neon-green",
      highlightColor: "#10B981",
      quotes: [
        { id: "ins-1", category: "💡 灵感爆棚", themeColor: "neon-green", lines: ["AI 不是替代你的想象力，", "而是放大你灵感的", "赛博杠杆。"], highlightIndex: 2 },
        { id: "ins-2", category: "💡 灵感爆棚", themeColor: "neon-green", lines: ["最大的商业机会，", "往往藏在旧行业与新工具的", "断层缝隙里。"], highlightIndex: 2 },
        { id: "ins-3", category: "💡 灵感爆棚", themeColor: "neon-green", lines: ["不要用战术上的勤奋，", "掩盖战略上的", "偷懒与恐惧。"], highlightIndex: 2 },
        { id: "ins-4", category: "💡 灵感爆棚", themeColor: "neon-green", lines: ["品牌不是一句空洞的口号，", "而是每一个交付细节中", "复利的信任。"], highlightIndex: 2 },
      ],
    },
    growth: {
      label: "破局焦虑",
      icon: "🚀",
      color: "text-blue-400 border-blue-500/40 bg-blue-500/10",
      themeColor: "amber-gold",
      highlightColor: "#F59E0B",
      quotes: [
        { id: "gro-1", category: "🚀 破局焦虑", themeColor: "amber-gold", lines: ["破局的唯一方式，", "不是做得更多，", "而是砍掉 80% 的伪需求。"], highlightIndex: 2 },
        { id: "gro-2", category: "🚀 破局焦虑", themeColor: "amber-gold", lines: ["焦虑源于不确定性，", "而终结焦虑的唯一解，", "是极速交付。"], highlightIndex: 2 },
        { id: "gro-3", category: "🚀 破局焦虑", themeColor: "amber-gold", lines: ["种一棵树最好的时间是十年前，", "其次是现在，", "用 AI 敏捷把树种出来。"], highlightIndex: 2 },
        { id: "gro-4", category: "🚀 破局焦虑", themeColor: "amber-gold", lines: ["与其在红海里卷低价，", "不如用数字独立站", "重新定义产品价值。"], highlightIndex: 2 },
      ],
    },
    healing: {
      label: "赛博疗愈",
      icon: "🌿",
      color: "text-green-400 border-green-500/40 bg-green-500/10",
      themeColor: "electric-blue",
      highlightColor: "#3B82F6",
      quotes: [
        { id: "hea-1", category: "🌿 赛博疗愈", themeColor: "electric-blue", lines: ["允许自己是个超级个体，", "但要像大军团一样", "思考与呼吸。"], highlightIndex: 0 },
        { id: "hea-2", category: "🌿 赛博疗愈", themeColor: "electric-blue", lines: ["赛博时代的温度，", "来自于算法之外，", "你对人性的极致洞察。"], highlightIndex: 2 },
        { id: "hea-3", category: "🌿 赛博疗愈", themeColor: "electric-blue", lines: ["深夜的每一个脑洞，", "都是你在赛博世界里", "安放灵魂的角落。"], highlightIndex: 2 },
        { id: "hea-4", category: "🌿 赛博疗愈", themeColor: "electric-blue", lines: ["不必向所有人解释你的路线，", "赛博时代的轻舟，", "已过万重山。"], highlightIndex: 2 },
      ],
    },
  },

  incenses: [
    { id: "1", emoji: "🕯️", name: "方案一次过", color: "text-blue-400", glowClass: "shadow-blue-500/40", borderClass: "hover:border-blue-500/50", count: 128 },
    { id: "2", emoji: "💰", name: "甲方即刻回款", color: "text-amber-400", glowClass: "shadow-amber-500/40", borderClass: "hover:border-amber-500/50", count: 96 },
    { id: "3", emoji: "💡", name: "灵感瞬间爆发", color: "text-purple-400", glowClass: "shadow-purple-500/40", borderClass: "hover:border-purple-500/50", count: 234 },
    { id: "4", emoji: "🕊️", name: "沟通极其顺畅", color: "text-green-400", glowClass: "shadow-green-500/40", borderClass: "hover:border-green-500/50", count: 167 },
    { id: "5", emoji: "💥", name: "品牌防塌房", color: "text-red-400", glowClass: "shadow-red-500/40", borderClass: "hover:border-red-500/50", count: 88 },
    { id: "6", emoji: "🚀", name: "准点无痛下班", color: "text-orange-400", glowClass: "shadow-orange-500/40", borderClass: "hover:border-orange-500/50", count: 312 },
  ] as Incense[],

  postTagOptions: [
    { label: "💡 概念萌芽", color: "text-blue-400 bg-blue-500/10" },
    { label: "🔥 职场发疯/吐槽", color: "text-red-400 bg-red-500/10" },
    { label: "🤖 AI 硬件想法", color: "text-purple-400 bg-purple-500/10" },
  ],

  initialPosts: [
    {
      id: 1,
      content: "做一款只有墨水屏和 3 个物理按键的赛博灵感卡片，连着 Coze 接口，随时按一下就把声音转成结构化 Prompt 存回 Notion，大家觉得有戏吗？",
      tag: "💡 概念萌芽",
      tagColor: "text-blue-400 bg-blue-500/10",
      author: "赛博农夫",
      time: "2小时前",
      likes: 42,
      reactions: { cool: 12, biz: 8, hard: 3, fake: 2 },
      comments: [
        { author: "硬件老兵", text: "墨水屏 + 物理按键的成本可以压到 80 块以内，有戏。", time: "1小时前" },
        { author: "产品经理阿May", text: "关键不是硬件，是后面的 Prompt 模板库做不做得好。", time: "30分钟前" },
        { author: "赛博农夫", text: "对，所以我打算先做软件 MVP，再反推硬件。", time: "10分钟前" },
      ],
    },
    {
      id: 2,
      content: "甲方说要「既有大厂的稳重，又有赛博朋克的叛逆，还要带一点新马东南亚本土风情」，我直接把上香页面发给了他。",
      tag: "🔥 职场发疯",
      tagColor: "text-red-400 bg-red-500/10",
      author: "策略打工人",
      time: "5小时前",
      likes: 89,
      reactions: { cool: 45, biz: 2, hard: 30, fake: 8 },
      comments: [
        { author: "设计受害者", text: "甲方看完上香页面说：这个可以，但能不能再大气一点？", time: "4小时前" },
        { author: "策略打工人", text: "我反手给他上了一柱「品牌防塌房香」", time: "3小时前" },
      ],
    },
    {
      id: 3,
      content: "做 independent B2B 独立站的第 30 天，把全流程 Workflow 接上了 AI 自动化，感觉一个人真的能打出一个小团队的产出。",
      tag: "✦ 阶段探索",
      tagColor: "text-purple-400 bg-purple-500/10",
      author: "深圳探索者",
      time: "1天前",
      likes: 56,
      reactions: { cool: 20, biz: 18, hard: 4, fake: 1 },
      comments: [
        { author: "独立开发者K", text: "同感，AI 自动化让单人作战成为可能。你用的什么 Workflow 工具？", time: "20小时前" },
        { author: "深圳探索者", text: "Coze + n8n + Notion，三件套够用了", time: "18小时前" },
      ],
    },
  ] as SanctuaryPost[],
};

// ========== 6. 陈皮 AI (Mascot) ==========

export const mascot = {
  name: "陈皮 AI",
  tagline: "陈皮同学的 24/7 赛博数字分身",
  bubbles: [
    "今日方案过审率 99%，来上根香？",
    "又在发呆？灵感不会自己敲门。",
    "需要我帮你整理作品集思路吗？",
    "新的一周，新的甲方，新的修行。",
    "休息一下吧，你已经看了三小时屏幕了。",
    "赛博功德 +1，今日运势：宜提案。",
  ],

  quickPrompts: [
    "💡 陈皮的主要背景与核心能力",
    "🚀 陶瓷品牌出海与跨境营销案例",
    "🧠 推荐关于 OPC / AI 自动化流程的深度文章",
    "🤝 如何与陈皮建立项目合作？",
  ],
};

// ========== 7. 资源包（Resource Hub）Mock 数据 ==========

export const resources: ResourceItem[] = [
  {
    id: "res-1",
    title: "AI 硬件 GEO 指南",
    excerpt: "从 0 到 1 拆解 AI 硬件产品的搜索引擎优化策略，覆盖 GEO（Generative Engine Optimization）核心方法论。",
    outline: [
      "AI 硬件搜索生态现状",
      "GEO vs 传统 SEO 差异",
      "结构化数据标记实操",
      "AI 助理收录优化清单",
    ],
    fileUrl: "",
    fileSize: "2.4 MB",
    category: "指南",
    requireLogin: true,
    isPublished: true,
    downloadCount: 128,
    date: "2025.07.15",
  },
  {
    id: "res-2",
    title: " OPC 超级个体运营手册",
    excerpt: "一人公司（One Person Company）的全栈运营框架，含自动化工具链与增长杠杆清单。",
    outline: [
      "OPC 核心能力模型",
      "自动化工具链选型",
      "增长杠杆矩阵",
      "一人团队时间管理",
    ],
    fileUrl: "",
    fileSize: "1.8 MB",
    category: "手册",
    requireLogin: true,
    isPublished: true,
    downloadCount: 86,
    date: "2025.06.28",
  },
  {
    id: "res-3",
    title: "品牌出海拉丁美洲速览",
    excerpt: "拉美市场品牌进入策略速览，含消费者洞察、渠道选择与本地化关键点。",
    outline: [
      "拉美六国市场概览",
      "消费者画像与决策路径",
      "渠道优先级矩阵",
      "本地化避坑清单",
    ],
    fileUrl: "",
    fileSize: "3.1 MB",
    category: "报告",
    requireLogin: false,
    isPublished: true,
    downloadCount: 42,
    date: "2025.05.10",
  },
];

// ========== 8. 情报站 (Information Hub) 数据 ==========
// 由 AI (DeepSeek) 自动生成，基于最新科技商业动态

export const insightsHub: InsightHubItem[] = [
  {
    id: "hub-1",
    title: "智元远征A2量产，具身智能进入千台时代",
    category: "🤖 机器人/具身智能",
    summary: "智元机器人宣布远征A2系列正式量产，年产能规划达千台级，标志着人形机器人从实验室走向规模化交付。商业价值在于其供应链整合能力与工业场景落地速度，直接对标特斯拉Optimus的降本路径，为投资人提供了具身智能商业化兑现的观察样本。",
    sourceName: "智元机器人官方",
    originalUrl: "https://www.zhiyuan-robot.com/news",
    publishedAt: "2025.07.20",
    isPublished: true,
    isFeatured: true,
    apiSource: "auto_bot",
    tags: ["人形机器人", "量产", "智元"],
  },
  {
    id: "hub-2",
    title: "宇树科技发布通用机器人操作大模型",
    category: "🤖 机器人/具身智能",
    summary: "宇树科技推出机器人操作大模型，实现跨场景的物体抓取与工具使用泛化能力。该模型采用端到端学习，大幅降低对特定任务编程的依赖，商业上瞄准物流分拣与家庭服务市场，其技术路线可能重塑机器人软件生态的竞争格局，值得关注其后续API开放策略。",
    sourceName: "宇树科技官方公众号",
    originalUrl: "https://www.unitree.com/cn/news",
    publishedAt: "2025.07.18",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["操作大模型", "宇树", "泛化能力"],
  },
  {
    id: "hub-3",
    title: "逐际动力获顶级风投融资，主攻工业巡检",
    category: "🤖 机器人/具身智能",
    summary: "逐际动力完成新一轮数亿元融资，资金将用于强化其在能源、石化等垂直领域的四足机器人巡检解决方案。其商业模式从卖硬件转向提供“硬件+AI检测+数据服务”的订阅制，客单价与客户粘性显著提升，为具身智能在B端的高毛利变现提供了新范本。",
    sourceName: "36Kr 深度报道",
    originalUrl: "https://36kr.com/newsflashes",
    publishedAt: "2025.07.16",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["融资", "工业巡检", "订阅制"],
  },
  {
    id: "hub-4",
    title: "OpenAI发布GPT-5，推理成本骤降90%",
    category: "⚡ AI技术/大厂策略",
    summary: "OpenAI正式推出GPT-5，采用混合专家架构与新的推理蒸馏技术，在同等任务下推理成本较GPT-4降低90%。这一杀手锏直接冲击ToB市场，使得AI原生应用的经济模型跑通。商业上，OpenAI正从卖API转向卖“结果”，其定价策略将倒逼Anthropic与谷歌跟进，引发企业级AI采用率的爆发。",
    sourceName: "OpenAI 官方博客",
    originalUrl: "https://openai.com/blog",
    publishedAt: "2025.07.14",
    isPublished: true,
    isFeatured: true,
    apiSource: "auto_bot",
    tags: ["GPT-5", "推理成本", "OpenAI"],
  },
  {
    id: "hub-5",
    title: "Anthropic发布Claude企业版，主打安全与合规",
    category: "⚡ AI技术/大厂策略",
    summary: "Anthropic推出Claude Enterprise版本，重点强化SOC 2 Type II合规、细粒度权限管理及审计日志功能，直击金融、医疗等高监管行业痛点。其GTM策略放弃低价竞争，通过“安全即服务”的溢价定位，与微软Azure的深度绑定，正在撬动Palantir的存量政企客户，是ToB AI领域最值得研究的ABM案例。",
    sourceName: "Anthropic 官方新闻室",
    originalUrl: "https://www.anthropic.com/news",
    publishedAt: "2025.07.12",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["企业版", "合规", "Anthropic"],
  },
  {
    id: "hub-6",
    title: "华为发布盘古大模型5.0，深耕行业Agent",
    category: "⚡ AI技术/大厂策略",
    summary: "华为在开发者大会发布盘古大模型5.0，不再强调参数规模，转而聚焦矿山、气象、铁路等行业的专用Agent解决方案。其策略是“AI+行业知识”深度绑定，通过昇腾算力底座形成软硬一体壁垒。商业价值在于，华为正以“被集成”模式赋能央国企数字化，其项目制交付的GTM打法对本土AI公司极具参考意义。",
    sourceName: "华为开发者大会2025",
    originalUrl: "https://developer.huawei.com/consumer/cn/",
    publishedAt: "2025.07.10",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["盘古大模型", "行业Agent", "华为"],
  },
  {
    id: "hub-7",
    title: "Apple Vision Pro 2发布，转向生产力工具叙事",
    category: "📈 品牌策略/GTM干货",
    summary: "Apple在WWDC发布Vision Pro 2，重点转向多屏办公与3D设计协作，弱化娱乐属性。其营销叙事从“空间计算”转向“终极生产力外设”，并推出企业API接口。商业意图明显：通过绑定Mac生态与Final Cut Pro等专业软件，在B端设计、医疗、工程领域寻找第二增长曲线，对抗Meta的Quest Pro。",
    sourceName: "Apple WWDC 2025 主题演讲",
    originalUrl: "https://www.apple.com/apple-events/",
    publishedAt: "2025.07.08",
    isPublished: true,
    isFeatured: true,
    apiSource: "auto_bot",
    tags: ["Vision Pro", "生产力", "苹果"],
  },
  {
    id: "hub-8",
    title: "特斯拉Cybertruck交付，情绪价值驱动品牌溢价",
    category: "📈 品牌策略/GTM干货",
    summary: "特斯拉Cybertruck终于开启大规模交付，其颠覆性外观与“防弹”不锈钢车身成为社交货币。营销上，特斯拉放弃传统广告，通过马斯克个人IP与车主UGC内容制造持续热度。商业价值在于，Cybertruck并非走量车型，而是通过极致差异化强化特斯拉“科技先锋”的品牌心智，反哺Model 3/Y的销量，是情绪价值营销的教科书案例。",
    sourceName: "Tesla 官方新闻",
    originalUrl: "https://www.tesla.com/blog",
    publishedAt: "2025.07.06",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["Cybertruck", "情绪价值", "特斯拉"],
  },
  {
    id: "hub-9",
    title: "HubSpot发布AI Agent，重构Inbound营销漏斗",
    category: "📈 品牌策略/GTM干货",
    summary: "HubSpot推出Breeze AI Agent，能自动完成线索打分、邮件触达与内容个性化。其GTM策略是“PLG+AI”，将AI能力嵌入免费版工具，以极低门槛吸引SMB用户，再通过付费墙解锁高级自动化。此举正在颠覆传统Demand Gen流程，其产品驱动增长的路径与定价模型，是SaaS公司应对AI浪潮的标杆。",
    sourceName: "HubSpot 官方产品博客",
    originalUrl: "https://www.hubspot.com/product/news",
    publishedAt: "2025.07.04",
    isPublished: true,
    isFeatured: false,
    apiSource: "auto_bot",
    tags: ["AI Agent", "PLG", "HubSpot"],
  },
];

// ========== 统一导出 ==========

export const siteData = {
  profile,
  contact,
  portfolio,
  insights,
  sanctuary,
  mascot,
  resources,
  insightsHub,
};
