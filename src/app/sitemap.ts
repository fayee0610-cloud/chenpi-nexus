import type { MetadataRoute } from "next";
import { fetchProjects, fetchInsights } from "@/lib/dataApi";

// 站点基础 URL（部署到 Vercel 后，将 NEXT_PUBLIC_SITE_URL 设置为正式域名）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://myneuralhub.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 静态路由（首页 + 二级列表页）
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/portfolio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/insights`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sanctuary`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // 动态路由：作品详情页
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await fetchProjects();
    projectRoutes = projects.map((p) => ({
      url: `${siteUrl}/portfolio/${p.id}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // 降级：仅使用静态路由
  }

  // 动态路由：文章详情页
  let insightRoutes: MetadataRoute.Sitemap = [];
  try {
    const insights = await fetchInsights();
    insightRoutes = insights.map((i) => ({
      url: `${siteUrl}/insights/${i.id}`,
      lastModified: i.date ? new Date(i.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // 降级：仅使用静态路由
  }

  return [...staticRoutes, ...projectRoutes, ...insightRoutes];
}
