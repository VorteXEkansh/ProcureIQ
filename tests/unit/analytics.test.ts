import { describe, expect, it } from "vitest";
import { classifyAbc } from "@/domain/procurement/abc-analysis";
import { paretoCutoff } from "@/domain/procurement/pareto";
import { calculatePpv } from "@/domain/procurement/ppv";
import { calculateConcentration, spendBreakdown } from "@/domain/procurement/spend-analysis";
import type { Material, PurchaseOrderLine } from "@/types/procurement";

const breakdown = [
  { id: "a", label: "A", spend: 70, share: 70, count: 1 },
  { id: "b", label: "B", spend: 20, share: 20, count: 1 },
  { id: "c", label: "C", spend: 8, share: 8, count: 1 },
  { id: "d", label: "D", spend: 2, share: 2, count: 1 },
];

describe("spend analytics", () => {
  it("classifies ABC by cumulative spend", () => {
    const result = classifyAbc(breakdown);
    expect(result.map((item) => item.classification)).toEqual(["A", "A", "B", "C"]);
    expect(result.at(-1)?.cumulativeShare).toBe(100);
  });

  it("returns the minimum Pareto contributor set", () => {
    const result = paretoCutoff(breakdown, 80);
    expect(result.contributors.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result.achievedShare).toBe(90);
  });

  it("calculates concentration and HHI", () => {
    const result = calculateConcentration(breakdown);
    expect(result.top1).toBe(70);
    expect(result.top3).toBeCloseTo(98);
    expect(result.hhi).toBeCloseTo(5368);
  });

  it("calculates favourable and adverse PPV", () => {
    const material: Material = { id: "MAT", sku: "M", name: "Part", categoryId: "C", unit: "nos", standardPrice: 100, annualDemand: 100, criticality: "Medium", preferredSupplierIds: ["S"] };
    const base: PurchaseOrderLine = { id: "1", purchaseOrderId: "P", date: "2026-01-01", supplierId: "S", plantId: "PLT-GGN", materialId: "MAT", categoryId: "C", quantity: 10, unitPrice: 110, freight: 0, inspectionCost: 0, contracted: true };
    const results = calculatePpv([base, { ...base, id: "2", unitPrice: 90 }], [material]);
    expect(results[0]?.ppv).toBe(0);
    expect(calculatePpv([base], [material])[0]?.ppv).toBe(100);
  });

  it("creates sorted spend breakdowns", () => {
    const line = (id: string, supplierId: string, price: number): PurchaseOrderLine => ({ id, purchaseOrderId: id, date: "2026-01-01", supplierId, plantId: "PLT-GGN", materialId: "M", categoryId: "C", quantity: 1, unitPrice: price, freight: 0, inspectionCost: 0, contracted: true });
    const result = spendBreakdown([line("1", "S1", 10), line("2", "S2", 30)], (item) => item.supplierId, (id) => id);
    expect(result[0]).toMatchObject({ id: "S2", share: 75 });
  });
});
