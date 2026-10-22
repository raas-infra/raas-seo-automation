// Feature 1 — Weekly SEO performance comparison (deterministic mock data).
import { expect, test } from "./helpers";

const URL = "/projects/performance?id=p_demo_coffee";
const METRIC_KEYS = ["organicClicks", "impressions", "avgPosition", "top10Keywords", "technicalIssues"];

test("reachable from SEO Results and clearly labelled as mock data", async ({ page }) => {
  await page.goto("/projects/results?id=p_demo_coffee");
  await page.getByRole("link", { name: "Weekly performance" }).click();
  await expect(page).toHaveURL(/\/projects\/performance\?id=p_demo_coffee$/);

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Weekly Performance" })).toBeVisible();
  await expect(page.getByTestId("mock-banner")).toContainText("Mock / simulated data");
  await expect(main.getByRole("heading", { name: "Weekly trend (simulated)" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Week-by-week comparison (simulated)" })).toBeVisible();
  for (const key of METRIC_KEYS) await expect(page.getByTestId(`summary-${key}`)).toContainText("(simulated)");
  await expect(main.getByRole("link", { name: "Back to project" })).toBeVisible();
});

test("shows 8 calendar weeks: Mondays, 7 days apart, newest first, ending this week", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByTestId("week-row")).toHaveCount(8);
  const weeks = await page.getByTestId("week-row").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-week")!));
  expect(weeks).toHaveLength(8);
  const times = weeks.map((w) => new Date(`${w}T00:00:00Z`));
  for (const d of times) expect(d.getUTCDay()).toBe(1); // Monday
  for (let i = 1; i < times.length; i++) expect(times[i - 1].getTime() - times[i].getTime()).toBe(7 * 86_400_000);
  const now = Date.now();
  expect(times[0].getTime()).toBeLessThanOrEqual(now);
  expect(now - times[0].getTime()).toBeLessThan(7 * 86_400_000);
});

test("data is deterministic across reloads", async ({ page }) => {
  await page.goto(URL);
  const table = page.getByRole("table", { name: "Weekly comparison" });
  await expect(table.getByTestId("week-row")).toHaveCount(8);
  const first = await table.innerText();
  const cards = await page.getByTestId("summary-organicClicks").innerText();
  await page.reload();
  await expect(table.getByTestId("week-row")).toHaveCount(8);
  expect(await table.innerText()).toBe(first);
  expect(await page.getByTestId("summary-organicClicks").innerText()).toBe(cards);
});

test("summary deltas match the table, and lower position / fewer issues count as improvements", async ({ page }) => {
  await page.goto(URL);
  const rows = page.getByTestId("week-row");
  await expect(rows).toHaveCount(8);
  const cells = async (i: number) => (await rows.nth(i).locator("td").allInnerTexts()).map((t) => Number(t.replace(/[^\d.]/g, "") || NaN));
  // Cell 0 is the date; numbers follow: clicks, impressions, position, top10, critical, warning, notice.
  const latest = (await cells(0)).slice(1);
  const prev = (await cells(1)).slice(1);
  const dir = (key: string) => page.getByTestId(`summary-${key}`).getByTestId("delta-chip").getAttribute("data-direction");
  const expected = (delta: number, lowerIsBetter: boolean) => (delta === 0 ? "flat" : delta < 0 === lowerIsBetter ? "improved" : "declined");

  expect(await dir("organicClicks")).toBe(expected(latest[0] - prev[0], false));
  expect(await dir("impressions")).toBe(expected(latest[1] - prev[1], false));
  expect(await dir("avgPosition")).toBe(expected(Math.round((latest[2] - prev[2]) * 10) / 10, true));
  expect(await dir("top10Keywords")).toBe(expected(latest[3] - prev[3], false));
  const issues = (c: number[]) => c[4] + c[5] + c[6];
  expect(await dir("technicalIssues")).toBe(expected(issues(latest) - issues(prev), true));

  // Overall mock trend is positive: position number falls and issues fall from oldest to newest week.
  const oldest = (await cells(7)).slice(1);
  expect(latest[2]).toBeLessThan(oldest[2]);
  expect(issues(latest)).toBeLessThan(issues(oldest));
});

test("includes technical issue counts and documents future data sources", async ({ page }) => {
  await page.goto(URL);
  const table = page.getByRole("table", { name: "Weekly comparison" });
  for (const h of ["Critical", "Warning", "Notice"]) await expect(table.getByRole("columnheader", { name: h })).toBeVisible();
  await expect(table.getByText("Search Console").first()).toBeVisible();
  await expect(table.getByText("SERP provider")).toBeVisible();
  await expect(table.getByText("Technical audit")).toBeVisible();
  await page.getByRole("button", { name: "Avg. position" }).click();
  await expect(page.getByText(/Future source: Search Console/)).toBeVisible();
});

test("metric toggle switches the chart", async ({ page }) => {
  await page.goto(URL);
  const chart = page.getByTestId("weekly-chart");
  await expect(chart).toHaveAttribute("data-metric", "organicClicks");
  await expect(chart.getByTestId("chart-point")).toHaveCount(8);
  await page.getByRole("button", { name: "Technical issues" }).click();
  await expect(chart).toHaveAttribute("data-metric", "technicalIssues");
  await expect(chart).toHaveAttribute("aria-label", /Simulated weekly line chart of Technical issues/);
  await page.getByRole("button", { name: "Avg. position" }).click();
  await expect(page.getByText(/axis is inverted/)).toBeVisible();
});

test("unknown and missing project ids show clear errors", async ({ page }) => {
  await page.goto("/projects/performance?id=does-not-exist");
  await expect(page.getByRole("alert")).toHaveText(/Project "does-not-exist" not found\./);
  await page.goto("/projects/performance");
  await expect(page.getByRole("alert")).toContainText("No project selected.");
});

test("performance data is derived, not persisted in mock storage", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByTestId("week-row")).toHaveCount(8);
  const stored = await page.evaluate(() => localStorage.getItem("seo-mock:v1") ?? "");
  expect(stored).not.toContain("weekStart");
});
