import { describe, expect, it } from "vitest";
import { generateDemoDataset } from "@/data/demo/generate";
import { buildRecommendations } from "@/domain/procurement/recommendations";
import { evaluateRfq } from "@/domain/procurement/rfq-analysis";
import { identifySavingsOpportunities, nonOverlappingOpportunityValue } from "@/domain/procurement/savings";
import { simulateScenario } from "@/domain/procurement/scenario-engine";
import { DEFAULT_SCORING_WEIGHTS, scoreAllSuppliers, scoreSupplier, validateScoringWeights } from "@/domain/procurement/supplier-scoring";
import { calculateSupplierRisk } from "@/domain/procurement/supplier-risk";

describe("supplier and recommendation engines", () => {
  const dataset = generateDemoDataset();

  it("requires supplier weights to total 100", () => {
    expect(validateScoringWeights(DEFAULT_SCORING_WEIGHTS)).toBe(true);
    expect(() => scoreSupplier(dataset.suppliers[0]!, 1, 50, { ...DEFAULT_SCORING_WEIGHTS, cost: 26 })).toThrow(/100/);
  });

  it("rewards better quality and delivery performance", () => {
    const scores = scoreAllSuppliers(dataset);
    const risky = scores.find((item) => item.supplier.id === "SUP-001")!;
    const strong = scores.find((item) => item.supplier.id === "SUP-002")!;
    expect(strong.score.quality).toBeGreaterThan(risky.score.quality);
    expect(strong.score.delivery).toBeGreaterThan(risky.score.delivery);
  });

  it("bands operational risk from transparent inputs", () => {
    const risk = calculateSupplierRisk(dataset.suppliers[0]!, 95, 80, 80);
    expect(risk.score).toBeGreaterThan(55);
    expect(["High", "Critical"]).toContain(risk.band);
  });

  it("normalizes RFQ quotations into evaluated cost", () => {
    const result = evaluateRfq(dataset, dataset.rfqs[0]!);
    expect(result.evaluated).toHaveLength(3);
    expect(result.evaluated.every((item) => item.totalEvaluatedCost >= item.landedCost)).toBe(true);
    expect(result.recommended).toBeDefined();
  });

  it("identifies conservative non-overlapping savings and recommendations", () => {
    const opportunities = identifySavingsOpportunities(dataset);
    expect(opportunities.length).toBeGreaterThanOrEqual(5);
    expect(nonOverlappingOpportunityValue(opportunities)).toBeLessThanOrEqual(opportunities.reduce((total, item) => total + item.estimatedValue, 0));
    expect(buildRecommendations(dataset, opportunities).every((item) => item.evidence.length > 0 && item.methodology.length > 0)).toBe(true);
  });

  it("calculates scenario deltas from baseline", () => {
    const result = simulateScenario({ spend: 100, tco: 120, demand: 1_000, freight: 5, inventory: 10, qualityCost: 5, riskScore: 30, savings: 10 }, { id: "S", name: "Demand surge", demandChange: .2, rawMaterialChange: 0, quotationChange: 0, freightChange: 0, leadTimeChange: 0, defectRateChange: 0, capacityChange: 0, carryingRateChange: 0 });
    expect(result.spend).toBe(120);
    expect(result.deltas.spend).toBe(20);
    expect(result.riskScore).toBeGreaterThan(30);
  });
});
