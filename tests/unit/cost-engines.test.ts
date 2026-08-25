import { describe, expect, it } from "vitest";
import { simulateNegotiation } from "@/domain/procurement/negotiation";
import { calculateShouldCost, DEMO_SHOULD_COST_MODELS } from "@/domain/procurement/should-cost";
import { calculateInventoryCarryingCost, calculateQualityCost, calculateTco } from "@/domain/procurement/total-cost";

describe("cost intelligence", () => {
  it("calculates carrying cost from pipeline inventory", () => {
    expect(calculateInventoryCarryingCost(100, 10, 50, 0.2)).toBe(10_000);
  });

  it("calculates expected quality cost", () => {
    expect(calculateQualityCost(1_000, 0.02, 1, 100, 500)).toBe(3_500);
  });

  it("adds every TCO component without hiding cost", () => {
    const result = calculateTco({ annualQuantity: 1_000, unitPrice: 100, freightPerUnit: 2, inspectionPerUnit: 1, rejectionRate: .02, reworkPerRejectedUnit: 80, leadTimeDays: 10, dailyDemand: 4, carryingRate: .2, delayProbability: .1, delayCostPerEvent: 10_000, administrationAnnual: 500 });
    expect(result.purchase).toBe(100_000);
    expect(result.annualTco).toBe(result.purchase + result.freight + result.inspection + result.quality + result.inventory + result.delay + result.administration);
    expect(result.effectiveUnitCost).toBeGreaterThan(100);
  });

  it("produces a should-cost range and annual opportunity", () => {
    const result = calculateShouldCost(DEMO_SHOULD_COST_MODELS[0]!);
    expect(result.low).toBeLessThan(result.target);
    expect(result.high).toBeGreaterThan(result.target);
    expect(result.target).toBeGreaterThan(result.material);
    expect(result.annualOpportunity).toBeGreaterThan(0);
  });

  it("finds the negotiation break-even MOQ", () => {
    const result = simulateNegotiation({ annualQuantity: 50_000, currentUnitPrice: 100, discountRate: .04, currentMoq: 1_000, proposedMoq: 4_000, carryingRate: .18, paymentTermChangeDays: 0, freightChangePerUnit: 0, rejectionRateChange: 0 });
    expect(result.priceSavings).toBe(200_000);
    expect(result.breakEvenMoq).toBeGreaterThan(4_000);
    expect(result.netValue).toBeGreaterThan(0);
  });
});
