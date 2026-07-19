"use client";

import { useState } from "react";

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESC_MIN = 10;
const DESC_MAX = 300;

export function CustomRoleForm({
  onAdd,
  disabled,
}: {
  onAdd: (input: { roleName: string; description: string }) => void;
  disabled: boolean;
}) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  const nameValid = roleName.trim().length >= NAME_MIN && roleName.trim().length <= NAME_MAX;
  const descValid =
    description.trim().length >= DESC_MIN && description.trim().length <= DESC_MAX;
  const valid = nameValid && descValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || disabled) return;
    onAdd({ roleName: roleName.trim(), description: description.trim() });
    setRoleName("");
    setDescription("");
    setTouched(false);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 shadow-xl flex flex-col gap-4">
      <div>
        <label htmlFor="custom-role-name" className="block font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1.5 font-bold">
          Role Name
        </label>
        <input
          id="custom-role-name"
          type="text"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Copycat Competitor"
          maxLength={NAME_MAX}
          className="w-full rounded-xl border border-rule bg-paper-raised/40 px-4 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-customer/60 focus:ring-1 focus:ring-customer/60 transition-all"
        />
      </div>
      <div>
        <label htmlFor="custom-role-desc" className="block font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1.5 font-bold">
          What do they care about?
        </label>
        <textarea
          id="custom-role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={2}
          placeholder="e.g. Argues they could clone this in a weekend, forces you to defend the moat..."
          maxLength={DESC_MAX}
          className="w-full resize-none rounded-xl border border-rule bg-paper-raised/40 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-customer/60 focus:ring-1 focus:ring-customer/60 transition-all"
        />
      </div>
      {touched && !valid && (
        <p className="font-mono text-xs text-danger">
          {!nameValid
            ? `Role name should be ${NAME_MIN}-${NAME_MAX} characters.`
            : `Description should be ${DESC_MIN}-${DESC_MAX} characters.`}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="px-5 py-2.5 rounded-xl bg-mediator hover:brightness-110 text-paper font-mono text-[10px] uppercase tracking-wider hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
      >
        Swear In Witness
      </button>
    </form>
  );
}
