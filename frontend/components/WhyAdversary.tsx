const FEATURES = [
  {
    title: "Competing incentives, not manufactured variety",
    body: "The VC wants defensibility. The engineer wants proof it's buildable. The customer wants it to beat what they already do. They aren't roleplaying politeness — they actually contradict each other.",
    color: "var(--vc)",
    glowColor: "rgba(255, 46, 147, 0.15)",
  },
  {
    title: "It rebuts, not just reacts",
    body: "Round 2 forces every panelist to read what the others said and respond — agree, disagree, or add nuance. That's what makes it a debate, not three monologues stapled together.",
    color: "var(--engineer)",
    glowColor: "rgba(0, 245, 255, 0.15)",
  },
  {
    title: "Witnesses who read the room",
    body: "A classifier reads your pitch and suggests specific experts — a HIPAA officer for patient data, a financial regulator for lending — each justified by a phrase actually in your pitch, not a generic category match.",
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
