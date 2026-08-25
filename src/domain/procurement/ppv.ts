import { groupBy, sum } from "@/lib/math";
import type { Material, PurchaseOrderLine } from "@/types/procurement";

export interface PpvResult {
  id: string;
  actualSpend: number;
  referenceSpend: number;
  ppv: number;
  favourable: boolean;
}

export const calculatePpv = (
  lines: PurchaseOrderLine[],
  materials: Material[],
  groupKey: (line: PurchaseOrderLine) => string = (line) => line.materialId,
): PpvResult[] => {
  const standards = new Map(materials.map((material) => [material.id, material.standardPrice]));
  return [...groupBy(lines, groupKey).entries()]
    .map(([id, group]) => {
      const actualSpend = sum(group.map((line) => line.unitPrice * line.quantity));
      const referenceSpend = sum(
        group.map((line) => (standards.get(line.materialId) ?? line.unitPrice) * line.quantity),
      );
      const ppv = actualSpend - referenceSpend;
      return { id, actualSpend, referenceSpend, ppv, favourable: ppv <= 0 };
    })
    .sort((a, b) => b.ppv - a.ppv);
};

export const totalPpv = (results: PpvResult[]): number => sum(results.map((result) => result.ppv));
