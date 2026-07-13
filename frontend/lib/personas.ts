import { PersonaMeta } from "./types";

export const CORE_PERSONAS: PersonaMeta[] = [
  {
    id: "vc",
    roleName: "VC",
    tagline: "Market size, defensibility, moat",
    colorKey: "vc",
  },
  {
    id: "engineer",
    roleName: "Engineer",
    tagline: "Assumes it's harder to build than you think",
    colorKey: "engineer",
  },
  {
    id: "customer",
    roleName: "Customer",
    tagline: "Only cares if this beats what they use now",
    colorKey: "customer",
  },
];

export const MEDIATOR: PersonaMeta = {
  id: "mediator",
  roleName: "Mediator",
  tagline: "Synthesizes the full transcript into a verdict",
  colorKey: "mediator",
};

// Domain-tagged library the classifier suggests from. Frontend only needs
// display metadata; system prompts live server-side (Phase 2).
export const PERSONA_LIBRARY: PersonaMeta[] = [
  { id: "clinical_researcher", roleName: "Clinical Researcher", tagline: "Evidence quality, trial design", colorKey: "extra", domain: "healthcare" },
  { id: "hipaa_officer", roleName: "HIPAA Compliance Officer", tagline: "PHI handling, consent, breach liability", colorKey: "extra", domain: "healthcare" },
  { id: "payer_analyst", roleName: "Payer / Insurance Analyst", tagline: "Reimbursement pathway, prior auth friction", colorKey: "extra", domain: "healthcare" },
  { id: "practicing_clinician", roleName: "Practicing Clinician", tagline: "Real workflow friction in a 12-minute visit", colorKey: "extra", domain: "healthcare" },
  { id: "security_researcher", roleName: "Security Researcher", tagline: "Exploitable attack surface, fraud vectors", colorKey: "extra", domain: "fintech" },
  { id: "financial_regulator", roleName: "Financial Regulator", tagline: "Licensing, jurisdiction", colorKey: "extra", domain: "fintech" },
  { id: "risk_analyst", roleName: "Risk / Underwriting Analyst", tagline: "Default rates, adverse selection", colorKey: "extra", domain: "fintech" },
  { id: "growth_hacker", roleName: "Growth Hacker", tagline: "CAC, virality, retention", colorKey: "extra", domain: "consumer_social" },
  { id: "ethicist", roleName: "Ethicist", tagline: "Dark patterns, addictive design", colorKey: "extra", domain: "consumer_social" },
  { id: "content_moderator", roleName: "Content Moderator", tagline: "Trust & safety at scale", colorKey: "extra", domain: "consumer_social" },
  { id: "manufacturing_engineer", roleName: "Manufacturing Engineer", tagline: "BOM cost at scale, yield", colorKey: "extra", domain: "deep_tech" },
  { id: "safety_engineer", roleName: "Safety Engineer", tagline: "Failure modes, certification", colorKey: "extra", domain: "deep_tech" },
  { id: "it_procurement", roleName: "IT / Procurement Officer", tagline: "Integration complexity, security review", colorKey: "extra", domain: "enterprise_saas" },
  { id: "incumbent_competitor", roleName: "Incumbent Competitor", tagline: "How a large player bundles this for free", colorKey: "extra", domain: "enterprise_saas" },
  { id: "regulator", roleName: "Regulator", tagline: "Most likely compliance landmine", colorKey: "extra", domain: "legal_regulated" },
  { id: "ip_attorney", roleName: "IP Attorney", tagline: "Defensibility of the claimed moat", colorKey: "extra", domain: "legal_regulated" },
  { id: "grid_engineer", roleName: "Grid Engineer", tagline: "Physical infrastructure constraints", colorKey: "extra", domain: "climate_energy" },
  { id: "carbon_accountant", roleName: "Carbon Accountant", tagline: "Measurability of claimed emissions reduction", colorKey: "extra", domain: "climate_energy" },
];

export function findPersonaMeta(id: string): PersonaMeta | undefined {
  return (
    CORE_PERSONAS.find((p) => p.id === id) ??
    PERSONA_LIBRARY.find((p) => p.id === id) ??
    (id === "mediator" ? MEDIATOR : undefined)
  );
}
