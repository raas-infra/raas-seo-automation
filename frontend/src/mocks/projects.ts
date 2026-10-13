import type { Project, ResearchRun, ResearchStep, SeoResults } from "../types/models";
import { generateResults } from "./results";

export const STEP_LABELS: Pick<ResearchStep, "key" | "label">[] = [
  { key: "crawl", label: "Crawl website" },
  { key: "serp", label: "Collect search results" },
  { key: "competitors", label: "Analyse competitors" },
  { key: "gaps", label: "Find keyword gaps" },
];

export interface MockState {
  projects: Project[];
  runs: ResearchRun[];
  results: SeoResults[];
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** Initial demo data so the dashboard is not empty on first load. */
export function seedState(): MockState {
  const completed: Project = {
    id: "p_demo_coffee",
    websiteUrl: "https://www.greenleafroasters.com",
    targetCountry: "US",
    targetLanguage: "en",
    businessDescription:
      "Independent specialty coffee roaster selling single-origin beans and monthly coffee subscriptions online.",
    seedKeywords: ["specialty coffee beans", "coffee subscription", "single origin coffee"],
    knownCompetitors: ["brewcraftroasters.com", "morningridgecoffee.com"],
    targetSearchEngine: "google",
    status: "COMPLETED",
    latestRunId: "r_demo_coffee_1",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
  };
  const draft: Project = {
    id: "p_demo_dental",
    websiteUrl: "https://northpeakdental.co.uk",
    targetCountry: "GB",
    targetLanguage: "en",
    businessDescription:
      "Family dental clinic in Leeds offering check-ups, teeth whitening, Invisalign and emergency dental care.",
    seedKeywords: ["dentist leeds", "teeth whitening", "invisalign"],
    knownCompetitors: [],
    targetSearchEngine: "google",
    status: "DRAFT",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  };
  const run: ResearchRun = {
    id: "r_demo_coffee_1",
    projectId: completed.id,
    status: "COMPLETED",
    progress: 100,
    steps: STEP_LABELS.map((s) => ({ ...s, status: "DONE" })),
    startedAt: daysAgo(5.01),
    completedAt: daysAgo(5),
  };
  return {
    projects: [completed, draft],
    runs: [run],
    results: [generateResults(completed, run.id, run.completedAt!)],
  };
}
