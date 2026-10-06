// Generates believable, deterministic mock SEO results from a project's inputs.
// Placeholder only: the real keyword/competitor/gap engine lives in the Python backend later.
import type {
  CompetitorResult,
  KeywordGap,
  KeywordResult,
  Project,
  SearchIntent,
  SeoResults,
} from "../types/models";
import { domainOf } from "../lib/format";

const STOPWORDS = new Set(
  "about after also and are based business company from have help into more offer offers our over provide provides that their them they this through using we with your".split(" "),
);

const MODIFIERS: { pattern: (t: string) => string; intent: SearchIntent }[] = [
  { pattern: (t) => t, intent: "commercial" },
  { pattern: (t) => `best ${t}`, intent: "commercial" },
  { pattern: (t) => `${t} near me`, intent: "transactional" },
  { pattern: (t) => `${t} price`, intent: "transactional" },
  { pattern: (t) => `${t} cost`, intent: "transactional" },
  { pattern: (t) => `${t} reviews`, intent: "commercial" },
  { pattern: (t) => `top rated ${t}`, intent: "commercial" },
  { pattern: (t) => `${t} guide`, intent: "informational" },
  { pattern: (t) => `${t} benefits`, intent: "informational" },
];

/** Small seeded PRNG (mulberry32) so the same project always gets the same results. */
function rng(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baseTerms(project: Project): string[] {
  if (project.seedKeywords?.length) return project.seedKeywords.slice(0, 4);
  const words = project.businessDescription
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 3);
}

function niceVolume(n: number): number {
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 100) * 100;
}

export function generateResults(project: Project, runId: string, generatedAt: string): SeoResults {
  const rand = rng(project.id + runId);
  const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

  const terms = baseTerms(project);
  const keywords: KeywordResult[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    for (const mod of MODIFIERS) {
      if (rand() < 0.35 && mod.pattern(term) !== term) continue;
      const keyword = mod.pattern(term);
      if (seen.has(keyword)) continue;
      seen.add(keyword);
      keywords.push({
        keyword,
        searchVolume: niceVolume(Math.exp(4.5 + rand() * 4.8)),
        difficulty: int(8, 82),
        intent: mod.intent,
        currentRank: rand() < 0.4 ? int(3, 58) : undefined,
      });
    }
  }
  keywords.sort((a, b) => b.searchVolume - a.searchVolume);

  const stem = (terms[0] ?? domainOf(project.websiteUrl).split(".")[0]).split(" ")[0];
  const fallbackDomains = [`${stem}hub.com`, `the${stem}co.com`, `${stem}direct.com`, `${stem}guide.org`, `get${stem}.com`];
  const domains = [...new Set([...(project.knownCompetitors ?? []).map(domainOf), ...fallbackDomains])].slice(0, 5);
  const competitors: CompetitorResult[] = domains
    .map((domain) => ({
      domain,
      overlapScore: int(18, 74),
      sharedKeywords: int(3, Math.max(4, keywords.length)),
    }))
    .sort((a, b) => b.overlapScore - a.overlapScore);

  const gaps: KeywordGap[] = keywords
    .filter((k) => k.currentRank === undefined)
    .map((k) => ({
      keyword: k.keyword,
      searchVolume: k.searchVolume,
      competitorsRanking: domains.filter(() => rand() < 0.5).slice(0, 3),
      opportunityScore: Math.min(98, Math.round((100 - k.difficulty) * 0.45 + Math.log10(k.searchVolume) * 13)),
    }))
    .map((g) => (g.competitorsRanking.length ? g : { ...g, competitorsRanking: [domains[0]] }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10);

  const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
  const summary =
    `Found ${keywords.length} relevant keywords (≈${totalVolume.toLocaleString()} monthly searches) for ` +
    `${domainOf(project.websiteUrl)}. ${gaps.length} keyword gaps where competitors rank but you don't; ` +
    `top opportunity: “${gaps[0]?.keyword ?? "n/a"}”. ${competitors[0]?.domain ?? "—"} has the highest overlap.`;

  return { runId, projectId: project.id, generatedAt, keywords, competitors, gaps, summary };
}
