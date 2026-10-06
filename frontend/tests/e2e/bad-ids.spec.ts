// Test 7 — unknown, missing and malicious ?id= values show a clear message and never crash.
import { expect, test } from "./helpers";

const PAGES = ["/projects/view", "/projects/run", "/projects/results"];

for (const path of PAGES) {
  test(`${path} with an unknown project id shows "not found"`, async ({ page }) => {
    await page.goto(`${path}?id=does-not-exist`);
    await expect(page.getByRole("alert")).toHaveText(/Project "does-not-exist" not found\./);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible(); // shell still usable
  });

  test(`${path} with a missing or empty id shows "No project selected"`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("alert")).toContainText("No project selected.");
    await page.goto(`${path}?id=`);
    await expect(page.getByRole("alert")).toContainText("No project selected.");
    await page.getByRole("alert").getByRole("link", { name: "Back to projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
}

test("run and results pages explain when research has not been started", async ({ page }) => {
  await page.goto("/projects/run?id=p_demo_dental");
  await expect(page.getByRole("alert")).toContainText("Research has not been started for this project yet.");
  await page.goto("/projects/results?id=p_demo_dental");
  await expect(page.getByRole("alert")).toContainText("No completed research run yet for this project.");
});

test("HTML in the id parameter is shown as text, never executed", async ({ page }) => {
  let dialogOpened = false;
  page.on("dialog", async (dialog) => {
    dialogOpened = true;
    await dialog.dismiss();
  });
  const payload = '<img src=x onerror="alert(1)">';
  await page.goto(`/projects/view?id=${encodeURIComponent(payload)}`);
  await expect(page.getByRole("alert")).toContainText(`Project "${payload}" not found.`);
  await expect(page.getByRole("main").locator("img")).toHaveCount(0);
  expect(dialogOpened).toBe(false);
});

// Known bug #3 from the QA report: "Back to project" points at the same unknown id.
// Remove `test.fail` once fixed — Playwright will flag it when it starts passing.
for (const path of ["/projects/run", "/projects/results"]) {
  test(`${path} with an unknown id links back to the projects list`, async ({ page }) => {
    test.fail(true, "Known bug #3: error link points to the unknown project");
    await page.goto(`${path}?id=does-not-exist`);
    await expect(page.getByRole("alert").getByRole("link")).toHaveAttribute("href", "/projects", { timeout: 2_000 });
  });
}
