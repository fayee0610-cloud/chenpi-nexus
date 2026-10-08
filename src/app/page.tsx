import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InformationHub from "@/components/InformationHub";
import Insights from "@/components/Insights";
import Sanctuary from "@/components/Sanctuary";
import Portfolio from "@/components/Portfolio";
import Connect from "@/components/Connect";
import Mascot from "@/components/Mascot";
import ToolkitTabs from "@/components/ToolkitTabs";
import { fetchSiteConfig } from "@/lib/dataApi";

export default async function Home() {
  const config = await fetchSiteConfig();

  return (
    <>
      <Header config={config} />
      <main className="flex-1">
        <Hero />

        {/* 信任与权威：AI资讯 → 深度洞察 → 实战案例 */}
        {config.show_insights_hub && <InformationHub showLimit={6} />}
        {config.show_insights && <Insights showLimit={6} />}
        {config.show_portfolio && <Portfolio showLimit={6} />}

        {/* 出海工具箱：策略工具包 ↔ 马来语轻打卡 Tab 切换 */}
        <ToolkitTabs
          showResources={config.show_resources}
          showCanvasLimit={6}
        />

        {/* 出海茶水间：上香 + 脑洞画布 Tab */}
        {config.show_sanctuary && (
          <Sanctuary
            showInspirationSign={config.show_inspiration_sign}
            showCanvasLimit={6}
          />
        )}

        <Connect />
      </main>
      {config.show_chenpi_ai && <Mascot />}
    </>
  );
}
