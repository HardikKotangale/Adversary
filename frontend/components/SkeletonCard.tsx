const COLOR_CLASSES: Record<string, { border: string; text: string; ring: string }> = {
  vc: { border: "border-vc/35", text: "text-vc glow-text-vc", ring: "ring-vc/30" },
  engineer: { border: "border-engineer/35", text: "text-engineer glow-text-engineer", ring: "ring-engineer/30" },
  customer: { border: "border-customer/35", text: "text-customer glow-text-customer", ring: "ring-customer/30" },
  extra: { border: "border-extra/35", text: "text-extra glow-text-extra", ring: "ring-extra/30" },
};

export function SkeletonCard({
  colorKey,
  roleName,
}: {
  colorKey: string;
  roleName?: string;
}) {
  const colors = COLOR_CLASSES[colorKey] ?? COLOR_CLASSES.extra;
  return (
    <div
      className={`glass-panel rounded-2xl border-l-4 ${colors.border} p-5 sm:p-6 shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`inline-block w-8 h-8 rounded-full ring-2 ${colors.ring} animate-pulse shrink-0 bg-paper`}
          aria-hidden
        />
        <p className={`font-mono text-xs uppercase tracking-wider ${colors.text} font-bold`}>
          {roleName ? `${roleName} is drafting…` : "Awaiting response"}
          <span className="inline-block animate-caret">_</span>
        </p>
      </div>
      <div className="space-y-3 animate-pulse">
        <div className="h-2.5 bg-rule w-full rounded" />
        <div className="h-2.5 bg-rule w-11/12 rounded" />
        <div className="h-2.5 bg-rule w-4/5 rounded" />
      </div>
    </div>
  );
}
