import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Smoke: upload fixture CSVs the way a user does, run the call-over, and
// assert the results the app must show. The toggle interaction uses real
// mouse clicks on stable DOM, so a regression that re-renders the tree per
// second and eats taps fails here.

// Playwright runs from the project root, so fixtures resolve from cwd.
const FIXTURES = path.join(process.cwd(), "e2e", "fixtures");

function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

function csv(name: string): { name: string; mimeType: string; buffer: Buffer } {
  return { name, mimeType: "text/csv", buffer: readFileSync(fixture(name)) };
}

// Upload through the two real file inputs (first statement, then payments).
// Each change event replaces that zone's files, which mirrors the app.
async function upload(page: Page, statements: string[], payments: string[]) {
  const inputs = page.locator('input[type="file"]');
  await expect(inputs).toHaveCount(2);

  await inputs.nth(0).setInputFiles(statements.map(csv));
  await expect(page.getByText(/statement lines from \d+ files?/)).toBeVisible({ timeout: 15_000 });

  await inputs.nth(1).setInputFiles(payments.map(csv));
  await expect(page.getByText(/payments from \d+ files?/)).toBeVisible({ timeout: 15_000 });
}

async function runCallOver(page: Page) {
  await page.getByRole("button", { name: "Run call-over" }).click();
  await expect(page.getByRole("heading", { name: /No payment to compare with the following|Payments to look at|Successful payments/ }).first()).toBeVisible({ timeout: 20_000 });
}

test("smoke: statuses, tiles and headings from fixture CSVs", async ({ page }) => {
  await page.goto("/callover");

  await upload(page, ["callover-smoke-statement.csv"], ["callover-smoke-payments.csv"]);
  await runCallOver(page);

  // Summary tiles
  for (const label of ["Payments", "Paid", "Reversed", "Double posted"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

  // Both tickers render (isolated countdown badge and session sentence).
  await expect(page.getByRole("timer")).toHaveCount(2);

  // Problems table: one double posted and two reversed, with mention counts.
  await expect(page.getByRole("heading", { name: "Payments to look at (3)" })).toBeVisible();
  await expect(page.getByRole("button", { name: /DALU EZE 12,000\.00 Double posted \(Found 2 times\)/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /BELLO UMARU 18,000\.00 Reversed \(Found 1 time\)/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /EFE IGBA 9,000\.00 Reversed \(Found 2 times\)/ })).toBeVisible();

  // Problems table carries a Name column
  await expect(page.getByRole("columnheader", { name: "Name" }).first()).toBeVisible();

  // Successful payments section is collapsed by default; Show reveals the
  // paid rows (a straight paid and a paid with its stamp duty line).
  await expect(page.getByRole("heading", { name: "Successful payments (2)" })).toBeVisible();
  await page.getByRole("button", { name: "Show", exact: true }).click();
  await expect(page.getByText("ADAMU GARBA")).toBeVisible();
  await expect(page.getByText("CHIDI OKEKE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide", exact: true })).toBeVisible();

  // The stamp duty charge line must never surface as an orphan
  await expect(page.getByRole("heading", { name: /No payment to compare with the following/ })).toHaveCount(0);
});

test("smoke: show-all toggle reveals every orphan", async ({ page }) => {
  await page.goto("/callover");

  await upload(
    page,
    ["callover-orphans-statement-a.csv", "callover-orphans-statement-b.csv"],
    ["callover-orphans-payments.csv"],
  );
  await runCallOver(page);

  const orphans = page.locator('section[aria-labelledby="orphans-heading"]');
  await expect(orphans.getByRole("heading", { name: "No payment to compare with the following (12, 78,000.00)" })).toBeVisible();

  // Collapsed: 5 rows of 12, button says Show all 12.
  await expect(orphans.getByRole("button", { name: "Show all 12" })).toBeVisible();
  await expect(orphans.locator("tbody tr")).toHaveCount(5);

  // Real click: all 12 rows appear and the button flips to Hide.
  await orphans.getByRole("button", { name: "Show all 12" }).click();
  await expect(orphans.getByRole("button", { name: "Hide" })).toBeVisible();
  await expect(orphans.locator("tbody tr")).toHaveCount(12);

  // And back again.
  await orphans.getByRole("button", { name: "Hide" }).click();
  await expect(orphans.getByRole("button", { name: "Show all 12" })).toBeVisible();
  await expect(orphans.locator("tbody tr")).toHaveCount(5);
});

test("smoke: session restores on reload and Clear now wipes it", async ({ page }) => {
  await page.goto("/callover");

  await upload(page, ["callover-smoke-statement.csv"], ["callover-smoke-payments.csv"]);
  await runCallOver(page);
  await expect(page.getByRole("heading", { name: "Payments to look at (3)" })).toBeVisible();

  // A reload must restore the session: the run button comes back enabled
  // from the stored files (results are never persisted, only the inputs).
  await page.reload();
  const run = page.getByRole("button", { name: "Run call-over" });
  await expect(run).toBeEnabled({ timeout: 15_000 });
  await expect(page.getByRole("timer")).toHaveCount(1);
  await run.click();
  await expect(page.getByRole("heading", { name: "Payments to look at (3)" })).toBeVisible({ timeout: 20_000 });

  // Clear now wipes the session: back to the empty uploader, and storage
  // holds no session, so a further reload cannot resurrect anything.
  await page.getByRole("button", { name: "Clear now" }).click();
  await expect(page.getByRole("button", { name: "Run call-over" })).toBeVisible();
  await expect(page.getByText("Upload both files to run the call-over")).toBeVisible();
  const stored = await page.evaluate(() => window.localStorage.getItem("daymark.callover.v2"));
  expect(stored).toBeNull();

  await page.reload();
  await expect(page.getByRole("button", { name: "Run call-over" })).toBeVisible();
  await expect(page.getByText("Upload both files to run the call-over")).toBeVisible();
});
