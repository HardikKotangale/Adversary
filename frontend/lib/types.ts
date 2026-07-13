// Shared types describing the Adversary API surface.
// Phase 1: implemented by lib/mockApi.ts
// Phase 2: implemented by real fetch() calls against the Express backend,
// with SSE events matching the DebateEvent union below.

export type CorePersonaId = "vc" | "engineer" | "customer";
export type PersonaId = CorePersonaId | "mediator" | string;

export type ColorKey =
  | "vc"
  | "engineer"
  | "customer"
  | "mediator"
  | "extra";

export interface PersonaMeta {
  id: PersonaId;
  roleName: string;
  tagline: string;
  colorKey: ColorKey;
  domain?: string;
}

export interface SuggestedRole {
  id: string;
  roleName: string;
  tagline: string;
  domain: string;
  justification: string;
}

export interface RoundEntry {
  personaId: PersonaId;
  roleName: string;
  colorKey: ColorKey;
  content: string;
  /** Set on round 2 / rebuttal entries: which persona this is primarily responding to. */
  rebuttingId?: PersonaId;
}

export interface Verdict {
  score: number; // 1-10 fundability score
  strongestPoint: string;
  weakestPoint: string;
  biggestRisk: string;
  nextStep: string;
}

export type DebateStatus =
  | "idle"
  | "round1"
  | "round2"
  | "verdict"
  | "complete"
  | "error";

export interface Debate {
  id: string;
  pitch: string;
  status: DebateStatus;
  round1: RoundEntry[];
  round2: RoundEntry[];
  suggestedRoles: SuggestedRole[];
  addedRoles: PersonaMeta[];
  verdict: Verdict | null;
  transcriptUrl?: string;
  createdAt: string;
}

export type DebateEvent =
  | { type: "meta"; debateId: string; createdAt: string }
  | { type: "round1"; entry: RoundEntry }
  | { type: "suggestions"; roles: SuggestedRole[] }
  | { type: "round2"; entry: RoundEntry }
  | { type: "verdict"; verdict: Verdict }
  | { type: "done"; transcriptUrl: string }
  | { type: "error"; message: string };

export type AddRoleEvent =
  | { type: "role_round1"; entry: RoundEntry }
  | { type: "role_rebuttal"; entry: RoundEntry }
  | { type: "verdict"; verdict: Verdict }
  | { type: "done"; transcriptUrl: string }
  | { type: "error"; message: string };

export interface DebateHandle {
  cancel: () => void;
}
