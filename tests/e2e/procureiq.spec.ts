import { expect, test } from "@playwright/test";

test("landing page opens the demo workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn procurement data/ })).toBeVisible();
  await page.getByRole("link", { name: /Open Demo Workspace/i }).first().click();
  await expect(page).toHaveURL(/\/workspace\/overview/);
  await expect(page.getByRole("heading", { name: "Procurement overview" })).toBeVisible();
});

test("overview and spend filters recalculate the workspace", async ({ page }) => {
  await page.goto("/workspace/overview");
  await expect(page.getByText("Management attention")).toBeVisible();
  await page.goto("/workspace/spend");
  const before = await page.locator(".kpi").first().locator("strong").textContent();
  await page.getByLabel("Category", { exact: true }).selectOption("CAT-ALU");
  const after = await page.locator(".kpi").first().locator("strong").textContent();
  expect(after).not.toBe(before);
  await expect(page.getByText("Material Pareto")).toBeVisible();
});

test("supplier profile and comparison distinguish price from TCO", async ({ page }) => {
  await page.goto("/workspace/suppliers");
  await page.getByRole("button", { name: "Arka Precision Metals" }).click();
  await expect(page.getByRole("heading", { name: "Arka Precision Metals" })).toBeVisible();
  await page.goto("/workspace/comparison");
  await expect(page.getByText("Lowest quotation")).toBeVisible();
  await expect(page.getByText("Recommended supplier")).toBeVisible();
  await expect(page.getByText("Why this supplier?")).toBeVisible();
});

test("should-cost, RFQ, optimizer and scenario workflows respond", async ({ page }) => {
  await page.goto("/workspace/should-cost");
  const targetBefore = await page.locator(".kpi").nth(1).locator("strong").textContent();
  await page.getByLabel("Raw material rate (₹/kg)").fill("380");
  const targetAfter = await page.locator(".kpi").nth(1).locator("strong").textContent();
  expect(targetAfter).not.toBe(targetBefore);
  await page.goto("/workspace/rfq");
  await expect(page.getByText("Normalized bid comparison")).toBeVisible();
  await page.goto("/workspace/optimizer");
  await page.getByRole("button", { name: /Run optimization/ }).click();
  await expect(page.getByText("Recommended allocation")).toBeVisible();
  await page.goto("/workspace/scenario");
  await page.getByRole("button", { name: /Freight Shock/ }).click();
  await page.getByRole("button", { name: /Run scenario/ }).click();
  await expect(page.getByText(/changes the preferred sourcing posture/)).toBeVisible();
});

test("local import, export and guided demo controls work", async ({ page }) => {
  await page.goto("/workspace/data");
  await page.locator('input[type="file"][accept=".csv,.xlsx,.xls"]').setInputFiles({ name: "purchase-lines.csv", mimeType: "text/csv", buffer: Buffer.from("date,supplierId,plantId,materialId,quantity,unitPrice,freight,contracted\n2026-07-01,SUP-001,PLT-GGN,MAT-004,1000,1200,18000,true") });
  await expect(page.getByText("1 rows ready for validation")).toBeVisible();
  await page.getByRole("button", { name: /Import records/ }).click();
  await expect(page.getByText("Dataset imported and analytics recalculated.")).toBeVisible();
  await page.getByRole("button", { name: /Export backup/ }).first().click();
  await page.getByRole("button", { name: /Guided demo/ }).click();
  await expect(page.getByText(/Recruiter walkthrough/)).toBeVisible();
});

test("methodology, settings and reset recovery are available", async ({ page }) => {
  await page.goto("/workspace/methodology");
  await expect(page.getByText("Deterministic decision intelligence")).toBeVisible();
  await page.goto("/workspace/settings");
  await expect(page.getByText("Supplier scoring weights")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Reset to demo data/ }).click();
  await expect(page.getByText("Workspace reset to deterministic demo data.")).toBeVisible();
});
