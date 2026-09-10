import type { Metadata } from "next";
import Header from "@/components/Header";
import InformationHub from "@/components/InformationHub";
import Connect from "@/components/Connect";

export const metadata: Metadata = {
  title: "东南亚实局 | 陈皮同学",
  description: "东南亚核心市场洞察 · 本土化渠道 · AI 营销杠杆 · 第一线出海实局",
};

export default function HubPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <InformationHub />
        <Connect />
      </main>
    </>
  );
}
