"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Search, ShieldAlert } from "lucide-react";
import { SpendTrendChart, WaterfallBars } from "@/components/charts/analytics-charts";
import { Badge, Kpi, PageHeading, ProgressBar, Section } from "@/components/ui/primitives";
import { calculateTco } from "@/domain/procurement/total-cost";
import { monthlySpend } from "@/domain/procurement/spend-analysis";
import { scoreAllSuppliers } from "@/domain/procurement/supplier-scoring";
import { downloadBlob, formatInr, formatNumber, formatPercent } from "@/lib/format";
import { sum, weightedAverage } from "@/lib/math";
import { useWorkspace } from "@/stores/workspace-store";
import type { Supplier } from "@/types/procurement";

const riskTone = (band: string) => band === "Critical" ? "critical" : band === "High" ? "warning" : band === "Low" ? "positive" : "neutral";

export function SuppliersModule() {
  const { dataset, settings } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scores = useMemo(() => scoreAllSuppliers(dataset, settings.scoringWeights), [dataset, settings.scoringWeights]);
  const selected = scores.find((entry) => entry.supplier.id === selectedId);
  const filtered = scores.filter((entry) => (!query || `${entry.supplier.name} ${entry.supplier.id}`.toLowerCase().includes(query.toLowerCase())) && (!status || entry.supplier.status === status));

  if (selected) {
    const supplier = selected.supplier;
    const lines = dataset.purchaseOrderLines.filter((line) => line.supplierId === supplier.id);
    const lineIds = new Set(lines.map((line) => line.id));
    const deliveries = dataset.deliveries.filter((delivery) => lineIds.has(delivery.purchaseOrderLineId));
    const quality = dataset.qualityRecords.filter((record) => lineIds.has(record.purchaseOrderLineId));
    const quantity = sum(lines.map((line) => line.quantity));
    const rejected = sum(quality.map((record) => record.rejectedQuantity));
    const monthly = monthlySpend(lines);
    const recommendations = [
      selected.risk.score > 55 ? "Qualify a secondary source and reduce critical-item concentration." : "Protect preferred capacity through a rolling forecast.",
      supplier.defectRate > 0.025 ? "Launch supplier quality containment on the highest-cost defects." : "Maintain statistical process review at the current cadence.",
      supplier.onTimeDelivery < 0.85 ? "Review lead-time variability and commit-date governance." : "Use delivery performance as leverage in volume allocation.",
    ];
    return (
      <>
        <PageHeading eyebrow="Supplier profile" title={supplier.name} description={`${supplier.id} · ${supplier.city}, ${supplier.state} · ${supplier.categoryIds.map((id) => dataset.categories.find((category) => category.id === id)?.name).filter(Boolean).join(", ")}`} actions={<><button className="button button-secondary button-small" onClick={() => setSelectedId(null)}><ArrowLeft size={14} />Directory</button><a className="button button-primary button-small" href={`/workspace/comparison?suppliers=${supplier.id},SUP-002`}>Compare supplier <ArrowRight size={14} /></a></>} />
        <div className="profile-banner"><div><Badge tone={supplier.status === "Preferred" ? "positive" : supplier.status === "Conditional" ? "warning" : "info"}>{supplier.status}</Badge><Badge tone={riskTone(selected.risk.band)}>{selected.risk.band} operational risk</Badge></div><p>Score and risk are calculated from actual demo transactions and supplier attributes. No external credit data is used.</p></div>
        <div className="kpi-grid">
          <Kpi label="Annualized spend" value={formatInr(selected.spend / 1.5)} note={`${formatPercent(selected.spendShare)} measured share`} />
          <Kpi label="Overall supplier score" value={`${selected.score.overall}/100`} note="Editable weighted model" tone={selected.score.overall >= 80 ? "positive" : "warning"} />
          <Kpi label="On-time delivery" value={formatPercent(deliveries.length ? deliveries.filter((delivery) => delivery.delayDays === 0).length / deliveries.length * 100 : 0)} note={`${deliveries.length} measured deliveries`} />
          <Kpi label="Actual rejection rate" value={formatPercent(quantity ? rejected / quantity * 100 : 0, 2)} note={`${formatNumber(rejected)} rejected units`} tone={supplier.defectRate > .025 ? "critical" : "neutral"} />
        </div>
        <div className="workspace-grid">
          <Section className="span-8" title="Supplier spend trend" description="Measured procurement value across the reporting period"><SpendTrendChart data={monthly.map((item) => ({ label: item.label, value: item.spend }))} /></Section>
          <Section className="span-4" title="Performance scorecard" description="Higher is better; risk component is inverted"><div className="scorecard-list">{(["cost", "quality", "delivery", "reliability", "commercial", "risk"] as const).map((key) => <div key={key}><span>{key}</span><strong>{selected.score[key].toFixed(1)}</strong><ProgressBar value={selected.score[key]} tone={selected.score[key] < 60 ? "critical" : selected.score[key] < 75 ? "gold" : "positive"} /></div>)}</div></Section>
        </div>
        <div className="workspace-grid">
          <Section className="span-6" title="Commercial and capacity profile"><ul className="metric-list panel-body"><li><span>Payment terms</span><strong>{supplier.paymentTermsDays} days</strong></li><li><span>Nominal lead time</span><strong>{supplier.leadTimeDays} days</strong></li><li><span>Monthly capacity</span><strong>{formatNumber(supplier.capacityMonthly)}</strong></li><li><span>Commercial flexibility</span><strong>{supplier.commercialFlexibility}/100</strong></li><li><span>Process audit</span><strong>{supplier.audited ? "Completed" : "Pending"}</strong></li></ul></Section>
          <Section className="span-6" title="Strengths, concerns and recommended actions"><div className="recommendation-list">{recommendations.map((recommendation, index) => <div key={recommendation}><span>{String(index + 1).padStart(2, "0")}</span><p>{recommendation}</p></div>)}</div></Section>
        </div>
      </>
    );
  }

  const exportDirectory = () => {
    const rows = ["supplier_id,supplier,annualized_spend,overall_score,otd,defect_rate,risk,status", ...filtered.map((entry) => `${entry.supplier.id},"${entry.supplier.name}",${(entry.spend / 1.5).toFixed(2)},${entry.score.overall},${entry.supplier.onTimeDelivery},${entry.supplier.defectRate},${entry.risk.score},${entry.supplier.status}`)];
    downloadBlob("procureiq-supplier-directory.csv", rows.join("\n"), "text/csv;charset=utf-8");
  };
  return (
    <>
      <PageHeading eyebrow="Evaluate" title="Suppliers" description="Transparent performance and operational-risk view across all approved, preferred and conditional suppliers." actions={<button className="button button-secondary button-small" onClick={exportDirectory}><Download size={14} />Export directory</button>} />
      <div className="kpi-grid"><Kpi label="Active suppliers" value={String(scores.length)} note={`${scores.filter((item) => item.supplier.status === "Preferred").length} preferred`} /><Kpi label="Weighted average score" value={`${weightedAverage(scores.map((item) => ({ value: item.score.overall, weight: item.spend }))).toFixed(1)}/100`} note="Spend weighted" /><Kpi label="High-risk suppliers" value={String(scores.filter((item) => item.risk.score >= 55).length)} note="Operational risk ≥ 55" tone="critical" /><Kpi label="Conditional status" value={String(scores.filter((item) => item.supplier.status === "Conditional").length)} note="Require management attention" tone="warning" /></div>
      <Section title="Supplier performance directory" description="Select a supplier to open the transaction-backed performance profile">
        <div className="table-toolbar"><div className="search-field"><Search size={14} /><input aria-label="Search suppliers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier or ID…" /></div><select className="compact-select" aria-label="Filter supplier status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>Preferred</option><option>Approved</option><option>Conditional</option></select></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Supplier</th><th>Status</th><th className="numeric">Annual spend</th><th className="numeric">Cost</th><th className="numeric">Quality</th><th className="numeric">Delivery</th><th className="numeric">Overall</th><th className="numeric">OTD</th><th className="numeric">Defect rate</th><th>Risk</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.supplier.id}><td><button className="link-button" onClick={() => setSelectedId(entry.supplier.id)}>{entry.supplier.name}</button><small className="cell-subtitle">{entry.supplier.id} · {entry.supplier.city}</small></td><td><Badge tone={entry.supplier.status === "Preferred" ? "positive" : entry.supplier.status === "Conditional" ? "warning" : "info"}>{entry.supplier.status}</Badge></td><td className="numeric">{formatInr(entry.spend / 1.5)}</td><td className="numeric">{entry.score.cost.toFixed(1)}</td><td className="numeric">{entry.score.quality.toFixed(1)}</td><td className="numeric">{entry.score.delivery.toFixed(1)}</td><td className="numeric"><strong>{entry.score.overall.toFixed(1)}</strong></td><td className="numeric">{formatPercent(entry.supplier.onTimeDelivery * 100)}</td><td className="numeric">{formatPercent(entry.supplier.defectRate * 100, 2)}</td><td><Badge tone={riskTone(entry.risk.band)}>{entry.risk.band} · {entry.risk.score.toFixed(0)}</Badge></td></tr>)}</tbody></table></div>
      </Section>
    </>
  );
}

interface ComparisonRow {
  supplier: Supplier;
  score: ReturnType<typeof scoreAllSuppliers>[number];
  quotation: number;
  tco: ReturnType<typeof calculateTco>;
}

export function ComparisonModule() {
  const { dataset, settings } = useWorkspace();
  const [materialId, setMaterialId] = useState("MAT-004");
  const material = dataset.materials.find((item) => item.id === materialId) ?? dataset.materials[0]!;
  const [selectedIds, setSelectedIds] = useState<string[]>(["SUP-001", "SUP-002", "SUP-003"]);
  const scores = scoreAllSuppliers(dataset, settings.scoringWeights);
  const candidateIds = material.preferredSupplierIds.length >= 2 ? material.preferredSupplierIds : dataset.suppliers.slice(0, 5).map((supplier) => supplier.id);
  const rows: ComparisonRow[] = selectedIds.flatMap((supplierId) => {
    const supplier = dataset.suppliers.find((item) => item.id === supplierId);
    const score = scores.find((item) => item.supplier.id === supplierId);
    if (!supplier || !score) return [];
    const lines = dataset.purchaseOrderLines.filter((line) => line.materialId === material.id && line.supplierId === supplierId);
    const unitPrice = weightedAverage(lines.map((line) => ({ value: line.unitPrice, weight: line.quantity }))) || material.standardPrice;
    const freight = sum(lines.map((line) => line.freight));
    const quantity = sum(lines.map((line) => line.quantity));
    const quotation = unitPrice * material.annualDemand;
    return [{
      supplier,
      score,
      quotation,
      tco: calculateTco({ annualQuantity: material.annualDemand, unitPrice, freightPerUnit: quantity ? freight / quantity : unitPrice * .015, inspectionPerUnit: material.criticality === "High" ? 2.2 : .7, rejectionRate: supplier.defectRate, reworkPerRejectedUnit: unitPrice * 1.45, leadTimeDays: supplier.leadTimeDays, dailyDemand: material.annualDemand / 365, carryingRate: settings.carryingRate, delayProbability: 1 - supplier.onTimeDelivery, delayCostPerEvent: 165_000, administrationAnnual: 42_000 }),
    }];
  });
  const cheapest = [...rows].sort((a, b) => a.quotation - b.quotation)[0];
  const recommended = [...rows].sort((a, b) => a.tco.annualTco - b.tco.annualTco || b.score.score.overall - a.score.score.overall)[0];
  const toggleSupplier = (id: string) => setSelectedIds((current) => current.includes(id) ? current.length > 2 ? current.filter((item) => item !== id) : current : current.length < 5 ? [...current, id] : current);
  const difference = cheapest && recommended ? cheapest.tco.annualTco - recommended.tco.annualTco : 0;

  return (
    <>
      <PageHeading eyebrow="Compare" title="Supplier comparison" description="Separate quoted price from expected total cost, supplier performance, capacity and operational risk." />
      <div className="comparison-controls"><div className="select-field"><label htmlFor="comparison-material">Material</label><select id="comparison-material" value={materialId} onChange={(event) => { const next = dataset.materials.find((item) => item.id === event.target.value)!; setMaterialId(next.id); setSelectedIds(next.preferredSupplierIds.slice(0, 3)); }}>{dataset.materials.map((item) => <option value={item.id} key={item.id}>{item.sku} · {item.name}</option>)}</select></div><div className="supplier-chips" aria-label="Select two to five suppliers">{candidateIds.map((id) => { const supplier = dataset.suppliers.find((item) => item.id === id)!; return <button key={id} className={selectedIds.includes(id) ? "selected" : ""} onClick={() => toggleSupplier(id)}>{supplier.name}<span>{selectedIds.includes(id) ? "Included" : "Add"}</span></button>; })}</div></div>
      <div className="comparison-headline-grid"><article><span>Lowest quotation</span><strong>{cheapest?.supplier.name}</strong><b>{formatInr(cheapest?.quotation ?? 0)}</b><p>Purchase price only</p></article><article className="recommended"><span>Recommended supplier</span><strong>{recommended?.supplier.name}</strong><b>{formatInr(recommended?.tco.annualTco ?? 0)}</b><p>Lowest evaluated annual total cost</p></article><article><span>Decision impact</span><strong>{difference > 0 ? formatInr(difference) : "Best quote retained"}</strong><b>{recommended?.score.score.overall.toFixed(1)}/100</b><p>Expected annual TCO difference · supplier score</p></article></div>
      {cheapest && recommended ? <div className="explanation-callout"><ShieldAlert size={18} /><div><strong>Why this supplier?</strong><p>{recommended.supplier.name} is recommended {cheapest.supplier.id !== recommended.supplier.id ? `despite ${formatInr(recommended.quotation - cheapest.quotation)} higher quoted annual cost` : "at the lowest quote"} because quality, inventory, freight and expected delay effects create {formatInr(Math.abs(difference))} {difference > 0 ? "lower" : "comparable"} expected annual total cost.</p></div></div> : null}
      <div className="workspace-grid">
        {rows.map((row) => <Section className="span-4 supplier-compare-card" key={row.supplier.id} title={row.supplier.name} description={`${row.supplier.id} · ${row.supplier.city}`} action={row.supplier.id === recommended?.supplier.id ? <Badge tone="positive">Recommended</Badge> : row.supplier.id === cheapest?.supplier.id ? <Badge tone="gold">Lowest quote</Badge> : null}><WaterfallBars items={[{ label: "Purchase", value: row.tco.purchase }, { label: "Freight", value: row.tco.freight }, { label: "Quality", value: row.tco.quality, tone: "critical" }, { label: "Inventory", value: row.tco.inventory, tone: "gold" }, { label: "Delay", value: row.tco.delay, tone: "critical" }]} /><div className="compare-total"><span>Effective unit cost</span><strong>{formatInr(row.tco.effectiveUnitCost, false)}</strong></div></Section>)}
      </div>
      <Section title="Normalized supplier comparison" description="Every measure uses the same annual demand and carrying-rate assumptions"><div className="table-scroll"><table className="data-table"><thead><tr><th>Supplier</th><th className="numeric">Quote</th><th className="numeric">Landed + inspection</th><th className="numeric">Quality</th><th className="numeric">Inventory</th><th className="numeric">Delay</th><th className="numeric">Annual TCO</th><th className="numeric">Score</th><th className="numeric">Risk</th></tr></thead><tbody>{rows.map((row) => <tr key={row.supplier.id}><td><strong>{row.supplier.name}</strong></td><td className="numeric">{formatInr(row.quotation)}</td><td className="numeric">{formatInr(row.tco.purchase + row.tco.freight + row.tco.inspection)}</td><td className="numeric">{formatInr(row.tco.quality)}</td><td className="numeric">{formatInr(row.tco.inventory)}</td><td className="numeric">{formatInr(row.tco.delay)}</td><td className="numeric"><strong>{formatInr(row.tco.annualTco)}</strong></td><td className="numeric">{row.score.score.overall}</td><td className="numeric"><Badge tone={riskTone(row.score.risk.band)}>{row.score.risk.score}</Badge></td></tr>)}</tbody></table></div></Section>
    </>
  );
}
