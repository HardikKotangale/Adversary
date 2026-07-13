import { SuggestedRole } from "@/lib/types";

export function SuggestionCard({
  role,
  onAdd,
  disabled,
}: {
  role: SuggestedRole;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="group text-left animate-rise-in glass-panel rounded-2xl p-4 border border-dashed border-extra/30 hover:border-extra hover:bg-extra-soft/30 hover:scale-[1.01] hover:shadow-lg hover:shadow-extra/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-bold text-sm text-extra glow-text-extra">
          {role.roleName}
        </h4>
        <span className="font-mono text-[9px] uppercase tracking-wider text-extra opacity-0 group-hover:opacity-100 transition-opacity shrink-0 font-bold">
          {disabled ? "Limit Reached" : "+ Swear In"}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-ink-soft">
        {role.justification}
      </p>
    </button>
  );
}
