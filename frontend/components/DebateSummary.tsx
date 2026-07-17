interface DebateSummaryProps {
  turnCount: number;
  panelistCount: number;
  summons: { roleName: string; reasoning: string }[];
  concludeReasoning?: string;
}

export function DebateSummary({ turnCount, panelistCount, summons, concludeReasoning }: DebateSummaryProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/5">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft mb-3 font-bold">
        Debate Summary
      </p>
      <p className="text-sm text-ink-soft leading-relaxed mb-4">
        {turnCount} turn{turnCount === 1 ? "" : "s"} across {panelistCount} panelist
        {panelistCount === 1 ? "" : "s"}
        {summons.length > 0
          ? ` — including ${summons.length} specialist${summons.length === 1 ? "" : "s"} the Orchestrator called in mid-debate.`
          : "."}
      </p>
      {summons.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {summons.map((s, i) => (
            <li key={i} className="text-xs font-mono text-ink-soft border-l-2 border-extra/40 pl-3">
              <span className="text-extra font-bold">{s.roleName} summoned —</span> {s.reasoning}
            </li>
          ))}
        </ul>
      )}
      {concludeReasoning && (
        <p className="text-xs font-mono text-ink-soft border-l-2 border-mediator/40 pl-3">
          <span className="text-mediator font-bold">Concluded —</span> {concludeReasoning}
        </p>
      )}
    </div>
  );
}
