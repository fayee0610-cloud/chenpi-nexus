import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 站点基础配置（部署到 Vercel 后，将 NEXT_PUBLIC_SITE_URL 设置为正式域名）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://myneuralhub.com";
const ogImage = `${siteUrl}/og-image.png`;

const siteTitle = "陈皮同学 | 创意、AI 与 市场的赛博数字中枢";
const siteDescription =
  "聚焦品牌规划、海外市场策略、陶瓷外贸与 AI 自动化流程的超级个体数字空间。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | 陈皮同学",
  },
  description: siteDescription,
  keywords: [
    "陈皮同学",
    "品牌策略",
    "海外市场",
    "跨境出海",
    "AI 自动化",
    "OPC",
    "超级个体",
    "创意营销",
    "My Neural Hub",
  ],
  authors: [{ name: "陈皮同学" }],
  creator: "陈皮同学",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "陈皮同学 My Neural Hub",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "陈皮同学 · 创意、AI 与 市场的赛博数字中枢",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
    creator: "@chenpi",
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        {children}
      </body>
    </html>
  );
}
