import { test as base, expect, type Page } from "@playwright/test";

export const STORAGE_KEY = "seo-mock:v1";

/** Fails any test that logs a console error or throws an uncaught page error (incl. React/MUI/hydration). */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
      });
      await use();
      expect(problems, "browser console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toBeHidden();
}

export interface ProjectFields {
  websiteUrl: string;
  country: string;
  language: string;
  description: string;
  seedKeywords?: string;
  competitors?: string;
  searchEngine?: string;
}

export async function fillProjectForm(page: Page, f: ProjectFields) {
  await page.getByLabel("Website URL").fill(f.websiteUrl);
  await selectOption(page, "Target Country", f.country);
  await selectOption(page, "Target Language", f.language);
  await page.getByLabel("Business Description").fill(f.description);
  if (f.seedKeywords) await page.getByLabel("Seed Keywords").fill(f.seedKeywords);
  if (f.competitors) await page.getByLabel("Known Competitors").fill(f.competitors);
  if (f.searchEngine) await selectOption(page, "Target Search Engine", f.searchEngine);
}

/** Reads the mock database the app keeps in localStorage. */
export async function readMockState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), STORAGE_KEY);
}

/** Current research progress shown on the Run page, e.g. 42. */
export async function readProgress(page: Page): Promise<number> {
  const text = await page.getByRole("main").getByText(/^\d+%$/).textContent();
  return Number(text?.replace("%", ""));
}

export const statusChip = (page: Page, status: string) =>
  page.getByRole("main").getByText(status, { exact: true }).first();
