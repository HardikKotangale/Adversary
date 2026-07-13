const SOLID_BG: Record<string, string> = {
  vc: "bg-vc",
  engineer: "bg-engineer",
  customer: "bg-customer",
  mediator: "bg-mediator",
  extra: "bg-extra",
};

export function PersonaBadge({
  roleName,
  colorKey,
  size = "md",
}: {
  roleName: string;
  colorKey: string;
  size?: "sm" | "md";
}) {
  const initial = roleName.trim().charAt(0).toUpperCase();
  const dims = size === "sm" ? "w-6 h-6 text-[11px]" : "w-8 h-8 text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${dims} ${SOLID_BG[colorKey] ?? SOLID_BG.extra} text-paper font-serif font-bold shrink-0 ring-2 ring-paper`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
