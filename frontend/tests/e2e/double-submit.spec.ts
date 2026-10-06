// Test 6 — rapid repeated clicks must not create duplicate runs or projects.
import type { Page } from "@playwright/test";
import { expect, fillProjectForm, readMockState, test } from "./helpers";

/** Three clicks in the same JS task — faster than any human, the worst case for double-submits. */
const clickThreeTimesInstantly = (el: HTMLButtonElement) => {
  el.click();
  el.click();
  el.click();
};

async function fillValidProject(page: Page, websiteUrl: string) {
  await page.goto("/projects/new");
  await fillProjectForm(page, {
    websiteUrl,
    country: "Canada",
    language: "English",
    description: "Bike repair shop in Toronto offering tune-ups and e-bike servicing.",
  });
}

async function countProjects(page: Page, urlPart: string) {
  await expect(page).toHaveURL(/\/projects\/view\?id=p_/);
  // The mock saves synchronously on each createProject call, so any duplicate is already stored.
  const projects = (await readMockState(page)).projects as { websiteUrl: string }[];
  return projects.filter((p) => p.websiteUrl.includes(urlPart)).length;
}

test("clicking Start Research three times instantly creates only one run", async ({ page }) => {
  await page.goto("/projects/view?id=p_demo_dental");
  const button = page.getByRole("main").getByRole("button", { name: "Start Research" });
  await expect(button).toBeEnabled();
  await button.evaluate(clickThreeTimesInstantly);

  await expect(page).toHaveURL("/projects/run?id=p_demo_dental");
  const runs = (await readMockState(page)).runs.filter((r: { projectId: string }) => r.projectId === "p_demo_dental");
  expect(runs).toHaveLength(1);
});

test("a fast real-mouse triple-click on Create Project creates only one project", async ({ page }) => {
  await fillValidProject(page, "triple-click-example.com");
  await page.getByRole("button", { name: "Create Project" }).click({ clickCount: 3, delay: 0 });
  expect(await countProjects(page, "triple-click-example")).toBe(1);
});

// Known bug #7: clicks dispatched in the same task all run handleSubmit before React disables
// the button, creating duplicates. Remove `test.fail` once submit is guarded (e.g. a ref flag).
test("three instant clicks on Create Project create only one project", async ({ page }) => {
  test.fail(true, "Known bug #7: Create Project has no re-entrancy guard");
  await fillValidProject(page, "instant-click-example.com");
  await page.getByRole("button", { name: "Create Project" }).evaluate(clickThreeTimesInstantly);
  expect(await countProjects(page, "instant-click-example")).toBe(1);
});
