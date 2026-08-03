import type { Metadata } from "next";
import Header from "@/components/Header";
import ResourceHub from "@/components/ResourceHub";
import Connect from "@/components/Connect";

export const metadata: Metadata = {
  title: "精选资源包 | 陈皮同学",
  description: "深度行业指南、实战运营手册、品牌策略报告 — 注册解锁完整 PDF 下载。",
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
