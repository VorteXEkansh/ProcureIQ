"use client";

import { useMemo, useState } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import { HorizontalBarChart, ParetoChart, SpendTrendChart } from "@/components/charts/analytics-charts";
import { Badge, Kpi, PageHeading, Section } from "@/components/ui/primitives";
import { abcSummary, classifyAbc } from "@/domain/procurement/abc-analysis";
import { paretoCutoff } from "@/domain/procurement/pareto";
import { calculatePpv } from "@/domain/procurement/ppv";
import { calculateConcentration, calculateOverview, filterLines, monthlySpend, spendBreakdown } from "@/domain/procurement/spend-analysis";
import { downloadBlob, formatInr, formatPercent } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace-store";

export function SpendModule() {
  const { dataset } = useWorkspace();
  const [categoryId, setCategoryId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2026-06-30");
  const lines = useMemo(() => filterLines(dataset.purchaseOrderLines, { categoryId: categoryId || undefined, plantId: plantId || undefined, from, to }), [categoryId, dataset.purchaseOrderLines, from, plantId, to]);
  const overview = calculateOverview(dataset, { categoryId: categoryId || undefined, plantId: plantId || undefined, from, to });
  const categoryNames = new Map(dataset.categories.map((category) => [category.id, category.name]));
  const supplierNames = new Map(dataset.suppliers.map((supplier) => [supplier.id, supplier.name]));
  const materialNames = new Map(dataset.materials.map((material) => [material.id, material.name]));
  const categories = spendBreakdown(lines, (line) => line.categoryId, (id) => categoryNames.get(id) ?? id);
  const suppliers = spendBreakdown(lines, (line) => line.supplierId, (id) => supplierNames.get(id) ?? id);
  const materials = spendBreakdown(lines, (line) => line.materialId, (id) => materialNames.get(id) ?? id);
  const abc = classifyAbc(materials);
  const summaries = abcSummary(abc);
  const pareto = paretoCutoff(materials);
  const ppv = calculatePpv(lines, dataset.materials);
  const concentration = calculateConcentration(suppliers);
  const visibleMaterials = abc.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  const reset = () => { setCategoryId(""); setPlantId(""); setFrom("2025-01-01"); setTo("2026-06-30"); setQuery(""); };
  const exportTable = () => {
    const rows = ["material,classification,spend,share,cumulative_share", ...visibleMaterials.map((item) => `"${item.label}",${item.classification},${item.spend.toFixed(2)},${item.share.toFixed(2)},${item.cumulativeShare.toFixed(2)}`)];
    downloadBlob("procureiq-spend-analysis.csv", rows.join("\n"), "text/csv;charset=utf-8");
  };

  return (
    <>
      <PageHeading eyebrow="Analyse" title="Spend intelligence" description="Trace procurement spend across category, supplier, plant and material; identify concentration, price variance and the long tail." actions={<button className="button button-secondary button-small" onClick={exportTable}><Download size={14} />Export analysis</button>} />
      <div className="filter-bar">
        <div className="select-field"><label htmlFor="spend-category">Category</label><select id="spend-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">All categories</option>{dataset.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="select-field"><label htmlFor="spend-plant">Plant</label><select id="spend-plant" value={plantId} onChange={(event) => setPlantId(event.target.value)}><option value="">All plants</option>{dataset.plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.name}</option>)}</select></div>
        <div className="field"><label htmlFor="spend-from">From</label><input id="spend-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
        <div className="field"><label htmlFor="spend-to">To</label><input id="spend-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
        <button className="button button-secondary button-small filter-reset" onClick={reset}><RotateCcw size={13} />Reset</button>
      </div>
      <div className="kpi-grid">
        <Kpi label="Filtered spend" value={formatInr(overview.totalSpend)} note={`${overview.lineCount.toLocaleString("en-IN")} PO lines`} />
        <Kpi label="Average PO line value" value={formatInr(overview.averagePo)} note="Spend ÷ measured lines" />
        <Kpi label="Top-three supplier share" value={formatPercent(concentration.top3)} note={`HHI ${concentration.hhi.toFixed(0)}`} tone={concentration.top3 > 65 ? "warning" : "neutral"} />
        <Kpi label="Maverick spend rate" value={formatPercent(overview.maverickRate)} note={formatInr(overview.maverickSpend)} tone="warning" />
      </div>
      <div className="workspace-grid">
        <Section className="span-8" title="Spend trend" description="Filters update every metric, chart and table on this page"><SpendTrendChart data={monthlySpend(lines).map((item) => ({ label: item.label, value: item.spend }))} /></Section>
        <Section className="span-4" title="Category spend" description="Ranked by total measured procurement value"><HorizontalBarChart data={categories.slice(0, 8).map((item) => ({ label: item.label, value: item.spend }))} /></Section>
      </div>
      <div className="workspace-grid">
        <Section className="span-8" title="Material Pareto" description={`${pareto.count} materials account for ${pareto.achievedShare.toFixed(1)}% of filtered spend`}><ParetoChart data={abc.slice(0, 20).map((item) => ({ label: item.label, spend: item.spend, cumulative: item.cumulativeShare }))} /></Section>
        <Section className="span-4" title="ABC management approach" description="A ≤ 80%, B ≤ 95%, C remaining cumulative spend"><div className="abc-summary">{summaries.map((item) => <div key={item.classification}><span className={`abc-label abc-${item.classification.toLowerCase()}`}>{item.classification}</span><div><strong>{item.itemCount} materials · {formatPercent(item.share)}</strong><p>{item.approach}</p></div></div>)}</div></Section>
      </div>
      <div className="workspace-grid">
        <Section className="span-12" title="Material classification and price variance" description="PPV = (actual unit price − standard price) × actual quantity" action={<div className="search-field"><Search size={14} /><input aria-label="Search materials" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search material…" /></div>}>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Material</th><th>Class</th><th className="numeric">Spend</th><th className="numeric">Share</th><th className="numeric">Cumulative</th><th className="numeric">PPV</th><th>Interpretation</th></tr></thead><tbody>{visibleMaterials.slice(0, 40).map((item) => { const variance = ppv.find((record) => record.id === item.id)?.ppv ?? 0; return <tr key={item.id}><td><strong>{item.label}</strong></td><td><Badge tone={item.classification === "A" ? "critical" : item.classification === "B" ? "warning" : "neutral"}>{item.classification}</Badge></td><td className="numeric">{formatInr(item.spend)}</td><td className="numeric">{formatPercent(item.share)}</td><td className="numeric">{formatPercent(item.cumulativeShare)}</td><td className="numeric"><strong className={variance > 0 ? "text-critical" : "text-positive"}>{formatInr(variance)}</strong></td><td>{variance > 0 ? "Adverse: paid above standard" : "Favourable: below standard"}</td></tr>; })}</tbody></table></div>
        </Section>
      </div>
    </>
  );
}
