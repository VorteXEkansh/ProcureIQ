import { describe, expect, it } from "vitest";
import { generateDemoDataset } from "@/data/demo/generate";

describe("deterministic demo dataset", () => {
  it("meets the documented portfolio scale", () => {
    const dataset = generateDemoDataset();
    expect(dataset.suppliers.length).toBeGreaterThanOrEqual(30);
    expect(dataset.materials.length).toBeGreaterThanOrEqual(100);
    expect(dataset.categories.length).toBeGreaterThanOrEqual(8);
    expect(dataset.plants).toHaveLength(3);
    expect(dataset.purchaseOrderLines.length).toBeGreaterThanOrEqual(2_000);
    expect(dataset.rfqs.length).toBeGreaterThanOrEqual(20);
    expect(dataset.deliveries).toHaveLength(dataset.purchaseOrderLines.length);
    expect(dataset.qualityRecords).toHaveLength(dataset.purchaseOrderLines.length);
  });

  it("is reproducible and internally linked", () => {
    const first = generateDemoDataset();
    const second = generateDemoDataset();
    expect(first).toEqual(second);
    const supplierIds = new Set(first.suppliers.map((supplier) => supplier.id));
    const materialIds = new Set(first.materials.map((material) => material.id));
    expect(first.purchaseOrderLines.every((line) => supplierIds.has(line.supplierId))).toBe(true);
    expect(first.purchaseOrderLines.every((line) => materialIds.has(line.materialId))).toBe(true);
    expect(first.purchaseOrderLines.every((line) => line.quantity > 0 && line.unitPrice >= 0)).toBe(true);
  });

  it("embeds the cheapest-is-not-cheapest operational story", () => {
    const dataset = generateDemoDataset();
    const cheapest = dataset.suppliers.find((supplier) => supplier.id === "SUP-001")!;
    const highPerformer = dataset.suppliers.find((supplier) => supplier.id === "SUP-002")!;
    expect(cheapest.defectRate).toBeGreaterThan(highPerformer.defectRate);
    expect(cheapest.onTimeDelivery).toBeLessThan(highPerformer.onTimeDelivery);
    expect(cheapest.leadTimeDays).toBeGreaterThan(highPerformer.leadTimeDays);
  });
});
