import { round, sum } from "@/lib/math";
import type {
  OptimizationConstraint,
  OptimizationResult,
  OptimizationSupplier,
} from "@/types/procurement";

export const optimizeSourcing = (
  suppliers: OptimizationSupplier[],
  constraints: OptimizationConstraint,
): OptimizationResult => {
  const warnings: string[] = [];
  if (constraints.demand <= 0) {
    return { feasible: false, allocations: [], objectiveValue: 0, demandFulfilled: 0, concentration: 0, explanation: "Demand must be greater than zero.", warnings: ["Invalid demand."] };
  }
  const excluded = new Set(constraints.excludedSupplierIds);
  const eligible = suppliers
    .filter(
      (supplier) =>
        !excluded.has(supplier.supplierId) &&
        supplier.qualityScore >= constraints.minQualityScore &&
        supplier.riskScore <= constraints.maxRiskScore &&
        supplier.capacity > 0,
    )
    .map((supplier) => ({
      ...supplier,
      effectiveCapacity: Math.min(supplier.capacity, constraints.demand * constraints.maxSupplierShare),
    }))
    .filter((supplier) => supplier.effectiveCapacity >= Math.max(supplier.minimumAllocation, supplier.moq))
    .sort((a, b) => a.unitTco - b.unitTco || a.riskScore - b.riskScore);

  if (sum(eligible.map((supplier) => supplier.effectiveCapacity)) + 0.0001 < constraints.demand) {
    return {
      feasible: false,
      allocations: [],
      objectiveValue: 0,
      demandFulfilled: 0,
      concentration: 0,
      explanation: "No feasible allocation satisfies demand, capacity, concentration, quality and risk constraints.",
      warnings: ["Eligible capacity is below required demand."],
    };
  }

  let remaining = constraints.demand;
  const rawAllocations: Array<{ supplier: (typeof eligible)[number]; quantity: number }> = [];
  for (const supplier of eligible) {
    if (remaining <= 0) break;
    const minimum = Math.max(supplier.minimumAllocation, supplier.moq);
    const quantity = Math.min(supplier.effectiveCapacity, remaining);
    if (quantity >= minimum) {
      rawAllocations.push({ supplier, quantity });
      remaining -= quantity;
    }
  }

  if (remaining > 0.0001) {
    const allocations = new Map(rawAllocations.map((entry) => [entry.supplier.supplierId, entry]));
    for (const supplier of [...eligible].reverse()) {
      if (remaining <= 0) break;
      const existing = allocations.get(supplier.supplierId);
      const current = existing?.quantity ?? 0;
      const room = supplier.effectiveCapacity - current;
      const addition = Math.min(room, remaining);
      if (addition > 0 && (current > 0 || addition >= Math.max(supplier.minimumAllocation, supplier.moq))) {
        if (existing) existing.quantity += addition;
        else {
          const entry = { supplier, quantity: addition };
          rawAllocations.push(entry);
          allocations.set(supplier.supplierId, entry);
        }
        remaining -= addition;
      }
    }
  }

  const fulfilled = constraints.demand - remaining;
  if (remaining > 0.0001) {
    warnings.push("Allocation could not satisfy demand after MOQ and minimum-allocation rounding.");
    return { feasible: false, allocations: [], objectiveValue: 0, demandFulfilled: fulfilled, concentration: 0, explanation: warnings[0]!, warnings };
  }
  const allocations = rawAllocations
    .filter((entry) => entry.quantity > 0)
    .map((entry) => ({
      supplierId: entry.supplier.supplierId,
      quantity: round(entry.quantity),
      share: round((entry.quantity / constraints.demand) * 100, 2),
      unitTco: entry.supplier.unitTco,
      totalCost: round(entry.quantity * entry.supplier.unitTco),
    }));
  const concentration = sum(allocations.map((allocation) => (allocation.share / 100) ** 2)) * 10_000;
  const objectiveValue = sum(allocations.map((allocation) => allocation.totalCost));
  const primary = allocations[0];
  const explanation = allocations.length === 1
    ? `${primary?.supplierId ?? "The selected supplier"} meets demand at the lowest feasible expected total cost.`
    : `A ${allocations.length}-supplier allocation balances expected total cost with the ${(constraints.maxSupplierShare * 100).toFixed(0)}% concentration limit and eligible capacity.`;
  return {
    feasible: true,
    allocations,
    objectiveValue: round(objectiveValue),
    demandFulfilled: round(fulfilled),
    concentration: round(concentration),
    explanation,
    warnings,
  };
};
