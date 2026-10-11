// Unified data-access layer. Every page imports its hooks from here.
//
// Each hook branches on USE_MOCK at call time (a build-time constant): the real
// branch talks to the backend via src/api/client; the mock branch reads/writes
// the in-memory zustand store (src/mock/store). One switch, both paths compile
// (Requirement G). Hook names + signatures mirror the original store actions so
// pages barely change.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPostForm,
  apiPut,
} from "../api/client";
import { USE_MOCK } from "../api/config";
import {
  normalizeAlert,
  normalizeCompany,
  normalizeDocItem,
  normalizeProposal,
  normalizeSubAdmin,
} from "../api/normalize";
import { ApiError } from "../api/types";
import { DEMO_ADMIN, DEMO_SIGNER_WALLET } from "../mock/identity";
import { useMockStore } from "../mock/store";
import type {
  Alert,
  Company,
  ComplianceProgram,
  DocItem,
  Framework,
  GovernanceConfig,
  Jurisdiction,
  ProgramType,
  Proposal,
  ProposalType,
  Review,
  SubAdmin,
  Template,
} from "../mock/types";
import { fakeTxHash, sleep } from "../mock/utils";

// A generous page size so list screens show everything without pagination UI.
// TODO(integration): add real pagination controls for very large datasets.
const LIST_LIMIT = 100;

const qk = {
  documents: ["documents"] as const,
  document: (id?: string) => ["documents", id] as const,
  templates: ["templates"] as const,
  companies: ["companies"] as const,
  subAdmins: ["subAdmins"] as const,
  proposals: ["proposals"] as const,
  proposal: (id?: string) => ["proposals", id] as const,
  frameworks: ["frameworks"] as const,
  compliancePrograms: ["compliance-programs"] as const,
  governance: ["governance"] as const,
  alerts: ["alerts"] as const,
};

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ------------------------------------------------------------------ Reads ----

export function useDocuments() {
  return useQuery({
    queryKey: qk.documents,
    queryFn: async (): Promise<DocItem[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().documents;
      }
      const { data } = await apiGetPaginated<DocItem[]>("/documents", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeDocItem);
    },
  });
}

// Public certificate registry — no auth required (issued/revoked/expired certs).
export function usePublicRegistry() {
  return useQuery({
    queryKey: ["public-registry"],
    queryFn: async (): Promise<DocItem[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().documents;
      }
      const { data } = await apiGetPaginated<DocItem[]>("/documents/registry", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeDocItem);
    },
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: qk.document(id),
    enabled: !!id,
    queryFn: async (): Promise<DocItem | undefined> => {
      if (!id) return undefined;
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().documents.find((d) => d.id === id);
      }
      // Prefer the auth-scoped route (full detail for admins/reviewers and the
      // owning company). Anonymous users, and companies opening another
      // company's certificate from the public Registry, aren't allowed there —
      // fall back to the public certificate-detail endpoint (issued/revoked/
      // expired certs only) so the Registry link still resolves.
      try {
        return normalizeDocItem(await apiGet<DocItem>(`/documents/${id}`));
      } catch (err) {
        try {
          return normalizeDocItem(
            await apiGet<DocItem>(`/documents/registry/${id}`),
          );
        } catch {
          throw err;
        }
      }
    },
  });
}

// Reviews recorded by the signed-in sub-admin ONLY. The backend scopes to the
// current reviewer, so a fresh/other reviewer never sees another's work. Mock
// mode returns all docs and the page filters to the demo reviewer.
export function useMyReviews() {
  return useQuery({
    queryKey: ["my-reviews"],
    queryFn: async (): Promise<DocItem[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().documents;
      }
      const { data } = await apiGetPaginated<DocItem[]>(
        "/documents/mine/reviews",
        { query: { limit: LIST_LIMIT } },
      );
      return (data ?? []).map(normalizeDocItem);
    },
  });
}

// The signed-in company's own record — used to gate company features until an
// admin approves the account (status becomes "active").
export function useMyCompany(companyId?: string) {
  return useQuery({
    queryKey: ["my-company", companyId ?? "none"],
    enabled: !USE_MOCK && !!companyId,
    queryFn: async (): Promise<Company | null> => {
      if (!companyId) return null;
      return normalizeCompany(await apiGet<Company>(`/companies/${companyId}`));
    },
  });
}

/** Company-scoped documents. In real mode the backend already scopes to the
 *  caller's company, so `companyName` is only used for the mock filter. */
export function useCompanyDocuments(companyName?: string) {
  const query = useDocuments();
  if (USE_MOCK && companyName) {
    return { ...query, data: query.data?.filter((d) => d.company === companyName) };
  }
  return query;
}

export function useTemplates() {
  return useQuery({
    queryKey: qk.templates,
    queryFn: async (): Promise<Template[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().templates;
      }
      const { data } = await apiGetPaginated<Template[]>("/templates", {
        query: { limit: LIST_LIMIT },
      });
      return data ?? [];
    },
  });
}

export function useFrameworks() {
  return useQuery({
    queryKey: qk.frameworks,
    queryFn: async (): Promise<Framework[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().frameworks;
      }
      const { data } = await apiGetPaginated<Framework[]>("/frameworks", {
        query: { limit: LIST_LIMIT },
      });
      return data ?? [];
    },
  });
}

// ---------------------------------------------------- Compliance Programs ----
// Admin-managed AITT compliance programs (replace the old Frameworks concept).
// Only the Main Admin can create/edit/archive/delete or assign sub-admins.
const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  expert_support: "Expert Compliance Support",
  self_service: "Self-Service",
};
let mockPrograms: ComplianceProgram[] = [
  { id: "cp-eu-gov", name: "AI Governance", type: "expert_support", typeLabel: "Expert Compliance Support", jurisdiction: "EU", description: "Governance controls for AI systems.", assignedSubAdmins: [], archived: false },
  { id: "cp-eu-tra", name: "AI Transparency", type: "self_service", typeLabel: "Self-Service", jurisdiction: "EU", description: "Transparency and disclosure for AI systems.", assignedSubAdmins: [], archived: false },
  { id: "cp-us-risk", name: "AI Risk Management", type: "self_service", typeLabel: "Self-Service", jurisdiction: "US", description: "Risk identification and mitigation for AI systems.", assignedSubAdmins: [], archived: false },
];

export function useCompliancePrograms(opts?: { includeArchived?: boolean }) {
  const includeArchived = opts?.includeArchived ?? false;
  return useQuery({
    queryKey: [...qk.compliancePrograms, includeArchived] as const,
    queryFn: async (): Promise<ComplianceProgram[]> => {
      if (USE_MOCK) {
        await sleep();
        return mockPrograms.filter((p) => includeArchived || !p.archived);
      }
      const { data } = await apiGetPaginated<ComplianceProgram[]>("/compliance-programs", {
        query: { limit: LIST_LIMIT, ...(includeArchived ? { includeArchived: "true" } : {}) },
      });
      return data ?? [];
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      type: ProgramType;
      jurisdiction: Jurisdiction;
      description?: string;
    }): Promise<ComplianceProgram> => {
      if (USE_MOCK) {
        await sleep();
        const p: ComplianceProgram = {
          id: `cp-${Date.now()}`,
          name: input.name,
          type: input.type,
          typeLabel: PROGRAM_TYPE_LABELS[input.type],
          jurisdiction: input.jurisdiction,
          description: input.description ?? "",
          assignedSubAdmins: [],
          archived: false,
        };
        mockPrograms = [...mockPrograms, p];
        return p;
      }
      return apiPost<ComplianceProgram>("/compliance-programs", input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compliancePrograms }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<{ name: string; type: ProgramType; jurisdiction: Jurisdiction; description: string }>;
    }) => {
      if (USE_MOCK) {
        await sleep();
        mockPrograms = mockPrograms.map((p) =>
          p.id === id
            ? { ...p, ...input, typeLabel: input.type ? PROGRAM_TYPE_LABELS[input.type] : p.typeLabel }
            : p,
        );
        return;
      }
      await apiPut(`/compliance-programs/${id}`, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compliancePrograms }),
  });
}

export function useArchiveProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (USE_MOCK) {
        await sleep();
        mockPrograms = mockPrograms.map((p) => (p.id === id ? { ...p, archived } : p));
        return;
      }
      await apiPost(`/compliance-programs/${id}/archive`, { archived });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compliancePrograms }),
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        mockPrograms = mockPrograms.filter((p) => p.id !== id);
        return;
      }
      await apiDelete(`/compliance-programs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compliancePrograms }),
  });
}

export function useAssignProgramSubAdmins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, subAdminIds }: { id: string; subAdminIds: string[] }) => {
      if (USE_MOCK) {
        await sleep();
        return;
      }
      await apiPost(`/compliance-programs/${id}/assignees`, { subAdminIds });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compliancePrograms }),
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: qk.companies,
    queryFn: async (): Promise<Company[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().companies;
      }
      const { data } = await apiGetPaginated<Company[]>("/companies", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeCompany);
    },
  });
}

export function useSubAdmins() {
  return useQuery({
    queryKey: qk.subAdmins,
    queryFn: async (): Promise<SubAdmin[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().subAdmins;
      }
      const { data } = await apiGetPaginated<SubAdmin[]>("/sub-admins", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeSubAdmin);
    },
  });
}

export function useProposals() {
  return useQuery({
    queryKey: qk.proposals,
    queryFn: async (): Promise<Proposal[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().proposals;
      }
      const { data } = await apiGetPaginated<Proposal[]>("/proposals", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeProposal);
    },
  });
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: qk.proposal(id),
    enabled: !!id,
    queryFn: async (): Promise<Proposal | undefined> => {
      if (!id) return undefined;
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().proposals.find((p) => p.id === id);
      }
      return normalizeProposal(await apiGet<Proposal>(`/proposals/${id}`));
    },
  });
}

interface GovernanceView {
  governance: GovernanceConfig;
  signerWallets: string[];
}

export function useGovernance() {
  return useQuery({
    queryKey: qk.governance,
    queryFn: async (): Promise<GovernanceView> => {
      if (USE_MOCK) {
        await sleep();
        const { governance, signerWallets } = useMockStore.getState();
        return { governance, signerWallets };
      }
      const data = await apiGet<{
        required: number;
        total: number;
        signerWallets?: string[];
      }>("/governance");
      return {
        governance: { required: data.required, total: data.total },
        signerWallets: data.signerWallets ?? [],
      };
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: qk.alerts,
    queryFn: async (): Promise<Alert[]> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().alerts;
      }
      const { data } = await apiGetPaginated<Alert[]>("/alerts", {
        query: { limit: LIST_LIMIT },
      });
      return (data ?? []).map(normalizeAlert);
    },
  });
}

// -------------------------------------------------------------- Mutations ----

export function useSubmitDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      subject?: string;
      programId?: string;
      filename?: string;
    }): Promise<DocItem> => {
      if (USE_MOCK) {
        await sleep();
        const hash = await sha256Hex(input.file);
        return useMockStore.getState().submitDocument({
          filename: input.filename ?? input.file.name,
          company: useMockStore.getState().companies[0]?.name ?? "Demo Company",
          subject: input.subject ?? "Compliance Program",
          hash,
        });
      }
      const form = new FormData();
      form.append("file", input.file);
      if (input.subject) form.append("subject", input.subject);
      if (input.programId) form.append("programId", input.programId);
      if (input.filename) form.append("filename", input.filename);
      return apiPostForm<DocItem>("/documents", form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.documents });
      qc.invalidateQueries({ queryKey: qk.companies });
    },
  });
}

// Create a Workflow (certification case) — no company file uploaded (supporting
// docs live off-platform). Just company + program + optional assigned reviewer.
export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      companyId: string;
      programId: string;
      assignedReviewerId?: string;
      name?: string;
      subject?: string;
    }): Promise<DocItem> => {
      if (USE_MOCK) {
        await sleep();
        const store = useMockStore.getState();
        const hash = Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");
        return store.submitDocument({
          filename: input.name ?? "Certification workflow",
          company:
            store.companies.find((c) => c.id === input.companyId)?.name ??
            store.companies[0]?.name ??
            "Company",
          subject: input.subject ?? "Compliance Program",
          hash,
        });
      }
      const form = new FormData();
      form.append("companyId", input.companyId);
      form.append("programId", input.programId);
      if (input.assignedReviewerId) form.append("assignedReviewerId", input.assignedReviewerId);
      if (input.subject) form.append("subject", input.subject);
      form.append("filename", input.name ?? "Certification workflow");
      return apiPostForm<DocItem>("/documents", form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.documents });
      qc.invalidateQueries({ queryKey: qk.companies });
    },
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, review }: { docId: string; review: Review }) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().addReview(docId, review);
        return;
      }
      await apiPost<DocItem>(`/documents/${docId}/review`, {
        decision: review.decision,
        complianceScore: review.complianceScore,
        comment: review.comment,
      });
    },
    onSuccess: (_data, { docId }) => {
      qc.invalidateQueries({ queryKey: qk.documents });
      qc.invalidateQueries({ queryKey: qk.document(docId) });
      qc.invalidateQueries({ queryKey: qk.subAdmins });
    },
  });
}

export function useIssueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      docId,
      expiryAt,
      file,
    }: {
      docId: string;
      expiryAt?: string;
      file?: File;
    }) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().issueCertificate(docId, fakeTxHash());
        return;
      }
      if (file) {
        // Final Certificate PDF upload — multipart.
        const form = new FormData();
        form.append("file", file);
        if (expiryAt) form.append("expiryAt", expiryAt);
        await apiPostForm<DocItem>(`/documents/${docId}/issue`, form);
      } else {
        await apiPost<DocItem>(`/documents/${docId}/issue`, expiryAt ? { expiryAt } : {});
      }
    },
    onSuccess: (_data, { docId }) => {
      qc.invalidateQueries({ queryKey: qk.documents });
      qc.invalidateQueries({ queryKey: qk.document(docId) });
    },
  });
}

export function useApproveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().approveCompany(id);
        return;
      }
      await apiPost<Company>(`/companies/${id}/approve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useRemoveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().removeCompany(id);
        return;
      }
      await apiDelete(`/companies/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useInviteSubAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      wallet?: string;
      password?: string;
    }): Promise<SubAdmin> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().inviteSubAdmin({
          name: input.name,
          email: input.email,
          wallet: input.wallet ?? "",
        });
      }
      return apiPost<SubAdmin>("/sub-admins", {
        name: input.name,
        email: input.email,
        ...(input.wallet ? { wallet: input.wallet } : {}),
        ...(input.password ? { password: input.password } : {}),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subAdmins }),
  });
}

export function useActivateSubAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().activateSubAdmin(id);
        return;
      }
      await apiPost<SubAdmin>(`/sub-admins/${id}/activate`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subAdmins });
      qc.invalidateQueries({ queryKey: qk.governance });
    },
  });
}

export function useRemoveSubAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().removeSubAdmin(id);
        return;
      }
      await apiDelete(`/sub-admins/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subAdmins });
      qc.invalidateQueries({ queryKey: qk.governance });
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      type: ProposalType;
      title: string;
      description?: string;
      targetRef?: string;
      payload?: Record<string, unknown>;
    }): Promise<Proposal> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().createProposal({
          type: input.type,
          title: input.title,
          description: input.description ?? "",
          createdBy: DEMO_ADMIN,
          targetRef: input.targetRef,
        });
      }
      return apiPost<Proposal>("/proposals", {
        type: input.type,
        title: input.title,
        description: input.description,
        targetRef: input.targetRef,
        payload: input.payload,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.proposals }),
  });
}

/** Sign a proposal AS THE CURRENT USER. Auto-executes at threshold in both
 *  modes (mirrors the deployed contract — create ≠ sign). `wallet` is only used
 *  by the mock demo to sign on behalf of a chosen roster wallet. */
export function useSignProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, wallet }: { id: string; wallet?: string }) => {
      if (USE_MOCK) {
        await sleep();
        const store = useMockStore.getState();
        store.signProposal(id, wallet ?? DEMO_SIGNER_WALLET);
        const p = useMockStore.getState().proposals.find((x) => x.id === id);
        if (p && p.status === "pending" && p.approvals >= p.threshold) {
          store.executeProposal(id, fakeTxHash());
        }
        return;
      }
      await apiPost<Proposal>(`/proposals/${id}/sign`);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: qk.proposals });
      qc.invalidateQueries({ queryKey: qk.proposal(id) });
      qc.invalidateQueries({ queryKey: qk.documents });
    },
  });
}

/** Admin-only reject (backend has no on-chain reject; sets status=rejected). */
export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().rejectProposal(id);
        return;
      }
      await apiPost<Proposal>(`/proposals/${id}/reject`);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.proposals });
      qc.invalidateQueries({ queryKey: qk.proposal(id) });
    },
  });
}

export function useSetGovernance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: { required: number; total: number }) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().setGovernance(config);
        return;
      }
      await apiPut("/governance", { required: config.required, total: config.total });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.governance }),
  });
}

export function useAddAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Alert, "id">) => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().addAlert(input);
      }
      // The backend ties an alert to a document; omit docId when it's a general
      // (document-less) regulatory notice rather than sending an empty string.
      const body: Record<string, unknown> = {
        message: input.message,
        dueDate: input.dueDate,
        severity: input.severity,
      };
      if (input.docId) body.docId = input.docId;
      return apiPost<Alert>("/alerts", body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().resolveAlert(id);
        return;
      }
      await apiPost<Alert>(`/alerts/${id}/resolve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

// Signer wallets: in real mode M is derived from active sub-admins — there is no
// direct add/remove endpoint. These stay for the mock demo; the real-mode UI is
// hidden (see GovernanceSettingsPage), and calling them live is a clear error.
export function useAddSignerWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wallet: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().addSignerWallet(wallet);
        return;
      }
      throw new ApiError(
        "Signers are managed by inviting and activating sub-admins.",
        400,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.governance }),
  });
}

export function useRemoveSignerWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wallet: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().removeSignerWallet(wallet);
        return;
      }
      throw new ApiError(
        "Signers are managed by removing sub-admins.",
        400,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.governance }),
  });
}

// Frameworks: read-only in real mode (changes go through framework_update
// proposals). Direct CRUD stays for the mock demo; real-mode UI is replaced by a
// "Propose framework update" flow (see AdminFrameworksPage).
export function useAddFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string }) => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().addFramework(input);
      }
      throw new ApiError(
        "Frameworks are updated through governance proposals.",
        400,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useUpdateFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; description: string };
    }) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().updateFramework(id, input);
        return;
      }
      throw new ApiError(
        "Frameworks are updated through governance proposals.",
        400,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useRemoveFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().removeFramework(id);
        return;
      }
      throw new ApiError(
        "Frameworks are updated through governance proposals.",
        400,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useAddTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      file: string;
    }): Promise<Template> => {
      if (USE_MOCK) {
        await sleep();
        return useMockStore.getState().addTemplate(input);
      }
      return apiPost<Template>("/templates", input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.templates }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; description: string; file: string };
    }) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().updateTemplate(id, input);
        return;
      }
      await apiPut<Template>(`/templates/${id}`, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.templates }),
  });
}

export function useRemoveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await sleep();
        useMockStore.getState().removeTemplate(id);
        return;
      }
      await apiDelete(`/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.templates }),
  });
}
