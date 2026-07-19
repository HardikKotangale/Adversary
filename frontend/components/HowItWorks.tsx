const STEPS = [
  {
    n: "01",
    title: "File the Pitch",
    body: "Enter your startup or project idea. A minimum of 40 characters gives our adversarial agents enough surface area to stress-test.",
  },
  {
    n: "02",
    title: "Opening Statements",
    body: "VC, Engineer, and Customer react to the raw pitch independently and in parallel, streaming in as each finishes.",
  },
  {
    n: "03",
    title: "The Orchestrator Takes Over",
    body: "After every turn, an agent reads the live transcript and decides what happens next: who rebuts whom, when to summon a specialist witness, when the cross-examination is actually done. Nothing about the debate's length or shape is scripted.",
  },
  {
    n: "04",
    title: "The Final Verdict",
    body: "The Mediator AI processes the complete cross-examination transcript and renders a fundability score, critical risks, and concrete next steps.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-16 sm:py-24 max-w-5xl mx-auto border-t border-rule">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft mb-2">
          The Process Flow
        </p>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-ink">
          Four stages of relentless scrutiny.
        </h3>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="glass-panel rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-ink-soft/20 flex flex-col justify-between"
          >
            <div>
              <span className="font-mono font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-vc to-customer opacity-70">
                {step.n}
              </span>
              <h4 className="font-bold text-base text-ink mt-3 mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
