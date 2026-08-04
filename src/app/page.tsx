import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import Insights from "@/components/Insights";
import InformationHub from "@/components/InformationHub";
import ResourceHub from "@/components/ResourceHub";
import Sanctuary from "@/components/Sanctuary";
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
        {config.show_portfolio && <Portfolio showLimit={6} />}
        {config.show_insights_hub && <InformationHub showLimit={6} />}
        {config.show_insights && <Insights showLimit={6} />}
        {config.show_resources && <ResourceHub showLimit={6} />}
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
