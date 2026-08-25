# Data Model

## Core relationships

```text
Category 1 ── * Material
Supplier * ── * Category
Plant 1 ── * PurchaseOrder
PurchaseOrder 1 ── * PurchaseOrderLine
Supplier 1 ── * PurchaseOrderLine
Material 1 ── * PurchaseOrderLine
PurchaseOrderLine 1 ── 1 DeliveryRecord
PurchaseOrderLine 1 ── 1 QualityRecord
QualityRecord 1 ── 1 InspectionRecord
Material * ── * SupplierCapacity
RFQ 1 ── * RFQLine
RFQ 1 ── * SupplierQuote
```

## Demo scale

- 12 categories and 3 plants: Gurugram, Pune and Chennai.
- 36 suppliers with commercial, delivery, quality, capacity and audit attributes.
- 120 materials with standard price, annual demand, unit, category and criticality.
- 2,592 PO lines generated across January 2025–June 2026.
- One linked delivery, quality and inspection record per demo PO line.
- 24 RFQs with three supplier quotes each.

## Workspace snapshot

The IndexedDB record is versioned and contains the active dataset plus opportunity statuses, saved should-cost models, scenarios and settings. `id = "active"` is the single logical workspace. JSON backup/restore uses the same structure.

## Consistency and stories

The generator uses a fixed Mulberry32-style seeded PRNG. Supplier attributes influence generated delivery and defect records. Commodity trends influence prices. Special cases create auditable stories:

- `SUP-001` has a low quotation but weaker defects, lead time and OTD.
- `SUP-002` charges slightly more and has strong operational performance.
- `SUP-014` has explicit deterioration risk.
- `MAT-004` is a concentrated critical Aluminium Bracket.
- Packaging uses a fragmented supplier set.
- The Aluminium Bracket should-cost model contains measurable negotiation headroom.
