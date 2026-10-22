import type { WeeklyMetrics } from "../types/models";

export type MetricKey = "organicClicks" | "impressions" | "avgPosition" | "top10Keywords" | "technicalIssues";
export type Direction = "improved" | "declined" | "flat";

export interface MetricDef {
  key: MetricKey;
  label: string;
  /** Where the real value will come from once the backend exists. */
  source: string;
  /** true when a LOWER number is the improvement (position, issue counts). */
  lowerIsBetter: boolean;
  decimals: number;
  value: (w: WeeklyMetrics) => number;
}

export const totalIssues = (w: WeeklyMetrics) =>
  w.technicalIssues.critical + w.technicalIssues.warning + w.technicalIssues.notice;

export const METRICS: MetricDef[] = [
  { key: "organicClicks", label: "Organic clicks", source: "Search Console", lowerIsBetter: false, decimals: 0, value: (w) => w.organicClicks },
  { key: "impressions", label: "Impressions", source: "Search Console", lowerIsBetter: false, decimals: 0, value: (w) => w.impressions },
  { key: "avgPosition", label: "Avg. position", source: "Search Console", lowerIsBetter: true, decimals: 1, value: (w) => w.avgPosition },
  { key: "top10Keywords", label: "Top-10 keywords", source: "SERP provider", lowerIsBetter: false, decimals: 0, value: (w) => w.top10Keywords },
  { key: "technicalIssues", label: "Technical issues", source: "Technical audit", lowerIsBetter: true, decimals: 0, value: totalIssues },
];

export interface Comparison {
  current: number;
  previous: number;
  delta: number;
  direction: Direction;
}

export function compare(def: MetricDef, latest: WeeklyMetrics, previous: WeeklyMetrics): Comparison {
  const current = def.value(latest);
  const prev = def.value(previous);
  const factor = 10 ** def.decimals;
  const delta = Math.round((current - prev) * factor) / factor;
  const direction: Direction = delta === 0 ? "flat" : (delta < 0) === def.lowerIsBetter ? "improved" : "declined";
  return { current, previous: prev, delta, direction };
}

export function formatWeek(weekStart: string): string {
  return new Date(`${weekStart}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatMetric(def: MetricDef, n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: def.decimals, maximumFractionDigits: def.decimals });
}
