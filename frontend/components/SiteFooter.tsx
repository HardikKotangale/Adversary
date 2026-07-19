export function SiteFooter() {
  return (
    <footer className="border-t border-rule px-6 py-6 mt-12 bg-paper-raised/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="case-mark font-serif font-bold text-base text-ink" aria-hidden>
            A
          </span>
          <div>
            <p className="font-serif font-bold text-sm text-ink leading-none">Adversary</p>
            <p className="text-[10px] font-mono text-ink-soft opacity-70 mt-1">
              A pitch stress-test arena.
            </p>
          </div>
        </div>
        <p className="font-mono text-[10px] text-ink-soft opacity-50 uppercase tracking-wider">
          Qwen Cloud × Alibaba Cloud · Agent Society Track
        </p>
      </div>
    </footer>
  );
}
