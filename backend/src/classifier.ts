import { PERSONA_LIBRARY, findPersona } from "./personas.js";
import { callClassifier } from "./qwen.js";
import type { SuggestedRole } from "./types.js";

function buildClassifierPrompt(): string {
  const catalog = PERSONA_LIBRARY.map(
    (p) =>
      `- id: "${p.id}", role: "${p.roleName}", domain: "${p.domain}", triggers: [${(p.triggers ?? [])
        .map((t) => `"${t}"`)
        .join(", ")}]`
  ).join("\n");

  return `You are a domain classifier for a startup-pitch panel. Read the pitch and select 2 to 4 personas from the catalog below whose expertise is most relevant, based on SPECIFIC details in the pitch — not a generic category match.

Catalog:
${catalog}

For each persona you select, write a one-sentence justification that names a specific detail from the pitch (a word, phrase, or claim actually in the text) and ties it to why that persona's expertise matters here.

Respond with strict JSON only, no other text: {"suggestions": [{"id": "<catalog id>", "justification": "<one sentence citing a specific pitch detail>"}]}. Only use ids that appear in the catalog above.`;
}

export async function suggestExtraRoles(pitch: string): Promise<SuggestedRole[]> {
  const prompt = buildClassifierPrompt();
  const result = await callClassifier(prompt, pitch);

  const suggestions: SuggestedRole[] = [];
  for (const s of result.suggestions ?? []) {
    const persona = findPersona(s.id);
    if (!persona || !persona.domain) continue;
    suggestions.push({
      id: persona.id,
      roleName: persona.roleName,
      tagline: persona.systemPrompt.split(".")[0].replace(/^You are (a |an )?/i, ""),
      domain: persona.domain,
      justification: s.justification,
    });
    if (suggestions.length >= 4) break;
  }
  return suggestions;
}
