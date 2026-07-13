import { CORE_PERSONAS } from "@/lib/personas";
import { PersonaBadge } from "./PersonaBadge";

const COLOR_TEXT: Record<string, string> = {
  vc: "text-vc glow-text-vc",
  engineer: "text-engineer glow-text-engineer",
  customer: "text-customer glow-text-customer",
};

const COLOR_BORDER: Record<string, string> = {
  vc: "border-vc/30 hover:border-vc",
  engineer: "border-engineer/30 hover:border-engineer",
  customer: "border-customer/30 hover:border-customer",
};

const COLOR_WASH: Record<string, string> = {
  vc: "bg-vc-soft shadow-vc/5",
  engineer: "bg-engineer-soft shadow-engineer/5",
  customer: "bg-customer-soft shadow-customer/5",
};

const SAMPLE_PITCHES = [
  {
    label: "Healthtech",
    text: "We're building an AI scribe that sits in on telehealth visits, auto-generates clinical notes from the conversation, and syncs them directly to the patient's EHR — saving clinicians 90 minutes a day of after-hours charting.",
  },
  {
    label: "Fintech",
    text: "We're building a debit card for gig workers that advances same-day pay against confirmed shifts, underwritten by real-time platform earnings data instead of a credit score, with no interest charged if repaid within 14 days.",
  },
  {
    label: "Enterprise SaaS",
    text: "We're building a Slack-native tool that watches engineering standup threads and auto-drafts the weekly status report for engineering managers, pulling from linked Jira tickets and GitHub PRs so nobody has to write it by hand.",
  },
];

export function EmptyState({
  onSelectSample,
}: {
  onSelectSample: (text: string) => void;
}) {
  return (
    <div className="relative glass-panel rounded-2xl px-6 py-12 sm:px-8 sm:py-16 text-center overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-customer/5 rounded-full blur-[60px] pointer-events-none -z-10" />

      <p className="relative font-mono text-sm uppercase tracking-[0.25em] text-ink-soft mb-3">
        System Status: Ready
      </p>
      <h2 className="relative font-extrabold text-2xl sm:text-3xl text-ink max-w-lg mx-auto mb-10">
        Enter a pitch above to convene the adversarial panel.
      </h2>

      <div className="relative flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto text-left mb-12">
        {CORE_PERSONAS.map((p) => (
          <div
            key={p.id}
            className={`flex-1 glass-panel rounded-xl border-l-4 ${COLOR_BORDER[p.id]} ${COLOR_WASH[p.id]} p-4 flex items-start gap-3 transition-all duration-300 shadow-lg`}
          >
            <PersonaBadge roleName={p.roleName} colorKey={p.id} size="sm" />
            <div>
              <p className={`font-bold text-base ${COLOR_TEXT[p.id]}`}>
                {p.roleName}
              </p>
              <p className="text-sm text-ink-soft mt-1 leading-relaxed">{p.tagline}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-xl mx-auto text-left">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft mb-4 flex items-center gap-3 font-semibold">
          Select a sample scenario
          <span className="h-px flex-1 bg-rule" aria-hidden />
        </p>
        <ul className="divide-y divide-rule border-t border-b border-rule">
          {SAMPLE_PITCHES.map((sample, i) => (
            <li key={sample.label}>
              <button
                type="button"
                onClick={() => onSelectSample(sample.text)}
                className="group w-full flex items-baseline gap-4 py-3.5 text-left hover:bg-paper-raised/40 transition-all px-3 rounded-lg"
              >
                <span className="font-mono text-sm text-ink-soft opacity-50 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-bold text-base text-ink shrink-0">
                  {sample.label}
                </span>
                <span className="text-sm text-ink-soft truncate flex-1">
                  {sample.text}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-customer opacity-0 group-hover:opacity-100 transition-opacity shrink-0 font-bold">
                  Use Sample →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
