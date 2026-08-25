import { round, sum } from "@/lib/math";
import type { ShouldCostModel, ShouldCostOperation } from "@/types/procurement";

export interface ShouldCostResult {
  material: number;
  grossMaterial: number;
  scrapRecovery: number;
  conversion: number;
  setup: number;
  labour: number;
  machine: number;
  tooling: number;
  utilities: number;
  overhead: number;
  packaging: number;
  freight: number;
  margin: number;
  target: number;
  low: number;
  high: number;
  quoteGap: number;
  quoteGapPercent: number;
  annualOpportunity: number;
}

const operationCost = (operation: ShouldCostOperation) => {
  const cycleHours = operation.cycleTimeMinutes / 60;
  const setupHoursPerPart = operation.setupTimeMinutes / 60 / Math.max(1, operation.batchSize);
  return {
    machine: cycleHours * operation.machineHourlyRate,
    labour: cycleHours * operation.labourHourlyRate,
    setup: setupHoursPerPart * (operation.machineHourlyRate + operation.labourHourlyRate),
    tooling: operation.toolingPerPart,
    utilities: operation.utilitiesPerPart,
  };
};

export const calculateShouldCost = (model: ShouldCostModel): ShouldCostResult => {
  const grossMaterial = model.grossWeight * model.rawMaterialRate;
  const scrapWeight = Math.max(0, model.grossWeight - model.finishedWeight);
  const scrapRecovery = scrapWeight * model.scrapRecoveryRate;
  const material = grossMaterial - scrapRecovery;
  const operationCosts = model.operations.map(operationCost);
  const machine = sum(operationCosts.map((cost) => cost.machine));
  const labour = sum(operationCosts.map((cost) => cost.labour));
  const setup = sum(operationCosts.map((cost) => cost.setup));
  const tooling = sum(operationCosts.map((cost) => cost.tooling));
  const utilities = sum(operationCosts.map((cost) => cost.utilities));
  const conversion = machine + labour + setup + tooling + utilities;
  const overhead = (material + conversion) * model.overheadRate;
  const preMargin = material + conversion + overhead + model.packaging + model.freight;
  const margin = preMargin * model.marginRate;
  const target = preMargin + margin;
  const low = target * 0.94;
  const high = target * 1.08;
  const quoteGap = model.supplierQuote - target;
  return {
    material: round(material),
    grossMaterial: round(grossMaterial),
    scrapRecovery: round(scrapRecovery),
    conversion: round(conversion),
    setup: round(setup),
    labour: round(labour),
    machine: round(machine),
    tooling: round(tooling),
    utilities: round(utilities),
    overhead: round(overhead),
    packaging: round(model.packaging),
    freight: round(model.freight),
    margin: round(margin),
    target: round(target),
    low: round(low),
    high: round(high),
    quoteGap: round(quoteGap),
    quoteGapPercent: round(target === 0 ? 0 : (quoteGap / target) * 100, 1),
    annualOpportunity: round(Math.max(0, quoteGap) * model.annualQuantity),
  };
};

export const DEMO_SHOULD_COST_MODELS: ShouldCostModel[] = [
  {
    id: "SCM-001",
    name: "Aluminium Bracket",
    material: "Aluminium 6061-T6",
    rawMaterialRate: 314,
    grossWeight: 2.6,
    finishedWeight: 1.72,
    scrapRecoveryRate: 178,
    annualQuantity: 48_000,
    supplierQuote: 1_264,
    operations: [
      { id: "OP-1", name: "Cutting", cycleTimeMinutes: 1.8, setupTimeMinutes: 35, batchSize: 400, machineHourlyRate: 720, labourHourlyRate: 180, toolingPerPart: 9, utilitiesPerPart: 3 },
      { id: "OP-2", name: "Milling", cycleTimeMinutes: 5.4, setupTimeMinutes: 55, batchSize: 200, machineHourlyRate: 1_180, labourHourlyRate: 220, toolingPerPart: 24, utilitiesPerPart: 8 },
      { id: "OP-3", name: "Drilling", cycleTimeMinutes: 2.2, setupTimeMinutes: 25, batchSize: 300, machineHourlyRate: 820, labourHourlyRate: 190, toolingPerPart: 11, utilitiesPerPart: 4 },
      { id: "OP-4", name: "Inspection", cycleTimeMinutes: 1.5, setupTimeMinutes: 10, batchSize: 100, machineHourlyRate: 180, labourHourlyRate: 260, toolingPerPart: 2, utilitiesPerPart: 1 },
    ],
    overheadRate: 0.12,
    packaging: 26,
    freight: 38,
    marginRate: 0.1,
    updatedAt: "2026-06-20T12:00:00.000Z",
  },
  {
    id: "SCM-002",
    name: "Gear Housing",
    material: "SG Iron 500/7",
    rawMaterialRate: 102,
    grossWeight: 8.5,
    finishedWeight: 6.9,
    scrapRecoveryRate: 28,
    annualQuantity: 22_000,
    supplierQuote: 1_980,
    operations: [
      { id: "OP-1", name: "Casting", cycleTimeMinutes: 7, setupTimeMinutes: 80, batchSize: 250, machineHourlyRate: 1_100, labourHourlyRate: 210, toolingPerPart: 42, utilitiesPerPart: 18 },
      { id: "OP-2", name: "Machining", cycleTimeMinutes: 8.5, setupTimeMinutes: 50, batchSize: 150, machineHourlyRate: 1_280, labourHourlyRate: 230, toolingPerPart: 38, utilitiesPerPart: 10 },
      { id: "OP-3", name: "Inspection", cycleTimeMinutes: 2.2, setupTimeMinutes: 10, batchSize: 80, machineHourlyRate: 160, labourHourlyRate: 270, toolingPerPart: 3, utilitiesPerPart: 1 },
    ],
    overheadRate: 0.14,
    packaging: 48,
    freight: 72,
    marginRate: 0.11,
    updatedAt: "2026-06-18T12:00:00.000Z",
  },
];
