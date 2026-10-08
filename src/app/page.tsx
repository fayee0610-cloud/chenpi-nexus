import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InformationHub from "@/components/InformationHub";
import Insights from "@/components/Insights";
import ResourceHub from "@/components/ResourceHub";
import Sanctuary from "@/components/Sanctuary";
import Portfolio from "@/components/Portfolio";
import Connect from "@/components/Connect";
import Mascot from "@/components/Mascot";
import MalayDailyCard from "@/components/MalayDailyCard";
import { fetchSiteConfig } from "@/lib/dataApi";

export default async function Home() {
  const config = await fetchSiteConfig();

  return (
    <>
      <Header config={config} />
      <main className="flex-1">
        <Hero />
        {/*
          全站信息架构（三大梯队）：
          第一梯队·信任与权威：AI动态资讯 → 深度洞察 → 实战案例
          第二梯队·赋能工具：策略工具包 → 马来语轻打卡
          第三梯队·出海茶水间：解压站（上香+脑洞画布 Tab）
        */}

        {/* ===== 第一梯队：信任与权威层 ===== */}
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
              <span className="h-1 w-1 rounded-full bg-blue-500/60" />
              第一梯队 · 信任与权威
            </span>
          </div>
          {config.show_insights_hub && <InformationHub showLimit={6} />}
          {config.show_insights && <Insights showLimit={6} />}
          {config.show_portfolio && <Portfolio showLimit={6} />}
        </div>

        {/* ===== 第二梯队：赋能与实用工具层 ===== */}
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
              <span className="h-1 w-1 rounded-full bg-emerald-500/60" />
              第二梯队 · 出海工具箱
            </span>
          </div>
          {config.show_resources && <ResourceHub showLimit={6} />}
          {/* 马来语轻打卡：明确定位为出海本土化沟通工具，与策略工具包同梯队 */}
          <section id="malay-daily" className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
                马来语轻打卡
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500">
                每日 1 分钟，掌握大马日常与商务沟通 · 出海团队本土化沟通工具箱
              </p>
            </div>
            <div className="mx-auto max-w-2xl">
              <MalayDailyCard />
            </div>
          </section>
        </div>

        {/* ===== 第三梯队：出海茶水间 / 灵感解压层 ===== */}
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
              <span className="h-1 w-1 rounded-full bg-amber-500/60" />
              第三梯队 · 出海茶水间
            </span>
          </div>
          {config.show_sanctuary && (
            <Sanctuary
              showInspirationSign={config.show_inspiration_sign}
              showCanvasLimit={6}
            />
          )}
        </div>

        <Connect />
      </main>
      {config.show_chenpi_ai && <Mascot />}
    </>
  );
}
