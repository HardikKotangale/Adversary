"use client";

import { useMemo, useState } from "react";
import { PERSONA_LIBRARY } from "@/lib/personas";
import { PersonaMeta } from "@/lib/types";
import { PersonaBadge } from "./PersonaBadge";

const DOMAIN_LABELS: Record<string, string> = {
  healthcare: "Healthcare",
  fintech: "Fintech",
  consumer_social: "Consumer / Social",
  deep_tech: "Deep Tech",
  enterprise_saas: "Enterprise SaaS",
  legal_regulated: "Legal / Regulated",
  climate_energy: "Climate / Energy",
};

export function RoleLibraryBrowser({
  excludeIds,
  onAdd,
  disabled,
}: {
  excludeIds: string[];
  onAdd: (role: PersonaMeta) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PERSONA_LIBRARY.filter((p) => !excludeIds.includes(p.id)).filter((p) => {
      if (!q) return true;
      const domainLabel = DOMAIN_LABELS[p.domain ?? ""] ?? p.domain ?? "";
      return (
        p.roleName.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        domainLabel.toLowerCase().includes(q)
      );
    });
  }, [query, excludeIds]);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 shadow-xl" data-testid="role-library-browser">
      <label htmlFor="role-search" className="sr-only">
        Search the full witness roster
      </label>
      <input
        id="role-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by role, domain, or focus (e.g. “IP attorney”, “fintech”)…"
        className="w-full rounded-xl border border-rule bg-paper-raised/40 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-customer/60 focus:ring-1 focus:ring-customer/60 transition-all mb-4"
      />
      
      <div className="max-h-72 overflow-y-auto divide-y divide-rule border-t border-b border-rule">
        {results.length === 0 && (
          <p className="font-mono text-xs text-ink-soft py-6 text-center">
            No roles match &ldquo;{query}&rdquo;.
          </p>
        )}
        {results.map((role) => (
          <div key={role.id} className="flex items-center gap-3 py-3 hover:bg-paper-raised/10 px-2 rounded-lg transition-colors">
            <PersonaBadge roleName={role.roleName} colorKey={role.colorKey} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="font-bold text-sm text-extra">{role.roleName}</p>
                {role.domain && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-soft opacity-60">
                    {DOMAIN_LABELS[role.domain] ?? role.domain}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft truncate">{role.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(role)}
              disabled={disabled}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-extra text-extra font-mono text-[9px] uppercase tracking-wider hover:bg-extra hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
