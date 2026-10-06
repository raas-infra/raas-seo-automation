// Test 3 — Create Project validation, including invalid website URLs.
import { expect, fillProjectForm, readMockState, test } from "./helpers";
import type { Page } from "@playwright/test";

const VALID = {
  websiteUrl: "example-shop.com",
  country: "United States",
  language: "English",
  description: "Online shop selling handmade leather wallets and bags.",
};

const submit = (page: Page) => page.getByRole("button", { name: "Create Project" }).click();
const urlError = (page: Page) => page.locator("#field-websiteUrl-helper-text");

test.beforeEach(async ({ page }) => {
  await page.goto("/projects/new");
});

test("empty form shows all required-field errors and focuses Website URL", async ({ page }) => {
  await submit(page);
  await expect(page.getByText("Website URL is required.")).toBeVisible();
  await expect(page.getByText("Select a target country.")).toBeVisible();
  await expect(page.getByText("Select a target language.")).toBeVisible();
  await expect(page.getByText("Business description is required.")).toBeVisible();
  await expect(page.getByLabel("Website URL")).toBeFocused();
  await expect(page).toHaveURL(/\/projects\/new$/);
});

test("only the missing required fields are flagged", async ({ page }) => {
  await page.getByLabel("Website URL").fill(VALID.websiteUrl);
  await page.getByLabel("Business Description").fill(VALID.description);
  await submit(page);
  await expect(page.getByText("Select a target country.")).toBeVisible();
  await expect(page.getByText("Select a target language.")).toBeVisible();
  await expect(page.getByText("Website URL is required.")).toBeHidden();
  await expect(page.getByText("Business description is required.")).toBeHidden();
});

for (const badUrl of ["not a url", "localhost", "ftp://x.com", "http://", "example"]) {
  test(`rejects invalid website URL: "${badUrl}"`, async ({ page }) => {
    await fillProjectForm(page, { ...VALID, websiteUrl: badUrl });
    await submit(page);
    await expect(urlError(page)).toHaveText("Enter a valid URL, e.g. https://example.com");
    await expect(page).toHaveURL(/\/projects\/new$/);
  });
}

// Known bug #1 from the QA report: hostnames with spaces / empty labels are accepted.
// Remove `test.fail` once validation is fixed — Playwright will flag it when it starts passing.
for (const badUrl of ["https://exa mple.com", "a..b.com"]) {
  test(`rejects malformed hostname: "${badUrl}"`, async ({ page }) => {
    test.fail(true, "Known bug #1: URL validation accepts malformed hostnames");
    await fillProjectForm(page, { ...VALID, websiteUrl: badUrl });
    await submit(page);
    await expect(urlError(page)).toHaveText("Enter a valid URL, e.g. https://example.com", { timeout: 2_000 });
  });
}

test("rejects a too-short or blank business description", async ({ page }) => {
  await fillProjectForm(page, { ...VALID, description: "Shop" });
  await submit(page);
  await expect(page.getByText("Add a bit more detail (at least 20 characters).")).toBeVisible();

  await page.getByLabel("Business Description").fill("                         ");
  await expect(page.getByText("Business description is required.")).toBeVisible();
});

test("rejects an invalid competitor entry", async ({ page }) => {
  await fillProjectForm(page, { ...VALID, competitors: "good-rival.com, not valid" });
  await submit(page);
  await expect(page.getByText('"not valid" is not a valid domain or URL.')).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/new$/);
});

test("valid required fields only creates a project with defaults", async ({ page }) => {
  await fillProjectForm(page, VALID);
  await submit(page);
  await expect(page).toHaveURL(/\/projects\/view\?id=p_/);
  const id = new URL(page.url()).searchParams.get("id");
  const project = (await readMockState(page)).projects.find((p: { id: string }) => p.id === id);
  expect(project).toMatchObject({
    websiteUrl: "https://example-shop.com",
    targetCountry: "US",
    targetLanguage: "en",
    seedKeywords: [],
    knownCompetitors: [],
    targetSearchEngine: "google",
    status: "DRAFT",
  });
});
