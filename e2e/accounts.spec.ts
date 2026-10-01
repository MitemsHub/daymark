import { expect, test } from "@playwright/test";

// The Quick reference accounts table is tap-to-copy: a tap on an account
// number copies it and shows a brief Copied confirmation.
test("quick reference account numbers tap to copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const gtb = page.getByRole("button", { name: "Copy the account number for GTB" });
  await expect(gtb).toHaveText("0023723318");

  await gtb.click();
  await expect(gtb).toHaveText("Copied ✓");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe("0023723318");

  // The confirmation reverts on its own.
  await expect(gtb).toHaveText("0023723318", { timeout: 5_000 });
});
