// Shared types describing the Adversary API surface.
// Mirrors backend/src/types.ts — the SSE event union below matches what the
// Express backend actually emits from its Orchestrator-driven debate engine.

export type PersonaId = string;

export type ColorKey = "vc" | "engineer" | "customer" | "mediator" | "extra";

export interface PersonaMeta {
  id: PersonaId;
  roleName: string;
  tagline: string;
  colorKey: ColorKey;
  domain?: string;
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export type TurnKind = "opening" | "rebuttal" | "summon_opening";

export interface Turn {
  turnId: number;
  personaId: PersonaId;
  roleName: string;
  colorKey: ColorKey;
  content: string;
  kind: TurnKind;
  respondingToId?: PersonaId;
  toolCalls?: ToolCallRecord[];
}

export interface OrchestratorDecision {
  action: "speak" | "summon" | "conclude";
  speakerIds: string[];
  directives?: Record<string, string>;
  specialistToSummon?: string;
  reasoning: string;
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
  | { type: "orchestrator"; decision: OrchestratorDecision }
  | { type: "turn"; turn: Turn }
  | { type: "summon"; personaId: string; roleName: string; colorKey: ColorKey; reasoning: string }
  | { type: "verdict"; verdict: Verdict }
  | { type: "done"; transcriptUrl: string }
  | { type: "error"; message: string };

export interface DebateHandle {
  cancel: () => void;
}
