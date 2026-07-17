import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { CORE_PERSONAS, PERSONA_LIBRARY, MEDIATOR_PROMPT, findPersona, buildCustomPersona } from "./personas.js";
import { callPersonaTurn, callOrchestrator, callMediator } from "./qwen.js";
import { sendEvent } from "./sse.js";
import { debateStore } from "./store.js";
import { persistTranscript } from "./transcript.js";
import { config } from "./config.js";
import { DebateMemory } from "./debateMemory.js";
import type { DebateRecord, DebateEvent, RoleInput } from "./types.js";

const MAX_DYNAMIC_TURNS = 14;

/** Runs one persona's turn against the current shared memory, emitting the resulting Turn. */
async function runTurn(
  memory: DebateMemory,
  personaId: string,
  kind: "opening" | "rebuttal" | "summon_opening",
  directive: string | undefined,
  emit: (e: DebateEvent) => void
): Promise<void> {
  const persona = memory.getActivePersona(personaId);
  if (!persona) return;
  const isOpening = kind !== "rebuttal";
  const result = await callPersonaTurn(persona, memory.pitch, memory.transcriptText(), directive, isOpening);
  const turn = memory.addTurn(persona, result.content, kind, result.respondingToId, result.toolCalls);
  emit({ type: "turn", turn });
}

export async function runDebate(pitch: string, res: Response): Promise<void> {
  const debateId = randomUUID();
  const createdAt = new Date().toISOString();
  const emit = (event: DebateEvent) => sendEvent(res, event);

  emit({ type: "meta", debateId, createdAt });

  const memory = new DebateMemory(pitch);
  for (const persona of CORE_PERSONAS) memory.addActivePersona(persona);

  try {
    // Genesis step: the core panel always opens — nothing to orchestrate yet
    // with zero transcript, so this one step is deterministic. Every turn
    // after this is a genuine Orchestrator decision.
    await Promise.all(
      CORE_PERSONAS.map((p) => runTurn(memory, p.id, "opening", undefined, emit))
    );

    let concluded = false;
    while (!concluded && memory.turnCount < MAX_DYNAMIC_TURNS) {
      const summonedIds = new Set(memory.listActivePersonas().map((p) => p.id));
      const availableSpecialists = PERSONA_LIBRARY.filter((p) => !summonedIds.has(p.id)).map((p) => ({
        id: p.id,
        roleName: p.roleName,
        tagline: p.systemPrompt.split(".")[0].replace(/^You are (a |an )?/i, ""),
        domain: p.domain,
      }));

      const decision = await callOrchestrator({
        pitch,
        activePersonas: memory.listActivePersonas().map((p) => ({ id: p.id, roleName: p.roleName })),
        availableSpecialists,
        transcriptSoFar: memory.transcriptText(),
        turnCount: memory.turnCount,
        maxTurns: MAX_DYNAMIC_TURNS,
      });
      emit({ type: "orchestrator", decision });

      if (decision.action === "conclude") {
        concluded = true;
        break;
      }

      if (decision.action === "summon" && decision.specialistToSummon) {
        const specialist = findPersona(decision.specialistToSummon);
        if (specialist && !summonedIds.has(specialist.id)) {
          memory.addActivePersona(specialist);
          emit({
            type: "summon",
            personaId: specialist.id,
            roleName: specialist.roleName,
            colorKey: specialist.colorKey,
            reasoning: decision.reasoning,
          });
          await runTurn(memory, specialist.id, "summon_opening", undefined, emit);
        }
        continue;
      }

      if (decision.action === "speak" && decision.speakerIds.length > 0) {
        const speakers = decision.speakerIds.filter((id) => memory.getActivePersona(id));
        if (speakers.length === 0) break; // orchestrator named unknown ids twice in a row — bail safely
        await Promise.all(
          speakers.map((id) => runTurn(memory, id, "rebuttal", decision.directives?.[id], emit))
        );
        continue;
      }

      // Unrecognized/empty decision — treat as conclude rather than loop forever.
      break;
    }

    const verdict = await callMediator(MEDIATOR_PROMPT, memory.transcriptText());
    emit({ type: "verdict", verdict });

    const record: DebateRecord = {
      id: debateId,
      pitch,
      turns: [...memory.getTurns()],
      activePersonaIds: memory.listActivePersonas().map((p) => p.id),
      verdict,
      transcriptUrl: null,
      createdAt,
    };
    await debateStore.create(record);

    const transcriptUrl = await persistTranscript(record);
    await debateStore.update(debateId, { transcriptUrl });

    emit({ type: "done", transcriptUrl });
  } catch (err) {
    console.error("debate failed:", err);
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  } finally {
    res.end();
  }
}

export async function runAddRole(debateId: string, roleInput: RoleInput, res: Response): Promise<void> {
  const emit = (event: DebateEvent) => sendEvent(res, event);

  const record = await debateStore.get(debateId);
  if (!record) {
    emit({ type: "error", message: "Debate not found." });
    res.end();
    return;
  }

  const summonedCount = record.activePersonaIds.length - 3; // core panel doesn't count against the cap
  if (summonedCount >= config.maxExtraRoles) {
    emit({ type: "error", message: "Extra role limit reached for this session." });
    res.end();
    return;
  }

  const persona =
    "roleId" in roleInput
      ? findPersona(roleInput.roleId)
      : buildCustomPersona(roleInput.customRoleName, roleInput.customDescription);

  if (!persona) {
    emit({
      type: "error",
      message: "roleId" in roleInput ? `Unknown role: ${roleInput.roleId}` : "Invalid custom role.",
    });
    res.end();
    return;
  }

  try {
    // Rehydrate a DebateMemory from the stored record so this manual add
    // reads/writes through the same shared-memory abstraction as the main
    // dynamic loop, not a parallel code path.
    const memory = new DebateMemory(record.pitch);
    const allKnownPersonas = [...CORE_PERSONAS, ...PERSONA_LIBRARY];
    for (const id of record.activePersonaIds) {
      const p = allKnownPersonas.find((x) => x.id === id) ?? persona;
      memory.addActivePersona(p);
    }
    for (const t of record.turns) {
      const p = memory.getActivePersona(t.personaId) ?? persona;
      memory.addTurn(p, t.content, t.kind, t.respondingToId, t.toolCalls);
    }
    memory.addActivePersona(persona);

    emit({
      type: "summon",
      personaId: persona.id,
      roleName: persona.roleName,
      colorKey: persona.colorKey,
      reasoning: "Manually called in by the founder.",
    });
    await runTurn(memory, persona.id, "summon_opening", undefined, emit);
    await runTurn(memory, persona.id, "rebuttal", undefined, emit);

    const verdict = await callMediator(MEDIATOR_PROMPT, memory.transcriptText());
    emit({ type: "verdict", verdict });

    const updatedRecord: DebateRecord = {
      ...record,
      turns: [...memory.getTurns()],
      activePersonaIds: memory.listActivePersonas().map((p) => p.id),
      verdict,
    };
    const transcriptUrl = await persistTranscript(updatedRecord);
    updatedRecord.transcriptUrl = transcriptUrl;
    await debateStore.update(debateId, updatedRecord);

    emit({ type: "done", transcriptUrl });
  } catch (err) {
    console.error("add-role failed:", err);
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  } finally {
    res.end();
  }
}
