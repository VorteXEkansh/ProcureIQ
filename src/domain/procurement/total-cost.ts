import { round, sum } from "@/lib/math";
import type { TcoInput, TcoResult } from "@/types/procurement";

export const calculateInventoryCarryingCost = (
  dailyDemand: number,
  leadTimeDays: number,
  unitValue: number,
  carryingRate: number,
): number => {
  const pipelineInventory = dailyDemand * leadTimeDays;
  return pipelineInventory * unitValue * carryingRate;
};

export const calculateQualityCost = (
  volume: number,
  rejectionRate: number,
  inspectionPerUnit: number,
  reworkPerRejectedUnit: number,
  disruptionCost = 0,
): number => volume * inspectionPerUnit + volume * rejectionRate * reworkPerRejectedUnit + disruptionCost;

export const calculateTco = (input: TcoInput): TcoResult => {
  const purchase = input.annualQuantity * input.unitPrice;
  const freight = input.annualQuantity * input.freightPerUnit;
  const inspection = input.annualQuantity * input.inspectionPerUnit;
  const quality = input.annualQuantity * input.rejectionRate * input.reworkPerRejectedUnit;
  const inventory = calculateInventoryCarryingCost(
    input.dailyDemand,
    input.leadTimeDays,
    input.unitPrice,
    input.carryingRate,
  );
  const delay = input.delayProbability * input.delayCostPerEvent;
  const annualTco = sum([
    purchase,
    freight,
    inspection,
    quality,
    inventory,
    delay,
    input.administrationAnnual,
  ]);
  return {
    purchase: round(purchase),
    freight: round(freight),
    inspection: round(inspection),
    quality: round(quality),
    inventory: round(inventory),
    delay: round(delay),
    administration: round(input.administrationAnnual),
    annualTco: round(annualTco),
    effectiveUnitCost: round(input.annualQuantity === 0 ? 0 : annualTco / input.annualQuantity, 2),
  };
};
