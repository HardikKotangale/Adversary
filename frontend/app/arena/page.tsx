"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PitchForm } from "@/components/PitchForm";
import { EmptyState } from "@/components/EmptyState";
import { TurnCard } from "@/components/TurnCard";
import { OrchestratorNote } from "@/components/OrchestratorNote";
import { DebateSummary } from "@/components/DebateSummary";
import { VerdictStamp } from "@/components/VerdictStamp";
import { RoundLabel } from "@/components/RoundLabel";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RoleLibraryBrowser } from "@/components/RoleLibraryBrowser";
import { CustomRoleForm } from "@/components/CustomRoleForm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CORE_PERSONAS } from "@/lib/personas";
import * as api from "@/lib/client";
import { ColorKey, DebateHandle, OrchestratorDecision, PersonaMeta, Turn, Verdict } from "@/lib/types";

const MAX_EXTRA_ROLES = 2;
const SUMMON_PLACEHOLDER_ID = "__pending_summon__";

type Status = "empty" | "running" | "complete" | "error";

type FeedItem =
  | { kind: "turn"; key: string; turn: Turn }
  | { kind: "orchestrator"; key: string; decision: OrchestratorDecision }
  | {
      kind: "summon";
      key: string;
      personaId: string;
      roleName: string;
      colorKey: ColorKey;
      reasoning: string;
    };

type PendingSpeaker = { id: string; roleName?: string; colorKey: ColorKey };
type ActivePersonaInfo = { roleName: string; colorKey: ColorKey };

export default function ArenaPage() {
  const [status, setStatus] = useState<Status>("empty");
  const [pitch, setPitch] = useState("");
  const [draftPitch, setDraftPitch] = useState("");
  const [debateId, setDebateId] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activePersonas, setActivePersonas] = useState<Map<string, ActivePersonaInfo>>(new Map());
  const [pendingSpeakers, setPendingSpeakers] = useState<PendingSpeaker[]>([]);
  const [concluded, setConcluded] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finderMode, setFinderMode] = useState<"none" | "search" | "custom">("none");

  const handleRef = useRef<DebateHandle | null>(null);
  const feedKeyRef = useRef(0);
  // Mirrors `activePersonas` synchronously so SSE callbacks (set up once per
  // debate) can look up fresh persona info without a stale-closure read.
  const activePersonasRef = useRef<Map<string, ActivePersonaInfo>>(new Map());

  const updateActivePersonas = useCallback(
    (updater: (prev: Map<string, ActivePersonaInfo>) => Map<string, ActivePersonaInfo>) => {
      setActivePersonas((prev) => {
        const next = updater(prev);
        activePersonasRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const findRoleName = useCallback(
    (id: string | undefined) => (id ? activePersonas.get(id)?.roleName : undefined),
    [activePersonas]
  );

  const startDebate = useCallback(
    (pitchText: string) => {
      handleRef.current?.cancel();
      setStatus("running");
      setPitch(pitchText);
      setDraftPitch(pitchText);
      setDebateId(null);
      setFeed([]);
      setPendingSpeakers([]);
      setConcluded(false);
      updateActivePersonas(() => new Map(CORE_PERSONAS.map((p) => [p.id, { roleName: p.roleName, colorKey: p.colorKey }])));
      setVerdict(null);
      setErrorMessage(null);
      setElapsedSeconds(0);
      setFinderMode("none");
      feedKeyRef.current = 0;

      handleRef.current = api.runDebate(pitchText, (event) => {
        switch (event.type) {
          case "meta":
            setDebateId(event.debateId);
            break;
          case "turn":
            setFeed((prev) => [...prev, { kind: "turn", key: `k${feedKeyRef.current++}`, turn: event.turn }]);
            setPendingSpeakers((prev) => prev.filter((p) => p.id !== event.turn.personaId));
            break;
          case "orchestrator": {
            setFeed((prev) => [
              ...prev,
              { kind: "orchestrator", key: `k${feedKeyRef.current++}`, decision: event.decision },
            ]);
            if (event.decision.action === "speak") {
              setPendingSpeakers(
                event.decision.speakerIds.map((id) => {
                  const info = activePersonasRef.current.get(id);
                  return { id, roleName: info?.roleName, colorKey: info?.colorKey ?? "extra" };
                })
              );
            } else if (event.decision.action === "summon") {
              setPendingSpeakers([{ id: SUMMON_PLACEHOLDER_ID, roleName: undefined, colorKey: "extra" }]);
            } else {
              setPendingSpeakers([]);
              setConcluded(true);
            }
            break;
          }
          case "summon":
            updateActivePersonas((prev) => new Map(prev).set(event.personaId, { roleName: event.roleName, colorKey: event.colorKey }));
            setFeed((prev) => [
              ...prev,
              {
                kind: "summon",
                key: `k${feedKeyRef.current++}`,
                personaId: event.personaId,
                roleName: event.roleName,
                colorKey: event.colorKey,
                reasoning: event.reasoning,
              },
            ]);
            setPendingSpeakers((prev) =>
              prev.map((p) =>
                p.id === SUMMON_PLACEHOLDER_ID
                  ? { id: event.personaId, roleName: event.roleName, colorKey: event.colorKey }
                  : p
              )
            );
            break;
          case "verdict":
            setVerdict(event.verdict);
            setPendingSpeakers([]);
            break;
          case "done":
            setStatus("complete");
            break;
          case "error":
            setErrorMessage(event.message);
            setStatus("error");
            setPendingSpeakers([]);
            break;
        }
      });
    },
    [updateActivePersonas]
  );

  const summonedCount = Math.max(0, activePersonas.size - CORE_PERSONAS.length);

  const addPersonaToDebate = useCallback(
    (meta: PersonaMeta) => {
      if (summonedCount >= MAX_EXTRA_ROLES || !debateId) return;
      updateActivePersonas((prev) => new Map(prev).set(meta.id, { roleName: meta.roleName, colorKey: meta.colorKey }));
      setFinderMode("none");
      setPendingSpeakers([{ id: meta.id, roleName: meta.roleName, colorKey: meta.colorKey }]);

      api.addRole(debateId, meta.id, (event) => {
        switch (event.type) {
          case "summon":
            setFeed((prev) => [
              ...prev,
              {
                kind: "summon",
                key: `k${feedKeyRef.current++}`,
                personaId: event.personaId,
                roleName: event.roleName,
                colorKey: event.colorKey,
                reasoning: event.reasoning,
              },
            ]);
            break;
          case "turn":
            setFeed((prev) => [...prev, { kind: "turn", key: `k${feedKeyRef.current++}`, turn: event.turn }]);
            // The manual-add flow produces two turns (opening, then rebuttal)
            // from the same persona — re-arm the pending skeleton after the
            // first so the wait for the second isn't silently unloading.
            if (event.turn.kind === "summon_opening") {
              setPendingSpeakers([{ id: meta.id, roleName: meta.roleName, colorKey: meta.colorKey }]);
            } else {
              setPendingSpeakers((prev) => prev.filter((p) => p.id !== meta.id));
            }
            break;
          case "verdict":
            setVerdict(event.verdict);
            setPendingSpeakers([]);
            break;
          case "error":
            setErrorMessage(event.message);
            setPendingSpeakers([]);
            break;
        }
      });
    },
    [summonedCount, debateId, updateActivePersonas]
  );

  const handleAddFromLibrary = useCallback((role: PersonaMeta) => addPersonaToDebate(role), [addPersonaToDebate]);

  const handleAddCustomRole = useCallback(
    (input: { roleName: string; description: string }) => {
      if (summonedCount >= MAX_EXTRA_ROLES || !debateId) return;
      setFinderMode("none");
      setPendingSpeakers([{ id: SUMMON_PLACEHOLDER_ID, roleName: input.roleName, colorKey: "extra" }]);

      api.addCustomRole(debateId, input, (event) => {
        switch (event.type) {
          case "summon":
            updateActivePersonas((prev) => new Map(prev).set(event.personaId, { roleName: event.roleName, colorKey: event.colorKey }));
            setFeed((prev) => [
              ...prev,
              {
                kind: "summon",
                key: `k${feedKeyRef.current++}`,
                personaId: event.personaId,
                roleName: event.roleName,
                colorKey: event.colorKey,
                reasoning: event.reasoning,
              },
            ]);
            setPendingSpeakers([{ id: event.personaId, roleName: event.roleName, colorKey: event.colorKey }]);
            break;
          case "turn":
            setFeed((prev) => [...prev, { kind: "turn", key: `k${feedKeyRef.current++}`, turn: event.turn }]);
            if (event.turn.kind !== "summon_opening") {
              setPendingSpeakers((prev) => prev.filter((p) => p.id !== event.turn.personaId));
            }
            break;
          case "verdict":
            setVerdict(event.verdict);
            setPendingSpeakers([]);
            break;
          case "error":
            setErrorMessage(event.message);
            setPendingSpeakers([]);
            break;
        }
      });
    },
    [summonedCount, debateId, updateActivePersonas]
  );

  const isRunning = status === "running";
  const openingsReceived = feed.filter((f) => f.kind === "turn" && f.turn.kind === "opening").length;
  const round1Pending = Math.max(0, CORE_PERSONAS.length - openingsReceived);
  const genesisDone = round1Pending === 0;
  const awaitingVerdict = isRunning && genesisDone && pendingSpeakers.length === 0 && !verdict;
  const turnCount = feed.filter((f) => f.kind === "turn").length;
  const summons = feed
    .filter((f): f is Extract<FeedItem, { kind: "summon" }> => f.kind === "summon")
    .map((f) => ({ roleName: f.roleName, reasoning: f.reasoning }));
  const concludeReasoning = feed
    .filter((f): f is Extract<FeedItem, { kind: "orchestrator" }> => f.kind === "orchestrator")
    .find((f) => f.decision.action === "conclude")?.decision.reasoning;

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />

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

          <PitchForm value={draftPitch} onChange={setDraftPitch} onSubmit={startDebate} disabled={isRunning} />

          {status === "empty" && <EmptyState onSelectSample={setDraftPitch} />}

          {status === "error" && errorMessage && (
            <ErrorBanner message={errorMessage} onRetry={() => startDebate(pitch)} />
          )}

          {status !== "empty" && (
            <section className="flex flex-col gap-6">
              <RoundLabel>The Cross-Examination</RoundLabel>
              {isRunning && elapsedSeconds >= 8 && (
                <p className="font-mono text-xs text-ink-soft opacity-70 -mt-2">
                  Live calls to Qwen Cloud — a response can take up to a minute.
                  {` (${elapsedSeconds}s elapsed)`}
                </p>
              )}

              <div className="flex flex-col gap-4">
                {feed.map((item) => {
                  if (item.kind === "orchestrator") {
                    return <OrchestratorNote key={item.key} decision={item.decision} />;
                  }
                  if (item.kind === "summon") {
                    return (
                      <div
                        key={item.key}
                        className="font-mono text-xs uppercase tracking-wider text-extra text-center py-1"
                      >
                        ⚖ {item.roleName} called to the stand
                      </div>
                    );
                  }
                  return (
                    <TurnCard
                      key={item.key}
                      turn={item.turn}
                      respondingToName={findRoleName(item.turn.respondingToId)}
                      indent={item.turn.kind === "rebuttal"}
                    />
                  );
                })}

                {isRunning &&
                  !genesisDone &&
                  Array.from({ length: round1Pending }).map((_, i) => (
                    <SkeletonCard
                      key={`skeleton-${i}`}
                      colorKey={CORE_PERSONAS[openingsReceived + i]?.colorKey ?? "extra"}
                      roleName={CORE_PERSONAS[openingsReceived + i]?.roleName}
                    />
                  ))}

                {isRunning &&
                  genesisDone &&
                  pendingSpeakers.map((speaker) => (
                    <SkeletonCard
                      key={`pending-${speaker.id}`}
                      colorKey={speaker.colorKey}
                      roleName={speaker.roleName ?? "A specialist witness"}
                    />
                  ))}

                {awaitingVerdict && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-mediator">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-mediator animate-pulse shadow-md shadow-mediator/50" />
                      {concluded ? "The Mediator is deliberating…" : "Panel in session — Orchestrator deciding the next move…"}
                    </div>
                    <p className="font-mono text-[11px] text-ink-soft opacity-60">
                      {concluded
                        ? "The flagship model reasons over the full transcript — this can take a minute or more."
                        : "Live calls to Qwen Cloud — this can take a moment."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {status !== "empty" && summonedCount < MAX_EXTRA_ROLES && debateId && (
            <section className="flex flex-col gap-3 border-t border-rule pt-6">
              <p className="font-mono text-xs text-ink-soft opacity-70">
                The Orchestrator can summon specialists on its own — but you can also force one in manually.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFinderMode((m) => (m === "search" ? "none" : "search"))}
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
                  onClick={() => setFinderMode((m) => (m === "custom" ? "none" : "custom"))}
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
                  excludeIds={[...activePersonas.keys()]}
                  onAdd={handleAddFromLibrary}
                  disabled={summonedCount >= MAX_EXTRA_ROLES}
                />
              )}
              {finderMode === "custom" && (
                <CustomRoleForm onAdd={handleAddCustomRole} disabled={summonedCount >= MAX_EXTRA_ROLES} />
              )}
            </section>
          )}

          {verdict && (
            <section className="border-t border-rule pt-6 flex flex-col gap-6">
              <DebateSummary
                turnCount={turnCount}
                panelistCount={activePersonas.size}
                summons={summons}
                concludeReasoning={concludeReasoning}
              />
              <div>
                <RoundLabel>The Verdict</RoundLabel>
                <VerdictStamp verdict={verdict} />
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
