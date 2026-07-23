import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import Insights from "@/components/Insights";
import Sanctuary from "@/components/Sanctuary";
import Connect from "@/components/Connect";
import Mascot from "@/components/Mascot";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Portfolio />
        <Insights />
        <Sanctuary />
        <Connect />
      </main>
      <Mascot />
    </>
  );
}
