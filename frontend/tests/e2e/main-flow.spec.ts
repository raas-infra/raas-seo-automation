// Test 2 — full user flow through the real UI:
// Dashboard → Create Project → Project Details → Start Research → RUNNING → COMPLETED → SEO Results.
import { expect, fillProjectForm, readMockState, statusChip, test } from "./helpers";

test("create a project, run research and view its SEO results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Create Project" }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);

  await fillProjectForm(page, {
    websiteUrl: "swiftdrivedubai.ae",
    country: "United Arab Emirates",
    language: "English",
    description: "Car rental company in Dubai offering daily and monthly rentals of economy, SUV and luxury cars.",
    seedKeywords: "car rental dubai, monthly car rental dubai\nluxury car rental",
    competitors: "https://www.rentacardubai-example.com, quickwheels-example.ae",
    searchEngine: "Bing",
  });
  await page.getByRole("button", { name: "Create Project" }).click();

  // Project Details shows exactly what was entered (normalised).
  await expect(page).toHaveURL(/\/projects\/view\?id=p_/);
  const projectId = new URL(page.url()).searchParams.get("id")!;
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText("swiftdrivedubai.ae");
  await expect(statusChip(page, "DRAFT")).toBeVisible();
  for (const text of [
    "https://swiftdrivedubai.ae",
    "United Arab Emirates",
    "English",
    "Bing",
    "car rental dubai",
    "monthly car rental dubai",
    "luxury car rental",
    "rentacardubai-example.com",
    "quickwheels-example.ae",
  ]) {
    await expect(main.getByText(text, { exact: true })).toBeVisible();
  }

  const stored = (await readMockState(page)).projects.find((p: { id: string }) => p.id === projectId);
  expect(stored).toMatchObject({
    websiteUrl: "https://swiftdrivedubai.ae",
    targetCountry: "AE",
    targetLanguage: "en",
    targetSearchEngine: "bing",
    seedKeywords: ["car rental dubai", "monthly car rental dubai", "luxury car rental"],
    knownCompetitors: ["rentacardubai-example.com", "quickwheels-example.ae"],
    status: "DRAFT",
  });

  // Start research → RUNNING → COMPLETED.
  await main.getByRole("button", { name: "Start Research" }).click();
  await expect(page).toHaveURL(`/projects/run?id=${projectId}`);
  await expect(statusChip(page, "RUNNING")).toBeVisible();
  await expect(statusChip(page, "COMPLETED")).toBeVisible({ timeout: 25_000 });
  await expect(main.getByText("100%", { exact: true })).toBeVisible();

  // SEO Results belong to this project.
  await main.getByRole("link", { name: "View SEO Results" }).click();
  await expect(page).toHaveURL(`/projects/results?id=${projectId}`);
  await expect(main.getByRole("heading", { level: 1, name: "SEO Results" })).toBeVisible();
  await expect(main.getByText(/swiftdrivedubai\.ae · generated/)).toBeVisible();
  await expect(main.getByText(/Found \d+ relevant keywords .* for swiftdrivedubai\.ae/)).toBeVisible();
  await expect(main.getByRole("cell", { name: /car rental/ }).first()).toBeVisible();

  await main.getByRole("tab", { name: /Competitors/ }).click();
  await expect(main.getByRole("cell", { name: "rentacardubai-example.com" })).toBeVisible();
  await expect(main.getByRole("cell", { name: "quickwheels-example.ae" })).toBeVisible();

  await main.getByRole("tab", { name: /Keyword Gaps/ }).click();
  await expect(main.getByRole("row")).not.toHaveCount(1); // header + at least one gap

  // Project now shows as COMPLETED in the list.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" }).click();
  const row = page.getByRole("row").filter({ hasText: "swiftdrivedubai.ae" });
  await expect(row.getByText("COMPLETED", { exact: true })).toBeVisible();
});
