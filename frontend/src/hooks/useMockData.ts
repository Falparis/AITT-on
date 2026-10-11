// Hooks that bridge the Zustand store (src/mock/store.ts) and react-query.
// Reads simulate latency + expose isLoading; mutations update the store and
// invalidate the relevant queries so changes propagate across every screen.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMockStore } from "../mock/store";
import type { Alert, ProposalType, Review } from "../mock/types";
import { sleep } from "../mock/utils";

const qk = {
  documents: ["mock", "documents"] as const,
  templates: ["mock", "templates"] as const,
  companies: ["mock", "companies"] as const,
  subAdmins: ["mock", "subAdmins"] as const,
  proposals: ["mock", "proposals"] as const,
  frameworks: ["mock", "frameworks"] as const,
  governance: ["mock", "governance"] as const,
  signers: ["mock", "signers"] as const,
  alerts: ["mock", "alerts"] as const,
};

// ---------- Reads ----------

export function useDocuments() {
  return useQuery({
    queryKey: qk.documents,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().documents;
    },
  });
}

export function useDocument(id: string | undefined) {
  const query = useDocuments();
  return {
    ...query,
    data: id ? query.data?.find((d) => d.id === id) : undefined,
  };
}

export function useCompanyDocuments(companyName: string) {
  const query = useDocuments();
  return {
    ...query,
    data: query.data?.filter((d) => d.company === companyName),
  };
}

export function useTemplates() {
  return useQuery({
    queryKey: qk.templates,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().templates;
    },
  });
}

export function useFrameworks() {
  return useQuery({
    queryKey: qk.frameworks,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().frameworks;
    },
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: qk.companies,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().companies;
    },
  });
}

export function useSubAdmins() {
  return useQuery({
    queryKey: qk.subAdmins,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().subAdmins;
    },
  });
}

export function useProposals() {
  return useQuery({
    queryKey: qk.proposals,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().proposals;
    },
  });
}

export function useProposal(id: string | undefined) {
  const query = useProposals();
  return {
    ...query,
    data: id ? query.data?.find((p) => p.id === id) : undefined,
  };
}

export function useGovernance() {
  return useQuery({
    queryKey: qk.governance,
    queryFn: async () => {
      await sleep();
      const { governance, signerWallets } = useMockStore.getState();
      return { governance, signerWallets };
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: qk.alerts,
    queryFn: async () => {
      await sleep();
      return useMockStore.getState().alerts;
    },
  });
}

// ---------- Mutations ----------

export function useSubmitDocument() {
  const queryClient = useQueryClient();
  const submitDocument = useMockStore((s) => s.submitDocument);
  return useMutation({
    mutationFn: async (input: {
      filename: string;
      company: string;
      subject: string;
      hash: string;
    }) => {
      await sleep();
      return submitDocument(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.documents });
      queryClient.invalidateQueries({ queryKey: qk.companies });
    },
  });
}

export function useAddReview() {
  const queryClient = useQueryClient();
  const addReview = useMockStore((s) => s.addReview);
  return useMutation({
    mutationFn: async ({ docId, review }: { docId: string; review: Review }) => {
      await sleep();
      addReview(docId, review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.documents });
      queryClient.invalidateQueries({ queryKey: qk.subAdmins });
    },
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  const issueCertificate = useMockStore((s) => s.issueCertificate);
  return useMutation({
    mutationFn: async ({ docId, txHash }: { docId: string; txHash: string }) => {
      await sleep();
      issueCertificate(docId, txHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.documents });
    },
  });
}

export function useApproveCompany() {
  const queryClient = useQueryClient();
  const approveCompany = useMockStore((s) => s.approveCompany);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      approveCompany(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useRemoveCompany() {
  const queryClient = useQueryClient();
  const removeCompany = useMockStore((s) => s.removeCompany);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      removeCompany(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useInviteSubAdmin() {
  const queryClient = useQueryClient();
  const inviteSubAdmin = useMockStore((s) => s.inviteSubAdmin);
  return useMutation({
    mutationFn: async (input: { name: string; email: string; wallet: string }) => {
      await sleep();
      return inviteSubAdmin(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subAdmins }),
  });
}

export function useRemoveSubAdmin() {
  const queryClient = useQueryClient();
  const removeSubAdmin = useMockStore((s) => s.removeSubAdmin);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      removeSubAdmin(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subAdmins }),
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const createProposal = useMockStore((s) => s.createProposal);
  return useMutation({
    mutationFn: async (input: {
      type: ProposalType;
      title: string;
      description: string;
      createdBy: string;
      targetRef?: string;
    }) => {
      await sleep();
      return createProposal(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.proposals }),
  });
}

export function useSignProposal() {
  const queryClient = useQueryClient();
  const signProposal = useMockStore((s) => s.signProposal);
  return useMutation({
    mutationFn: async ({ id, wallet }: { id: string; wallet: string }) => {
      await sleep();
      signProposal(id, wallet);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.proposals }),
  });
}

export function useExecuteProposal() {
  const queryClient = useQueryClient();
  const executeProposal = useMockStore((s) => s.executeProposal);
  return useMutation({
    mutationFn: async ({ id, txHash }: { id: string; txHash: string }) => {
      await sleep();
      executeProposal(id, txHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.proposals });
      queryClient.invalidateQueries({ queryKey: qk.documents });
    },
  });
}

export function useSetGovernance() {
  const queryClient = useQueryClient();
  const setGovernance = useMockStore((s) => s.setGovernance);
  return useMutation({
    mutationFn: async (config: { required: number; total: number }) => {
      await sleep();
      setGovernance(config);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.governance }),
  });
}

export function useAddAlert() {
  const queryClient = useQueryClient();
  const addAlert = useMockStore((s) => s.addAlert);
  return useMutation({
    mutationFn: async (input: Omit<Alert, "id">) => {
      await sleep();
      return addAlert(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  const resolveAlert = useMockStore((s) => s.resolveAlert);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      resolveAlert(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useAddSignerWallet() {
  const queryClient = useQueryClient();
  const addSignerWallet = useMockStore((s) => s.addSignerWallet);
  return useMutation({
    mutationFn: async (wallet: string) => {
      await sleep();
      addSignerWallet(wallet);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.governance }),
  });
}

export function useRemoveSignerWallet() {
  const queryClient = useQueryClient();
  const removeSignerWallet = useMockStore((s) => s.removeSignerWallet);
  return useMutation({
    mutationFn: async (wallet: string) => {
      await sleep();
      removeSignerWallet(wallet);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.governance }),
  });
}

export function useAddFramework() {
  const queryClient = useQueryClient();
  const addFramework = useMockStore((s) => s.addFramework);
  return useMutation({
    mutationFn: async (input: { name: string; description: string }) => {
      await sleep();
      return addFramework(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useUpdateFramework() {
  const queryClient = useQueryClient();
  const updateFramework = useMockStore((s) => s.updateFramework);
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; description: string };
    }) => {
      await sleep();
      updateFramework(id, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useRemoveFramework() {
  const queryClient = useQueryClient();
  const removeFramework = useMockStore((s) => s.removeFramework);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      removeFramework(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.frameworks }),
  });
}

export function useAddTemplate() {
  const queryClient = useQueryClient();
  const addTemplate = useMockStore((s) => s.addTemplate);
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      file: string;
    }) => {
      await sleep();
      return addTemplate(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.templates }),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const updateTemplate = useMockStore((s) => s.updateTemplate);
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; description: string; file: string };
    }) => {
      await sleep();
      updateTemplate(id, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.templates }),
  });
}

export function useRemoveTemplate() {
  const queryClient = useQueryClient();
  const removeTemplate = useMockStore((s) => s.removeTemplate);
  return useMutation({
    mutationFn: async (id: string) => {
      await sleep();
      removeTemplate(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.templates }),
  });
}
