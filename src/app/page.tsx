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
      <Header />
      <main className="flex-1">
        <Hero />
        {config.show_portfolio && <Portfolio />}
        <InformationHub />
        {config.show_insights && <Insights />}
        <ResourceHub />
        {config.show_sanctuary && (
          <Sanctuary showInspirationSign={config.show_inspiration_sign} />
        )}
        <Connect />
      </main>
      {config.show_chenpi_ai && <Mascot />}
    </>
  );
}
