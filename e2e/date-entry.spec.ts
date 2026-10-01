import { expect, test } from "@playwright/test";

// Date entry is day-first everywhere: typed text auto-slashes and commits
// when it forms a real calendar date, whatever the OS locale prefers.
test("calculator dates are entered day-first", async ({ page }) => {
  await page.goto("/");

  const start = page.locator("#calc-start-display");
  const end = page.locator("#calc-end-display");
  // Both fields start empty so the day-first placeholder shows.
  await expect(start).toHaveAttribute("placeholder", "dd/mm/yyyy");
  await expect(end).toHaveAttribute("placeholder", "dd/mm/yyyy");

  // Type start then end; slashes insert themselves and the result appears.
  await start.fill("01/10/2026");
  await expect(start).toHaveValue("01/10/2026");
  await end.fill("31/12/2026");
  await expect(end).toHaveValue("31/12/2026");
  await expect(page.getByText("31 December 2026")).toBeVisible();
  await expect(page.getByText("Total days, + End date")).toBeVisible();
});
