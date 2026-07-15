"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const inArena = pathname === "/arena";

  return (
    <header className="relative border-b border-rule px-6 py-4 glass-panel sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-all"
        >
          <span className="case-mark font-serif font-bold text-xl text-ink" aria-hidden>
            A
          </span>
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight leading-none">
              Adversary
            </h1>
            <div className="spectrum-bar mt-1.5" aria-hidden>
              <span style={{ background: "var(--vc)" }} />
              <span style={{ background: "var(--engineer)" }} />
              <span style={{ background: "var(--customer)" }} />
              <span style={{ background: "var(--mediator)" }} />
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {inArena ? (
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-rule hover:border-ink-soft text-ink-soft hover:text-ink font-mono text-xs uppercase tracking-wider transition-all"
            >
              ← View Info & Guide
            </Link>
          ) : (
            <Link
              href="/arena"
              className="px-5 py-2 rounded-lg bg-mediator hover:brightness-110 text-paper font-mono text-xs uppercase tracking-wider shadow-lg shadow-mediator/25 transition-all font-bold"
            >
              Launch Arena →
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
