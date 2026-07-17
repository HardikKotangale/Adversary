import { Turn } from "@/lib/types";
import { PersonaBadge } from "./PersonaBadge";
import { SpeakButton } from "./SpeakButton";

const COLOR_CLASSES: Record<
  string,
  { border: string; text: string; bg: string; glow: string; textGlow: string }
> = {
  vc: { border: "border-vc/30 hover:border-vc", text: "text-vc", bg: "bg-vc-soft", glow: "shadow-vc/5", textGlow: "glow-text-vc" },
  engineer: { border: "border-engineer/30 hover:border-engineer", text: "text-engineer", bg: "bg-engineer-soft", glow: "shadow-engineer/5", textGlow: "glow-text-engineer" },
  customer: { border: "border-customer/30 hover:border-customer", text: "text-customer", bg: "bg-customer-soft", glow: "shadow-customer/5", textGlow: "glow-text-customer" },
  mediator: { border: "border-mediator/30 hover:border-mediator", text: "text-mediator", bg: "bg-mediator-soft", glow: "shadow-mediator/5", textGlow: "glow-text-mediator" },
  extra: { border: "border-extra/30 hover:border-extra", text: "text-extra", bg: "bg-extra-soft", glow: "shadow-extra/5", textGlow: "glow-text-extra" },
};

const KIND_LABEL: Record<Turn["kind"], string> = {
  opening: "Opening Statement",
  summon_opening: "Witness Opening",
  rebuttal: "Rebuttal",
};

export function TurnCard({
  turn,
  respondingToName,
  indent,
}: {
  turn: Turn;
  respondingToName?: string;
  indent?: boolean;
}) {
  const colors = COLOR_CLASSES[turn.colorKey] ?? COLOR_CLASSES.extra;
  return (
    <article
      className={`animate-rise-in glass-panel rounded-2xl p-5 sm:p-6 border-l-4 ${colors.border} transition-all duration-300 shadow-xl ${colors.glow} ${
        indent ? "ml-4 sm:ml-10" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <PersonaBadge roleName={turn.roleName} colorKey={turn.colorKey} />
          <h3 className={`font-bold text-lg ${colors.text} ${colors.textGlow}`}>{turn.roleName}</h3>
          {respondingToName && (
            <span className="font-mono text-xs text-ink-soft opacity-70">
              → responding to <span className="text-ink font-semibold">{respondingToName}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SpeakButton text={turn.content} />
          <span
            className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${colors.bg} ${colors.text} rounded-full font-semibold border border-white/5`}
          >
            {KIND_LABEL[turn.kind]}
          </span>
        </div>
      </header>
      <p className="text-base leading-relaxed text-ink-soft whitespace-pre-wrap">{turn.content}</p>
      {turn.toolCalls && turn.toolCalls.length > 0 && (
        <div className="mt-4 pt-4 border-t border-rule/50 flex flex-col gap-2">
          {turn.toolCalls.map((tc, i) => (
            <div key={i} className="font-mono text-[11px] text-ink-soft bg-paper-raised/40 rounded-lg px-3 py-2">
              <span className={`${colors.text} font-bold`}>⚙ {tc.name}</span>
              {"("}
              {Object.entries(tc.args)
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                .join(", ")}
              {") → "}
              {tc.result}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
