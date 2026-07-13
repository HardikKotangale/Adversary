import { CORE_PERSONAS, MEDIATOR, PERSONA_LIBRARY } from "./personas";
import {
  AddRoleEvent,
  DebateEvent,
  DebateHandle,
  PersonaMeta,
  RoundEntry,
  SuggestedRole,
  Verdict,
} from "./types";

// ---- helpers -----------------------------------------------------------

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pitchFragment(pitch: string): string {
  const words = pitch.trim().split(/\s+/).filter(Boolean);
  const start = Math.min(3, Math.max(0, words.length - 8));
  return words.slice(start, start + 6).join(" ");
}

function firstSentence(pitch: string): string {
  const match = pitch.match(/[^.!?]+[.!?]?/);
  return (match?.[0] ?? pitch).trim();
}

/** Schedules a sequence of timed callbacks; returns a cancel function. */
function scheduleSequence(
  steps: Array<{ delay: number; run: () => void }>
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsed = 0;
  for (const step of steps) {
    elapsed += step.delay;
    timers.push(setTimeout(step.run, elapsed));
  }
  return () => timers.forEach(clearTimeout);
}

// ---- round 1 content templates -----------------------------------------

function round1Content(personaId: string, pitch: string): string {
  const frag = pitchFragment(pitch);
  switch (personaId) {
    case "vc":
      return `Walk me through the actual TAM here, not the category size — "${frag}" tells me the wedge, not the market. Who else is funded in this exact wedge, and what stops an incumbent from shipping this as a feature in two quarters? Show me one number that proves this compounds instead of just growing linearly with sales headcount.`;
    case "engineer":
      return `The hard part isn't the demo, it's the part you didn't mention: "${frag}" implies a data pipeline, an edge-case taxonomy, and a failure mode you haven't hit yet at scale. What's your plan for the 20% of cases that don't fit the happy path? I'd want to see the architecture before I believed the timeline.`;
    case "customer":
      return `I already have a way to do this — maybe it's a spreadsheet, maybe it's a person, maybe it's nothing and I just live with the problem. "${frag}" has to be better enough that switching is worth the hassle, not just "better." What do I stop paying for the day I start paying for this?`;
    default:
      return `Reacting to the pitch: "${frag}" — I need more specifics before I'd trust this claim.`;
  }
}

function extraRound1Content(role: PersonaMeta, pitch: string): string {
  const frag = pitchFragment(pitch);
  return `From where I sit, "${frag}" is the part that concerns me most. ${role.tagline} — and nothing in this pitch tells me how that gets handled once this leaves a slide deck. I'd want a concrete answer before this moves forward.`;
}

// ---- round 2 (rebuttal) templates ---------------------------------------

function rebuttalContent(
  speaker: PersonaMeta,
  target: RoundEntry,
  pitch: string
): string {
  const frag = pitchFragment(pitch);
  const templates: Record<string, string> = {
    vc: `${target.roleName} is right to flag that, but from a market lens it's survivable if the wedge is narrow enough to defend — the risk is "${frag}" turning into a feature war before there's a moat. I'd still want to see switching costs modeled explicitly.`,
    engineer: `${target.roleName}'s point assumes the team has already solved the boring 80%. In practice "${frag}" is where projects like this slip six months — I've seen the estimate double once the edge cases show up in production.`,
    customer: `Sure, but ${target.roleName} is thinking about this from the business side. I don't care about the moat or the architecture — I care whether "${frag}" saves me time on Tuesday. If it doesn't, none of the rest matters to me.`,
  };
  return (
    templates[speaker.id] ??
    `Responding to ${target.roleName}: ${role_generic(speaker, target, frag)}`
  );
}

function role_generic(speaker: PersonaMeta, target: RoundEntry, frag: string): string {
  return `${speaker.tagline} is the lens I'd apply to ${target.roleName}'s point on "${frag}" — it holds up only if the underlying claim is verifiable, and right now it isn't.`;
}

function extraRebuttalContent(role: PersonaMeta, target: RoundEntry, pitch: string): string {
  const frag = pitchFragment(pitch);
  return `${target.roleName} raised "${frag}" — fair, but from a ${role.roleName.toLowerCase()} standpoint that's the second-biggest risk, not the first. ${role.tagline}, and that's the piece I'd want resolved before anything else on this list.`;
}

// ---- verdict --------------------------------------------------------------

function buildVerdict(pitch: string): Verdict {
  const opener = firstSentence(pitch);
  return {
    score: 5,
    strongestPoint: `There's a real, specific wedge here — "${opener}" describes a concrete user and moment of pain, not a vague category play.`,
    weakestPoint: `Defensibility is unproven. Nothing in the pitch or the panel's exchange shows why this survives an incumbent shipping the same thing as a feature, or why a customer wouldn't churn back to their current workaround.`,
    biggestRisk: `An incumbent with distribution already in place bundles this exact feature for free before this reaches meaningful scale.`,
    nextStep: `Run five paid pilots with the exact user described in the pitch and measure whether they'd churn if the price doubled — that answer, more than anything else discussed, determines if this is a business or a feature.`,
  };
}

// ---- classifier (suggestExtraRoles) ---------------------------------------

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  healthcare: ["patient", "clinical", "health", "ehr", "phi", "diagnos", "treatment", "provider", "hospital", "clinic"],
  fintech: ["payment", "wallet", "loan", "credit", "bank", "transaction", "lending", "crypto", "custody", "underwrit"],
  consumer_social: ["social", "viral", "feed", "community", "chat", "content", "creator", "engagement"],
  deep_tech: ["hardware", "device", "manufactur", "sensor", "robot", "battery cell", "fabrication"],
  enterprise_saas: ["enterprise", "b2b", "procurement", "saas", "integration", "erp", "workflow software"],
  legal_regulated: ["regulat", "license", "patent", "compliance", "law"],
  climate_energy: ["energy", "grid", "solar", "carbon", "emission", "battery", "sustainab"],
};

function computeSuggestions(pitch: string): SuggestedRole[] {
  const lower = pitch.toLowerCase();
  const matchedDomains = Object.entries(DOMAIN_KEYWORDS)
    .map(([domain, keywords]) => ({
      domain,
      hits: keywords.filter((k) => lower.includes(k)),
    }))
    .filter((d) => d.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);

  const domains = matchedDomains.length > 0 ? matchedDomains : [{ domain: "enterprise_saas", hits: ["default"] }];

  const suggestions: SuggestedRole[] = [];
  for (const { domain, hits } of domains) {
    const rolesInDomain = PERSONA_LIBRARY.filter((p) => p.domain === domain);
    for (const role of rolesInDomain) {
      if (suggestions.length >= 4) break;
      const trigger = hits[0] ?? domain;
      const frag = pitchFragment(pitch);
      suggestions.push({
        id: role.id,
        roleName: role.roleName,
        tagline: role.tagline,
        domain,
        justification: `The pitch mentions "${trigger}" in context of "${frag}" — ${role.tagline.toLowerCase()} is directly at stake here.`,
      });
    }
    if (suggestions.length >= 4) break;
  }
  return suggestions.slice(0, Math.max(2, Math.min(4, suggestions.length)));
}

/** Kept for API-shape parity with the real client; runDebate now streams suggestions itself. */
export async function suggestExtraRoles(pitch: string): Promise<SuggestedRole[]> {
  return computeSuggestions(pitch);
}

// ---- runDebate --------------------------------------------------------------

export function runDebate(pitch: string, onEvent: (e: DebateEvent) => void): DebateHandle {
  const debateId = uid("debate");
  const createdAt = new Date().toISOString();

  const round1Entries: RoundEntry[] = CORE_PERSONAS.map((p) => ({
    personaId: p.id,
    roleName: p.roleName,
    colorKey: p.colorKey,
    content: round1Content(p.id, pitch),
  }));

  const steps: Array<{ delay: number; run: () => void }> = [
    { delay: 150, run: () => onEvent({ type: "meta", debateId, createdAt }) },
    {
      delay: 900,
      run: () => onEvent({ type: "suggestions", roles: computeSuggestions(pitch) }),
    },
  ];

  round1Entries.forEach((entry, i) => {
    steps.push({
      delay: i === 0 ? 700 : 1400,
      run: () => onEvent({ type: "round1", entry }),
    });
  });

  // Round 2: each core persona rebuts the persona whose point differs most —
  // simple rotation so each targets a different colleague.
  CORE_PERSONAS.forEach((speaker, i) => {
    const target = round1Entries[(i + 1) % round1Entries.length];
    const speakerMeta = CORE_PERSONAS[i];
    steps.push({
      delay: 1600,
      run: () =>
        onEvent({
          type: "round2",
          entry: {
            personaId: speakerMeta.id,
            roleName: speakerMeta.roleName,
            colorKey: speakerMeta.colorKey,
            content: rebuttalContent(speakerMeta, target, pitch),
            rebuttingId: target.personaId,
          },
        }),
    });
  });

  steps.push({
    delay: 1800,
    run: () => onEvent({ type: "verdict", verdict: buildVerdict(pitch) }),
  });

  steps.push({
    delay: 400,
    run: () =>
      onEvent({
        type: "done",
        transcriptUrl: `https://mock-oss.example.com/transcripts/${debateId}.json`,
      }),
  });

  const cancel = scheduleSequence(steps);
  return { cancel };
}

// ---- addRole --------------------------------------------------------------

export function addRole(
  _debateId: string,
  role: PersonaMeta,
  context: { pitch: string; round1: RoundEntry[] },
  onEvent: (e: AddRoleEvent) => void
): DebateHandle {
  const { pitch, round1 } = context;

  const roleEntry: RoundEntry = {
    personaId: role.id,
    roleName: role.roleName,
    colorKey: role.colorKey,
    content: extraRound1Content(role, pitch),
  };

  const strongestExisting =
    round1.find((e) => e.personaId === "engineer") ?? round1[0];

  const steps: Array<{ delay: number; run: () => void }> = [
    { delay: 700, run: () => onEvent({ type: "role_round1", entry: roleEntry }) },
    {
      delay: 1500,
      run: () =>
        onEvent({
          type: "role_rebuttal",
          entry: {
            personaId: role.id,
            roleName: role.roleName,
            colorKey: role.colorKey,
            content: extraRebuttalContent(role, strongestExisting, pitch),
            rebuttingId: strongestExisting.personaId,
          },
        }),
    },
    { delay: 1400, run: () => onEvent({ type: "verdict", verdict: buildVerdict(pitch) }) },
    {
      delay: 400,
      run: () =>
        onEvent({
          type: "done",
          transcriptUrl: `https://mock-oss.example.com/transcripts/${uid("debate")}.json`,
        }),
    },
  ];

  const cancel = scheduleSequence(steps);
  return { cancel };
}

export function addCustomRole(
  debateId: string,
  input: { roleName: string; description: string },
  context: { pitch: string; round1: RoundEntry[] },
  onEvent: (e: AddRoleEvent) => void
): DebateHandle {
  const meta: PersonaMeta = {
    id: `custom_${uid("role")}`,
    roleName: input.roleName,
    tagline: input.description,
    colorKey: "extra",
  };
  return addRole(debateId, meta, context, onEvent);
}

export { MEDIATOR };
