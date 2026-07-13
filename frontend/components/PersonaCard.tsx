import { RoundEntry } from "@/lib/types";
import { PersonaBadge } from "./PersonaBadge";

const COLOR_CLASSES: Record<
  string,
  { border: string; text: string; bg: string; glow: string; textGlow: string }
> = {
  vc: {
    border: "border-vc/30 hover:border-vc",
    text: "text-vc",
    bg: "bg-vc-soft",
    glow: "shadow-vc/5",
    textGlow: "glow-text-vc",
  },
  engineer: {
    border: "border-engineer/30 hover:border-engineer",
    text: "text-engineer",
    bg: "bg-engineer-soft",
    glow: "shadow-engineer/5",
    textGlow: "glow-text-engineer",
  },
  customer: {
    border: "border-customer/30 hover:border-customer",
    text: "text-customer",
    bg: "bg-customer-soft",
    glow: "shadow-customer/5",
    textGlow: "glow-text-customer",
  },
  mediator: {
    border: "border-mediator/30 hover:border-mediator",
    text: "text-mediator",
    bg: "bg-mediator-soft",
    glow: "shadow-mediator/5",
    textGlow: "glow-text-mediator",
  },
  extra: {
    border: "border-extra/30 hover:border-extra",
    text: "text-extra",
    bg: "bg-extra-soft",
    glow: "shadow-extra/5",
    textGlow: "glow-text-extra",
  },
};

export function PersonaCard({
  entry,
  index,
}: {
  entry: RoundEntry;
  index?: number;
}) {
  const colors = COLOR_CLASSES[entry.colorKey] ?? COLOR_CLASSES.extra;
  return (
    <article
      className={`animate-rise-in glass-panel rounded-2xl p-5 sm:p-6 border-l-4 ${colors.border} transition-all duration-300 shadow-xl ${colors.glow}`}
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <PersonaBadge roleName={entry.roleName} colorKey={entry.colorKey} />
          <div className="flex items-baseline gap-2">
            {typeof index === "number" && (
              <span className={`font-mono text-xs ${colors.text} opacity-70`}>
                EX. {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <h3 className={`font-bold text-lg ${colors.text} ${colors.textGlow}`}>
              {entry.roleName}
            </h3>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${colors.bg} ${colors.text} rounded-full shrink-0 font-semibold border border-white/5`}>
          Opening Statement
        </span>
      </header>
      <p className="text-base leading-relaxed text-ink-soft whitespace-pre-wrap">
        {entry.content}
      </p>
    </article>
  );
}
