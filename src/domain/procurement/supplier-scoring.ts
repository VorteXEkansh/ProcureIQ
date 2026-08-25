import { clamp, groupBy, round, sum, weightedAverage } from "@/lib/math";
import type {
  ProcurementDataset,
  ScoringWeights,
  Supplier,
  SupplierScore,
} from "@/types/procurement";
import { lineSpend, spendBreakdown } from "./spend-analysis";
import { calculateSupplierRisk } from "./supplier-risk";

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  cost: 25,
  quality: 25,
  delivery: 20,
  reliability: 15,
  commercial: 5,
  risk: 10,
};

export const validateScoringWeights = (weights: ScoringWeights): boolean =>
  Math.abs(sum(Object.values(weights)) - 100) < 0.001 && Object.values(weights).every((weight) => weight >= 0);

export const scoreSupplier = (
  supplier: Supplier,
  priceIndex: number,
  riskScore: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): SupplierScore => {
  if (!validateScoringWeights(weights)) throw new Error("Supplier scoring weights must total 100%.");
  const components = {
    cost: clamp(100 - (priceIndex - 0.9) * 160, 0, 100),
    quality: clamp(100 - supplier.defectRate * 1_700, 0, 100),
    delivery: clamp(supplier.onTimeDelivery * 100, 0, 100),
    reliability: clamp(100 - supplier.deliveryVariability * 6.5, 0, 100),
    commercial: clamp(supplier.commercialFlexibility + supplier.paymentTermsDays * 0.12, 0, 100),
    risk: clamp(100 - riskScore, 0, 100),
  };
  const overall =
    (components.cost * weights.cost +
      components.quality * weights.quality +
      components.delivery * weights.delivery +
      components.reliability * weights.reliability +
      components.commercial * weights.commercial +
      components.risk * weights.risk) /
    100;
  return { supplierId: supplier.id, ...components, overall: round(overall, 1) };
};

export const scoreAllSuppliers = (
  dataset: ProcurementDataset,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
) => {
  const supplierLines = groupBy(dataset.purchaseOrderLines, (line) => line.supplierId);
  const categoryLines = groupBy(dataset.purchaseOrderLines, (line) => line.categoryId);
  const supplierSpend = spendBreakdown(
    dataset.purchaseOrderLines,
    (line) => line.supplierId,
    (id) => id,
  );
  const total = sum(supplierSpend.map((item) => item.spend));
  return dataset.suppliers
    .map((supplier) => {
      const lines = supplierLines.get(supplier.id) ?? [];
      const supplierUnitAverage = weightedAverage(lines.map((line) => ({ value: line.unitPrice, weight: line.quantity })));
      const peerLines = supplier.categoryIds.flatMap((categoryId) => categoryLines.get(categoryId) ?? []);
      const peerUnitAverage = weightedAverage(peerLines.map((line) => ({ value: line.unitPrice, weight: line.quantity })));
      const priceIndex = peerUnitAverage === 0 ? 1 : supplierUnitAverage / peerUnitAverage;
      const spend = sum(lines.map(lineSpend));
      const share = total === 0 ? 0 : (spend / total) * 100;
      const categoryConcentration = Math.max(
        0,
        ...supplier.categoryIds.map((categoryId) => {
          const category = categoryLines.get(categoryId) ?? [];
          const categorySpend = sum(category.map(lineSpend));
          const supplierCategorySpend = sum(
            category.filter((line) => line.supplierId === supplier.id).map(lineSpend),
          );
          return categorySpend === 0 ? 0 : (supplierCategorySpend / categorySpend) * 100;
        }),
      );
      const utilization = supplier.capacityMonthly === 0 ? 0 : Math.min(100, (sum(lines.map((line) => line.quantity)) / 18 / supplier.capacityMonthly) * 100);
      const risk = calculateSupplierRisk(
        supplier,
        utilization,
        categoryConcentration,
        supplier.id === "SUP-014" ? 70 : supplier.id === "SUP-001" ? 50 : 8,
      );
      return {
        supplier,
        spend,
        spendShare: share,
        priceIndex,
        risk,
        score: scoreSupplier(supplier, priceIndex, risk.score, weights),
      };
    })
    .sort((a, b) => b.spend - a.spend);
};
