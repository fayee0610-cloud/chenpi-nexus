import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Sanctuary from "@/components/Sanctuary";

export const dynamic = "force-dynamic";

export default function SanctuaryPage() {
  // 二级页始终展示完整庇护所（不受首页 site_config 显隐开关影响）
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* 返回按钮 */}
        <div className="mx-auto max-w-7xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回首页
          </Link>
        </div>

        <Sanctuary showInspirationSign={true} />
      </main>
    </>
  );
}
