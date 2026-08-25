import { describe, expect, it } from "vitest";
import { optimizeSourcing } from "@/domain/procurement/sourcing-optimizer";
import type { OptimizationSupplier } from "@/types/procurement";

const suppliers: OptimizationSupplier[] = [
  { supplierId: "A", capacity: 700, minimumAllocation: 0, moq: 100, unitTco: 10, qualityScore: 90, riskScore: 20 },
  { supplierId: "B", capacity: 600, minimumAllocation: 0, moq: 100, unitTco: 11, qualityScore: 88, riskScore: 25 },
  { supplierId: "C", capacity: 500, minimumAllocation: 0, moq: 100, unitTco: 13, qualityScore: 70, riskScore: 40 },
];

const constraints = { demand: 1_000, maxSupplierShare: .6, minQualityScore: 60, maxRiskScore: 60, excludedSupplierIds: [] as string[] };

describe("sourcing optimizer", () => {
  it("fulfils demand and respects capacity and concentration", () => {
    const result = optimizeSourcing(suppliers, constraints);
    expect(result.feasible).toBe(true);
    expect(result.allocations.reduce((total, item) => total + item.quantity, 0)).toBe(1_000);
    expect(result.allocations.every((item) => item.share <= 60)).toBe(true);
    expect(result.allocations.every((item) => item.quantity <= suppliers.find((supplier) => supplier.supplierId === item.supplierId)!.capacity)).toBe(true);
  });

  it("excludes a supplier completely", () => {
    const result = optimizeSourcing(suppliers, { ...constraints, excludedSupplierIds: ["A"] });
    expect(result.allocations.find((item) => item.supplierId === "A")).toBeUndefined();
  });

  it("selects the lowest-cost feasible mix", () => {
    const result = optimizeSourcing(suppliers, constraints);
    expect(result.objectiveValue).toBe(600 * 10 + 400 * 11);
    expect(result.objectiveValue).toBeLessThanOrEqual(1_000 * 13);
  });

  it("returns an explanation for infeasible capacity", () => {
    const result = optimizeSourcing(suppliers, { ...constraints, demand: 3_000, maxSupplierShare: 1 });
    expect(result.feasible).toBe(false);
    expect(result.allocations).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/capacity/i);
  });
});
