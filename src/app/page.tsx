import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InformationHub from "@/components/InformationHub";
import Insights from "@/components/Insights";
import ResourceHub from "@/components/ResourceHub";
import Sanctuary from "@/components/Sanctuary";
import Portfolio from "@/components/Portfolio";
import Connect from "@/components/Connect";
import Mascot from "@/components/Mascot";
import { fetchSiteConfig } from "@/lib/dataApi";

export default async function Home() {
  const config = await fetchSiteConfig();

  return (
    <>
      <Header config={config} />
      <main className="flex-1">
        <Hero />
        {/* 全站 Section 顺序严格统一为 6 模块：
            东南亚实局 → 深度洞察 → 策略工具包 → 脑洞画布 → 实战案例 → 联系我 */}
        {config.show_insights_hub && <InformationHub showLimit={6} />}
        {config.show_insights && <Insights showLimit={6} />}
        {config.show_resources && <ResourceHub showLimit={6} />}
        {config.show_sanctuary && (
          <Sanctuary
            showInspirationSign={config.show_inspiration_sign}
            showCanvasLimit={6}
          />
        )}
        {config.show_portfolio && <Portfolio showLimit={6} />}
        <Connect />
      </main>
      {config.show_chenpi_ai && <Mascot />}
    </>
  );
}
