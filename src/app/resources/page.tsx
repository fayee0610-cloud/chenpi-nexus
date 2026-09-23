import type { Metadata } from "next";
import Header from "@/components/Header";
import ResourceHub from "@/components/ResourceHub";
import Connect from "@/components/Connect";

export const metadata: Metadata = {
  title: "策略工具包 | 陈皮同学",
  description: "实战 SOP · 东南亚渠道指南 · AI 营销 Prompt 库 · 品牌策略模板 — 注册解锁完整 PDF 下载。",
};

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <ResourceHub />
        <Connect />
      </main>
    </>
  );
}
