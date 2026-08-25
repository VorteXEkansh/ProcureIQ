import { seededRandom, round } from "@/lib/math";
import type {
  Category,
  InspectionRecord,
  Material,
  Plant,
  ProcurementDataset,
  PurchaseOrder,
  PurchaseOrderLine,
  QualityRecord,
  RFQ,
  Supplier,
  SupplierCapacity,
} from "@/types/procurement";

const DEMO_SEED = 20_260_825;
const GENERATED_AT = "2026-07-01T09:00:00.000Z";

const categoryBlueprints = [
  ["CAT-ALU", "Aluminium", "High", 0.072, 285],
  ["CAT-STL", "Alloy Steel", "High", 0.064, 178],
  ["CAT-BRG", "Bearings", "High", 0.041, 820],
  ["CAT-FST", "Fasteners", "Medium", 0.034, 18],
  ["CAT-FRG", "Forgings", "High", 0.059, 1_260],
  ["CAT-CST", "Castings", "High", 0.054, 1_080],
  ["CAT-ELC", "Electronics", "High", 0.038, 2_450],
  ["CAT-MOT", "Motors", "High", 0.045, 4_650],
  ["CAT-TOL", "Cutting Tools", "Medium", 0.029, 690],
  ["CAT-LUB", "Lubricants", "Medium", 0.051, 245],
  ["CAT-PKG", "Packaging", "Low", 0.032, 72],
  ["CAT-LOG", "Logistics Services", "Medium", 0.061, 9_800],
] as const;

const supplierNames = [
  "Arka Precision Metals",
  "Bharat Alloy Works",
  "Crestline Engineering",
  "Dhruva Bearing Systems",
  "Elite Motion Components",
  "FerroLink Industries",
  "Garuda Fastening Solutions",
  "Helix Auto Parts",
  "Indus Forgecraft",
  "Jupiter Metalforms",
  "Kaveri CastTech",
  "Lakshmi Diecast",
  "Meridian Circuits",
  "Nexon Industrial Electronics",
  "Orion Mechatronics",
  "Pragati Motor Works",
  "Qube Drive Systems",
  "Radian Tooling",
  "Shakti Carbide Tools",
  "Trident Machine Tools",
  "Unity Lubricants",
  "Vardhan Petrochem",
  "Western Process Oils",
  "XcelPack Solutions",
  "Yashoda Corrugators",
  "Zenith Packaging",
  "Apex Freight Network",
  "BlueRoute Logistics",
  "CargoSphere India",
  "Deccan Metals",
  "Everest Industrial Supply",
  "Frontier Components",
  "GatiNova Services",
  "Horizon Manufacturing",
  "Integra Sourcing",
  "Jai Hind Enterprises",
] as const;

const locations = [
  ["Gurugram", "Haryana"],
  ["Pune", "Maharashtra"],
  ["Chennai", "Tamil Nadu"],
  ["Faridabad", "Haryana"],
  ["Rajkot", "Gujarat"],
  ["Coimbatore", "Tamil Nadu"],
  ["Bengaluru", "Karnataka"],
  ["Ahmedabad", "Gujarat"],
  ["Jamshedpur", "Jharkhand"],
] as const;

const materialPrefixes: Record<string, string[]> = {
  "CAT-ALU": ["Extrusion", "Billet", "Sheet", "Machined Bracket", "Housing"],
  "CAT-STL": ["EN8 Bar", "EN19 Bar", "42CrMo4 Rod", "Steel Coil", "Spline Shaft"],
  "CAT-BRG": ["Ball Bearing", "Taper Roller", "Needle Bearing", "Thrust Bearing", "Hub Bearing"],
  "CAT-FST": ["Hex Bolt", "Flange Nut", "Washer", "Stud", "Retaining Ring"],
  "CAT-FRG": ["Forged Flange", "Gear Blank", "Yoke", "Knuckle", "Crank Blank"],
  "CAT-CST": ["Gear Housing", "Pump Body", "Bracket Casting", "Cover Plate", "Manifold"],
  "CAT-ELC": ["Control PCB", "Position Sensor", "Wire Harness", "Relay Module", "ECU Housing"],
  "CAT-MOT": ["BLDC Motor", "Stepper Motor", "Servo Motor", "Actuator", "Fan Motor"],
  "CAT-TOL": ["Carbide Insert", "End Mill", "Drill", "Reamer", "Grinding Wheel"],
  "CAT-LUB": ["Cutting Oil", "Hydraulic Oil", "Grease", "Rust Preventive", "Coolant"],
  "CAT-PKG": ["Corrugated Box", "VCI Bag", "Wooden Pallet", "Partition Set", "Stretch Film"],
  "CAT-LOG": ["FTL Lane", "LTL Lane", "Milk Run", "Express Freight", "Returnable Transit"],
};

export const DEMO_PLANTS: Plant[] = [
  { id: "PLT-GGN", name: "Gurugram Plant", city: "Gurugram", state: "Haryana" },
  { id: "PLT-PUN", name: "Pune Plant", city: "Pune", state: "Maharashtra" },
  { id: "PLT-CHE", name: "Chennai Plant", city: "Chennai", state: "Tamil Nadu" },
];

const buildCategories = (): Category[] =>
  categoryBlueprints.map(([id, name, criticality, benchmarkInflation]) => ({
    id,
    name,
    criticality,
    benchmarkInflation,
  }));

const buildSuppliers = (random: () => number): Supplier[] =>
  supplierNames.map((name, index) => {
    const category = categoryBlueprints[Math.floor(index / 3)]?.[0] ?? "CAT-PKG";
    const location = locations[index % locations.length] ?? locations[0];
    const isCheapButRisky = index === 0;
    const isHighPerformer = index === 1;
    const isDeteriorating = index === 13;
    const categoryIds = [category];
    if (index >= 30) categoryIds.push(index % 2 === 0 ? "CAT-PKG" : "CAT-FST");
    return {
      id: `SUP-${String(index + 1).padStart(3, "0")}`,
      name,
      city: location[0],
      state: location[1],
      categoryIds,
      paymentTermsDays: isHighPerformer ? 60 : [30, 45, 60][index % 3] ?? 45,
      leadTimeDays: isCheapButRisky ? 28 : isHighPerformer ? 11 : 12 + Math.floor(random() * 13),
      capacityMonthly: 8_000 + Math.round(random() * 28_000),
      defectRate: isCheapButRisky ? 0.048 : isHighPerformer ? 0.004 : isDeteriorating ? 0.036 : round(0.007 + random() * 0.022, 4),
      onTimeDelivery: isCheapButRisky ? 0.76 : isHighPerformer ? 0.98 : isDeteriorating ? 0.79 : round(0.84 + random() * 0.12, 3),
      deliveryVariability: isCheapButRisky ? 8.2 : isHighPerformer ? 1.4 : isDeteriorating ? 7.1 : round(2 + random() * 4.5, 1),
      commercialFlexibility: isCheapButRisky ? 78 : isHighPerformer ? 88 : Math.round(55 + random() * 35),
      audited: index % 7 !== 0,
      status: isCheapButRisky || isDeteriorating ? "Conditional" : index % 3 === 1 ? "Preferred" : "Approved",
    };
  });

const supplierIdsForCategory = (suppliers: Supplier[], categoryId: string): string[] =>
  suppliers.filter((supplier) => supplier.categoryIds.includes(categoryId)).map((supplier) => supplier.id);

const buildMaterials = (suppliers: Supplier[], random: () => number): Material[] => {
  const materials: Material[] = [];
  for (const [categoryIndex, blueprint] of categoryBlueprints.entries()) {
    const [categoryId, , , , basePrice] = blueprint;
    const supplierIds = supplierIdsForCategory(suppliers, categoryId);
    const names = materialPrefixes[categoryId] ?? ["Industrial Item"];
    for (let itemIndex = 0; itemIndex < 10; itemIndex += 1) {
      const sequence = categoryIndex * 10 + itemIndex + 1;
      const unit = categoryId === "CAT-LUB" ? "litre" : categoryId === "CAT-LOG" ? "service" : categoryId === "CAT-ALU" || categoryId === "CAT-STL" ? "kg" : "nos";
      const isCriticalBracket = categoryId === "CAT-ALU" && itemIndex === 3;
      const preferredSupplierIds = isCriticalBracket
        ? ["SUP-001", "SUP-002", "SUP-003"]
        : categoryId === "CAT-PKG"
          ? supplierIds.slice(0, 6)
          : supplierIds.slice(0, Math.min(3, supplierIds.length));
      materials.push({
        id: `MAT-${String(sequence).padStart(3, "0")}`,
        sku: `AC-${categoryId.slice(4)}-${String(itemIndex + 1).padStart(3, "0")}`,
        name: `${names[itemIndex % names.length]} ${String.fromCharCode(65 + Math.floor(itemIndex / names.length))}`,
        categoryId,
        unit,
        standardPrice: round(basePrice * (0.72 + random() * 0.7), 2),
        annualDemand: categoryId === "CAT-LOG" ? 180 + Math.round(random() * 420) : 8_000 + Math.round(random() * 65_000),
        criticality: isCriticalBracket || itemIndex % 4 === 0 ? "High" : itemIndex % 3 === 0 ? "Low" : "Medium",
        preferredSupplierIds,
      });
    }
  }
  return materials;
};

const chooseSupplier = (material: Material, monthIndex: number, random: () => number): string => {
  const options = material.preferredSupplierIds;
  if (material.id === "MAT-004") {
    const draw = random();
    return draw < 0.72 ? "SUP-001" : draw < 0.9 ? "SUP-002" : "SUP-003";
  }
  const draw = random();
  if (monthIndex > 12 && options.includes("SUP-014") && draw < 0.48) return "SUP-014";
  return options[Math.min(options.length - 1, Math.floor(draw * options.length))] ?? options[0] ?? "SUP-001";
};

const isoDate = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addDays = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const buildTransactions = (
  materials: Material[],
  suppliers: Supplier[],
  categories: Category[],
  random: () => number,
): Pick<ProcurementDataset, "purchaseOrders" | "purchaseOrderLines" | "deliveries" | "qualityRecords" | "inspections"> => {
  const purchaseOrders: PurchaseOrder[] = [];
  const purchaseOrderLines: PurchaseOrderLine[] = [];
  const deliveries: ProcurementDataset["deliveries"] = [];
  const qualityRecords: QualityRecord[] = [];
  const inspections: InspectionRecord[] = [];
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  let sequence = 1;

  for (let monthIndex = 0; monthIndex < 18; monthIndex += 1) {
    const year = 2025 + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    for (const [materialIndex, material] of materials.entries()) {
      const ordersThisMonth = materialIndex % 5 === 0 ? 2 : 1;
      for (let orderPart = 0; orderPart < ordersThisMonth; orderPart += 1) {
        const supplierId = chooseSupplier(material, monthIndex, random);
        const supplier = supplierMap.get(supplierId) ?? suppliers[0]!;
        const category = categoryMap.get(material.categoryId)!;
        const quantity = Math.max(1, Math.round((material.annualDemand / 12 / ordersThisMonth) * (0.85 + random() * 0.32)));
        const commodityTrend = 1 + category.benchmarkInflation * (monthIndex / 12) + Math.sin(monthIndex / 2.4) * 0.018;
        const supplierFactor = supplierId === "SUP-001" ? 0.94 : supplierId === "SUP-002" ? 1.018 : 0.98 + random() * 0.075;
        const adverseInflation = material.categoryId === "CAT-ALU" && monthIndex >= 11 ? 1.035 : 1;
        const unitPrice = round(material.standardPrice * commodityTrend * supplierFactor * adverseInflation * (0.99 + random() * 0.025), 2);
        const day = Math.min(25, 3 + ((materialIndex * 2 + orderPart * 7) % 24));
        const date = isoDate(year, month, day);
        const id = `POL-${String(sequence).padStart(5, "0")}`;
        const poId = `PO-${String(sequence).padStart(5, "0")}`;
        const plant = DEMO_PLANTS[(materialIndex + monthIndex + orderPart) % DEMO_PLANTS.length]!;
        const contracted = material.categoryId !== "CAT-PKG" ? random() > 0.08 : random() > 0.24;
        const freightRate = material.categoryId === "CAT-LOG" ? 0 : 0.008 + random() * 0.026;
        const line: PurchaseOrderLine = {
          id,
          purchaseOrderId: poId,
          date,
          supplierId,
          plantId: plant.id,
          materialId: material.id,
          categoryId: material.categoryId,
          quantity,
          unitPrice,
          freight: round(quantity * unitPrice * freightRate, 2),
          inspectionCost: round(quantity * (material.criticality === "High" ? 2.2 : 0.7), 2),
          contracted,
        };
        purchaseOrderLines.push(line);
        purchaseOrders.push({ id: poId, date, supplierId, plantId: plant.id, approved: true, contracted, lineIds: [id] });

        const defectJitter = Math.max(0, supplier.defectRate * (0.7 + random() * 0.75));
        const rejectedQuantity = Math.round(quantity * defectJitter);
        const promisedDate = addDays(date, supplier.leadTimeDays);
        const late = random() > supplier.onTimeDelivery;
        const delayDays = late ? Math.max(1, Math.round(supplier.deliveryVariability * (0.5 + random()))) : 0;
        deliveries.push({
          id: `DEL-${String(sequence).padStart(5, "0")}`,
          purchaseOrderLineId: id,
          promisedDate,
          deliveredDate: addDays(promisedDate, delayDays),
          quantityDelivered: quantity,
          delayDays,
        });
        const qualityId = `QLT-${String(sequence).padStart(5, "0")}`;
        qualityRecords.push({
          id: qualityId,
          purchaseOrderLineId: id,
          inspectedQuantity: quantity,
          rejectedQuantity,
          reworkCost: round(rejectedQuantity * unitPrice * 0.42, 2),
          disruptionCost: delayDays > 3 && material.criticality === "High" ? round(delayDays * 4_500, 2) : 0,
        });
        inspections.push({
          id: `INS-${String(sequence).padStart(5, "0")}`,
          qualityRecordId: qualityId,
          inspectionDate: addDays(date, supplier.leadTimeDays + delayDays),
          result: rejectedQuantity / quantity > 0.04 ? "Rejected" : rejectedQuantity > 0 ? "Conditional" : "Accepted",
          notes: rejectedQuantity > 0 ? "Dimensional or visual non-conformance recorded." : "Lot accepted to control plan.",
        });
        sequence += 1;
      }
    }
  }
  return { purchaseOrders, purchaseOrderLines, deliveries, qualityRecords, inspections };
};

const buildCapacities = (materials: Material[], suppliers: Supplier[], random: () => number): SupplierCapacity[] => {
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  return materials.flatMap((material) =>
    material.preferredSupplierIds.map((supplierId) => {
      const supplier = supplierMap.get(supplierId)!;
      const share = supplierId === material.preferredSupplierIds[0] ? 0.55 : 0.3;
      const monthlyCapacity = Math.max(
        Math.round(material.annualDemand / 12 / 0.65),
        Math.round(supplier.capacityMonthly * (0.15 + random() * 0.2)),
      );
      return {
        supplierId,
        materialId: material.id,
        monthlyCapacity,
        committedCapacity: Math.round((material.annualDemand / 12) * share),
      };
    }),
  );
};

const buildRfqs = (materials: Material[], suppliers: Supplier[], random: () => number): RFQ[] => {
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  return Array.from({ length: 24 }, (_, index) => {
    const material = materials[(index * 5 + 3) % materials.length]!;
    const lineId = `RFQL-${String(index + 1).padStart(3, "0")}`;
    const quantity = Math.round(material.annualDemand * (0.35 + (index % 4) * 0.1));
    const supplierIds = material.preferredSupplierIds.slice(0, 3);
    return {
      id: `RFQ-${String(index + 1).padStart(3, "0")}`,
      title: `${material.name} annual sourcing`,
      createdAt: isoDate(2026, (index % 6) + 1, 5 + (index % 18)),
      status: index < 16 ? "Evaluated" : "Open",
      lines: [{ id: lineId, materialId: material.id, quantity, targetDeliveryDays: 20 }],
      quotes: supplierIds.map((supplierId, quoteIndex) => {
        const supplier = supplierMap.get(supplierId)!;
        const cheapestStory = material.id === "MAT-004" && supplierId === "SUP-001";
        const priceFactor = cheapestStory ? 0.91 : supplierId === "SUP-002" ? 0.95 : 0.93 + quoteIndex * 0.025 + random() * 0.02;
        return {
          id: `Q-${String(index + 1).padStart(3, "0")}-${quoteIndex + 1}`,
          rfqId: `RFQ-${String(index + 1).padStart(3, "0")}`,
          supplierId,
          lineId,
          unitPrice: round(material.standardPrice * priceFactor, 2),
          freightPerUnit: round(material.standardPrice * (0.008 + quoteIndex * 0.004), 2),
          moq: Math.max(100, Math.round(quantity * (0.06 + quoteIndex * 0.025))),
          leadTimeDays: supplier.leadTimeDays,
          capacity: Math.round(quantity * (0.55 + random() * 0.35)),
          paymentTermsDays: supplier.paymentTermsDays,
          validityDays: 45,
        };
      }),
    };
  });
};

export const generateDemoDataset = (): ProcurementDataset => {
  const random = seededRandom(DEMO_SEED);
  const categories = buildCategories();
  const suppliers = buildSuppliers(random);
  const materials = buildMaterials(suppliers, random);
  const transactions = buildTransactions(materials, suppliers, categories, random);
  return {
    version: 1,
    generatedAt: GENERATED_AT,
    company: "Asteron Components Pvt. Ltd.",
    plants: DEMO_PLANTS,
    categories,
    suppliers,
    materials,
    ...transactions,
    capacities: buildCapacities(materials, suppliers, random),
    rfqs: buildRfqs(materials, suppliers, random),
  };
};

let cachedDataset: ProcurementDataset | undefined;

export const getDemoDataset = (): ProcurementDataset => {
  cachedDataset ??= generateDemoDataset();
  return cachedDataset;
};
