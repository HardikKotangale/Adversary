"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PitchForm } from "@/components/PitchForm";
import { EmptyState } from "@/components/EmptyState";
import { PersonaCard } from "@/components/PersonaCard";
import { RebuttalCard } from "@/components/RebuttalCard";
import { SuggestionCard } from "@/components/SuggestionCard";
import { VerdictStamp } from "@/components/VerdictStamp";
import { RoundLabel } from "@/components/RoundLabel";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RoleLibraryBrowser } from "@/components/RoleLibraryBrowser";
import { CustomRoleForm } from "@/components/CustomRoleForm";
import { HeroSection } from "@/components/HeroSection";
import { WhyAdversary } from "@/components/WhyAdversary";
import { HowItWorks } from "@/components/HowItWorks";
import { TechStrip } from "@/components/TechStrip";
import { CORE_PERSONAS } from "@/lib/personas";
import * as api from "@/lib/client";
import {
  DebateHandle,
  PersonaMeta,
  RoundEntry,
  SuggestedRole,
  Verdict,
} from "@/lib/types";

const MAX_EXTRA_ROLES = 2;

type Status = "empty" | "running" | "complete" | "error";
type ViewMode = "landing" | "arena";

export default function Home() {
  const [view, setView] = useState<ViewMode>("landing");
  const [status, setStatus] = useState<Status>("empty");
  const [pitch, setPitch] = useState("");
  const [draftPitch, setDraftPitch] = useState("");
  const [debateId, setDebateId] = useState<string | null>(null);
  const [round1, setRound1] = useState<RoundEntry[]>([]);
  const [round2, setRound2] = useState<RoundEntry[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<SuggestedRole[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [addedRoles, setAddedRoles] = useState<PersonaMeta[]>([]);
  const [addedEntries, setAddedEntries] = useState<RoundEntry[]>([]);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finderMode, setFinderMode] = useState<"none" | "search" | "custom">("none");

  const handleRef = useRef<DebateHandle | null>(null);
  const round1Ref = useRef<RoundEntry[]>([]);

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const findRoleName = useCallback(
    (id: string | undefined) => {
      if (!id) return undefined;
      return (
        round1.find((e) => e.personaId === id)?.roleName ??
        addedEntries.find((e) => e.personaId === id)?.roleName
      );
    },
    [round1, addedEntries]
  );

  const startDebate = useCallback((pitchText: string) => {
    handleRef.current?.cancel();
    setStatus("running");
    setPitch(pitchText);
    setDraftPitch(pitchText);
    setRound1([]);
    setRound2([]);
    setSuggestedRoles([]);
    setSuggestionsLoading(true);
    setAddedRoles([]);
    setAddedEntries([]);
    setVerdict(null);
    setErrorMessage(null);
    setDebateId(null);
    setElapsedSeconds(0);
    setFinderMode("none");
    round1Ref.current = [];

    handleRef.current = api.runDebate(pitchText, (event) => {
      switch (event.type) {
        case "meta":
          setDebateId(event.debateId);
          break;
        case "suggestions":
          setSuggestedRoles(event.roles);
          setSuggestionsLoading(false);
          break;
        case "round1":
          round1Ref.current = [...round1Ref.current, event.entry];
          setRound1((prev) => [...prev, event.entry]);
          break;
        case "round2":
          setRound2((prev) => [...prev, event.entry]);
          break;
        case "verdict":
          setVerdict(event.verdict);
          break;
        case "done":
          setStatus("complete");
          break;
        case "error":
          setErrorMessage(event.message);
          setStatus("error");
          setSuggestionsLoading(false);
          break;
      }
    });
  }, []);

  const addPersonaToDebate = useCallback(
    (meta: PersonaMeta) => {
      if (addedRoles.length >= MAX_EXTRA_ROLES || !debateId) return;
      setAddedRoles((prev) => [...prev, meta]);
      setSuggestedRoles((prev) => prev.filter((r) => r.id !== meta.id));
      setPendingRoleId(meta.id);
      setFinderMode("none");

      api.addRole(debateId, meta, { pitch, round1: round1Ref.current }, (event) => {
        switch (event.type) {
          case "role_round1":
            setAddedEntries((prev) => [...prev, event.entry]);
            break;
          case "role_rebuttal":
            setAddedEntries((prev) => [...prev, event.entry]);
            setPendingRoleId(null);
            break;
          case "verdict":
            setVerdict(event.verdict);
            break;
          case "error":
            setErrorMessage(event.message);
            setPendingRoleId(null);
            break;
        }
      });
    },
    [addedRoles.length, debateId, pitch]
  );

  const handleAddRole = useCallback(
    (role: SuggestedRole) => {
      addPersonaToDebate({
        id: role.id,
        roleName: role.roleName,
        tagline: role.tagline,
        colorKey: "extra",
        domain: role.domain,
      });
    },
    [addPersonaToDebate]
  );

  const handleAddFromLibrary = useCallback(
    (role: PersonaMeta) => addPersonaToDebate(role),
    [addPersonaToDebate]
  );

  const handleAddCustomRole = useCallback(
    (input: { roleName: string; description: string }) => {
      if (addedRoles.length >= MAX_EXTRA_ROLES || !debateId) return;
      const tempId = `custom_pending_${Date.now()}`;
      const meta: PersonaMeta = {
        id: tempId,
        roleName: input.roleName,
        tagline: input.description,
        colorKey: "extra",
      };
      setAddedRoles((prev) => [...prev, meta]);
      setPendingRoleId(tempId);
      setFinderMode("none");

      api.addCustomRole(debateId, input, { pitch, round1: round1Ref.current }, (event) => {
        switch (event.type) {
          case "role_round1":
            setAddedEntries((prev) => [...prev, event.entry]);
            break;
          case "role_rebuttal":
            setAddedEntries((prev) => [...prev, event.entry]);
            setPendingRoleId(null);
            break;
          case "verdict":
            setVerdict(event.verdict);
            break;
          case "error":
            setErrorMessage(event.message);
            setPendingRoleId(null);
            break;
        }
      });
    },
    [addedRoles.length, debateId, pitch]
  );

  const isRunning = status === "running";
  const round1Pending = Math.max(0, CORE_PERSONAS.length - round1.length);
  const showSuggestions =
    status !== "empty" &&
    (suggestionsLoading || suggestedRoles.length > 0) &&
    addedRoles.length < MAX_EXTRA_ROLES;

  return (
    <div className="flex-1 flex flex-col">
      <header className="relative border-b border-rule px-6 py-4 glass-panel sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => setView("landing")} 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all text-left border-none outline-none bg-transparent shadow-none p-0 focus:outline-none focus:ring-0"
          >
            <span className="case-mark font-serif font-bold text-xl text-ink" aria-hidden>
              A
            </span>
            <div>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight leading-none">
                Adversary
              </h1>
              <div className="spectrum-bar mt-1.5" aria-hidden>
                <span style={{ background: "var(--vc)" }} />
                <span style={{ background: "var(--engineer)" }} />
                <span style={{ background: "var(--customer)" }} />
                <span style={{ background: "var(--mediator)" }} />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-4">
            {view === "arena" ? (
              <button
                onClick={() => setView("landing")}
                className="px-4 py-2 rounded-lg border border-rule hover:border-ink-soft text-ink-soft hover:text-ink font-mono text-xs uppercase tracking-wider transition-all"
              >
                ← View Info & Guide
              </button>
            ) : (
              <button
                onClick={() => setView("arena")}
                className="px-5 py-2 rounded-lg bg-mediator hover:brightness-110 text-paper font-mono text-xs uppercase tracking-wider shadow-lg shadow-mediator/25 transition-all font-bold"
              >
                Launch Arena →
              </button>
            )}
          </div>
        </div>
      </header>

      {view === "landing" ? (
        <div className="animate-rise-in">
          <HeroSection onStartArena={() => setView("arena")} />
          <WhyAdversary />
          <HowItWorks />
          <TechStrip />
          
          <div className="py-16 text-center border-t border-rule">
            <h3 className="text-2xl font-bold mb-4">Ready to put your idea to the test?</h3>
            <button
              onClick={() => setView("arena")}
              className="px-8 py-4 rounded-xl bg-mediator hover:brightness-110 hover:scale-105 active:scale-95 text-paper font-mono text-sm uppercase tracking-wider shadow-xl shadow-mediator/30 transition-all font-bold"
            >
              Enter Adversary Arena
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 px-5 sm:px-10 py-8 max-w-5xl mx-auto w-full animate-rise-in">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/5 flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-rule pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-mediator font-bold">
                  Stress-Testing Terminal
                </span>
                <h2 className="text-3xl font-extrabold text-ink mt-1.5">Submit Pitch Case</h2>
              </div>
              <div className="spectrum-bar" aria-hidden>
                <span className="bg-vc text-vc" />
                <span className="bg-engineer text-engineer" />
                <span className="bg-customer text-customer" />
                <span className="bg-mediator text-mediator" />
              </div>
            </div>

            <PitchForm
              value={draftPitch}
              onChange={setDraftPitch}
              onSubmit={startDebate}
              disabled={isRunning}
            />

            {status === "empty" && <EmptyState onSelectSample={setDraftPitch} />}

            {status === "error" && errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onRetry={() => startDebate(pitch)}
              />
            )}

            {status !== "empty" && (
              <section className="flex flex-col gap-6">
                <RoundLabel>Round I — Opening Statements</RoundLabel>
                {status === "running" && round1Pending > 0 && elapsedSeconds >= 8 && (
                  <p className="font-mono text-xs text-ink-soft opacity-70 -mt-2">
                    Live calls to Qwen Cloud — a response can take up to a minute.
                    {elapsedSeconds >= 8 && ` (${elapsedSeconds}s elapsed)`}
                  </p>
                )}
                <div className="grid gap-6">
                  {round1.map((entry, i) => (
                    <PersonaCard key={entry.personaId} entry={entry} index={i} />
                  ))}
                  {Array.from({ length: round1Pending }).map((_, i) => (
                    <SkeletonCard
                      key={`skeleton-${i}`}
                      colorKey={CORE_PERSONAS[round1.length + i]?.colorKey ?? "extra"}
                      roleName={CORE_PERSONAS[round1.length + i]?.roleName}
                    />
                  ))}
                </div>
              </section>
            )}

            {showSuggestions && (
              <section className="flex flex-col gap-4 border-t border-rule pt-6">
                <RoundLabel>Call Additional Witnesses</RoundLabel>
                <p className="font-mono text-xs text-ink-soft opacity-70 -mt-2">
                  The panel thinks these specialists have something to add — click one to swear
                  them in.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {suggestedRoles.map((role) => (
                    <SuggestionCard
                      key={role.id}
                      role={role}
                      onAdd={() => handleAddRole(role)}
                      disabled={addedRoles.length >= MAX_EXTRA_ROLES}
                    />
                  ))}
                  {suggestionsLoading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={`sugg-skel-${i}`}
                        className="border border-dashed border-extra/30 rounded-xl p-4 animate-pulse bg-paper-raised"
                      >
                        <div className="h-3 w-32 bg-rule mb-2 rounded" />
                        <div className="h-2.5 w-full bg-rule rounded" />
                      </div>
                    ))}
                </div>
                {addedRoles.length > 0 && (
                  <p className="font-mono text-xs text-ink-soft opacity-70">
                    You can call {MAX_EXTRA_ROLES - addedRoles.length} more witness
                    {MAX_EXTRA_ROLES - addedRoles.length === 1 ? "" : "es"} to the stand this
                    session.
                  </p>
                )}
              </section>
            )}

            {status !== "empty" && addedRoles.length < MAX_EXTRA_ROLES && (
              <section className="flex flex-col gap-3 border-t border-rule pt-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setFinderMode((m) => (m === "search" ? "none" : "search"))
                    }
                    className={`px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider border transition-all ${
                      finderMode === "search"
                        ? "border-extra bg-extra text-ink"
                        : "border-rule text-ink-soft hover:border-extra hover:text-ink"
                    }`}
                  >
                    Search full witness roster
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFinderMode((m) => (m === "custom" ? "none" : "custom"))
                    }
                    className={`px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider border transition-all ${
                      finderMode === "custom"
                        ? "border-extra bg-extra text-ink"
                        : "border-rule text-ink-soft hover:border-extra hover:text-ink"
                    }`}
                  >
                    Draft a custom witness
                  </button>
                </div>

                {finderMode === "search" && (
                  <RoleLibraryBrowser
                    excludeIds={[
                      ...addedRoles.map((r) => r.id),
                      ...suggestedRoles.map((r) => r.id),
                    ]}
                    onAdd={handleAddFromLibrary}
                    disabled={addedRoles.length >= MAX_EXTRA_ROLES}
                  />
                )}
                {finderMode === "custom" && (
                  <CustomRoleForm
                    onAdd={handleAddCustomRole}
                    disabled={addedRoles.length >= MAX_EXTRA_ROLES}
                  />
                )}
              </section>
            )}

            {round2.length > 0 && (
              <section className="flex flex-col gap-4 border-t border-rule pt-6">
                <RoundLabel>Round II — Rebuttals</RoundLabel>
                <div className="flex flex-col gap-4">
                  {round2.map((entry, i) => (
                    <RebuttalCard
                      key={`${entry.personaId}-${i}`}
                      entry={entry}
                      targetRoleName={findRoleName(entry.rebuttingId)}
                    />
                  ))}
                </div>
              </section>
            )}

            {addedEntries.length > 0 && (
              <section className="flex flex-col gap-4 border-t border-rule pt-6">
                <RoundLabel>Additional Witnesses</RoundLabel>
                <div className="flex flex-col gap-4">
                  {addedEntries.map((entry, i) =>
                    entry.rebuttingId ? (
                      <RebuttalCard
                        key={`added-${entry.personaId}-${i}`}
                        entry={entry}
                        targetRoleName={findRoleName(entry.rebuttingId)}
                      />
                    ) : (
                      <PersonaCard key={`added-${entry.personaId}-${i}`} entry={entry} />
                    )
                  )}
                  {pendingRoleId && (
                    <SkeletonCard
                      colorKey="extra"
                      roleName={addedRoles.find((r) => r.id === pendingRoleId)?.roleName}
                    />
                  )}
                </div>
              </section>
            )}

            {status === "running" &&
              !verdict &&
              round1.length >= CORE_PERSONAS.length &&
              round2.length >= CORE_PERSONAS.length &&
              !pendingRoleId && (
                <section className="flex flex-col items-center gap-2 py-6 border-t border-rule">
                  <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-mediator">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-mediator animate-pulse shadow-md shadow-mediator/50" />
                    The Mediator is deliberating…
                  </div>
                  <p className="font-mono text-[11px] text-ink-soft opacity-60">
                    The flagship model reasons over the full transcript — this step is often the
                    slowest, sometimes a minute or more.
                  </p>
                </section>
              )}

            {verdict && (
              <section className="border-t border-rule pt-6">
                <RoundLabel>The Verdict</RoundLabel>
                <VerdictStamp verdict={verdict} />
              </section>
            )}
          </div>
        </main>
      )}

      <footer className="border-t border-rule px-6 py-6 mt-12 bg-paper-raised/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="case-mark font-serif font-bold text-base text-ink" aria-hidden>
              A
            </span>
            <div>
              <p className="font-serif font-bold text-sm text-ink leading-none">Adversary</p>
              <p className="text-[10px] font-mono text-ink-soft opacity-70 mt-1">
                A pitch stress-test arena.
              </p>
            </div>
          </div>
          <p className="font-mono text-[10px] text-ink-soft opacity-50 uppercase tracking-wider">
            Qwen Cloud × Alibaba Cloud — Agent Society Track
          </p>
        </div>
      </footer>
    </div>
  );
}
