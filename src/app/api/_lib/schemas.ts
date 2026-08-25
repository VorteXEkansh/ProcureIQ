import { z } from "zod";

const positive = z.number().finite().nonnegative();
const rate = z.number().finite().min(0).max(1);

export const spendLineSchema = z.object({
  id: z.string().max(80),
  purchaseOrderId: z.string().max(80),
  date: z.iso.date(),
  supplierId: z.string().max(80),
  plantId: z.enum(["PLT-GGN", "PLT-PUN", "PLT-CHE"]),
  materialId: z.string().max(80),
  categoryId: z.string().max(80),
  quantity: positive,
  unitPrice: positive,
  freight: positive.default(0),
  inspectionCost: positive.default(0),
  contracted: z.boolean().default(true),
});

export const supplierSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  city: z.string().max(80),
  state: z.string().max(80),
  categoryIds: z.array(z.string().max(80)).max(20),
  paymentTermsDays: positive.max(180),
  leadTimeDays: positive.max(365),
  capacityMonthly: positive,
  defectRate: rate,
  onTimeDelivery: rate,
  deliveryVariability: positive.max(365),
  commercialFlexibility: positive.max(100),
  audited: z.boolean(),
  status: z.enum(["Preferred", "Approved", "Conditional"]),
});

export const weightsSchema = z.object({
  cost: positive,
  quality: positive,
  delivery: positive,
  reliability: positive,
  commercial: positive,
  risk: positive,
});

export const tcoSchema = z.object({
  annualQuantity: positive,
  unitPrice: positive,
  freightPerUnit: positive,
  inspectionPerUnit: positive,
  rejectionRate: rate,
  reworkPerRejectedUnit: positive,
  leadTimeDays: positive,
  dailyDemand: positive,
  carryingRate: rate,
  delayProbability: rate,
  delayCostPerEvent: positive,
  administrationAnnual: positive,
});

export const operationSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(100),
  cycleTimeMinutes: positive,
  setupTimeMinutes: positive,
  batchSize: positive.min(1),
  machineHourlyRate: positive,
  labourHourlyRate: positive,
  toolingPerPart: positive,
  utilitiesPerPart: positive,
});

export const shouldCostSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(120),
  material: z.string().min(1).max(120),
  rawMaterialRate: positive,
  grossWeight: positive,
  finishedWeight: positive,
  scrapRecoveryRate: positive,
  annualQuantity: positive,
  supplierQuote: positive,
  operations: z.array(operationSchema).min(1).max(30),
  overheadRate: rate,
  packaging: positive,
  freight: positive,
  marginRate: rate,
  updatedAt: z.iso.datetime(),
});

export const optimizationSupplierSchema = z.object({
  supplierId: z.string().max(80),
  capacity: positive,
  minimumAllocation: positive,
  moq: positive,
  unitTco: positive,
  qualityScore: positive.max(100),
  riskScore: positive.max(100),
});

export const optimizationConstraintSchema = z.object({
  demand: positive,
  maxSupplierShare: rate,
  minQualityScore: positive.max(100),
  maxRiskScore: positive.max(100),
  excludedSupplierIds: z.array(z.string().max(80)).max(100),
});

export const negotiationSchema = z.object({
  annualQuantity: positive,
  currentUnitPrice: positive,
  discountRate: rate,
  currentMoq: positive,
  proposedMoq: positive,
  carryingRate: rate,
  paymentTermChangeDays: z.number().finite().min(-180).max(180),
  freightChangePerUnit: z.number().finite(),
  rejectionRateChange: z.number().finite().min(-1).max(1),
});

export const scenarioSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(120),
  demandChange: z.number().finite().min(-0.9).max(5),
  rawMaterialChange: z.number().finite().min(-0.9).max(5),
  quotationChange: z.number().finite().min(-0.9).max(5),
  freightChange: z.number().finite().min(-0.9).max(5),
  leadTimeChange: z.number().finite().min(-0.9).max(5),
  defectRateChange: z.number().finite().min(-0.9).max(5),
  capacityChange: z.number().finite().min(-0.9).max(5),
  carryingRateChange: z.number().finite().min(-0.9).max(5),
});

export const scenarioBaselineSchema = z.object({
  spend: positive,
  tco: positive,
  demand: positive,
  freight: positive,
  inventory: positive,
  qualityCost: positive,
  riskScore: positive.max(100),
  savings: positive,
});
