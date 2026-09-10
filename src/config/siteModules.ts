// ============================================================
// siteModules.ts — 全站模块配置单一真理源 (Single Source of Truth)
// 控制首页与导航的模块显隐、路径映射、显示名称
// ============================================================

export interface SiteModule {
  id: string;
  name: string;
  enabled: boolean;
  path?: string;
  flag?: string; // 对应 site_config 表的字段名
}

export const SITE_MODULES: SiteModule[] = [
  { id: "hero", name: "Hero", enabled: true },
  { id: "cases", name: "实战案例", enabled: true, path: "/portfolio", flag: "show_portfolio" },
  { id: "sea-insights", name: "东南亚实局", enabled: true, path: "/hub", flag: "show_insights_hub" },
  { id: "insights", name: "深度洞察", enabled: true, path: "/insights", flag: "show_insights" },
  { id: "toolkit", name: "策略工具包", enabled: true, path: "/resources", flag: "show_resources" },
  { id: "canvas", name: "脑洞画布", enabled: true, path: "/sanctuary", flag: "show_sanctuary" },
];

// 获取已启用的导航模块（排除 hero）
export const NAV_MODULES = SITE_MODULES.filter((m) => m.enabled && m.path);

// 按 flag 查询模块是否启用
export function isModuleEnabled(flag: string): boolean {
  const mod = SITE_MODULES.find((m) => m.flag === flag);
  return mod ? mod.enabled : true;
}
