import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Clock,
  Tag,
  Sparkles,
} from "lucide-react";
import { fetchInsightById } from "@/lib/dataApi";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import InsightShareClient from "./InsightShareClient";
import InspireButton from "./InspireButton";
import ArticleComments from "./ArticleComments";
import type { ContentBlock } from "@/data/siteData";
import { HARDCORE_TAGS_POOL, FLAT_HARDCORE_TAGS } from "@/data/siteData";

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
  const tagsFlat = Array.isArray(insight.tags) ? insight.tags : [];
  return {
    title,
    description,
    keywords: tagsFlat.length ? tagsFlat.join(",") : undefined,
    openGraph: {
      type: "article",
      title: `${title} | 陈皮同学灵感点`,
      description,
      tags: tagsFlat.length ? tagsFlat : undefined,
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

// 正文渲染（首行 blockquote 作为 TL;DR 高亮区）
function renderBlock(block: ContentBlock, i: number, opts: { isFirstBlockquote: boolean }) {
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
    if (opts.isFirstBlockquote) {
      return (
        <section
          key={i}
          aria-label="TL;DR 核心战术摘要"
          className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-zinc-900/40 to-blue-500/10 p-5"
        >
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-zinc-950/60 px-2 py-0.5 text-[11px] font-semibold text-purple-200">
            <Sparkles className="h-3 w-3" />
            TL;DR · 核心战术摘要
          </div>
          <blockquote className="mt-5 pr-1 text-base font-medium leading-relaxed text-zinc-100 md:text-lg md:leading-loose">
            {block.text}
          </blockquote>
        </section>
      );
    }
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

function normalizeDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  // 支持常见的 2024.07.15 / 2024-07-15
  let s = String(iso).trim().replace(/\./g, "-").replace(/\//g, "-");
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insight = await fetchInsightById(id);

  if (!insight) notFound();

  // 首段 blockquote 视为 TL;DR
  let firstBlockquoteIndex: number | null = null;
  for (let i = 0; i < insight.content.length; i++) {
    if (insight.content[i].type === "blockquote") {
      firstBlockquoteIndex = i;
      break;
    }
  }

  const tags = Array.isArray(insight.tags) ? insight.tags : [];

  // JSON-LD Article（符合 Schema.org，GEO 爬虫可识别）
  const headline = insight.title;
  const description = insight.excerpt || insight.title;
  const authorName = insight.author?.trim() ? insight.author.trim() : "陈皮";
  const datePublished = normalizeDate(insight.date) || undefined;
  const keywordsFlat = tags.length ? tags : FLAT_HARDCORE_TAGS.slice(0, 4);
  const articleUrl =
    typeof window === "undefined"
      ? `https://chenpi.dev/insights/${encodeURIComponent(id)}`
      : `/insights/${encodeURIComponent(id)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: [
      {
        "@type": "Person",
        name: authorName,
        url: "https://chenpi.dev",
        alternativeName: "陈皮 · 陈述中马",
        description:
          "深耕 AI / 具身智能 / 出海 GTM 与品牌心智的策略研究者，做真正落地的 GEO 与营销思考。",
      },
    ],
    publisher: {
      "@type": "Person",
      name: "陈皮 · 陈述中马",
      url: "https://chenpi.dev",
    },
    keywords: keywordsFlat.join(","),
    articleSection: insight.category || "灵感思考",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    ...(datePublished ? { datePublished } : {}),
    ...(datePublished ? { dateModified: datePublished } : {}),
  };

  // 标签分组展示（只展示命中池中的真实 tag）
  const tagsByGroup: { group: string; icon: string; tags: string[] }[] =
    HARDCORE_TAGS_POOL.map((g) => ({
      group: g.group,
      icon: g.groupIcon,
      tags: g.tags.filter((t) => tags.includes(t)),
    })).filter((g) => g.tags.length > 0);
  // 其他非池化标签作为"自定义/其他"展示
  const otherTags = tags.filter((t) => !FLAT_HARDCORE_TAGS.includes(t));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* JSON-LD Script（GEO 结构化数据注入） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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

          {/* 硬核结构化标签展示 */}
          {(tagsByGroup.length > 0 || otherTags.length > 0) && (
            <div className="mt-5 space-y-3">
              {tagsByGroup.map((g) => (
                <div key={g.group} className="flex flex-wrap items-start gap-2">
                  <span className="mt-1 inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-zinc-400">
                    <span>{g.icon}</span>
                    {g.group}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-200"
                      >
                        <Tag className="h-3 w-3 opacity-80" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {otherTags.length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  <span className="mt-1 inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-zinc-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    自定义
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {otherTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* 摘要 */}
        {insight.excerpt && (
          <p className="mb-8 text-lg leading-relaxed text-zinc-400">
            {insight.excerpt}
          </p>
        )}

        {/* 正文排版（首段 blockquote 高亮为 TL;DR） */}
        <article className="space-y-5">
          {insight.content.map((block, i) =>
            renderBlock(block, i, { isFirstBlockquote: firstBlockquoteIndex === i })
          )}
        </article>

        {/* 底部分享区 */}
        <section className="mt-12 border-t border-zinc-800 pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <InspireButton insightId={String(id)} initialLikes={insight.likes} />
            <InsightShareClient title={insight.title} />
          </div>
        </section>

        {/* 读者战术讨论区 */}
        <ArticleComments articleId={String(id)} />
      </main>
    </>
  );
}
