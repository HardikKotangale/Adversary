interface HeroSectionProps {
  onStartArena: () => void;
}

export function HeroSection({ onStartArena }: HeroSectionProps) {
  return (
    <section className="px-6 py-20 sm:py-32 text-center max-w-4xl mx-auto relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-vc/10 to-engineer/10 rounded-full blur-[80px] pointer-events-none -z-10" />

      <p className="font-mono text-xs tracking-[0.3em] uppercase text-ink-soft opacity-80 mb-6 bg-paper-raised/60 border border-rule px-4 py-1.5 rounded-full inline-block">
        Qwen Cloud × Alibaba Cloud — Agent Society Hackathon
      </p>
      
      <h2 className="font-sans font-extrabold text-5xl sm:text-7xl text-ink tracking-tight leading-[1.05] max-w-3xl mx-auto">
        A panel that <span className="bg-clip-text text-transparent bg-gradient-to-r from-vc via-mediator to-engineer">genuinely disagrees</span>.
      </h2>
      
      <p className="text-lg sm:text-xl text-ink-soft max-w-2xl mx-auto mt-8 leading-relaxed font-sans">
        Adversary puts your pitch in front of a VC, an engineer, and a customer with deeply competing incentives — then lets them debate and rebut each other in real-time. No sugar-coated feedback. Just raw, unfiltered stress-testing.
      </p>
      
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={onStartArena}
          className="px-8 py-4 rounded-xl bg-mediator hover:brightness-110 text-paper font-mono text-sm uppercase tracking-wider shadow-lg shadow-mediator/25 hover:shadow-mediator/40 hover:scale-[1.02] transition-all font-bold"
        >
          Launch Stress-Test Arena →
        </button>
        <a
          href="#how-it-works"
          className="px-6 py-4 rounded-xl border border-rule hover:border-ink-soft text-ink-soft hover:text-ink font-mono text-sm uppercase tracking-wider transition-all"
        >
          How It Works ↓
        </a>
      </div>
    </section>
  );
}
