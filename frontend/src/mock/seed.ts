// Deterministic seed data for the in-memory store.
// Fixed hashes/wallets/dates so the demo looks identical on every reload.

import type {
  Alert,
  Company,
  DocItem,
  Framework,
  GovernanceConfig,
  Proposal,
  SubAdmin,
  Template,
} from "./types";

// A few fixed signer wallets (the "M" of the N-of-M multi-sig).
export const seedSignerWallets: string[] = [
  "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAI4",
  "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2H4LK2HQH4NSEERDQQ6P2NDQ5O",
  "GCKFBEIYTKP6RJGWLOUQBCGWDLNYZ3TT4LMTRAB3F7K5UGZ5W7K2LLQR",
];

export const seedFrameworks: Framework[] = [
  { id: "fw-eu-ai-act", name: "EU AI Act", description: "European Union Artificial Intelligence Act conformity assessment." },
  { id: "fw-us-ai", name: "US AI Regulations", description: "United States federal AI regulatory guidance and executive orders." },
  { id: "fw-iso-42001", name: "ISO/IEC 42001", description: "AI management system standard." },
  { id: "fw-nist-rmf", name: "NIST AI RMF", description: "NIST AI Risk Management Framework." },
  { id: "fw-gdpr", name: "GDPR Data Governance", description: "Data governance and protection under the GDPR." },
];

export const seedCompanies: Company[] = [
  {
    id: "co-acme",
    name: "Acme AI",
    email: "compliance@acme-ai.example",
    wallet: "GDACMEAI4QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74PQ",
    status: "active",
    documents: 3,
    joinedAt: "2026-02-14T09:00:00Z",
  },
  {
    id: "co-northwind",
    name: "Northwind Systems",
    email: "legal@northwind.example",
    wallet: "GDNORTHWINDIL2CI3FNQ4BXLFMNDLFJUNPU2H4LK2HQH4NSEERDQQ6P2N",
    status: "active",
    documents: 3,
    joinedAt: "2026-03-02T11:30:00Z",
  },
  {
    id: "co-quantum",
    name: "Quantum Labs",
    email: "ops@quantumlabs.example",
    wallet: "GDQUANTUMBEIYTKP6RJGWLOUQBCGWDLNYZ3TT4LMTRAB3F7K5UGZ5W7K2",
    status: "pending",
    documents: 0,
    joinedAt: "2026-06-10T15:45:00Z",
  },
];

export const seedSubAdmins: SubAdmin[] = [
  {
    id: "sa-okafor",
    name: "Dr. Amara Okafor",
    email: "a.okafor@aitt-legal.example",
    wallet: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAI4",
    reviewsDone: 12,
    status: "active",
  },
  {
    id: "sa-meyer",
    name: "Lukas Meyer",
    email: "l.meyer@aitt-legal.example",
    wallet: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2H4LK2HQH4NSEERDQQ6P2NDQ5O",
    reviewsDone: 8,
    status: "active",
  },
  {
    id: "sa-laurent",
    name: "Sophie Laurent",
    email: "s.laurent@aitt-legal.example",
    wallet: "GCKFBEIYTKP6RJGWLOUQBCGWDLNYZ3TT4LMTRAB3F7K5UGZ5W7K2LLQR",
    reviewsDone: 0,
    status: "invited",
  },
];

export const seedDocuments: DocItem[] = [
  {
    id: "doc-1001",
    filename: "EU_AI_Act_Conformity.pdf",
    company: "Acme AI",
    subject: "EU AI Act",
    status: "submitted",
    submittedAt: "2026-06-12T08:20:00Z",
    hash: "9f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f7081928374655",
    reviews: [],
  },
  {
    id: "doc-1002",
    filename: "Model_Risk_Assessment.pdf",
    company: "Northwind Systems",
    subject: "NIST AI RMF",
    status: "under_review",
    submittedAt: "2026-06-08T13:10:00Z",
    hash: "1a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5",
    reviews: [
      {
        reviewer: "Dr. Amara Okafor",
        decision: "requires_changes",
        complianceScore: 64,
        comment:
          "Risk taxonomy is incomplete; add quantitative thresholds for each tier and cite the data sources.",
        date: "2026-06-10T10:00:00Z",
        commentHash: "c1f90a2b3c4d5e6f7081928374655a1a2b3c4d5e6f70819f2c4a1be7d05836a1",
        txHash: "7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be3c4d5e6f7",
      },
    ],
  },
  {
    id: "doc-1003",
    filename: "Data_Governance_Policy.pdf",
    company: "Acme AI",
    subject: "GDPR Data Governance",
    status: "requires_changes",
    submittedAt: "2026-06-05T09:45:00Z",
    hash: "5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d51a2b3c4d",
    complianceScore: 58,
    reviews: [
      {
        reviewer: "Lukas Meyer",
        decision: "requires_changes",
        complianceScore: 58,
        comment:
          "Retention schedule conflicts with stated purpose limitation. Revise §4 and document the legal basis.",
        date: "2026-06-07T14:30:00Z",
        commentHash: "a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90",
        txHash: "2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a",
      },
    ],
  },
  {
    id: "doc-1004",
    filename: "AI_Management_System.pdf",
    company: "Northwind Systems",
    subject: "ISO/IEC 42001",
    status: "approved",
    submittedAt: "2026-05-28T16:00:00Z",
    hash: "0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f5e6f70819",
    complianceScore: 86,
    reviews: [
      {
        reviewer: "Dr. Amara Okafor",
        decision: "approved",
        complianceScore: 88,
        comment: "Management system clauses are well documented and traceable. Strong internal audit evidence.",
        date: "2026-06-01T11:15:00Z",
        commentHash: "f7081928374655a1a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4",
        txHash: "3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f7",
      },
      {
        reviewer: "Lukas Meyer",
        decision: "approved_with_recommendations",
        complianceScore: 84,
        comment: "Approve. Recommend adding a periodic re-certification cadence and supplier conformity checks.",
        date: "2026-06-03T09:40:00Z",
        commentHash: "819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f7081928374655",
        txHash: "6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f7081928",
      },
    ],
  },
  {
    id: "doc-1005",
    filename: "Transparency_Certification.pdf",
    company: "Acme AI",
    subject: "EU AI Act",
    status: "issued",
    submittedAt: "2026-04-18T10:05:00Z",
    expiryAt: "2027-04-18T10:05:00Z",
    hash: "8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d0e2b9d877",
    txHash: "a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b",
    complianceScore: 91,
    reviews: [
      {
        reviewer: "Dr. Amara Okafor",
        decision: "approved",
        complianceScore: 92,
        comment: "Transparency obligations under Articles 13 and 52 are fully met. Documentation is exemplary.",
        date: "2026-04-25T13:20:00Z",
        commentHash: "4655a1a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b",
        txHash: "d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f7081",
      },
      {
        reviewer: "Lukas Meyer",
        decision: "approved",
        complianceScore: 90,
        comment: "Concur. Clear user-facing disclosures and robust logging of model decisions.",
        date: "2026-04-27T08:50:00Z",
        commentHash: "70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a",
        txHash: "0a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5",
      },
    ],
  },
  {
    id: "doc-1006",
    filename: "Bias_Audit_Report.pdf",
    company: "Northwind Systems",
    subject: "US AI Regulations",
    status: "rejected",
    submittedAt: "2026-05-30T12:00:00Z",
    hash: "be7d05836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1b8773a4e6",
    complianceScore: 38,
    reviews: [
      {
        reviewer: "Dr. Amara Okafor",
        decision: "rejected",
        complianceScore: 38,
        comment:
          "Audit lacks disaggregated metrics across protected groups and the sample size is insufficient. Resubmit a full study.",
        date: "2026-06-02T15:05:00Z",
        commentHash: "836a1c4f0e2b9d8773a4e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0",
        txHash: "e6c1f90a2b3c4d5e6f70819f2c4a1be7d05836a1c4f0e2b9d8773a4e6c1f90a2",
      },
    ],
  },
];

export const seedProposals: Proposal[] = [
  {
    id: "prop-501",
    type: "revocation",
    title: "Revoke certificate for Transparency_Certification.pdf",
    description:
      "A post-issuance audit flagged that Acme AI's transparency disclosures are out of date following a model update. Propose revoking the issued certificate (doc-1005).",
    status: "pending",
    approvals: 1,
    threshold: 2,
    signers: ["GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAI4"],
    createdBy: "Dr. Amara Okafor",
    createdAt: "2026-06-14T09:30:00Z",
    targetRef: "doc-1005",
  },
  {
    id: "prop-502",
    type: "framework_update",
    title: "Adopt ISO/IEC 42001:2026 amendment",
    description:
      "Update the ISO/IEC 42001 framework definition to the 2026 amendment, adding two new management-system controls.",
    status: "executed",
    approvals: 2,
    threshold: 2,
    signers: [
      "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAI4",
      "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2H4LK2HQH4NSEERDQQ6P2NDQ5O",
    ],
    createdBy: "Main Admin",
    createdAt: "2026-05-20T10:00:00Z",
    targetRef: "fw-iso-42001",
  },
  {
    id: "prop-503",
    type: "governance_rule",
    title: "Raise approval threshold to 3-of-3",
    description:
      "Propose increasing the multi-signature threshold from 2-of-3 to 3-of-3 for all exceptional governance actions.",
    status: "pending",
    approvals: 0,
    threshold: 2,
    signers: [],
    createdBy: "Main Admin",
    createdAt: "2026-06-15T08:00:00Z",
  },
  {
    id: "prop-504",
    type: "contract_upgrade",
    title: "Upgrade certificate registry contract to v2",
    description:
      "Deploy v2 of the certificate registry contract, adding batched anchoring and on-chain expiry checks.",
    status: "executed",
    approvals: 2,
    threshold: 2,
    signers: [
      "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2H4LK2HQH4NSEERDQQ6P2NDQ5O",
      "GCKFBEIYTKP6RJGWLOUQBCGWDLNYZ3TT4LMTRAB3F7K5UGZ5W7K2LLQR",
    ],
    createdBy: "Main Admin",
    createdAt: "2026-05-05T14:20:00Z",
  },
];

export const seedTemplates: Template[] = [
  {
    id: "tpl-eu-conformity",
    name: "EU AI Act Conformity Declaration",
    description: "Blank declaration of conformity for high-risk AI systems under the EU AI Act.",
    file: "EU_AI_Act_Conformity_Declaration.docx",
  },
  {
    id: "tpl-risk-assessment",
    name: "Model Risk Assessment",
    description: "Structured template for documenting model risks, mitigations and residual risk.",
    file: "Model_Risk_Assessment_Template.docx",
  },
  {
    id: "tpl-data-governance",
    name: "Data Governance Policy",
    description: "Policy template covering data provenance, retention and purpose limitation.",
    file: "Data_Governance_Policy_Template.docx",
  },
  {
    id: "tpl-transparency",
    name: "AI Transparency Disclosure",
    description: "User-facing transparency and disclosure statement template.",
    file: "AI_Transparency_Disclosure.docx",
  },
];

export const seedAlerts: Alert[] = [
  {
    id: "al-1",
    docId: "doc-1005",
    message: "Transparency Certification for Acme AI expires in under 60 days.",
    dueDate: "2027-04-18T00:00:00Z",
    severity: "warning",
  },
  {
    id: "al-2",
    docId: "doc-1003",
    message: "Data Governance Policy requires changes — awaiting company resubmission.",
    dueDate: "2026-06-30T00:00:00Z",
    severity: "info",
  },
  {
    id: "al-3",
    docId: "doc-1005",
    message: "Regulatory update: EU AI Act Article 52 amended — re-review issued certificates.",
    dueDate: "2026-06-25T00:00:00Z",
    severity: "critical",
  },
];

export const seedGovernance: GovernanceConfig = { required: 2, total: 3 };
