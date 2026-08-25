import { clamp, round } from "@/lib/math";
import type { RiskBand, Supplier, SupplierRiskMetric } from "@/types/procurement";

export const riskBand = (score: number): RiskBand =>
  score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 32 ? "Moderate" : "Low";

export const calculateSupplierRisk = (
  supplier: Supplier,
  capacityUtilization: number,
  sourcingConcentration: number,
  trendDeterioration = 0,
): SupplierRiskMetric => {
  const deliveryVariation = clamp((supplier.deliveryVariability / 10) * 100, 0, 100);
  const qualityVariation = clamp((supplier.defectRate / 0.06) * 100, 0, 100);
  const leadTimeVariation = clamp(((supplier.leadTimeDays - 8) / 25) * 100, 0, 100);
  const score = round(
    deliveryVariation * 0.23 +
      qualityVariation * 0.23 +
      clamp(capacityUtilization, 0, 100) * 0.14 +
      clamp(sourcingConcentration, 0, 100) * 0.18 +
      leadTimeVariation * 0.1 +
      clamp(trendDeterioration, 0, 100) * 0.12,
    1,
  );
  return {
    supplierId: supplier.id,
    deliveryVariation,
    qualityVariation,
    capacityUtilization,
    sourcingConcentration,
    leadTimeVariation,
    trendDeterioration,
    score,
    band: riskBand(score),
  };
};
