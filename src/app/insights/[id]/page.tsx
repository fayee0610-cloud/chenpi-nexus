import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Clock,
} from "lucide-react";
import { fetchInsightById } from "@/lib/dataApi";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import InsightShareClient from "./InsightShareClient";
import type { ContentBlock } from "@/data/siteData";

export const dynamic = "force-dynamic";

// 动态 SEO Metadata：分享时展示具体文章标题与摘要
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const insight = await fetchInsightById(id);
  if (!insight) {
    return { title: "文章未找到" };
  }
  const title = insight.title;
  const description = insight.excerpt || "陈皮同学灵感点深度思考";
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: `${title} | 陈皮同学灵感点`,
      description,
      images: insight.image ? [{ url: insight.image, width: 1200, height: 630 }] : undefined,
      publishedTime: insight.date,
      authors: insight.author ? [insight.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 陈皮同学灵感点`,
      description,
      images: insight.image ? [insight.image] : undefined,
    },
  };
}

// 正文渲染
function renderBlock(block: ContentBlock, i: number) {
  if (block.type === "heading") {
    return (
      <h2 key={i} className="pt-2 text-lg font-bold text-zinc-100 sm:text-xl">
        {block.text}
      </h2>
    );
  }
  if (block.type === "paragraph") {
    return (
      <p key={i} className="text-base leading-relaxed text-zinc-300 md:text-lg">
        {block.text}
      </p>
    );
  }
  if (block.type === "blockquote") {
    return (
      <blockquote
        key={i}
        className="border-l-2 border-purple-500/40 bg-purple-950/10 py-3 pl-4 text-base italic text-zinc-400"
      >
        {block.text}
      </blockquote>
    );
  }
  if (block.type === "code") {
    return (
      <pre
        key={i}
        className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
      >
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === "list" && block.items) {
    return (
      <ul key={i} className="list-disc space-y-1.5 pl-6 text-zinc-300">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  }
  return null;
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insight = await fetchInsightById(id);

  if (!insight) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* 返回按钮 */}
        <Link
          href="/insights"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回灵感点
        </Link>

        {/* 文章 Header */}
        <header className="mt-8 mb-8 border-b border-zinc-800 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-purple-500/30 bg-purple-950/20 px-2.5 py-1 text-xs font-medium text-purple-300">
              [ {insight.category} ]
            </span>
            {insight.readTime && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5" />
                {insight.readTime}
              </span>
            )}
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-zinc-50 md:text-4xl">
            {insight.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            {insight.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {insight.date}
              </span>
            )}
            {insight.author && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {insight.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {insight.views} 阅读
            </span>
          </div>
        </header>

        {/* 摘要 */}
        {insight.excerpt && (
          <p className="mb-8 text-lg leading-relaxed text-zinc-400">
            {insight.excerpt}
          </p>
        )}

        {/* 正文排版 */}
        <article className="space-y-5">
          {insight.content.map((block, i) => renderBlock(block, i))}
        </article>

        {/* 底部分享区 */}
        <section className="mt-12 border-t border-zinc-800 pt-6">
          <InsightShareClient title={insight.title} />
        </section>
      </main>
    </>
  );
}
