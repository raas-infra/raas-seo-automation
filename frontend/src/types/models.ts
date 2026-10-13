export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type ProjectStatus = "DRAFT" | RunStatus;
export type SearchEngine = "google" | "bing";

export interface CreateProjectInput {
  websiteUrl: string;
  targetCountry: string; // ISO 3166-1 alpha-2, e.g. "US"
  targetLanguage: string; // ISO 639-1, e.g. "en"
  businessDescription: string;
  seedKeywords?: string[];
  knownCompetitors?: string[];
  targetSearchEngine?: SearchEngine;
}

export interface Project extends CreateProjectInput {
  id: string;
  status: ProjectStatus;
  latestRunId?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export type ResearchStepKey = "crawl" | "serp" | "competitors" | "gaps";

export interface ResearchStep {
  key: ResearchStepKey;
  label: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
}

export interface ResearchRun {
  id: string;
  projectId: string;
  status: RunStatus;
  progress: number; // 0-100
  steps: ResearchStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export interface KeywordResult {
  keyword: string;
  searchVolume: number;
  difficulty: number; // 0-100
  intent: SearchIntent;
  currentRank?: number;
}

export interface CompetitorResult {
  domain: string;
  overlapScore: number; // 0-100
  sharedKeywords: number;
}

export interface KeywordGap {
  keyword: string;
  searchVolume: number;
  competitorsRanking: string[];
  opportunityScore: number; // 0-100
}

export interface SeoResults {
  runId: string;
  projectId: string;
  generatedAt: string;
  keywords: KeywordResult[];
  competitors: CompetitorResult[];
  gaps: KeywordGap[];
  summary: string;
}

export interface ApiClient {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project>;
  createProject(input: CreateProjectInput): Promise<Project>;
  listRuns(projectId: string): Promise<ResearchRun[]>;
  startResearch(projectId: string): Promise<ResearchRun>;
  getRun(runId: string): Promise<ResearchRun>;
  getResults(runId: string): Promise<SeoResults>;
}
