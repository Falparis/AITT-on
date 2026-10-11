// ICP actor removed. This is a drop-in MOCK that implements the same
// ActorInterface the UI expects, returning local sample data so the copied
// front end runs standalone (no Internet Computer canister, no auth).
// Swap this for real Stellar/back-end calls later — the hook signature is unchanged.

import {
  type ActorInterface,
  type DocumentMetadata,
  type RepositoryMetadata,
  type RiskAnalysis,
  type RiskEvent,
  Regulation,
  RiskCategory,
} from "../types";

const nowNs = () => BigInt(Date.parse("2026-06-01T10:00:00Z")) * 1_000_000n;

const sampleHash = (seed: number): Uint8Array => {
  const a = new Uint8Array(32);
  for (let i = 0; i < a.length; i++) a[i] = (seed * 31 + i * 7) % 256;
  return a;
};

const blobFor = (name: string) => ({
  getDirectURL: () => `/assets/generated/${name}`,
});

const sampleDocuments: DocumentMetadata[] = [
  {
    id: "doc-001",
    filename: "AI_Compliance_Certification.pdf",
    hash: sampleHash(1),
    timestamp: nowNs(),
    regulation: Regulation.euAIAct,
    companyName: "Acme AI",
    compliance: { score: 87n, isCompliant: true, recommendations: "Maintain documentation of training data provenance." },
    blob: blobFor("hero-security-documents.dim_800x400.png"),
  },
  {
    id: "doc-002",
    filename: "Model_Risk_Assessment.pdf",
    hash: sampleHash(2),
    timestamp: nowNs(),
    regulation: Regulation.usAIRegulations,
    companyName: "Northwind Systems",
    compliance: { score: 72n, isCompliant: true, recommendations: "Add bias-testing results for protected attributes." },
    blob: blobFor("compliance-icon-transparent.dim_64x64.png"),
  },
];

const sampleRepositories: RepositoryMetadata[] = [
  {
    id: "repo-001",
    name: "ai-legal-compliance",
    url: "https://github.com/example/ai-legal-compliance",
    timestamp: nowNs(),
    cybersecurity: { score: 91n, vulnerabilities: [], recommendations: "Enable dependency scanning in CI." },
    analysisStatus: "complete",
  },
];

const sampleRiskEvents: RiskEvent[] = [
  {
    id: "risk-001",
    issueType: "Hallucination",
    description: "Model produced an unsupported legal citation in 1.2% of sampled responses.",
    severity: "Medium",
    riskScore: 42n,
    category: RiskCategory.medium,
    suggestedAction: "Add retrieval-grounding and citation verification.",
    timestamp: nowNs(),
  },
  {
    id: "risk-002",
    issueType: "Bias",
    description: "Minor disparity detected across demographic groups in outcome scoring.",
    severity: "Low",
    riskScore: 23n,
    category: RiskCategory.low,
    suggestedAction: "Re-balance evaluation set and re-test.",
    timestamp: nowNs(),
  },
];

const sampleRiskAnalysis: RiskAnalysis = {
  currentScore: 68n,
  category: RiskCategory.medium,
  summary: "Overall risk is moderate. Two issues identified, none critical.",
  recommendations: "Prioritise retrieval-grounding to reduce hallucination risk.",
  events: sampleRiskEvents,
};

const mockActor: ActorInterface = {
  async getCallerUserProfile() {
    return { id: "user-001", name: "Demo User", email: "demo@aitt.example" };
  },
  async saveCallerUserProfile() {},
  async uploadDocument() {
    return "doc-" + Math.floor(performance.now()).toString();
  },
  async getAllDocuments() {
    return sampleDocuments;
  },
  async verifyDocument() {
    return sampleDocuments[0];
  },
  async getComplianceDashboard() {
    return sampleDocuments;
  },
  async updateComplianceScore() {},
  async updateCompanyName() {},
  async aiActAssistant(query) {
    return {
      answer: `Regarding "${query.question}": under the EU AI Act, high-risk systems require a documented risk-management system, data governance, and human oversight. (Demo response.)`,
      sources: ["EU AI Act, Article 9", "EU AI Act, Article 14"],
    };
  },
  async makePostOutcall() {
    return "{}";
  },
  async getExampleDocument() {
    return sampleDocuments[0];
  },
  async addRepository() {
    return "repo-" + Math.floor(performance.now()).toString();
  },
  async getAllRepositories() {
    return sampleRepositories;
  },
  async getCybersecurityDashboard() {
    return sampleRepositories;
  },
  async updateCybersecurityScore() {},
  async analyzeRepository() {
    return { score: 88n, vulnerabilities: [], recommendations: "Pin dependency versions and enable secret scanning." };
  },
  async cybersecurityAssistant(query) {
    return {
      answer: `Regarding "${query.question}": follow least-privilege access, enable MFA, and scan dependencies continuously. (Demo response.)`,
      recommendations: ["Enable branch protection", "Rotate API keys quarterly"],
    };
  },
  async getExampleRepository() {
    return sampleRepositories[0];
  },
  async getRiskAnalysis() {
    return sampleRiskAnalysis;
  },
  async runRiskAnalysis() {
    return sampleRiskAnalysis;
  },
  async getRiskEvents() {
    return sampleRiskEvents;
  },
  async getSDKSecret() {
    return null;
  },
  async generateSDKSecret() {
    return "sk_demo_0000000000000000";
  },
};

// Same shape as the original hook: { actor, isFetching }.
export function useActor(): { actor: ActorInterface | null; isFetching: boolean } {
  return { actor: mockActor, isFetching: false };
}
