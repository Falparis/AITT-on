// Local type definitions that mirror the backend types
// These are used until the backend is compiled and bindgen is run

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface ComplianceResult {
  score: bigint;
  isCompliant: boolean;
  recommendations?: string;
}

export enum Regulation {
  euAIAct = "euAIAct",
  usAIRegulations = "usAIRegulations",
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  hash: Uint8Array;
  timestamp: bigint;
  regulation: Regulation;
  companyName: string;
  compliance?: ComplianceResult;
  blob: {
    getDirectURL: () => string;
  };
}

export interface AIActQuery {
  question: string;
  context?: string;
}

export interface AIActResponse {
  answer: string;
  sources?: string[];
}

export interface CybersecurityResult {
  score: bigint;
  vulnerabilities?: string[];
  recommendations?: string;
}

export interface RepositoryMetadata {
  id: string;
  name: string;
  url: string;
  timestamp: bigint;
  cybersecurity?: CybersecurityResult;
  analysisStatus?: string;
}

export interface CybersecurityQuery {
  question: string;
  context?: string;
}

export interface CybersecurityResponse {
  answer: string;
  recommendations?: string[];
}

export enum RiskCategory {
  low = "low",
  medium = "medium",
  high = "high",
}

export interface RiskEvent {
  id: string;
  issueType: string;
  description: string;
  severity: string;
  riskScore: bigint;
  category: RiskCategory;
  suggestedAction: string;
  timestamp: bigint;
}

export interface RiskAnalysis {
  currentScore: bigint;
  category: RiskCategory;
  summary: string;
  recommendations?: string;
  events: RiskEvent[];
}

// Actor interface defining all backend methods the frontend can call
export interface ActorInterface {
  getCallerUserProfile(): Promise<UserProfile | null>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  uploadDocument(
    filename: string,
    hash: Uint8Array,
    regulation: Regulation,
    blob: unknown,
    companyName: string,
  ): Promise<string>;
  getAllDocuments(): Promise<DocumentMetadata[]>;
  verifyDocument(hash: Uint8Array): Promise<DocumentMetadata | null>;
  getComplianceDashboard(): Promise<DocumentMetadata[]>;
  updateComplianceScore(documentId: string, newScore: bigint): Promise<void>;
  updateCompanyName(documentId: string, newCompanyName: string): Promise<void>;
  aiActAssistant(query: AIActQuery): Promise<AIActResponse>;
  makePostOutcall(url: string, body: string): Promise<string>;
  getExampleDocument(): Promise<DocumentMetadata | null>;
  addRepository(name: string, url: string): Promise<string>;
  getAllRepositories(): Promise<RepositoryMetadata[]>;
  getCybersecurityDashboard(): Promise<RepositoryMetadata[]>;
  updateCybersecurityScore(
    repositoryId: string,
    newScore: bigint,
  ): Promise<void>;
  analyzeRepository(repositoryId: string): Promise<CybersecurityResult>;
  cybersecurityAssistant(
    query: CybersecurityQuery,
  ): Promise<CybersecurityResponse>;
  getExampleRepository(): Promise<RepositoryMetadata | null>;
  getRiskAnalysis(): Promise<RiskAnalysis>;
  runRiskAnalysis(): Promise<RiskAnalysis>;
  getRiskEvents(): Promise<RiskEvent[]>;
  getSDKSecret(): Promise<string | null>;
  generateSDKSecret(): Promise<string>;
}
