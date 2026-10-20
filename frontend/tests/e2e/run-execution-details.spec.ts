// Feature 2 — expandable (simulated) execution details for each research stage on the Research Run page.
import { expect, STORAGE_KEY, statusChip, test } from "./helpers";
import type { Locator, Page } from "@playwright/test";

const COMPLETED_PROJECT = "p_demo_coffee"; // seeded, run already COMPLETED
const DRAFT_PROJECT = "p_demo_dental"; // seeded DRAFT, research can be started

const STAGES = [
  { key: "crawl", name: "Crawl website" },
  { key: "serp", name: "Collect search results" },
  { key: "competitors", name: "Analyse competitors" },
  { key: "gaps", name: "Find keyword gaps" },
] as const;

const header = (page: Page, name: string) => page.getByRole("main").getByRole("button", { name: new RegExp(name) });
const panel = (page: Page, key: string) => page.getByTestId(`step-details-${key}`);
const result = (page: Page, key: string, label: string) =>
  panel(page, key).locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]");

async function open(page: Page, stage: (typeof STAGES)[number]) {
  const h = header(page, stage.name);
  if ((await h.getAttribute("aria-expanded")) !== "true") await h.click();
  await expect(h).toHaveAttribute("aria-expanded", "true");
}

test("completed run: four stages, collapsed by default, labelled as simulated", async ({ page }) => {
  await page.goto(`/projects/run?id=${COMPLETED_PROJECT}`);
  await expect(statusChip(page, "COMPLETED")).toBeVisible();
  await expect(page.getByRole("main").getByText("Simulated execution details")).toBeVisible();

  for (const stage of STAGES) {
    await expect(header(page, stage.name)).toHaveAttribute("aria-expanded", "false");
    await expect(panel(page, stage.key).getByText("Done", { exact: true })).toBeVisible();
  }
  await expect(page.getByText("Actions performed")).toHaveCount(0);

  // Existing page content is untouched.
  await expect(page.getByRole("main").getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "View SEO Results" })).toHaveCount(1);
});

test("expand and collapse shows actions, results and timing; several can be open", async ({ page }) => {
  await page.goto(`/projects/run?id=${COMPLETED_PROJECT}`);
  await expect(statusChip(page, "COMPLETED")).toBeVisible();

  await open(page, STAGES[0]);
  const crawl = panel(page, "crawl");
  await expect(crawl.getByText("Actions performed")).toBeVisible();
  await expect(crawl.getByText(/Fetched sitemap and robots\.txt for greenleafroasters\.com/)).toBeVisible();
  await expect(crawl.getByText("Results", { exact: true })).toBeVisible();
  await expect(result(page, "crawl", "Pages crawled")).toHaveText(/^\d+$/);
  await expect(crawl.getByText("Timing")).toBeVisible();
  await expect(crawl.getByText(/Started .* · Finished .* · 3s/)).toBeVisible();

  await open(page, STAGES[1]);
  await expect(panel(page, "serp").getByText(/Queried Google \(US\/en\) for \d+ search terms/)).toBeVisible();
  await expect(header(page, STAGES[0].name)).toHaveAttribute("aria-expanded", "true"); // first stays open

  await header(page, STAGES[0].name).click();
  await expect(header(page, STAGES[0].name)).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(/Fetched sitemap/)).toHaveCount(0);
  await expect(header(page, STAGES[1].name)).toHaveAttribute("aria-expanded", "true");
});

test("stage headers work with the keyboard", async ({ page }) => {
  await page.goto(`/projects/run?id=${COMPLETED_PROJECT}`);
  await expect(statusChip(page, "COMPLETED")).toBeVisible();
  const h = header(page, STAGES[2].name);
  await h.focus();
  await page.keyboard.press("Enter");
  await expect(h).toHaveAttribute("aria-expanded", "true");
  await expect(result(page, "competitors", "Competitors analysed")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(h).toHaveAttribute("aria-expanded", "false");
});

test("detail numbers match the SEO Results page", async ({ page }) => {
  await page.goto(`/projects/run?id=${COMPLETED_PROJECT}`);
  await expect(statusChip(page, "COMPLETED")).toBeVisible();
  for (const stage of STAGES) await open(page, stage);

  const keywords = await result(page, "serp", "Keywords found").innerText();
  const competitors = await result(page, "competitors", "Competitors analysed").innerText();
  const gaps = await result(page, "gaps", "Keyword gaps").innerText();
  const topGap = await result(page, "gaps", "Top opportunity").innerText();
  const topCompetitor = (await result(page, "competitors", "Highest overlap").innerText()).split(" (")[0];

  await page.getByRole("main").getByRole("link", { name: "View SEO Results" }).click();
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "SEO Results" })).toBeVisible();
  await expect(main.getByText("Keywords found", { exact: true }).locator("xpath=following-sibling::*[1]")).toHaveText(keywords);
  await expect(main.getByRole("tab", { name: `Competitors (${competitors})` })).toBeVisible();
  await expect(main.getByRole("tab", { name: `Keyword Gaps (${gaps})` })).toBeVisible();
  await expect(main.getByText(new RegExp(`top opportunity: ${topGap.split(" (")[0]}`))).toBeVisible();
  await expect(main.getByText(new RegExp(`${topCompetitor.replace(/\./g, "\\.")} has the highest overlap`))).toBeVisible();
});

test("details are deterministic across reloads", async ({ page }) => {
  const readAll = async () => {
    await expect(statusChip(page, "COMPLETED")).toBeVisible();
    for (const stage of STAGES) await open(page, stage);
    return page.getByRole("main").getByRole("list").first().innerText();
  };
  await page.goto(`/projects/run?id=${COMPLETED_PROJECT}`);
  const first = await readAll();
  await page.reload();
  expect(await readAll()).toBe(first);
});

// The simulated run is driven by Date.now(), so this test uses Playwright's fake clock and steps
// through the stages itself. That makes every "still RUNNING" / "not finished yet" check exact,
// however slow or loaded the machine is. (The fake clock restarts on navigation, so instead of
// clicking Start Research we seed a RUNNING run that begins at a known fake time.)
test("live run: details refresh on every stage change and open panels stay open", async ({ page }) => {
  const T0 = Date.parse("2026-06-01T10:00:00Z");
  const startedAt = T0 + 20_000; // in the future when the page loads; we jump the clock to it below
  await page.clock.install({ time: new Date(T0) });
  await page.goto("/");
  await expect(page.getByRole("main")).toContainText("greenleafroasters.com"); // mock data has been seeded
  await page.evaluate(
    ({ key, projectId, startedAt }) => {
      const state = JSON.parse(localStorage.getItem(key)!);
      const runId = "r_live_details";
      state.runs.push({
        id: runId,
        projectId,
        status: "RUNNING",
        progress: 0,
        startedAt: new Date(startedAt).toISOString(),
        steps: [
          { key: "crawl", label: "Crawl website", status: "RUNNING" },
          { key: "serp", label: "Collect search results", status: "PENDING" },
          { key: "competitors", label: "Analyse competitors", status: "PENDING" },
          { key: "gaps", label: "Find keyword gaps", status: "PENDING" },
        ],
      });
      const project = state.projects.find((p: { id: string }) => p.id === projectId);
      Object.assign(project, { status: "RUNNING", latestRunId: runId });
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, projectId: DRAFT_PROJECT, startedAt },
  );
  await page.goto(`/projects/run?id=${DRAFT_PROJECT}`);
  await expect(statusChip(page, "RUNNING")).toBeVisible(); // page has loaded (run still "in the future")
  await page.clock.pauseAt(new Date(startedAt)); // run is now exactly 0s old, and time only moves when we say so

  /**
   * Moves the fake clock forward in small steps until the UI shows the expected state (no fixed
   * offsets: polling and refetch lag does not matter). Steps are far smaller than a 3s stage, so the
   * "not finished yet" checks right after each wait cannot be overshot.
   */
  const stepUntil = async (what: string, shown: Locator) => {
    for (let i = 0; i < 120; i++) {
      if ((await shown.count()) > 0) return;
      await page.clock.runFor(250);
    }
    throw new Error(`Gave up stepping the clock until: ${what}`);
  };

  // Stage 1 running: open stages 1–3; stage 4 is never opened.
  await open(page, STAGES[0]);
  await open(page, STAGES[1]);
  await open(page, STAGES[2]);
  await stepUntil("stage 1 shows in-progress details", panel(page, "crawl").getByText(/\(in progress\)/));
  await expect(panel(page, "serp").getByText("Not started yet.")).toBeVisible();
  await expect(panel(page, "competitors").getByText("Not started yet.")).toBeVisible();
  await expect(header(page, STAGES[3].name)).toHaveAttribute("aria-expanded", "false");

  // Stage 1 finishes while the run is still RUNNING: its open panel refreshes to final results.
  await stepUntil("stage 1 results appear", result(page, "crawl", "Pages crawled"));
  await expect(panel(page, "crawl").getByText("Done", { exact: true })).toBeVisible();
  await expect(panel(page, "crawl").getByText(/\(in progress\)/)).toHaveCount(0);
  await expect(statusChip(page, "RUNNING")).toBeVisible();
  await expect(result(page, "serp", "Keywords found")).toHaveCount(0); // stage 2 has not finished
  await expect(header(page, STAGES[0].name)).toHaveAttribute("aria-expanded", "true");

  // Stage 2 finishes, still RUNNING; stage 3 is now in progress.
  await stepUntil("stage 2 results appear", result(page, "serp", "Keywords found"));
  await expect(statusChip(page, "RUNNING")).toBeVisible();
  await expect(result(page, "competitors", "Competitors analysed")).toHaveCount(0); // stage 3 has not finished
  await expect(panel(page, "competitors").getByText("Not started yet.")).toHaveCount(0);
  await stepUntil("stage 3 shows in-progress details", panel(page, "competitors").getByText(/\(in progress\)/));
  await expect(statusChip(page, "RUNNING")).toBeVisible();

  // Panels opened by the user stayed open through every refresh; the never-opened one stayed closed.
  for (const stage of STAGES.slice(0, 3)) await expect(header(page, stage.name)).toHaveAttribute("aria-expanded", "true");
  await expect(header(page, STAGES[3].name)).toHaveAttribute("aria-expanded", "false");

  // Stage 3 finishes (still RUNNING), then the whole run completes.
  await stepUntil("stage 3 results appear", result(page, "competitors", "Competitors analysed"));
  await expect(statusChip(page, "RUNNING")).toBeVisible();
  await stepUntil("run completes", page.getByRole("main").getByText("COMPLETED", { exact: true }));
  await open(page, STAGES[3]);
  await stepUntil("stage 4 results appear", result(page, "gaps", "Keyword gaps"));
  for (const stage of STAGES) await expect(panel(page, stage.key).getByText("Done", { exact: true })).toBeVisible();
  for (const stage of STAGES) await expect(header(page, stage.name)).toHaveAttribute("aria-expanded", "true");
});
