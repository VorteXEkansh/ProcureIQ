import { clamp, round } from "@/lib/math";
import type { ProcurementDataset, RFQ, SupplierQuote } from "@/types/procurement";

export interface EvaluatedQuote {
  quote: SupplierQuote;
  supplierName: string;
  quotation: number;
  landedCost: number;
  qualityCost: number;
  inventoryCost: number;
  paymentTermEffect: number;
  riskAdjustment: number;
  totalEvaluatedCost: number;
  effectiveUnitCost: number;
  score: number;
}

export const evaluateRfq = (dataset: ProcurementDataset, rfq: RFQ, carryingRate = 0.18) => {
  const supplierMap = new Map(dataset.suppliers.map((supplier) => [supplier.id, supplier]));
  const line = rfq.lines[0];
  if (!line) return { evaluated: [], lowestQuote: undefined, lowestEvaluated: undefined, recommended: undefined };
  const evaluated: EvaluatedQuote[] = rfq.quotes.map((quote) => {
    const supplier = supplierMap.get(quote.supplierId);
    if (!supplier) throw new Error(`Unknown supplier ${quote.supplierId}`);
    const quotation = quote.unitPrice * line.quantity;
    const landedCost = quotation + quote.freightPerUnit * line.quantity;
    const qualityCost = line.quantity * supplier.defectRate * quote.unitPrice * 1.45;
    const inventoryCost = (line.quantity / 365) * quote.leadTimeDays * quote.unitPrice * carryingRate;
    const paymentTermEffect = ((45 - quote.paymentTermsDays) / 365) * quotation * carryingRate;
    const operationalRisk = clamp(
      (1 - supplier.onTimeDelivery) * 55 + supplier.defectRate * 450 + supplier.deliveryVariability * 1.5,
      0,
      100,
    );
    const riskAdjustment = landedCost * (operationalRisk / 100) * 0.025;
    const totalEvaluatedCost = landedCost + qualityCost + inventoryCost + paymentTermEffect + riskAdjustment;
    const score = 100 - (totalEvaluatedCost / Math.max(1, landedCost) - 1) * 180 - operationalRisk * 0.2;
    return {
      quote,
      supplierName: supplier.name,
      quotation: round(quotation),
      landedCost: round(landedCost),
      qualityCost: round(qualityCost),
      inventoryCost: round(inventoryCost),
      paymentTermEffect: round(paymentTermEffect),
      riskAdjustment: round(riskAdjustment),
      totalEvaluatedCost: round(totalEvaluatedCost),
      effectiveUnitCost: round(totalEvaluatedCost / line.quantity, 2),
      score: round(clamp(score, 0, 100), 1),
    };
  });
  const byQuote = [...evaluated].sort((a, b) => a.quotation - b.quotation);
  const byEvaluated = [...evaluated].sort((a, b) => a.totalEvaluatedCost - b.totalEvaluatedCost);
  const byRecommendation = [...evaluated].sort((a, b) => b.score - a.score || a.totalEvaluatedCost - b.totalEvaluatedCost);
  return {
    evaluated,
    lowestQuote: byQuote[0],
    lowestEvaluated: byEvaluated[0],
    recommended: byRecommendation[0],
  };
};
