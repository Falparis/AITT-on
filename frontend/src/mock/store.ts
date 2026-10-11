// Single in-memory source of truth for the whole demo.
// Actions mutate the store synchronously; the hooks in src/hooks/* add the
// simulated latency + react-query invalidation on top of these.

import { create } from "zustand";
import {
  seedAlerts,
  seedCompanies,
  seedDocuments,
  seedFrameworks,
  seedGovernance,
  seedProposals,
  seedSignerWallets,
  seedSubAdmins,
  seedTemplates,
} from "./seed";
import type {
  Alert,
  Company,
  DocItem,
  DocStatus,
  Framework,
  GovernanceConfig,
  Proposal,
  ProposalType,
  Review,
  SubAdmin,
  Template,
} from "./types";
import { genId, nowISO } from "./utils";

const decisionToStatus: Record<Review["decision"], DocStatus> = {
  approved: "approved",
  approved_with_recommendations: "approved_with_recommendations",
  requires_changes: "requires_changes",
  rejected: "rejected",
};

function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

interface MockState {
  companies: Company[];
  subAdmins: SubAdmin[];
  documents: DocItem[];
  proposals: Proposal[];
  governance: GovernanceConfig;
  signerWallets: string[];
  alerts: Alert[];
  templates: Template[];
  frameworks: Framework[];

  // Companies
  addCompany: (input: { name: string; email: string; wallet: string }) => Company;
  approveCompany: (id: string) => void;
  removeCompany: (id: string) => void;

  // Sub-admins (legal experts)
  inviteSubAdmin: (input: { name: string; email: string; wallet: string }) => SubAdmin;
  activateSubAdmin: (id: string) => void;
  removeSubAdmin: (id: string) => void;

  // Documents
  submitDocument: (input: {
    filename: string;
    company: string;
    subject: string;
    hash: string;
  }) => DocItem;
  addReview: (docId: string, review: Review) => void;
  issueCertificate: (docId: string, txHash: string) => void;
  revokeDocument: (docId: string, txHash?: string) => void;

  // Governance / multi-sig
  createProposal: (input: {
    type: ProposalType;
    title: string;
    description: string;
    createdBy: string;
    targetRef?: string;
  }) => Proposal;
  signProposal: (id: string, signerWallet: string) => void;
  executeProposal: (id: string, txHash: string) => void;
  rejectProposal: (id: string) => void;
  setGovernance: (config: GovernanceConfig) => void;
  addSignerWallet: (wallet: string) => void;
  removeSignerWallet: (wallet: string) => void;

  // Frameworks & templates
  addFramework: (input: { name: string; description: string }) => Framework;
  updateFramework: (id: string, input: { name: string; description: string }) => void;
  removeFramework: (id: string) => void;
  addTemplate: (input: { name: string; description: string; file: string }) => Template;
  updateTemplate: (id: string, input: { name: string; description: string; file: string }) => void;
  removeTemplate: (id: string) => void;

  // Monitoring
  addAlert: (input: Omit<Alert, "id">) => Alert;
  resolveAlert: (id: string) => void;
}

export const useMockStore = create<MockState>((set, get) => ({
  companies: seedCompanies,
  subAdmins: seedSubAdmins,
  documents: seedDocuments,
  proposals: seedProposals,
  governance: seedGovernance,
  signerWallets: seedSignerWallets,
  alerts: seedAlerts,
  templates: seedTemplates,
  frameworks: seedFrameworks,

  addCompany: (input) => {
    const company: Company = {
      id: genId("co"),
      name: input.name,
      email: input.email,
      wallet: input.wallet,
      status: "pending",
      documents: 0,
      joinedAt: nowISO(),
    };
    set((s) => ({ companies: [company, ...s.companies] }));
    return company;
  },
  approveCompany: (id) =>
    set((s) => ({
      companies: s.companies.map((c) =>
        c.id === id ? { ...c, status: "active" } : c,
      ),
    })),
  removeCompany: (id) =>
    set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),

  inviteSubAdmin: (input) => {
    const subAdmin: SubAdmin = {
      id: genId("sa"),
      name: input.name,
      email: input.email,
      wallet: input.wallet,
      reviewsDone: 0,
      status: "invited",
    };
    set((s) => ({ subAdmins: [subAdmin, ...s.subAdmins] }));
    return subAdmin;
  },
  activateSubAdmin: (id) =>
    set((s) => ({
      subAdmins: s.subAdmins.map((sa) =>
        sa.id === id ? { ...sa, status: "active" } : sa,
      ),
    })),
  removeSubAdmin: (id) =>
    set((s) => ({ subAdmins: s.subAdmins.filter((sa) => sa.id !== id) })),

  submitDocument: (input) => {
    const doc: DocItem = {
      id: genId("doc"),
      filename: input.filename,
      company: input.company,
      subject: input.subject,
      status: "submitted",
      submittedAt: nowISO(),
      hash: input.hash,
      reviews: [],
    };
    set((s) => ({
      documents: [doc, ...s.documents],
      companies: s.companies.map((c) =>
        c.name === input.company ? { ...c, documents: c.documents + 1 } : c,
      ),
    }));
    return doc;
  },
  addReview: (docId, review) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              reviews: [...d.reviews, review],
              status: decisionToStatus[review.decision],
              complianceScore: review.complianceScore,
            }
          : d,
      ),
      subAdmins: s.subAdmins.map((sa) =>
        sa.name === review.reviewer
          ? { ...sa, reviewsDone: sa.reviewsDone + 1 }
          : sa,
      ),
    })),
  issueCertificate: (docId, txHash) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: "issued",
              txHash,
              expiryAt: addYears(nowISO(), 1),
            }
          : d,
      ),
    })),
  revokeDocument: (docId, txHash) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId ? { ...d, status: "revoked", txHash: txHash ?? d.txHash } : d,
      ),
    })),

  createProposal: (input) => {
    const proposal: Proposal = {
      id: genId("prop"),
      type: input.type,
      title: input.title,
      description: input.description,
      status: "pending",
      approvals: 0,
      threshold: get().governance.required,
      signers: [],
      createdBy: input.createdBy,
      createdAt: nowISO(),
      targetRef: input.targetRef,
    };
    set((s) => ({ proposals: [proposal, ...s.proposals] }));
    return proposal;
  },
  signProposal: (id, signerWallet) =>
    set((s) => ({
      proposals: s.proposals.map((p) => {
        if (p.id !== id || p.signers.includes(signerWallet)) return p;
        return {
          ...p,
          signers: [...p.signers, signerWallet],
          approvals: p.approvals + 1,
        };
      }),
    })),
  executeProposal: (id, txHash) => {
    const proposal = get().proposals.find((p) => p.id === id);
    set((s) => ({
      proposals: s.proposals.map((p) =>
        p.id === id ? { ...p, status: "executed" } : p,
      ),
    }));
    // Apply the proposal's effect.
    if (proposal?.type === "revocation" && proposal.targetRef) {
      get().revokeDocument(proposal.targetRef, txHash);
    }
  },
  rejectProposal: (id) =>
    set((s) => ({
      proposals: s.proposals.map((p) =>
        p.id === id ? { ...p, status: "rejected" } : p,
      ),
    })),
  setGovernance: (config) => set({ governance: config }),
  addSignerWallet: (wallet) =>
    set((s) =>
      s.signerWallets.includes(wallet)
        ? s
        : {
            signerWallets: [...s.signerWallets, wallet],
            governance: { ...s.governance, total: s.signerWallets.length + 1 },
          },
    ),
  removeSignerWallet: (wallet) =>
    set((s) => {
      const signerWallets = s.signerWallets.filter((w) => w !== wallet);
      return {
        signerWallets,
        governance: {
          total: signerWallets.length,
          required: Math.min(s.governance.required, signerWallets.length),
        },
      };
    }),

  addFramework: (input) => {
    const framework: Framework = { id: genId("fw"), ...input };
    set((s) => ({ frameworks: [...s.frameworks, framework] }));
    return framework;
  },
  updateFramework: (id, input) =>
    set((s) => ({
      frameworks: s.frameworks.map((f) => (f.id === id ? { ...f, ...input } : f)),
    })),
  removeFramework: (id) =>
    set((s) => ({ frameworks: s.frameworks.filter((f) => f.id !== id) })),
  addTemplate: (input) => {
    const template: Template = { id: genId("tpl"), ...input };
    set((s) => ({ templates: [...s.templates, template] }));
    return template;
  },
  updateTemplate: (id, input) =>
    set((s) => ({
      templates: s.templates.map((t) => (t.id === id ? { ...t, ...input } : t)),
    })),
  removeTemplate: (id) =>
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

  addAlert: (input) => {
    const alert: Alert = { id: genId("al"), ...input };
    set((s) => ({ alerts: [alert, ...s.alerts] }));
    return alert;
  },
  resolveAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
}));
