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

export function RebuttalCard({
  entry,
  targetRoleName,
}: {
  entry: RoundEntry;
  targetRoleName?: string;
}) {
  const colors = COLOR_CLASSES[entry.colorKey] ?? COLOR_CLASSES.extra;
  return (
    <div className="relative ml-4 sm:ml-10 animate-rise-in">
      {/* connecting line back to the rebutted persona */}
      <span
        aria-hidden
        className="absolute -left-4 sm:-left-6 top-0 bottom-0 w-px bg-rule"
      />
      <span
        aria-hidden
        className="absolute -left-4 sm:-left-6 top-6 w-4 sm:w-6 h-px bg-rule"
      />
      <article className={`glass-panel rounded-2xl p-4 sm:p-5 border-l-4 ${colors.border} transition-all duration-300 shadow-xl ${colors.glow}`}>
        <header className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <PersonaBadge roleName={entry.roleName} colorKey={entry.colorKey} size="sm" />
            <h4 className={`font-bold text-base ${colors.text} ${colors.textGlow}`}>
              {entry.roleName}
            </h4>
            {targetRoleName && (
              <span className="font-mono text-xs text-ink-soft opacity-70">
                → rebutting <span className="text-ink font-semibold">{targetRoleName}</span>
              </span>
            )}
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${colors.bg} ${colors.text} rounded-full shrink-0 font-semibold border border-white/5`}>
            Rebuttal
          </span>
        </header>
        <p className="text-base leading-relaxed text-ink-soft whitespace-pre-wrap">
          {entry.content}
        </p>
      </article>
    </div>
  );
}
