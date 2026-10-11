// Mock data model for the AITT Compliance & Governance platform.
// Frontend-only: these types describe the in-memory store (src/mock/store.ts).
// No backend, no blockchain SDK — "on-chain" actions are simulated.

export type Role = "public" | "company" | "sub_admin" | "admin";

export type DocStatus =
  | "submitted"
  | "under_review"
  | "requires_changes"
  | "approved"
  | "approved_with_recommendations"
  | "issued"
  | "rejected"
  | "expired"
  | "revoked";

export type ReviewDecision =
  | "approved"
  | "approved_with_recommendations"
  | "requires_changes"
  | "rejected";

export type ProposalType =
  | "revocation"
  | "framework_update"
  | "governance_rule"
  | "contract_upgrade";

export type ProposalStatus = "pending" | "executed" | "rejected";

export interface Company {
  id: string;
  name: string;
  email: string;
  wallet: string;
  status: "active" | "pending";
  documents: number;
  joinedAt: string; // ISO date
}

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  wallet: string;
  reviewsDone: number;
  status: "active" | "invited";
}

export interface Review {
  reviewer: string; // sub-admin name
  decision: ReviewDecision;
  complianceScore: number; // 0–100
  comment: string;
  date: string; // ISO date
  commentHash: string; // SHA-256-style hex of the comment
  txHash?: string; // on-chain anchor (simulated)
}

export interface DocItem {
  id: string;
  filename: string;
  company: string; // company name
  subject: string; // compliance subject / framework
  status: DocStatus;
  submittedAt: string; // ISO date
  expiryAt?: string; // ISO date
  hash: string; // SHA-256 hex of the file
  /** A downloadable file is stored for this document. Workflows created without
   *  an upload have none, so a Download button must not be offered for them. */
  hasFile?: boolean;
  txHash?: string; // issuance/anchor tx (simulated)
  complianceScore?: number; // overall 0–100
  jurisdiction?: Jurisdiction; // EU / US
  program?: string; // compliance program name (snapshot)
  programType?: ProgramType; // expert_support / self_service
  programId?: string;
  reviewStatus?: ReviewDecision; // latest review decision (public "Review status")
  workflowStatus?: "in_progress" | "completed"; // simplified workflow status
  assignedReviewer?: string; // assigned reviewer display name
  assignedReviewerId?: string;
  reviews: Review[];
}

export interface Proposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  status: ProposalStatus;
  approvals: number;
  threshold: number;
  signers: string[]; // wallets that have already signed/approved
  createdBy: string;
  createdAt: string; // ISO date
  targetRef?: string; // e.g. a document id for a revocation proposal
}

// Configurable N-of-M multi-signature threshold.
export interface GovernanceConfig {
  required: number; // N
  total: number; // M
}

export interface Alert {
  id: string;
  docId: string;
  message: string;
  dueDate: string; // ISO date
  severity: "info" | "warning" | "critical";
}

export interface Template {
  id: string;
  name: string;
  description: string;
  file: string; // blank .docx filename
}

export interface Framework {
  id: string;
  name: string;
  description: string;
}

export type ProgramType = "expert_support" | "self_service";
export type Jurisdiction = "EU" | "US";

export interface ProgramAssignee {
  id: string;
  name?: string;
  email?: string;
}

export interface ComplianceProgram {
  id: string;
  name: string;
  type: ProgramType;
  typeLabel: string;
  jurisdiction: Jurisdiction;
  description: string;
  assignedSubAdmins: ProgramAssignee[];
  archived: boolean;
}
