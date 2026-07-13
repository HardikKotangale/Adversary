import OpenAI from "openai";
import { config } from "./config.js";
import type { Verdict } from "./types.js";

// Qwen Cloud (DashScope international) latency is occasionally high, especially
// for the flagship mediator model — a generous timeout with no retries avoids
// compounding a slow-but-working call into a false failure.
const client = new OpenAI({
  apiKey: config.qwen.apiKey,
  baseURL: config.qwen.baseURL,
  timeout: 120_000,
  maxRetries: 0,
});

async function chat(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error(`Empty completion from model ${model}`);
  }
  return text.trim();
}

/** Extracts a JSON object from a completion, tolerating stray prose around it. */
function extractJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`Could not find JSON in completion: ${text.slice(0, 200)}`);
    }
    return JSON.parse(text.slice(start, end + 1)) as T;
  }
}

export async function callPersonaOpening(
  systemPrompt: string,
  pitch: string
): Promise<string> {
  return chat(
    config.qwen.personaModel,
    systemPrompt,
    `Here is the startup pitch to evaluate:\n\n"""${pitch}"""\n\nGive your opening reaction now.`
  );
}

export interface RebuttalResult {
  targetPersonaId: string;
  content: string;
}

export async function callPersonaRebuttal(
  systemPrompt: string,
  pitch: string,
  coPanelists: { id: string; roleName: string; content: string }[]
): Promise<RebuttalResult> {
  const transcript = coPanelists
    .map((p) => `id=${p.id} (${p.roleName}): ${p.content}`)
    .join("\n\n");

  const raw = await chat(
    config.qwen.personaModel,
    `${systemPrompt}\n\nYou will be shown your co-panelists' opening statements. Write exactly one rebuttal turn (3-4 sentences) responding to whichever co-panelist's point you find most important — agree, disagree, or add nuance. Begin your reply with a single line "TARGET: persona_id" naming which panelist you are primarily responding to — output ONLY the bare id shown after "id=" (no brackets, quotes, or other punctuation), then a blank line, then your rebuttal.`,
    `Startup pitch:\n"""${pitch}"""\n\nCo-panelists' opening statements:\n\n${transcript}\n\nWrite your rebuttal now.`
  );

  const validIds = new Set(coPanelists.map((p) => p.id));
  const fallbackId = coPanelists[0]?.id ?? "";

  const match = raw.match(/^TARGET:\s*(.+?)\s*\n+([\s\S]+)$/i);
  if (match) {
    const cleanedId = match[1].replace(/[^a-zA-Z0-9_]/g, "");
    const targetPersonaId = validIds.has(cleanedId) ? cleanedId : fallbackId;
    return { targetPersonaId, content: match[2].trim() };
  }
  return { targetPersonaId: fallbackId, content: raw };
}

export async function callMediator(
  mediatorPrompt: string,
  transcriptText: string
): Promise<Verdict> {
  const raw = await chat(
    config.qwen.mediatorModel,
    mediatorPrompt,
    `Full debate transcript:\n\n${transcriptText}\n\nRespond with the JSON verdict now.`
  );
  const verdict = extractJson<Verdict>(raw);
  const score = Number(verdict.score);
  verdict.score = Number.isFinite(score) ? Math.max(1, Math.min(10, Math.round(score))) : 5;
  return verdict;
}

export async function callClassifier(
  classifierPrompt: string,
  pitch: string
): Promise<{ suggestions: { id: string; justification: string }[] }> {
  const raw = await chat(config.qwen.personaModel, classifierPrompt, pitch);
  return extractJson(raw);
}
