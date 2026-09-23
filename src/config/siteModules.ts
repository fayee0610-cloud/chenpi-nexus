// ============================================================
// siteModules.ts — 全站模块配置单一真理源 (Single Source of Truth)
// 控制首页与导航的模块显隐、路径映射、显示名称
// 顺序严格统一：东南亚实局 → 深度洞察 → 策略工具包 → 脑洞画布 → 实战案例 → 联系我
// ============================================================

export interface SiteModule {
  id: string;
  name: string;
  enabled: boolean;
  path?: string;
  anchor?: string; // 首页锚点 id
  flag?: string; // 对应 site_config 表的字段名
  tagline?: string; // 模块微文案
}

export const SITE_MODULES: SiteModule[] = [
  { id: "hero", name: "Hero", enabled: true },
  {
    id: "sea-insights",
    name: "东南亚实局",
    enabled: true,
    path: "/hub",
    anchor: "intelligence",
    flag: "show_insights_hub",
    tagline: "⚡ 以马来西亚/东盟市场为绝对核心的即时商业情报",
  },
  {
    id: "insights",
    name: "深度洞察",
    enabled: true,
    path: "/insights",
    anchor: "insights",
    flag: "show_insights",
    tagline: "关于大马 GTM、清真 Halal 认证与品牌策略的硬核思考",
  },
  {
    id: "toolkit",
    name: "策略工具包",
    enabled: true,
    path: "/resources",
    anchor: "toolkit",
    flag: "show_resources",
    tagline: "实战 SOP · 东南亚渠道指南 · AI 营销 Prompt 库 · 品牌策略模板",
  },
  {
    id: "canvas",
    name: "脑洞画布",
    enabled: true,
    path: "/sanctuary",
    anchor: "canvas",
    flag: "show_sanctuary",
    tagline: "出海同行与大马本土商业探索者的互动交流与脑洞碰撞",
  },
  {
    id: "cases",
    name: "实战案例",
    enabled: true,
    path: "/portfolio",
    anchor: "cases",
    flag: "show_portfolio",
    tagline: "大马本土化渠道重构与商业交付落地案例",
  },
  {
    id: "contact",
    name: "联系我",
    enabled: true,
    anchor: "contact",
    tagline: "预约大马出海策略咨询 / 商业合作对接",
  },
];

// 获取已启用的导航模块（排除 hero）
export const NAV_MODULES = SITE_MODULES.filter((m) => m.enabled && m.anchor && m.id !== "hero");

// 按 flag 查询模块是否启用
export function isModuleEnabled(flag: string): boolean {
  const mod = SITE_MODULES.find((m) => m.flag === flag);
  return mod ? mod.enabled : true;
}
