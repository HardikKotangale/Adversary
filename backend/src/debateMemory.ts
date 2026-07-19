import type { ColorKey, Turn, TurnKind, ToolCallRecord } from "./types.js";
import type { Persona } from "./personas.js";

/**
 * The single shared state object every agent call in a debate reads from and
 * writes to: the pitch, the panel of currently-active personas, and the
 * ordered transcript of turns taken so far. No agent or LLM call holds any
 * state of its own between calls; this object *is* the debate's memory.
 */
export class DebateMemory {
  readonly pitch: string;
  private turns: Turn[] = [];
  private activePersonas = new Map<string, Persona>();
  private nextTurnId = 1;

  constructor(pitch: string) {
    this.pitch = pitch;
  }

  addActivePersona(persona: Persona): void {
    this.activePersonas.set(persona.id, persona);
  }

  getActivePersona(id: string): Persona | undefined {
    return this.activePersonas.get(id);
  }

  listActivePersonas(): Persona[] {
    return [...this.activePersonas.values()];
  }

  addTurn(
    persona: Persona,
    content: string,
    kind: TurnKind,
    respondingToId?: string,
    toolCalls?: ToolCallRecord[]
  ): Turn {
    const turn: Turn = {
      turnId: this.nextTurnId++,
      personaId: persona.id,
      roleName: persona.roleName,
      colorKey: persona.colorKey as ColorKey,
      content,
      kind,
      respondingToId,
      toolCalls,
    };
    this.turns.push(turn);
    return turn;
  }

  getTurns(): readonly Turn[] {
    return this.turns;
  }

  get turnCount(): number {
    return this.turns.length;
  }

  /** Flattens the transcript to plain text for prompts that need the full history. */
  transcriptText(): string {
    if (this.turns.length === 0) return "(no turns yet)";
    return this.turns
      .map((t) => {
        const tag =
          t.kind === "opening"
            ? "OPENING"
            : t.kind === "summon_opening"
              ? "OPENING (newly summoned)"
              : `REBUTTAL${t.respondingToId ? ` -> ${t.respondingToId}` : ""}`;
        return `[${t.roleName} | id=${t.personaId} | ${tag}] ${t.content}`;
      })
      .join("\n\n");
  }
}
