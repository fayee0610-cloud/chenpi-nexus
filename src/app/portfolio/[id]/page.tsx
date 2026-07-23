import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TrendingUp, ExternalLink, Copy, Check, Target, Lightbulb } from "lucide-react";
import { fetchProjectById } from "@/lib/dataApi";
import Header from "@/components/Header";
import { notFound } from "next/navigation";

// ========== 客户端交互组件 ==========
import PortfolioShareClient from "./PortfolioShareClient";

export const dynamic = "force-dynamic";

// 动态 SEO Metadata：分享时展示具体作品标题与摘要
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProjectById(id);
  if (!project) {
    return { title: "作品未找到" };
  }
  const title = project.title;
  const description = project.subTitle || project.challenge || "陈皮同学作品案例";
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: `${title} | 陈皮同学作品集`,
      description,
      images: project.image ? [{ url: project.image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 陈皮同学作品集`,
      description,
      images: project.image ? [project.image] : undefined,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await fetchProjectById(id);

  if (!project) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* 返回按钮 */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回作品集
        </Link>

        {/* 标题区 */}
        <header className="mt-8 border-b border-zinc-800 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-md border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-purple-300">
              {project.category}
            </span>
            {project.date && <span>{project.date}</span>}
            {project.role && <span>· {project.role}</span>}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-zinc-50 sm:text-4xl">
            {project.title}
          </h1>
          {project.subTitle && (
            <p className="mt-2 text-lg text-zinc-400">{project.subTitle}</p>
          )}
        </header>

        {/* 大图 */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
          {project.image?.trim() ? (
            <img
              src={project.image}
              alt={project.title}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
              <Target className="h-12 w-12 text-zinc-700" />
            </div>
          )}
        </div>

        {/* 核心指标 */}
        {project.metrics.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
              <TrendingUp className="h-5 w-5 text-green-500" />
              核心指标
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {project.metrics.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="text-2xl font-bold text-zinc-100">{m.value}</div>
                  <div className="mt-1 text-xs text-zinc-500">{m.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 挑战背景 */}
        {project.challenge && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-200">
              <Target className="h-5 w-5 text-red-400" />
              挑战背景
            </h2>
            <p className="leading-relaxed text-zinc-300">{project.challenge}</p>
          </section>
        )}

        {/* 破局战术 */}
        {project.solutions.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              破局战术
            </h2>
            <div className="space-y-4">
              {project.solutions.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {s.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 演示链接 */}
        {project.demoUrl && (
          <section className="mt-10">
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              <ExternalLink className="h-4 w-4" />
              查看演示
            </a>
          </section>
        )}

        {/* 底部分享区 */}
        <section className="mt-12 border-t border-zinc-800 pt-6">
          <PortfolioShareClient title={project.title} />
        </section>
      </main>
    </>
  );
}
