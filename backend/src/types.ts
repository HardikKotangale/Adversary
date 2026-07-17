export type ColorKey = "vc" | "engineer" | "customer" | "mediator" | "extra";

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export type TurnKind = "opening" | "rebuttal" | "summon_opening";

export interface Turn {
  turnId: number;
  personaId: string;
  roleName: string;
  colorKey: ColorKey;
  content: string;
  kind: TurnKind;
  respondingToId?: string;
  toolCalls?: ToolCallRecord[];
}

export interface OrchestratorDecision {
  action: "speak" | "summon" | "conclude";
  speakerIds: string[];
  directives?: Record<string, string>;
  specialistToSummon?: string; // persona library id
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

export type RoleInput =
  | { roleId: string }
  | { customRoleName: string; customDescription: string };

export interface DebateRecord {
  id: string;
  pitch: string;
  turns: Turn[];
  activePersonaIds: string[];
  verdict: Verdict | null;
  transcriptUrl: string | null;
  createdAt: string;
}
