import { OrchestratorDecision } from "@/lib/types";

const ACTION_LABEL: Record<OrchestratorDecision["action"], string> = {
  speak: "Orchestrator: continuing the exchange",
  summon: "Orchestrator: calling in a specialist",
  conclude: "Orchestrator: concluding the debate",
};

export function OrchestratorNote({ decision }: { decision: OrchestratorDecision }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-dashed border-mediator/30 bg-mediator-soft/40">
      <span className="text-mediator font-mono text-xs uppercase tracking-wider font-bold shrink-0">
        {ACTION_LABEL[decision.action]}
      </span>
      <span className="font-mono text-xs text-ink-soft leading-relaxed">{decision.reasoning}</span>
    </div>
  );
}
