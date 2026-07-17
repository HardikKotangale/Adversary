import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { config } from "./config.js";
import { AGENT_TOOLS, executeAgentTool } from "./agentTools.js";
import type { Persona } from "./personas.js";
import type { OrchestratorDecision, ToolCallRecord, Verdict } from "./types.js";

// Qwen Cloud (DashScope international) latency is occasionally high, especially
// for the flagship mediator model — a generous timeout with no retries avoids
// compounding a slow-but-working call into a false failure.
const client = new OpenAI({
  apiKey: config.qwen.apiKey,
  baseURL: config.qwen.baseURL,
  timeout: 120_000,
  maxRetries: 0,
});

const MAX_TOOL_ROUND_TRIPS = 3;

async function chat(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error(`Empty completion from model ${model}`);
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

export interface PersonaTurnResult {
  content: string;
  respondingToId?: string;
  toolCalls?: ToolCallRecord[];
}

/**
 * Runs one persona's turn, giving it access to the calculate/search_pitch
 * tools via Qwen's native function-calling. The model may call a tool,
 * receive the result, and call again (capped) before producing its final
 * 3-4 sentence turn.
 */
export async function callPersonaTurn(
  persona: Persona,
  pitch: string,
  transcriptSoFar: string,
  directive: string | undefined,
  isOpening: boolean
): Promise<PersonaTurnResult> {
  const instruction = isOpening
    ? `This is your opening reaction — there is no prior transcript to respond to. Begin your reply with the line "TARGET: none", then a blank line, then your 3-4 sentence opening.`
    : `You will be shown the full transcript so far. Write exactly one turn (3-4 sentences) responding to whichever prior turn you find most important — agree, disagree, or add nuance. Begin your reply with a single line "TARGET: persona_id" naming which panelist you are primarily responding to (the bare id shown after "id=", no brackets/quotes), then a blank line, then your turn.`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${persona.systemPrompt}\n\n${instruction} You may call the "calculate" tool to verify arithmetic or "search_pitch" to quote the pitch exactly — use them only when it strengthens a specific point, not gratuitously.`,
    },
    {
      role: "user",
      content: `Startup pitch:\n"""${pitch}"""\n\n${
        isOpening ? "" : `Transcript so far:\n\n${transcriptSoFar}\n\n`
      }${directive ? `Orchestrator directive for you: ${directive}\n\n` : ""}Take your turn now.`,
    },
  ];

  const toolCalls: ToolCallRecord[] = [];

  for (let i = 0; i < MAX_TOOL_ROUND_TRIPS; i++) {
    const completion = await client.chat.completions.create({
      model: config.qwen.personaModel,
      messages,
      tools: AGENT_TOOLS,
      temperature: 0.8,
    });
    const msg = completion.choices[0]?.message;
    if (!msg) throw new Error(`Empty completion from model ${config.qwen.personaModel}`);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({ role: "assistant", content: msg.content, tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          // leave args empty on parse failure
        }
        const result = executeAgentTool(tc.function.name, args, pitch);
        toolCalls.push({ name: tc.function.name, args, result });
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
      continue;
    }

    const raw = (msg.content ?? "").trim();
    const match = raw.match(/^TARGET:\s*(.+?)\s*\n+([\s\S]+)$/i);
    if (match) {
      const cleanedId = match[1].replace(/[^a-zA-Z0-9_]/g, "");
      return {
        content: match[2].trim(),
        respondingToId: cleanedId.toLowerCase() === "none" ? undefined : cleanedId,
        toolCalls: toolCalls.length ? toolCalls : undefined,
      };
    }
    return { content: raw, toolCalls: toolCalls.length ? toolCalls : undefined };
  }

  throw new Error(`Tool-call loop did not converge for persona ${persona.id}`);
}

export interface OrchestratorInput {
  pitch: string;
  activePersonas: { id: string; roleName: string }[];
  availableSpecialists: { id: string; roleName: string; tagline: string; domain?: string }[];
  transcriptSoFar: string;
  turnCount: number;
  maxTurns: number;
}

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator of a multi-agent panel debating a startup pitch. You never speak yourself — you decide what happens next in the debate. Given the pitch, the currently active panelists, the transcript so far, and a roster of specialists you may summon, choose exactly one next action:

- "speak": have one or more currently-active panelists take their next turn. List their ids in speakerIds. Optionally give any of them a short one-sentence directive in "directives" (keyed by persona id) telling them what to focus on.
- "summon": bring in exactly one new specialist from the roster whose expertise is clearly needed based on something SPECIFIC in the pitch or the transcript so far — not a generic category match. Set specialistToSummon to their id.
- "conclude": end the debate now because the cross-examination has covered the pitch's key risks and further turns would be repetitive.

Keep the debate efficient — do not summon a specialist unless their expertise is clearly warranted, and conclude once diminishing returns set in (rarely more than 8-10 total turns). Respond with strict JSON only: {"action": "speak"|"summon"|"conclude", "speakerIds": string[], "directives": {"<id>": string}, "specialistToSummon": string|null, "reasoning": "one sentence, shown to the user, explaining this decision"}.`;

export async function callOrchestrator(input: OrchestratorInput): Promise<OrchestratorDecision> {
  const userPrompt = `Startup pitch:\n"""${input.pitch}"""\n\nActive panelists:\n${input.activePersonas
    .map((p) => `- id="${p.id}" (${p.roleName})`)
    .join("\n")}\n\nSpecialists available to summon:\n${input.availableSpecialists
    .map((p) => `- id="${p.id}" (${p.roleName}, ${p.domain ?? "general"}): ${p.tagline}`)
    .join("\n")}\n\nTranscript so far (${input.turnCount}/${input.maxTurns} turns used):\n${
    input.transcriptSoFar
  }\n\nDecide the next action now.`;

  const raw = await chat(config.qwen.personaModel, ORCHESTRATOR_SYSTEM_PROMPT, userPrompt);
  const decision = extractJson<OrchestratorDecision>(raw);
  if (!decision.speakerIds) decision.speakerIds = [];
  return decision;
}

export async function callMediator(mediatorPrompt: string, transcriptText: string): Promise<Verdict> {
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
