import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://myneuralhub.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // 全站允许抓取
        userAgent: "*",
        allow: "/",
        // 保护管理后台不被收录
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
