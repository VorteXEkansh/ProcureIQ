import { round } from "@/lib/math";
import type { NegotiationScenario } from "@/types/procurement";

export const simulateNegotiation = (scenario: NegotiationScenario) => {
  const priceSavings = scenario.annualQuantity * scenario.currentUnitPrice * scenario.discountRate;
  const additionalInventory = Math.max(0, scenario.proposedMoq - scenario.currentMoq) / 2;
  const inventoryCost = additionalInventory * scenario.currentUnitPrice * scenario.carryingRate;
  const paymentTermValue =
    (scenario.paymentTermChangeDays / 365) *
    scenario.annualQuantity *
    scenario.currentUnitPrice *
    scenario.carryingRate;
  const freightImpact = scenario.annualQuantity * scenario.freightChangePerUnit;
  const qualityImpact = scenario.annualQuantity * scenario.currentUnitPrice * scenario.rejectionRateChange * 1.4;
  const netValue = priceSavings - inventoryCost + paymentTermValue - freightImpact - qualityImpact;
  const annualConsumptionPerDay = scenario.annualQuantity / 365;
  const maximumExtraAverageInventory = priceSavings / Math.max(0.01, scenario.currentUnitPrice * scenario.carryingRate);
  const breakEvenMoq = scenario.currentMoq + maximumExtraAverageInventory * 2;
  const minimumDiscount =
    (inventoryCost - paymentTermValue + freightImpact + qualityImpact) /
    Math.max(1, scenario.annualQuantity * scenario.currentUnitPrice);
  return {
    priceSavings: round(priceSavings),
    additionalInventory: round(additionalInventory),
    inventoryDays: round(additionalInventory / Math.max(0.01, annualConsumptionPerDay), 1),
    inventoryCost: round(inventoryCost),
    paymentTermValue: round(paymentTermValue),
    freightImpact: round(freightImpact),
    qualityImpact: round(qualityImpact),
    netValue: round(netValue),
    breakEvenMoq: Math.round(breakEvenMoq),
    minimumDiscount: round(Math.max(0, minimumDiscount) * 100, 2),
  };
};
