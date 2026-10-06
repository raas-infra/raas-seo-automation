// Test 1 — refreshing during a RUNNING research run must not restart, duplicate or corrupt it.
import { expect, readMockState, readProgress, statusChip, test } from "./helpers";

const PROJECT_ID = "p_demo_dental"; // seeded DRAFT project

test("research run survives a page reload while RUNNING", async ({ page }) => {
  await page.goto(`/projects/view?id=${PROJECT_ID}`);
  await page.getByRole("main").getByRole("button", { name: "Start Research" }).click();
  await expect(page).toHaveURL(`/projects/run?id=${PROJECT_ID}`);
  await expect(statusChip(page, "RUNNING")).toBeVisible();

  // Let it make some progress, then reload mid-run.
  await expect.poll(() => readProgress(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(15);
  const beforeReload = await readProgress(page);
  expect(beforeReload).toBeLessThan(100);
  await page.reload();

  await expect(statusChip(page, "RUNNING")).toBeVisible();
  expect(await readProgress(page)).toBeGreaterThanOrEqual(beforeReload); // continued, not reset to 0

  await expect(statusChip(page, "COMPLETED")).toBeVisible({ timeout: 25_000 });

  // Exactly one run and one result set, all consistent.
  const state = await readMockState(page);
  const runs = state.runs.filter((r: { projectId: string }) => r.projectId === PROJECT_ID);
  expect(runs).toHaveLength(1);
  expect(runs[0]).toMatchObject({ status: "COMPLETED", progress: 100 });
  expect(state.results.filter((r: { runId: string }) => r.runId === runs[0].id)).toHaveLength(1);
  expect(state.projects.find((p: { id: string }) => p.id === PROJECT_ID)).toMatchObject({
    status: "COMPLETED",
    latestRunId: runs[0].id,
  });

  // Reloading after completion keeps it completed.
  await page.reload();
  await expect(statusChip(page, "COMPLETED")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "View SEO Results" })).toBeVisible();
});
