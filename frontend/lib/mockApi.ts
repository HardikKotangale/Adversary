import { CORE_PERSONAS, MEDIATOR, PERSONA_LIBRARY } from "./personas";
import { DebateEvent, DebateHandle, PersonaMeta, Turn, Verdict } from "./types";

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
function scheduleSequence(steps: Array<{ delay: number; run: () => void }>): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsed = 0;
  for (const step of steps) {
    elapsed += step.delay;
    timers.push(setTimeout(step.run, elapsed));
  }
  return () => timers.forEach(clearTimeout);
}

// ---- content templates ---------------------------------------------------

function openingContent(personaId: string, pitch: string): string {
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

function extraOpeningContent(role: PersonaMeta, pitch: string): string {
  const frag = pitchFragment(pitch);
  return `From where I sit, "${frag}" is the part that concerns me most. ${role.tagline} — and nothing in this pitch tells me how that gets handled once this leaves a slide deck. I'd want a concrete answer before this moves forward.`;
}

function rebuttalContent(speaker: PersonaMeta, target: Turn, pitch: string): string {
  const frag = pitchFragment(pitch);
  const templates: Record<string, string> = {
    vc: `${target.roleName} is right to flag that, but from a market lens it's survivable if the wedge is narrow enough to defend — the risk is "${frag}" turning into a feature war before there's a moat. I'd still want to see switching costs modeled explicitly.`,
    engineer: `${target.roleName}'s point assumes the team has already solved the boring 80%. In practice "${frag}" is where projects like this slip six months — I've seen the estimate double once the edge cases show up in production.`,
    customer: `Sure, but ${target.roleName} is thinking about this from the business side. I don't care about the moat or the architecture — I care whether "${frag}" saves me time on Tuesday. If it doesn't, none of the rest matters to me.`,
  };
  return (
    templates[speaker.id] ??
    `${speaker.tagline} is the lens I'd apply to ${target.roleName}'s point on "${frag}" — it holds up only if the underlying claim is verifiable, and right now it isn't.`
  );
}

function extraRebuttalContent(role: PersonaMeta, target: Turn, pitch: string): string {
  const frag = pitchFragment(pitch);
  return `${target.roleName} raised "${frag}" — fair, but from a ${role.roleName.toLowerCase()} standpoint that's the second-biggest risk, not the first. ${role.tagline}, and that's the piece I'd want resolved before anything else on this list.`;
}

function buildVerdict(pitch: string): Verdict {
  const opener = firstSentence(pitch);
  return {
    score: 5,
    scoreRationale: `A real wedge and validated demand pull the score up; unproven defensibility against a fast-following incumbent pulls it back down to the middle.`,
    strongestPoint: `There's a real, specific wedge here — "${opener}" describes a concrete user and moment of pain, not a vague category play.`,
    weakestPoint: `Defensibility is unproven. Nothing in the pitch or the panel's exchange shows why this survives an incumbent shipping the same thing as a feature, or why a customer wouldn't churn back to their current workaround.`,
    biggestRisk: `An incumbent with distribution already in place bundles this exact feature for free before this reaches meaningful scale.`,
    nextStep: `Run five paid pilots with the exact user described in the pitch and measure whether they'd churn if the price doubled — that answer, more than anything else discussed, determines if this is a business or a feature.`,
  };
}

// ---- domain-matching for the simulated Orchestrator summon -----------------

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  healthcare: ["patient", "clinical", "health", "ehr", "phi", "diagnos", "treatment", "provider", "hospital", "clinic"],
  fintech: ["payment", "wallet", "loan", "credit", "bank", "transaction", "lending", "crypto", "custody", "underwrit"],
  consumer_social: ["social", "viral", "feed", "community", "chat", "content", "creator", "engagement"],
  deep_tech: ["hardware", "device", "manufactur", "sensor", "robot", "battery cell", "fabrication"],
  enterprise_saas: ["enterprise", "b2b", "procurement", "saas", "integration", "erp", "workflow software"],
  legal_regulated: ["regulat", "license", "patent", "compliance", "law"],
  climate_energy: ["energy", "grid", "solar", "carbon", "emission", "battery", "sustainab"],
};

function pickSpecialist(pitch: string): PersonaMeta | undefined {
  const lower = pitch.toLowerCase();
  const matchedDomain = Object.entries(DOMAIN_KEYWORDS).find(([, keywords]) =>
    keywords.some((k) => lower.includes(k))
  );
  const domain = matchedDomain?.[0];
  const role = domain ? PERSONA_LIBRARY.find((p) => p.domain === domain) : PERSONA_LIBRARY[0];
  return role;
}

// ---- runDebate: simulates the Orchestrator-driven loop ---------------------

export function runDebate(pitch: string, onEvent: (e: DebateEvent) => void): DebateHandle {
  const debateId = uid("debate");
  const createdAt = new Date().toISOString();
  let turnId = 0;

  const openings: Turn[] = CORE_PERSONAS.map((p) => ({
    turnId: ++turnId,
    personaId: p.id,
    roleName: p.roleName,
    colorKey: p.colorKey,
    content: openingContent(p.id, pitch),
    kind: "opening",
  }));

  const steps: Array<{ delay: number; run: () => void }> = [
    { delay: 150, run: () => onEvent({ type: "meta", debateId, createdAt }) },
  ];

  openings.forEach((turn, i) => {
    steps.push({ delay: i === 0 ? 700 : 1400, run: () => onEvent({ type: "turn", turn }) });
  });

  // Simulated Orchestrator round: two core personas rebut each other.
  steps.push({
    delay: 1200,
    run: () =>
      onEvent({
        type: "orchestrator",
        decision: {
          action: "speak",
          speakerIds: ["engineer", "vc"],
          reasoning: "The VC's TAM claim and the Engineer's pipeline concern are the two sharpest open threads.",
        },
      }),
  });

  const rebuttalTargets = [openings[2], openings[0]]; // engineer -> customer, vc -> engineer
  const rebuttalSpeakers = [CORE_PERSONAS[1], CORE_PERSONAS[0]];
  const rebuttalTurns: Turn[] = rebuttalSpeakers.map((speaker, i) => ({
    turnId: ++turnId,
    personaId: speaker.id,
    roleName: speaker.roleName,
    colorKey: speaker.colorKey,
    content: rebuttalContent(speaker, rebuttalTargets[i], pitch),
    kind: "rebuttal",
    respondingToId: rebuttalTargets[i].personaId,
  }));
  rebuttalTurns.forEach((turn, i) => {
    steps.push({ delay: i === 0 ? 1500 : 1300, run: () => onEvent({ type: "turn", turn }) });
  });

  // Simulated Orchestrator summon of a domain specialist.
  const specialist = pickSpecialist(pitch);
  if (specialist) {
    steps.push({
      delay: 1200,
      run: () =>
        onEvent({
          type: "orchestrator",
          decision: {
            action: "summon",
            speakerIds: [],
            specialistToSummon: specialist.id,
            reasoning: `Specific details in the pitch fall squarely into this specialist's domain.`,
          },
        }),
    });
    steps.push({
      delay: 500,
      run: () =>
        onEvent({
          type: "summon",
          personaId: specialist.id,
          roleName: specialist.roleName,
          colorKey: specialist.colorKey,
          reasoning: `Specific details in the pitch fall squarely into ${specialist.roleName}'s domain.`,
        }),
    });
    steps.push({
      delay: 1500,
      run: () =>
        onEvent({
          type: "turn",
          turn: {
            turnId: ++turnId,
            personaId: specialist.id,
            roleName: specialist.roleName,
            colorKey: specialist.colorKey,
            content: extraOpeningContent(specialist, pitch),
            kind: "summon_opening",
          },
        }),
    });
  }

  steps.push({
    delay: 1000,
    run: () =>
      onEvent({
        type: "orchestrator",
        decision: {
          action: "conclude",
          speakerIds: [],
          reasoning: "The cross-examination has covered the pitch's key risks; further turns would be repetitive.",
        },
      }),
  });

  steps.push({ delay: 1800, run: () => onEvent({ type: "verdict", verdict: buildVerdict(pitch) }) });
  steps.push({
    delay: 400,
    run: () =>
      onEvent({ type: "done", transcriptUrl: `https://mock-oss.example.com/transcripts/${debateId}.json` }),
  });

  const cancel = scheduleSequence(steps);
  return { cancel };
}

// ---- addRole (manual override) ---------------------------------------------

function runAddRoleMock(role: PersonaMeta, pitch: string, onEvent: (e: DebateEvent) => void): DebateHandle {
  const openingTurn: Turn = {
    turnId: Date.now(),
    personaId: role.id,
    roleName: role.roleName,
    colorKey: role.colorKey,
    content: extraOpeningContent(role, pitch),
    kind: "summon_opening",
  };
  const rebuttalTurn: Turn = {
    turnId: Date.now() + 1,
    personaId: role.id,
    roleName: role.roleName,
    colorKey: role.colorKey,
    content: extraRebuttalContent(role, openingTurn, pitch),
    kind: "rebuttal",
    respondingToId: "engineer",
  };

  const steps: Array<{ delay: number; run: () => void }> = [
    {
      delay: 400,
      run: () =>
        onEvent({
          type: "summon",
          personaId: role.id,
          roleName: role.roleName,
          colorKey: role.colorKey,
          reasoning: "Manually called in by the founder.",
        }),
    },
    { delay: 700, run: () => onEvent({ type: "turn", turn: openingTurn }) },
    { delay: 1500, run: () => onEvent({ type: "turn", turn: rebuttalTurn }) },
    { delay: 1400, run: () => onEvent({ type: "verdict", verdict: buildVerdict(pitch) }) },
    {
      delay: 400,
      run: () =>
        onEvent({ type: "done", transcriptUrl: `https://mock-oss.example.com/transcripts/${uid("debate")}.json` }),
    },
  ];

  const cancel = scheduleSequence(steps);
  return { cancel };
}

export function addRole(_debateId: string, roleId: string, onEvent: (e: DebateEvent) => void): DebateHandle {
  const role = PERSONA_LIBRARY.find((p) => p.id === roleId);
  if (!role) {
    onEvent({ type: "error", message: `Unknown role: ${roleId}` });
    return { cancel: () => {} };
  }
  return runAddRoleMock(role, "the pitch under discussion", onEvent);
}

export function addCustomRole(
  _debateId: string,
  input: { roleName: string; description: string },
  onEvent: (e: DebateEvent) => void
): DebateHandle {
  const meta: PersonaMeta = {
    id: `custom_${uid("role")}`,
    roleName: input.roleName,
    tagline: input.description,
    colorKey: "extra",
  };
  return runAddRoleMock(meta, "the pitch under discussion", onEvent);
}

export { MEDIATOR };
