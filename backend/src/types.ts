export type ColorKey = "vc" | "engineer" | "customer" | "mediator" | "extra";

export interface RoundEntry {
  personaId: string;
  roleName: string;
  colorKey: ColorKey;
  content: string;
  rebuttingId?: string;
}

export interface SuggestedRole {
  id: string;
  roleName: string;
  tagline: string;
  domain: string;
  justification: string;
}

export interface Verdict {
  score: number; // 1-10 fundability score
  strongestPoint: string;
  weakestPoint: string;
  biggestRisk: string;
  nextStep: string;
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

export interface DebateRecord {
  id: string;
  pitch: string;
  round1: RoundEntry[];
  round2: RoundEntry[];
  addedRoles: RoundEntry[]; // flattened: each added persona's round1 + rebuttal entries
  verdict: Verdict | null;
  transcriptUrl: string | null;
  createdAt: string;
}
