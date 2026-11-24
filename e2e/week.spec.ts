import { expect, test } from "@playwright/test";

// Regression: the week lookup used to take the whole app down while a date
// was still being typed. 31/12/2026 passes through 31/12/202, which briefly
// read as the year 202, and the week maths threw during render and replaced
// the page with Next's "Application error" screen. Typing one key at a time
// is what reproduces the intermediate state; a single paste never does.
test("typing a full date on the Week tab keeps the readout alive", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/week");

  const date = page.locator("#wl-date-display");
  await expect(date).toBeVisible();
  await date.pressSequentially("31/12/2026", { delay: 40 });
  // The crash left a blank "Application error" page, so check for it first:
  // that failure reads better than a missing input further down.
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(date).toHaveValue("31/12/2026");

  // The final week of 2026: calendar week 53, unnumbered on the calendar.
  await expect(page.getByText("Week 53 of 53")).toBeVisible();
  await expect(page.getByText("Final week (unnumbered)")).toBeVisible();
  await expect(page.getByText("28 December 2026 – 31 December 2026")).toBeVisible();

  expect(pageErrors).toEqual([]);
});
