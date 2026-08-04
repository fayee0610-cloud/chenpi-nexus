"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  href: string;
  label?: string;
};

export default function LoadMoreButton({ href, label = "查看更多" }: Props) {
  return (
    <div className="mt-10 flex justify-center">
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-purple-500/40 hover:bg-zinc-900 hover:text-purple-300 hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
