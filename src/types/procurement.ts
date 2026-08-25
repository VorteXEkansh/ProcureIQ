export type PlantId = "PLT-GGN" | "PLT-PUN" | "PLT-CHE";
export type RiskBand = "Low" | "Moderate" | "High" | "Critical";
export type OpportunityStatus =
  | "Identified"
  | "Reviewing"
  | "Approved"
  | "In Progress"
  | "Realized"
  | "Rejected";

export interface Plant {
  id: PlantId;
  name: string;
  city: string;
  state: string;
}

export interface Category {
  id: string;
  name: string;
  criticality: "Low" | "Medium" | "High";
  benchmarkInflation: number;
}

export interface Supplier {
  id: string;
  name: string;
  city: string;
  state: string;
  categoryIds: string[];
  paymentTermsDays: number;
  leadTimeDays: number;
  capacityMonthly: number;
  defectRate: number;
  onTimeDelivery: number;
  deliveryVariability: number;
  commercialFlexibility: number;
  audited: boolean;
  status: "Preferred" | "Approved" | "Conditional";
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: "kg" | "nos" | "litre" | "set" | "service";
  standardPrice: number;
  annualDemand: number;
  criticality: "Low" | "Medium" | "High";
  preferredSupplierIds: string[];
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplierId: string;
  plantId: PlantId;
  approved: boolean;
  contracted: boolean;
  lineIds: string[];
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  date: string;
  supplierId: string;
  plantId: PlantId;
  materialId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  freight: number;
  inspectionCost: number;
  contracted: boolean;
}

export interface DeliveryRecord {
  id: string;
  purchaseOrderLineId: string;
  promisedDate: string;
  deliveredDate: string;
  quantityDelivered: number;
  delayDays: number;
}

export interface QualityRecord {
  id: string;
  purchaseOrderLineId: string;
  inspectedQuantity: number;
  rejectedQuantity: number;
  reworkCost: number;
  disruptionCost: number;
}

export interface InspectionRecord {
  id: string;
  qualityRecordId: string;
  inspectionDate: string;
  result: "Accepted" | "Conditional" | "Rejected";
  notes: string;
}

export interface SupplierCapacity {
  supplierId: string;
  materialId: string;
  monthlyCapacity: number;
  committedCapacity: number;
}

export interface SupplierRiskMetric {
  supplierId: string;
  deliveryVariation: number;
  qualityVariation: number;
  capacityUtilization: number;
  sourcingConcentration: number;
  leadTimeVariation: number;
  trendDeterioration: number;
  score: number;
  band: RiskBand;
}

export interface RFQLine {
  id: string;
  materialId: string;
  quantity: number;
  targetDeliveryDays: number;
}

export interface SupplierQuote {
  id: string;
  rfqId: string;
  supplierId: string;
  lineId: string;
  unitPrice: number;
  freightPerUnit: number;
  moq: number;
  leadTimeDays: number;
  capacity: number;
  paymentTermsDays: number;
  validityDays: number;
}

export interface RFQ {
  id: string;
  title: string;
  createdAt: string;
  status: "Open" | "Evaluated" | "Awarded";
  lines: RFQLine[];
  quotes: SupplierQuote[];
}

export interface ShouldCostOperation {
  id: string;
  name: string;
  cycleTimeMinutes: number;
  setupTimeMinutes: number;
  batchSize: number;
  machineHourlyRate: number;
  labourHourlyRate: number;
  toolingPerPart: number;
  utilitiesPerPart: number;
}

export interface ShouldCostModel {
  id: string;
  name: string;
  material: string;
  rawMaterialRate: number;
  grossWeight: number;
  finishedWeight: number;
  scrapRecoveryRate: number;
  annualQuantity: number;
  supplierQuote: number;
  operations: ShouldCostOperation[];
  overheadRate: number;
  packaging: number;
  freight: number;
  marginRate: number;
  updatedAt: string;
}

export interface ScoringWeights {
  cost: number;
  quality: number;
  delivery: number;
  reliability: number;
  commercial: number;
  risk: number;
}

export interface SupplierScore {
  supplierId: string;
  cost: number;
  quality: number;
  delivery: number;
  reliability: number;
  commercial: number;
  risk: number;
  overall: number;
}

export interface TcoInput {
  annualQuantity: number;
  unitPrice: number;
  freightPerUnit: number;
  inspectionPerUnit: number;
  rejectionRate: number;
  reworkPerRejectedUnit: number;
  leadTimeDays: number;
  dailyDemand: number;
  carryingRate: number;
  delayProbability: number;
  delayCostPerEvent: number;
  administrationAnnual: number;
}

export interface TcoResult {
  purchase: number;
  freight: number;
  inspection: number;
  quality: number;
  inventory: number;
  delay: number;
  administration: number;
  annualTco: number;
  effectiveUnitCost: number;
}

export interface OptimizationConstraint {
  demand: number;
  maxSupplierShare: number;
  minQualityScore: number;
  maxRiskScore: number;
  excludedSupplierIds: string[];
}

export interface OptimizationSupplier {
  supplierId: string;
  capacity: number;
  minimumAllocation: number;
  moq: number;
  unitTco: number;
  qualityScore: number;
  riskScore: number;
}

export interface OptimizationAllocation {
  supplierId: string;
  quantity: number;
  share: number;
  unitTco: number;
  totalCost: number;
}

export interface OptimizationResult {
  feasible: boolean;
  allocations: OptimizationAllocation[];
  objectiveValue: number;
  demandFulfilled: number;
  concentration: number;
  explanation: string;
  warnings: string[];
}

export interface Scenario {
  id: string;
  name: string;
  demandChange: number;
  rawMaterialChange: number;
  quotationChange: number;
  freightChange: number;
  leadTimeChange: number;
  defectRateChange: number;
  capacityChange: number;
  carryingRateChange: number;
}

export interface NegotiationScenario {
  annualQuantity: number;
  currentUnitPrice: number;
  discountRate: number;
  currentMoq: number;
  proposedMoq: number;
  carryingRate: number;
  paymentTermChangeDays: number;
  freightChangePerUnit: number;
  rejectionRateChange: number;
}

export interface SavingsOpportunity {
  id: string;
  title: string;
  type:
    | "Price Variance"
    | "Supplier Consolidation"
    | "Should-Cost Gap"
    | "Quality Improvement"
    | "Freight Optimization"
    | "Payment Terms"
    | "Volume Reallocation"
    | "Sourcing Optimization";
  supplierId?: string;
  categoryId?: string;
  estimatedValue: number;
  confidence: "High" | "Medium" | "Low";
  difficulty: "Low" | "Medium" | "High";
  priority: number;
  suggestedAction: string;
  status: OpportunityStatus;
  overlapGroup?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  expectedImpact: number;
  evidence: string[];
  confidence: "High" | "Medium" | "Low";
  assumptions: string[];
  methodology: string;
  actionRoute: string;
}

export interface ProcurementDataset {
  version: 1;
  generatedAt: string;
  company: string;
  plants: Plant[];
  categories: Category[];
  suppliers: Supplier[];
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  deliveries: DeliveryRecord[];
  qualityRecords: QualityRecord[];
  inspections: InspectionRecord[];
  capacities: SupplierCapacity[];
  rfqs: RFQ[];
}

export interface WorkspaceSettings {
  carryingRate: number;
  maxSupplierShare: number;
  riskPreference: "Balanced" | "Cost Focused" | "Resilience Focused";
  scoringWeights: ScoringWeights;
}

export interface WorkspaceSnapshot {
  id: "active";
  dataset: ProcurementDataset;
  opportunities: SavingsOpportunity[];
  savedShouldCostModels: ShouldCostModel[];
  savedScenarios: Scenario[];
  settings: WorkspaceSettings;
  updatedAt: string;
}
