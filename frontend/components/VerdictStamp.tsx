import { Verdict } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";

export function VerdictStamp({ verdict }: { verdict: Verdict }) {
  const fullReadout = `Fundability score: ${verdict.score} out of 10. ${verdict.scoreRationale} Strongest point: ${verdict.strongestPoint} Weakest point: ${verdict.weakestPoint} Biggest risk: ${verdict.biggestRisk} Recommended next step: ${verdict.nextStep}`;

  return (
    <div className="flex justify-center py-6">
      <div className="relative animate-stamp-in glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-mediator/30 shadow-2xl shadow-mediator/10 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-mediator/10 rounded-full blur-3xl pointer-events-none" />

        {/* Score Badge */}
        <div
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-20 h-20 rounded-2xl bg-gradient-to-tr from-mediator to-extra flex flex-col items-center justify-center shadow-lg shadow-mediator/20"
          aria-label={`Fundability score: ${verdict.score} out of 10`}
        >
          <span className="font-extrabold text-3xl text-paper leading-none">
            {verdict.score}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-paper/80 leading-none mt-1 font-bold">
            Score / 10
          </span>
        </div>

        <div className="mb-6 flex items-start justify-between gap-3 pr-24">
          <div>
            <span className="font-mono text-xs tracking-[0.25em] text-mediator uppercase block font-semibold glow-text-mediator">
              — The Mediator&apos;s Ruling —
            </span>
            <h2 className="text-3xl font-extrabold text-ink mt-1">
              Verdict Report
            </h2>
          </div>
          <SpeakButton text={fullReadout} className="mt-1 shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border border-mediator/40 text-mediator hover:bg-mediator/10 transition-colors" />
        </div>

        {verdict.scoreRationale && (
          <p className="font-mono text-xs text-ink-soft leading-relaxed mb-6 -mt-2 italic">
            &ldquo;{verdict.scoreRationale}&rdquo;
          </p>
        )}

        <dl className="space-y-5">
          <div className="bg-paper-raised/40 p-4 rounded-xl border border-white/5">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-mediator mb-1 font-bold">
              Strongest Point
            </dt>
            <dd className="text-sm leading-relaxed text-ink-soft">
              {verdict.strongestPoint}
            </dd>
          </div>

          <div className="bg-paper-raised/40 p-4 rounded-xl border border-white/5">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-mediator mb-1 font-bold">
              Weakest Point
            </dt>
            <dd className="text-sm leading-relaxed text-ink-soft">
              {verdict.weakestPoint}
            </dd>
          </div>

          <div className="bg-danger/5 p-4 rounded-xl border border-danger/20">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-danger mb-1 font-bold">
              Critical Risk Factor
            </dt>
            <dd className="text-sm leading-relaxed text-ink-soft">
              {verdict.biggestRisk}
            </dd>
          </div>

          <div className="bg-gradient-to-r from-mediator-soft to-extra-soft p-4 rounded-xl border border-mediator/20">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-mediator mb-1 font-bold">
              Recommended Next Step
            </dt>
            <dd className="text-sm leading-relaxed text-ink font-semibold">
              {verdict.nextStep}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
