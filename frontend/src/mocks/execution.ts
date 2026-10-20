// Simulated per-stage execution details for a research run. Placeholder only.
// Deterministic: the same project + run always yields the same text, and the numbers come from
// generateResults() so they match the SEO Results page exactly (even while the run is in progress).
//
// Future real sources, per stage:
//   crawl       -> website crawler / sitemap fetcher in the Python backend
//   serp        -> SERP data provider (Google / Bing) for volumes, difficulty, ranks
//   competitors -> competitor discovery + keyword-overlap engine (backend)
//   gaps        -> keyword gap analysis over the SERP and competitor data (backend)
import type { Project, ResearchRun, RunExecutionDetails, StepExecutionDetail } from "../types/models";
import { domainOf, formatNumber } from "../lib/format";
import { STEP_MS } from "./projects";
import { generateResults, rng } from "./results";

type Built = Pick<StepExecutionDetail, "actions" | "results">;

export function generateExecutionDetails(project: Project, run: ResearchRun): RunExecutionDetails {
  const domain = domainOf(project.websiteUrl);
  const results = generateResults(project, run.id, run.startedAt);
  const rand = rng(`${project.id}${run.id}:execution`);
  const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

  const pages = int(24, 160);
  const sitemapUrls = pages + int(4, 30);
  const topics = int(5, 12);
  const engine = project.targetSearchEngine === "bing" ? "Bing" : "Google";
  const locale = `${project.targetCountry}/${project.targetLanguage}`;
  const queries = results.keywords.length + int(6, 20);
  const topGap = results.gaps[0];
  const topCompetitor = results.competitors[0];
  const knownCount = project.knownCompetitors?.length ?? 0;
  const discovered = Math.max(0, results.competitors.length - knownCount);
  const ranking = results.keywords.filter((k) => k.currentRank).length;

  // Each stage: ordered actions (all of them once DONE) and the results shown once DONE.
  const plan: Record<StepExecutionDetail["key"], { actions: string[]; results: [string, string][] }> = {
    crawl: {
      actions: [
        `Fetched sitemap and robots.txt for ${domain}`,
        `Crawled ${pages} pages (${sitemapUrls} URLs in sitemap)`,
        `Extracted titles, headings and body copy`,
        `Identified ${topics} core topics from the content`,
      ],
      results: [
        ["Pages crawled", String(pages)],
        ["Topics identified", String(topics)],
      ],
    },
    serp: {
      actions: [
        `Selected seed terms from the business description${project.seedKeywords?.length ? " and your seed keywords" : ""}`,
        `Expanded terms with modifiers (best, price, near me, guide…)`,
        `Queried ${engine} (${locale}) for ${queries} search terms`,
        `Collected volume, difficulty, intent and your current rank`,
      ],
      results: [
        ["Keywords found", String(results.keywords.length)],
        ["Total monthly volume", formatNumber(results.keywords.reduce((s, k) => s + k.searchVolume, 0))],
        ["Already ranking", String(ranking)],
      ],
    },
    competitors: {
      actions: [
        knownCount ? `Loaded ${knownCount} known competitor${knownCount === 1 ? "" : "s"} from the project` : "No known competitors provided",
        `Discovered ${discovered} more domain${discovered === 1 ? "" : "s"} ranking for the same terms`,
        `Calculated keyword overlap for ${results.competitors.length} competitors`,
      ],
      results: [
        ["Competitors analysed", String(results.competitors.length)],
        ["Highest overlap", topCompetitor ? `${topCompetitor.domain} (${topCompetitor.overlapScore}/100)` : "—"],
      ],
    },
    gaps: {
      actions: [
        `Compared ${results.keywords.length} keywords against ${results.competitors.length} competitors`,
        `Found ${results.gaps.length} keywords where competitors rank and you do not`,
        `Scored each gap by volume and difficulty`,
      ],
      results: [
        ["Keyword gaps", String(results.gaps.length)],
        ["Top opportunity", topGap ? `“${topGap.keyword}” (${topGap.opportunityScore}/100)` : "—"],
      ],
    },
  };

  const started = new Date(run.startedAt).getTime();
  const steps = run.steps.map((step, i): StepExecutionDetail => {
    const p = plan[step.key];
    const startedAt = new Date(started + i * STEP_MS).toISOString();
    const completedAt = new Date(started + (i + 1) * STEP_MS).toISOString();
    const base = { key: step.key, label: step.label, status: step.status };

    let built: Built;
    let timing: Partial<StepExecutionDetail> = {};
    if (step.status === "DONE") {
      built = {
        actions: p.actions.map((label) => ({ label, state: "done" as const })),
        results: p.results.map(([label, value]) => ({ label, value })),
      };
      timing = { startedAt, completedAt, durationMs: STEP_MS };
    } else if (step.status === "RUNNING") {
      // Only the first action is shown, as in progress; this keeps the output stable until the stage changes.
      built = { actions: [{ label: p.actions[0], state: "active" }], results: [] };
      timing = { startedAt };
    } else if (step.status === "FAILED") {
      built = { actions: [{ label: p.actions[0], state: "done" }], results: [] };
      timing = { startedAt };
    } else {
      built = { actions: [], results: [] };
    }
    return { ...base, ...built, ...timing };
  });

  return { runId: run.id, isMock: true, steps };
}
