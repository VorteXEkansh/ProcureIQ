import { groupBy, sum, weightedAverage } from "@/lib/math";
import type { ProcurementDataset, PurchaseOrderLine } from "@/types/procurement";

export interface SpendFilters {
  from?: string;
  to?: string;
  plantId?: string;
  supplierId?: string;
  categoryId?: string;
  materialId?: string;
}

export interface SpendBreakdown {
  id: string;
  label: string;
  spend: number;
  share: number;
  count: number;
}

export const lineSpend = (line: PurchaseOrderLine): number =>
  line.quantity * line.unitPrice + line.freight + line.inspectionCost;

export const filterLines = (lines: PurchaseOrderLine[], filters: SpendFilters): PurchaseOrderLine[] =>
  lines.filter(
    (line) =>
      (!filters.from || line.date >= filters.from) &&
      (!filters.to || line.date <= filters.to) &&
      (!filters.plantId || line.plantId === filters.plantId) &&
      (!filters.supplierId || line.supplierId === filters.supplierId) &&
      (!filters.categoryId || line.categoryId === filters.categoryId) &&
      (!filters.materialId || line.materialId === filters.materialId),
  );

export const totalSpend = (lines: PurchaseOrderLine[]): number => sum(lines.map(lineSpend));

export const spendBreakdown = (
  lines: PurchaseOrderLine[],
  key: (line: PurchaseOrderLine) => string,
  labelFor: (id: string) => string,
): SpendBreakdown[] => {
  const total = totalSpend(lines);
  return [...groupBy(lines, key).entries()]
    .map(([id, group]) => ({
      id,
      label: labelFor(id),
      spend: totalSpend(group),
      share: total === 0 ? 0 : (totalSpend(group) / total) * 100,
      count: group.length,
    }))
    .sort((a, b) => b.spend - a.spend);
};

export const monthlySpend = (lines: PurchaseOrderLine[]): SpendBreakdown[] =>
  spendBreakdown(lines, (line) => line.date.slice(0, 7), (id) => id).sort((a, b) => a.id.localeCompare(b.id));

export const calculateConcentration = (breakdown: SpendBreakdown[]) => {
  const shares = breakdown.map((item) => item.share / 100);
  return {
    top1: (shares[0] ?? 0) * 100,
    top3: sum(shares.slice(0, 3)) * 100,
    top5: sum(shares.slice(0, 5)) * 100,
    hhi: sum(shares.map((share) => share ** 2)) * 10_000,
    supplierCount: breakdown.length,
  };
};

export const calculateOverview = (dataset: ProcurementDataset, filters: SpendFilters = {}) => {
  const lines = filterLines(dataset.purchaseOrderLines, filters);
  const spend = totalSpend(lines);
  const lineIds = new Set(lines.map((line) => line.id));
  const quality = dataset.qualityRecords.filter((record) => lineIds.has(record.purchaseOrderLineId));
  const deliveries = dataset.deliveries.filter((record) => lineIds.has(record.purchaseOrderLineId));
  const inspected = sum(quality.map((record) => record.inspectedQuantity));
  const rejected = sum(quality.map((record) => record.rejectedQuantity));
  const onTime = deliveries.filter((record) => record.delayDays === 0).length;
  const maverickSpend = totalSpend(lines.filter((line) => !line.contracted));
  const supplierNames = new Map(dataset.suppliers.map((supplier) => [supplier.id, supplier.name]));
  const supplierSpend = spendBreakdown(lines, (line) => line.supplierId, (id) => supplierNames.get(id) ?? id);
  const concentration = calculateConcentration(supplierSpend);
  const materialMap = new Map(dataset.materials.map((material) => [material.id, material]));
  const adversePpv = sum(
    lines.map((line) => {
      const benchmark = materialMap.get(line.materialId)?.standardPrice ?? line.unitPrice;
      return Math.max(0, (line.unitPrice - benchmark) * line.quantity);
    }),
  );
  const qualityCost = sum(quality.map((record) => record.reworkCost + record.disruptionCost));
  const opportunity = adversePpv * 0.36 + qualityCost * 0.55 + maverickSpend * 0.025;
  const averagePo = lines.length === 0 ? 0 : spend / lines.length;
  const averageSupplierScore = weightedAverage(
    dataset.suppliers.map((supplier) => ({
      value: (supplier.onTimeDelivery * 50 + (1 - supplier.defectRate) * 50),
      weight: supplierSpend.find((item) => item.id === supplier.id)?.spend ?? 0,
    })),
  );
  return {
    totalSpend: spend,
    identifiedOpportunity: opportunity,
    supplierPerformance: averageSupplierScore,
    adversePpv,
    highRiskSuppliers: dataset.suppliers.filter(
      (supplier) => supplier.onTimeDelivery < 0.83 || supplier.defectRate > 0.035,
    ).length,
    onTimeDelivery: deliveries.length === 0 ? 0 : (onTime / deliveries.length) * 100,
    rejectionRate: inspected === 0 ? 0 : (rejected / inspected) * 100,
    maverickSpend,
    maverickRate: spend === 0 ? 0 : (maverickSpend / spend) * 100,
    averagePo,
    concentration,
    lineCount: lines.length,
  };
};
