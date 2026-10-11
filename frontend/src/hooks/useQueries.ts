import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  AIActQuery,
  CybersecurityQuery,
  DocumentMetadata,
  Regulation,
  RepositoryMetadata,
  RiskAnalysis,
  RiskEvent,
  UserProfile,
} from "../types";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUploadDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filename,
      hash,
      regulation,
      blob,
      companyName,
    }: {
      filename: string;
      hash: Uint8Array;
      regulation: Regulation;
      blob: ExternalBlob;
      companyName: string;
    }) => {
      if (!actor) throw new Error("Actor not available");

      try {
        const documentId = await actor.uploadDocument(
          filename,
          hash,
          regulation,
          blob,
          companyName,
        );
        return documentId;
      } catch (error: any) {
        console.error("Upload document error:", error);
        throw new Error(error?.message || "Failed to upload document");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["complianceDashboard"] });
    },
    onError: (error: any) => {
      console.error("Upload mutation error:", error);
    },
  });
}

export function useGetUserDocuments() {
  const { actor, isFetching } = useActor();

  return useQuery<DocumentMetadata[]>({
    queryKey: ["userDocuments"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const docs = await actor.getAllDocuments();
        return docs;
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVerifyDocument() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (hash: Uint8Array) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyDocument(hash);
    },
  });
}

export function useGetComplianceDashboard() {
  const { actor, isFetching } = useActor();

  return useQuery<DocumentMetadata[]>({
    queryKey: ["complianceDashboard"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const docs = await actor.getComplianceDashboard();
        return docs;
      } catch (error) {
        console.error("Error fetching compliance dashboard:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateComplianceScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      newScore,
    }: {
      documentId: string;
      newScore: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await actor.updateComplianceScore(documentId, BigInt(newScore));
      } catch (error: any) {
        console.error("Error updating compliance score:", error);
        throw new Error(error?.message || "Failed to update compliance score");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["complianceDashboard"] });
    },
  });
}

export function useUpdateCompanyName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      newCompanyName,
    }: {
      documentId: string;
      newCompanyName: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await actor.updateCompanyName(documentId, newCompanyName);
      } catch (error: any) {
        console.error("Error updating company name:", error);
        throw new Error(error?.message || "Failed to update company name");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["complianceDashboard"] });
    },
  });
}

/**
 * Hook for calling the specialized AI Act assistant
 * This hook interfaces with the backend's aiActAssistant function which is
 * specifically configured to provide expert guidance on EU AI Act compliance
 */
export function useAIActAssistant() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (query: AIActQuery) => {
      if (!actor) throw new Error("Actor not available");
      return actor.aiActAssistant(query);
    },
  });
}

export function useMakePostOutcall() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ url, body }: { url: string; body: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.makePostOutcall(url, body);
    },
  });
}

export function useGetExampleDocument() {
  const { actor, isFetching } = useActor();

  return useQuery<DocumentMetadata | null>({
    queryKey: ["exampleDocument"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExampleDocument();
    },
    enabled: !!actor && !isFetching,
  });
}

// Cybersecurity hooks

export function useAddRepository() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const repositoryId = await actor.addRepository(name, url);
        return repositoryId;
      } catch (error: any) {
        console.error("Add repository error:", error);
        throw new Error(error?.message || "Failed to add repository");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      queryClient.invalidateQueries({ queryKey: ["cybersecurityDashboard"] });
    },
  });
}

export function useGetAllRepositories() {
  const { actor, isFetching } = useActor();

  return useQuery<RepositoryMetadata[]>({
    queryKey: ["repositories"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const repos = await actor.getAllRepositories();
        return repos;
      } catch (error) {
        console.error("Error fetching repositories:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCybersecurityDashboard() {
  const { actor, isFetching } = useActor();

  return useQuery<RepositoryMetadata[]>({
    queryKey: ["cybersecurityDashboard"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const repos = await actor.getCybersecurityDashboard();
        return repos;
      } catch (error) {
        console.error("Error fetching cybersecurity dashboard:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCybersecurityScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repositoryId,
      newScore,
    }: {
      repositoryId: string;
      newScore: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await actor.updateCybersecurityScore(repositoryId, BigInt(newScore));
      } catch (error: any) {
        console.error("Error updating cybersecurity score:", error);
        throw new Error(
          error?.message || "Failed to update cybersecurity score",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      queryClient.invalidateQueries({ queryKey: ["cybersecurityDashboard"] });
    },
  });
}

/**
 * Hook for analyzing a repository using the AI LLM canister simulation
 * This triggers automated code analysis to detect vulnerabilities and generate security scores
 */
export function useAnalyzeRepository() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.analyzeRepository(repositoryId);
        return result;
      } catch (error: any) {
        console.error("Error analyzing repository:", error);
        throw new Error(error?.message || "Failed to analyze repository");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      queryClient.invalidateQueries({ queryKey: ["cybersecurityDashboard"] });
    },
  });
}

/**
 * Hook for calling the specialized Cybersecurity assistant
 * This hook interfaces with the backend's cybersecurityAssistant function which is
 * specifically configured to provide expert guidance on cybersecurity best practices
 */
export function useCybersecurityAssistant() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (query: CybersecurityQuery) => {
      if (!actor) throw new Error("Actor not available");
      return actor.cybersecurityAssistant(query);
    },
  });
}

export function useGetExampleRepository() {
  const { actor, isFetching } = useActor();

  return useQuery<RepositoryMetadata | null>({
    queryKey: ["exampleRepository"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExampleRepository();
    },
    enabled: !!actor && !isFetching,
  });
}

// AI Risk & Bias Minimization Layer hooks

export function useGetRiskAnalysis() {
  const { actor, isFetching } = useActor();

  return useQuery<RiskAnalysis>({
    queryKey: ["riskAnalysis"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const analysis = await actor.getRiskAnalysis();
        return analysis;
      } catch (error) {
        console.error("Error fetching risk analysis:", error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRunRiskAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const analysis = await actor.runRiskAnalysis();
        return analysis;
      } catch (error: any) {
        console.error("Error running risk analysis:", error);
        throw new Error(error?.message || "Failed to run risk analysis");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskAnalysis"] });
      queryClient.invalidateQueries({ queryKey: ["riskEvents"] });
    },
  });
}

export function useGetRiskEvents() {
  const { actor, isFetching } = useActor();

  return useQuery<RiskEvent[]>({
    queryKey: ["riskEvents"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const events = await actor.getRiskEvents();
        return events;
      } catch (error) {
        console.error("Error fetching risk events:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// SDK Secret Management hooks

export function useGetSDKSecret() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["sdkSecret"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const secret = await actor.getSDKSecret();
        return secret;
      } catch (error) {
        console.error("Error fetching SDK secret:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateSDKSecret() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const secret = await actor.generateSDKSecret();
        return secret;
      } catch (error: any) {
        console.error("Error generating SDK secret:", error);
        throw new Error(error?.message || "Failed to generate SDK secret");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sdkSecret"] });
    },
  });
}
