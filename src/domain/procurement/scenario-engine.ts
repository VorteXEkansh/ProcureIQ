import { round } from "@/lib/math";
import type { Scenario } from "@/types/procurement";

export interface ScenarioBaseline {
  spend: number;
  tco: number;
  demand: number;
  freight: number;
  inventory: number;
  qualityCost: number;
  riskScore: number;
  savings: number;
}

export const simulateScenario = (baseline: ScenarioBaseline, scenario: Scenario) => {
  const demandFactor = 1 + scenario.demandChange;
  const priceFactor = 1 + scenario.rawMaterialChange * 0.58 + scenario.quotationChange;
  const freightFactor = 1 + scenario.freightChange;
  const leadFactor = 1 + scenario.leadTimeChange;
  const defectFactor = 1 + scenario.defectRateChange;
  const capacityPressure = Math.max(0, scenario.demandChange - scenario.capacityChange);
  const spend = baseline.spend * demandFactor * priceFactor;
  const freight = baseline.freight * demandFactor * freightFactor;
  const qualityCost = baseline.qualityCost * demandFactor * defectFactor;
  const inventory = baseline.inventory * demandFactor * leadFactor * (1 + scenario.carryingRateChange);
  const riskScore = Math.min(100, baseline.riskScore + capacityPressure * 70 + scenario.leadTimeChange * 25 + scenario.defectRateChange * 30);
  const tco = spend + freight + qualityCost + inventory;
  const savings = Math.max(0, baseline.savings * (1 - scenario.rawMaterialChange * 0.35) + (baseline.tco - tco) * 0.04);
  return {
    name: scenario.name,
    demand: round(baseline.demand * demandFactor),
    spend: round(spend),
    freight: round(freight),
    qualityCost: round(qualityCost),
    inventory: round(inventory),
    tco: round(tco),
    riskScore: round(riskScore, 1),
    savings: round(savings),
    deltas: {
      spend: round(spend - baseline.spend),
      tco: round(tco - baseline.tco),
      riskScore: round(riskScore - baseline.riskScore, 1),
      savings: round(savings - baseline.savings),
    },
  };
};

export const PREDEFINED_SCENARIOS: Scenario[] = [
  { id: "SCN-DEMAND", name: "Demand Surge", demandChange: 0.2, rawMaterialChange: 0, quotationChange: 0, freightChange: 0.05, leadTimeChange: 0.08, defectRateChange: 0, capacityChange: 0, carryingRateChange: 0 },
  { id: "SCN-COMMODITY", name: "Commodity Inflation", demandChange: 0, rawMaterialChange: 0.12, quotationChange: 0.03, freightChange: 0, leadTimeChange: 0, defectRateChange: 0, capacityChange: 0, carryingRateChange: 0 },
  { id: "SCN-QUALITY", name: "Quality Decline", demandChange: 0, rawMaterialChange: 0, quotationChange: 0, freightChange: 0, leadTimeChange: 0.05, defectRateChange: 0.65, capacityChange: 0, carryingRateChange: 0 },
  { id: "SCN-FREIGHT", name: "Freight Shock", demandChange: 0, rawMaterialChange: 0, quotationChange: 0, freightChange: 0.25, leadTimeChange: 0.1, defectRateChange: 0, capacityChange: 0, carryingRateChange: 0 },
  { id: "SCN-CAPACITY", name: "Supplier Capacity Loss", demandChange: 0, rawMaterialChange: 0, quotationChange: 0.02, freightChange: 0.08, leadTimeChange: 0.25, defectRateChange: 0.1, capacityChange: -0.4, carryingRateChange: 0 },
];
