import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ====== 精细化定制 Markdown 渲染组件 ======
// 彻底解决 ### ** 等格式直接渲染为源码文本的问题
// - h2：底部下划线分隔的大标题
// - h3：紫蓝渐变左边框硬核标题
// - strong：高亮紫色背景强调文本
// - p：leading-8 行高，mb-5 间距
// - img：正文内嵌图片自动适配圆角阴影
// - blockquote：半透明玻璃质感引用卡片
// - ul/ol：标准圆点/数字列表

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none text-zinc-300 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 1. h1 — 紫蓝色 Accent 细条高亮
          h1: ({ children }) => (
            <h1 className="mt-8 mb-4 border-l-4 border-purple-500 pl-4 text-2xl font-bold text-zinc-50">
              {children}
            </h1>
          ),
          // 2. h2 — 底部下划线分隔大标题
          h2: ({ children }) => (
            <h2 className="mt-10 mb-5 border-b border-zinc-800 pb-2 text-2xl font-extrabold text-white">
              {children}
            </h2>
          ),
          // 3. h3 — 紫蓝渐变左边框硬核标题
          h3: ({ children }) => (
            <h3 className="mt-8 mb-4 rounded-r bg-purple-950/20 py-1 pl-3 text-xl font-bold text-white border-l-4 border-purple-500">
              {children}
            </h3>
          ),
          // 4. h4 — 中等标题
          h4: ({ children }) => (
            <h4 className="mt-6 mb-3 text-base font-bold text-zinc-100">
              {children}
            </h4>
          ),
          // 5. 段落 — 行高 leading-8，间距 mb-5
          p: ({ children }) => (
            <p className="mb-5 text-base leading-8 text-zinc-300 sm:text-lg">
              {children}
            </p>
          ),
          // 6. 加粗 — 高亮紫色背景强调
          strong: ({ children }) => (
            <strong className="rounded bg-purple-900/30 px-1 font-semibold text-purple-300">
              {children}
            </strong>
          ),
          // 7. 斜体
          em: ({ children }) => (
            <em className="italic text-zinc-200">
              {children}
            </em>
          ),
          // 8. 正文内嵌图片 — 自动适配圆角阴影
          img: ({ src, alt }) => (
            <span className="my-6 block">
              <img
                src={typeof src === "string" ? src : ""}
                alt={alt || ""}
                className="max-h-[500px] w-full rounded-xl border border-white/10 object-cover shadow-lg"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </span>
          ),
          // 9. 金句引用 — 半透明玻璃质感卡片
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-xl border-l-4 border-purple-500 bg-zinc-900/80 p-4 italic text-zinc-200 shadow-inner">
              {children}
            </blockquote>
          ),
          // 10. 无序列表
          ul: ({ children }) => (
            <ul className="my-4 list-inside list-disc space-y-2 pl-2 text-zinc-300">
              {children}
            </ul>
          ),
          // 11. 有序列表
          ol: ({ children }) => (
            <ol className="my-4 list-inside list-decimal space-y-2 pl-2 text-zinc-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // 12. 行内代码
          code: ({ inline, className, children }: any) => {
            if (inline) {
              return (
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-purple-300">
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <code className={className}>{children}</code>
              </pre>
            );
          },
          pre: ({ children }) => <>{children}</>,
          // 13. 链接
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline decoration-blue-400/30 underline-offset-2 hover:text-blue-300 hover:decoration-blue-300"
            >
              {children}
            </a>
          ),
          // 14. 分隔线
          hr: () => <hr className="my-8 border-zinc-800" />,
          // 15. 表格
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm text-zinc-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-700 bg-zinc-800/60 px-3 py-2 font-semibold text-zinc-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-800 px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
