import type { Metadata } from "next";
import Header from "@/components/Header";
import InformationHub from "@/components/InformationHub";
import Connect from "@/components/Connect";

export const metadata: Metadata = {
  title: "赛博情报站 | 陈皮同学",
  description: "中国企业 AI、机器人与出海 Marketing 第一手硬核商业情报提炼。",
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
