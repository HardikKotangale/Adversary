const FEATURES = [
  {
    title: "Competing incentives, not manufactured variety",
    body: "The VC wants defensibility. The engineer wants proof it's buildable. The customer wants it to beat what they already do. They aren't roleplaying politeness — they actually contradict each other.",
    color: "var(--vc)",
    glowColor: "rgba(255, 46, 147, 0.15)",
  },
  {
    title: "An Orchestrator decides, not a script",
    body: "After every turn, an agent reads the live transcript and decides who speaks next, when to call in a specialist, and when the cross-examination is finished — a real decision, not a hardcoded round count. Personas can also call a calculator or re-search the pitch text via real tool calls before responding.",
    color: "var(--engineer)",
    glowColor: "rgba(0, 245, 255, 0.15)",
  },
  {
    title: "Witnesses who read the room",
    body: "The Orchestrator can summon any of 18 domain specialists mid-debate — a HIPAA officer for patient data, a financial regulator for lending — grounded in what's actually been said in the live transcript, not a pre-computed list from the initial pitch alone.",
    color: "var(--extra)",
    glowColor: "rgba(181, 23, 158, 0.15)",
  },
  {
    title: "A verdict with teeth",
    body: "Not a summary. A 1–10 fundability score, the strongest point, the weakest point, the single biggest risk, and one concrete next step — all grounded in what the panel actually said.",
    color: "var(--mediator)",
    glowColor: "rgba(255, 209, 102, 0.15)",
  },
];

export function WhyAdversary() {
  return (
    <section className="px-6 py-16 sm:py-24 max-w-5xl mx-auto border-t border-rule">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft mb-2">
          The Design Principle
        </p>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-ink">
          Real tension, not agreeable echo chambers.
        </h3>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-ink-soft/20 flex flex-col justify-between"
            style={{
              boxShadow: `0 10px 30px -15px ${f.glowColor}`,
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
              style={{ backgroundColor: f.color }}
            />
            <div>
              <h4 className="font-semibold text-lg text-ink mb-3 pl-2">{f.title}</h4>
              <p className="text-base text-ink-soft leading-relaxed pl-2">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
