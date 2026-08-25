import { groupBy, sum } from "@/lib/math";
import type { ProcurementDataset, SavingsOpportunity } from "@/types/procurement";
import { calculateShouldCost, DEMO_SHOULD_COST_MODELS } from "./should-cost";
import { calculatePpv } from "./ppv";
import { lineSpend, spendBreakdown, totalSpend } from "./spend-analysis";

export const identifySavingsOpportunities = (dataset: ProcurementDataset): SavingsOpportunity[] => {
  const categoryPpv = calculatePpv(dataset.purchaseOrderLines, dataset.materials, (line) => line.categoryId);
  const worstPpv = categoryPpv.find((item) => item.ppv > 0);
  const categoryMap = new Map(dataset.categories.map((category) => [category.id, category.name]));
  const supplierMap = new Map(dataset.suppliers.map((supplier) => [supplier.id, supplier]));
  const lineMap = new Map(dataset.purchaseOrderLines.map((line) => [line.id, line]));
  const supplierQualityCosts = [...groupBy(dataset.qualityRecords, (record) => lineMap.get(record.purchaseOrderLineId)?.supplierId ?? "unknown").entries()]
    .map(([supplierId, records]) => ({
      supplierId,
      cost: sum(records.map((record) => record.reworkCost + record.disruptionCost)),
    }))
    .filter((entry) => entry.supplierId !== "unknown")
    .sort((a, b) => b.cost - a.cost);
  const worstQuality = supplierQualityCosts[0];
  const packagingLines = dataset.purchaseOrderLines.filter((line) => line.categoryId === "CAT-PKG");
  const packagingSpend = totalSpend(packagingLines);
  const packagingSuppliers = new Set(packagingLines.map((line) => line.supplierId)).size;
  const freightBySupplier = [...groupBy(dataset.purchaseOrderLines, (line) => line.supplierId).entries()]
    .map(([supplierId, lines]) => ({
      supplierId,
      freight: sum(lines.map((line) => line.freight)),
      spend: sum(lines.map(lineSpend)),
    }))
    .sort((a, b) => b.freight - a.freight);
  const topFreight = freightBySupplier[0];
  const shouldCost = calculateShouldCost(DEMO_SHOULD_COST_MODELS[0]!);
  const supplierSpend = spendBreakdown(dataset.purchaseOrderLines, (line) => line.supplierId, (id) => id);
  const concentratedSupplier = supplierSpend[0];
  const opportunities: SavingsOpportunity[] = [];

  if (worstPpv) {
    opportunities.push({
      id: "OPP-PPV-001",
      title: `Address adverse ${categoryMap.get(worstPpv.id) ?? worstPpv.id} price variance`,
      type: "Price Variance",
      categoryId: worstPpv.id,
      estimatedValue: Math.max(0, worstPpv.ppv * 0.42),
      confidence: "High",
      difficulty: "Medium",
      priority: 92,
      suggestedAction: "Validate index movement, isolate supplier deltas and prepare a fact-based renegotiation.",
      status: "Identified",
      overlapGroup: "commercial-price",
    });
  }
  if (packagingSuppliers >= 5) {
    opportunities.push({
      id: "OPP-CON-001",
      title: `Consolidate ${packagingSuppliers} packaging suppliers`,
      type: "Supplier Consolidation",
      categoryId: "CAT-PKG",
      estimatedValue: packagingSpend * 0.055,
      confidence: "Medium",
      difficulty: "Medium",
      priority: 78,
      suggestedAction: "Bundle common specifications into a two-supplier annual sourcing event.",
      status: "Identified",
      overlapGroup: "packaging-base",
    });
  }
  opportunities.push({
    id: "OPP-SC-001",
    title: "Close Aluminium Bracket should-cost gap",
    type: "Should-Cost Gap",
    estimatedValue: shouldCost.annualOpportunity * 0.72,
    confidence: "High",
    difficulty: "Medium",
    priority: 96,
    suggestedAction: "Use the operation-level cost model to negotiate material yield, cycle time and margin.",
    status: "Reviewing",
    overlapGroup: "commercial-price",
  });
  if (worstQuality) {
    opportunities.push({
      id: "OPP-QLT-001",
      title: `Reduce quality leakage at ${supplierMap.get(worstQuality.supplierId)?.name ?? worstQuality.supplierId}`,
      type: "Quality Improvement",
      supplierId: worstQuality.supplierId,
      estimatedValue: worstQuality.cost * 0.58,
      confidence: "Medium",
      difficulty: "High",
      priority: 84,
      suggestedAction: "Launch containment and root-cause review on the highest-cost defect families.",
      status: "Identified",
    });
  }
  if (topFreight) {
    opportunities.push({
      id: "OPP-FRT-001",
      title: `Rebid freight terms for ${supplierMap.get(topFreight.supplierId)?.name ?? topFreight.supplierId}`,
      type: "Freight Optimization",
      supplierId: topFreight.supplierId,
      estimatedValue: topFreight.freight * 0.12,
      confidence: "Medium",
      difficulty: "Low",
      priority: 68,
      suggestedAction: "Compare supplier-paid freight against consolidated plant lanes and indexed fuel surcharge.",
      status: "Identified",
    });
  }
  if (concentratedSupplier) {
    opportunities.push({
      id: "OPP-ALLOC-001",
      title: `Rebalance volume from ${supplierMap.get(concentratedSupplier.id)?.name ?? concentratedSupplier.id}`,
      type: "Sourcing Optimization",
      supplierId: concentratedSupplier.id,
      estimatedValue: concentratedSupplier.spend * 0.018,
      confidence: "Medium",
      difficulty: "High",
      priority: 73,
      suggestedAction: "Model a capacity-feasible dual-source allocation with a 60% concentration ceiling.",
      status: "Identified",
      overlapGroup: "allocation",
    });
  }
  const shortTerms = dataset.suppliers.filter((supplier) => supplier.paymentTermsDays <= 30);
  const shortTermSpend = sum(
    dataset.purchaseOrderLines
      .filter((line) => shortTerms.some((supplier) => supplier.id === line.supplierId))
      .map(lineSpend),
  );
  opportunities.push({
    id: "OPP-TERMS-001",
    title: "Harmonize short supplier payment terms",
    type: "Payment Terms",
    estimatedValue: shortTermSpend * (15 / 365) * 0.12,
    confidence: "Medium",
    difficulty: "Low",
    priority: 61,
    suggestedAction: "Exchange committed volume for a 15-day extension where supplier economics permit.",
    status: "Identified",
  });
  return opportunities.sort((a, b) => b.priority - a.priority);
};

export const nonOverlappingOpportunityValue = (opportunities: SavingsOpportunity[]): number => {
  const counted = new Set<string>();
  return sum(
    opportunities.map((opportunity) => {
      if (!opportunity.overlapGroup) return opportunity.estimatedValue;
      if (counted.has(opportunity.overlapGroup)) return 0;
      counted.add(opportunity.overlapGroup);
      return opportunity.estimatedValue;
    }),
  );
};
