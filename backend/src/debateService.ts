import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { CORE_PERSONAS, MEDIATOR_PROMPT, findPersona, buildCustomPersona } from "./personas.js";
import { callPersonaOpening, callPersonaRebuttal, callMediator } from "./qwen.js";
import { suggestExtraRoles } from "./classifier.js";
import { sendEvent } from "./sse.js";
import { debateStore } from "./store.js";
import { persistTranscript } from "./transcript.js";
import { config } from "./config.js";
import type {
  DebateRecord,
  RoundEntry,
  DebateEvent,
  AddRoleEvent,
} from "./types.js";

function buildTranscriptText(record: DebateRecord): string {
  const lines: string[] = ["ROUND 1 — OPENING STATEMENTS"];
  for (const e of record.round1) lines.push(`[${e.roleName}] ${e.content}`);

  if (record.round2.length > 0) {
    lines.push("", "ROUND 2 — REBUTTALS");
    for (const e of record.round2) {
      lines.push(`[${e.roleName} -> rebutting ${e.rebuttingId}] ${e.content}`);
    }
  }

  if (record.addedRoles.length > 0) {
    lines.push("", "ADDITIONAL WITNESSES");
    for (const e of record.addedRoles) {
      lines.push(
        `[${e.roleName}${e.rebuttingId ? ` -> rebutting ${e.rebuttingId}` : ""}] ${e.content}`
      );
    }
  }

  return lines.join("\n");
}

export async function runDebate(pitch: string, res: Response): Promise<void> {
  const debateId = randomUUID();
  const createdAt = new Date().toISOString();
  const emit = (event: DebateEvent) => sendEvent(res, event);

  emit({ type: "meta", debateId, createdAt });

  const record: DebateRecord = {
    id: debateId,
    pitch,
    round1: [],
    round2: [],
    addedRoles: [],
    verdict: null,
    transcriptUrl: null,
    createdAt,
  };
  await debateStore.create(record);

  const classifierPromise = suggestExtraRoles(pitch)
    .then((roles) => emit({ type: "suggestions", roles }))
    .catch((err) => {
      console.error("classifier failed:", err);
    });

  try {
    const round1Results: RoundEntry[] = new Array(CORE_PERSONAS.length);
    await Promise.all(
      CORE_PERSONAS.map(async (persona, i) => {
        const content = await callPersonaOpening(persona.systemPrompt, pitch);
        const entry: RoundEntry = {
          personaId: persona.id,
          roleName: persona.roleName,
          colorKey: persona.colorKey,
          content,
        };
        round1Results[i] = entry;
        record.round1.push(entry);
        emit({ type: "round1", entry });
      })
    );

    await Promise.all(
      CORE_PERSONAS.map(async (persona) => {
        const others = round1Results
          .filter((e) => e.personaId !== persona.id)
          .map((e) => ({ id: e.personaId, roleName: e.roleName, content: e.content }));
        const { targetPersonaId, content } = await callPersonaRebuttal(
          persona.systemPrompt,
          pitch,
          others
        );
        const entry: RoundEntry = {
          personaId: persona.id,
          roleName: persona.roleName,
          colorKey: persona.colorKey,
          content,
          rebuttingId: targetPersonaId,
        };
        record.round2.push(entry);
        emit({ type: "round2", entry });
      })
    );

    await classifierPromise;

    const verdict = await callMediator(MEDIATOR_PROMPT, buildTranscriptText(record));
    record.verdict = verdict;
    emit({ type: "verdict", verdict });

    const transcriptUrl = await persistTranscript(record);
    record.transcriptUrl = transcriptUrl;
    await debateStore.update(debateId, record);

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

export type RoleInput =
  | { roleId: string }
  | { customRoleName: string; customDescription: string };

export async function runAddRole(
  debateId: string,
  roleInput: RoleInput,
  res: Response
): Promise<void> {
  const emit = (event: AddRoleEvent) => sendEvent(res, event);

  const record = await debateStore.get(debateId);
  if (!record) {
    emit({ type: "error", message: "Debate not found." });
    res.end();
    return;
  }

  const addedCount = record.addedRoles.filter((e) => !e.rebuttingId).length;
  if (addedCount >= config.maxExtraRoles) {
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
    const openingContent = await callPersonaOpening(persona.systemPrompt, record.pitch);
    const openingEntry: RoundEntry = {
      personaId: persona.id,
      roleName: persona.roleName,
      colorKey: persona.colorKey,
      content: openingContent,
    };
    record.addedRoles.push(openingEntry);
    emit({ type: "role_round1", entry: openingEntry });

    const others = record.round1.map((e) => ({
      id: e.personaId,
      roleName: e.roleName,
      content: e.content,
    }));
    const { targetPersonaId, content } = await callPersonaRebuttal(
      persona.systemPrompt,
      record.pitch,
      others
    );
    const rebuttalEntry: RoundEntry = {
      personaId: persona.id,
      roleName: persona.roleName,
      colorKey: persona.colorKey,
      content,
      rebuttingId: targetPersonaId,
    };
    record.addedRoles.push(rebuttalEntry);
    emit({ type: "role_rebuttal", entry: rebuttalEntry });

    const verdict = await callMediator(MEDIATOR_PROMPT, buildTranscriptText(record));
    record.verdict = verdict;
    emit({ type: "verdict", verdict });

    const transcriptUrl = await persistTranscript(record);
    record.transcriptUrl = transcriptUrl;
    await debateStore.update(debateId, record);

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
