export function RoundLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 my-3">
      <span className="font-mono text-xs tracking-[0.25em] uppercase text-ink-soft whitespace-nowrap bg-paper-raised px-3 py-1 rounded-md border border-white/5 font-bold shadow-sm">
        {children}
      </span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}
