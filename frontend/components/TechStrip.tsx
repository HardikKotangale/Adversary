const ITEMS = [
  {
    label: "qwen3.7-plus",
    role: "Runs the panel",
    body: "Every VC / Engineer / Customer / witness call — fast and cost-effective enough to run in volume across rounds.",
  },
  {
    label: "qwen3.7-max",
    role: "Delivers the verdict",
    body: "One flagship-model call per debate, reasoning over the entire transcript to produce the scored ruling.",
  },
  {
    label: "Alibaba Cloud",
    role: "RDS + OSS",
    body: "Every debate is persisted to RDS for PostgreSQL; every transcript is exported as JSON to Object Storage Service.",
  },
];

export function TechStrip() {
  return (
    <section className="border-b border-rule px-5 sm:px-10 py-16 sm:py-24 max-w-5xl mx-auto">
      <div className="mx-auto">
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-ink-soft mb-2 font-bold">
          Under the hood
        </p>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-ink mb-12 max-w-xl">
          Built on Qwen Cloud, deployed on Alibaba Cloud.
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
             <div key={item.label} className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg">
              <p className="font-mono text-sm uppercase tracking-wider text-mediator mb-2 font-bold">
                {item.role}
              </p>
              <p className="font-bold text-2xl text-ink mb-2.5">{item.label}</p>
              <p className="text-base text-ink-soft leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
