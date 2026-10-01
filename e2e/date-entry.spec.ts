import { expect, test } from "@playwright/test";

// Date entry is day-first everywhere: typed text auto-slashes and commits
// when it forms a real calendar date, whatever the OS locale prefers.
test("calculator dates are entered day-first", async ({ page }) => {
  await page.goto("/");

  const start = page.locator("#calc-start-display");
  const end = page.locator("#calc-end-display");
  await expect(start).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);
  await expect(end).toHaveAttribute("placeholder", "dd/mm/yyyy");

  // Type an end date; slashes insert themselves and the result appears.
  await end.fill("31/12/2026");
  await expect(end).toHaveValue("31/12/2026");
  await expect(page.getByText("31 December 2026")).toBeVisible();
  await expect(page.getByText("Total days, + End date")).toBeVisible();
});
