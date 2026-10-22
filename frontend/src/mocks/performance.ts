// Deterministic, SIMULATED weekly SEO performance. Nothing here comes from a real source.
//
// Future data source per metric (when the Python backend exists):
//   organicClicks    -> Google Search Console API (searchanalytics.query, clicks)
//   impressions      -> Google Search Console API (searchanalytics.query, impressions)
//   avgPosition      -> Google Search Console API (position). LOWER IS BETTER.
//   top10Keywords    -> SERP provider (rank tracking: tracked keywords ranking in positions 1-10)
//   technicalIssues  -> Technical audit / site crawler (critical, warning, notice counts)
import type { Project, WeeklyMetrics, WeeklyPerformance } from "../types/models";
import { rng } from "./results";

export const WEEK_COUNT = 8;

/** Monday (UTC) of the calendar week containing `date`, as YYYY-MM-DD. */
export function weekStartOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Eight consecutive calendar weeks ending with the current week. Values depend only on the
 * project id and the week-start date, so a given project/week always shows the same numbers.
 */
export function generateWeeklyPerformance(project: Project, now: Date = new Date()): WeeklyPerformance {
  const currentWeek = weekStartOf(now);
  const weeks: WeeklyMetrics[] = [];
  for (let i = 0; i < WEEK_COUNT; i++) {
    const weekStart = addDays(currentWeek, -7 * (WEEK_COUNT - 1 - i));
    const rand = rng(`${project.id}|${weekStart}`);
    const jitter = (spread: number) => (rand() - 0.5) * 2 * spread;
    const progress = i / (WEEK_COUNT - 1); // 0 = oldest week, 1 = current week
    weeks.push({
      weekStart,
      organicClicks: Math.round(420 * (1 + progress * 0.6) * (1 + jitter(0.06))),
      impressions: Math.round(14_500 * (1 + progress * 0.45) * (1 + jitter(0.05))),
      avgPosition: Math.round((24 - progress * 7 + jitter(0.8)) * 10) / 10,
      top10Keywords: Math.round(9 + progress * 8 + jitter(1)),
      technicalIssues: {
        critical: Math.max(0, Math.round(6 - progress * 4 + jitter(0.7))),
        warning: Math.max(0, Math.round(21 - progress * 9 + jitter(1.5))),
        notice: Math.max(0, Math.round(38 - progress * 10 + jitter(2))),
      },
    });
  }
  return { projectId: project.id, isMock: true, weeks };
}
