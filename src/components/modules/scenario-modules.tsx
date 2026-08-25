"use client";

import { useState } from "react";
import { Play, Save } from "lucide-react";
import { Badge, Kpi, PageHeading, ProgressBar, Section } from "@/components/ui/primitives";
import { simulateNegotiation } from "@/domain/procurement/negotiation";
import { PREDEFINED_SCENARIOS, simulateScenario, type ScenarioBaseline } from "@/domain/procurement/scenario-engine";
import { calculateOverview } from "@/domain/procurement/spend-analysis";
import { formatInr, formatNumber, formatPercent } from "@/lib/format";
import { sum } from "@/lib/math";
import { useWorkspace } from "@/stores/workspace-store";
import type { NegotiationScenario, Scenario } from "@/types/procurement";

export function NegotiationModule() {
  const [scenario, setScenario] = useState<NegotiationScenario>({ annualQuantity: 48_000, currentUnitPrice: 1_264, discountRate: .04, currentMoq: 1_000, proposedMoq: 4_000, carryingRate: .18, paymentTermChangeDays: 15, freightChangePerUnit: 0, rejectionRateChange: 0 });
  const result = simulateNegotiation(scenario);
  const update = (key: keyof NegotiationScenario, value: number) => setScenario((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeading eyebrow="Simulate" title="Negotiation lab" description="Test commercial offers against inventory, working capital, freight and quality economics before accepting the headline discount." />
      <div className="negotiation-brief"><div><Badge tone="gold">Supplier offer</Badge><h2>{formatPercent(scenario.discountRate * 100)} discount if MOQ increases to {formatNumber(scenario.proposedMoq)}</h2><p>Aluminium Bracket · annual commitment {formatNumber(scenario.annualQuantity)} units</p></div><div className={result.netValue >= 0 ? "positive" : "negative"}><span>Net annual value</span><strong>{formatInr(result.netValue)}</strong><small>{result.netValue >= 0 ? "Commercially favourable" : "Value destructive"}</small></div></div>
      <div className="workspace-grid">
        <Section className="span-5" title="Commercial assumptions" description="Change any input to recalculate negotiation economics"><div className="form-section"><div className="form-grid"><div className="field"><label htmlFor="neg-price">Current unit price (₹)</label><input id="neg-price" type="number" min="0" value={scenario.currentUnitPrice} onChange={(event) => update("currentUnitPrice", Number(event.target.value))} /></div><div className="field"><label htmlFor="neg-volume">Annual quantity</label><input id="neg-volume" type="number" min="1" value={scenario.annualQuantity} onChange={(event) => update("annualQuantity", Number(event.target.value))} /></div><div className="field"><label htmlFor="neg-discount">Discount (%)</label><input id="neg-discount" type="number" min="0" max="100" step=".1" value={scenario.discountRate * 100} onChange={(event) => update("discountRate", Number(event.target.value) / 100)} /></div><div className="field"><label htmlFor="neg-current-moq">Current MOQ</label><input id="neg-current-moq" type="number" min="0" value={scenario.currentMoq} onChange={(event) => update("currentMoq", Number(event.target.value))} /></div><div className="field"><label htmlFor="neg-proposed-moq">Proposed MOQ</label><input id="neg-proposed-moq" type="number" min="0" value={scenario.proposedMoq} onChange={(event) => update("proposedMoq", Number(event.target.value))} /></div><div className="field"><label htmlFor="neg-carry">Carrying rate (%)</label><input id="neg-carry" type="number" min="0" max="100" value={scenario.carryingRate * 100} onChange={(event) => update("carryingRate", Number(event.target.value) / 100)} /></div><div className="field"><label htmlFor="neg-terms">Payment-term change (days)</label><input id="neg-terms" type="number" min="-180" max="180" value={scenario.paymentTermChangeDays} onChange={(event) => update("paymentTermChangeDays", Number(event.target.value))} /></div><div className="field"><label htmlFor="neg-freight">Freight change (₹/unit)</label><input id="neg-freight" type="number" value={scenario.freightChangePerUnit} onChange={(event) => update("freightChangePerUnit", Number(event.target.value))} /></div></div></div></Section>
        <Section className="span-7" title="Net value bridge" description="Headline savings less working-capital and operating consequences"><div className="negotiation-bridge"><div><span>Price savings</span><strong className="text-positive">+{formatInr(result.priceSavings)}</strong><ProgressBar value={100} tone="positive" /></div><div><span>Additional inventory carrying cost</span><strong className="text-critical">−{formatInr(result.inventoryCost)}</strong><ProgressBar value={result.priceSavings ? result.inventoryCost / result.priceSavings * 100 : 0} tone="critical" /></div><div><span>Payment-term value</span><strong className="text-positive">+{formatInr(result.paymentTermValue)}</strong><ProgressBar value={result.priceSavings ? Math.abs(result.paymentTermValue) / result.priceSavings * 100 : 0} /></div><div><span>Freight and quality impact</span><strong className={result.freightImpact + result.qualityImpact > 0 ? "text-critical" : "text-positive"}>{formatInr(-(result.freightImpact + result.qualityImpact))}</strong><ProgressBar value={result.priceSavings ? Math.abs(result.freightImpact + result.qualityImpact) / result.priceSavings * 100 : 0} tone="gold" /></div></div><div className="net-value-total"><span>Net annual negotiation value</span><strong>{formatInr(result.netValue)}</strong></div></Section>
      </div>
      <div className="kpi-grid"><Kpi label="Break-even MOQ" value={formatNumber(result.breakEvenMoq)} note="Largest MOQ before discount is erased" tone="warning" /><Kpi label="Minimum required discount" value={formatPercent(result.minimumDiscount, 2)} note="At proposed MOQ and current side effects" /><Kpi label="Additional average inventory" value={formatNumber(result.additionalInventory)} note={`${result.inventoryDays} days of annual demand`} /><Kpi label="Working-capital benefit" value={formatInr(result.paymentTermValue)} note={`${scenario.paymentTermChangeDays} additional term days`} tone="positive" /></div>
      <div className="assumption-note"><Badge tone="info">Decision rule</Badge><p>Accept when net value remains positive after the supplier discount, incremental average inventory, carrying cost, terms, freight and expected quality impact.</p></div>
    </>
  );
}

export function ScenarioModule() {
  const workspace = useWorkspace();
  const overview = calculateOverview(workspace.dataset);
  const freight = sum(workspace.dataset.purchaseOrderLines.map((line) => line.freight));
  const qualityCost = sum(workspace.dataset.qualityRecords.map((record) => record.reworkCost + record.disruptionCost));
  const baseline: ScenarioBaseline = { spend: overview.totalSpend, tco: overview.totalSpend + freight + qualityCost + overview.totalSpend * .012, demand: sum(workspace.dataset.materials.map((material) => material.annualDemand)), freight, inventory: overview.totalSpend * .012, qualityCost, riskScore: 38, savings: overview.identifiedOpportunity };
  const [scenario, setScenario] = useState<Scenario>(() => structuredClone(PREDEFINED_SCENARIOS[4]!));
  const [result, setResult] = useState(() => simulateScenario(baseline, scenario));
  const run = () => setResult(simulateScenario(baseline, scenario));
  const update = (key: keyof Scenario, value: number | string) => setScenario((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeading eyebrow="Stress test" title="Scenario lab" description="Compare baseline procurement economics with demand, commodity, freight, quality, lead-time and supplier-capacity shocks." actions={<button className="button button-secondary button-small" onClick={() => workspace.saveScenario({ ...scenario, id: scenario.id.startsWith("SCN-") ? `${scenario.id}-${Date.now()}` : scenario.id })}><Save size={14} />Save scenario</button>} />
      <div className="scenario-presets">{PREDEFINED_SCENARIOS.map((preset) => <button key={preset.id} className={scenario.name === preset.name ? "active" : ""} onClick={() => { const clone = structuredClone(preset); setScenario(clone); setResult(simulateScenario(baseline, clone)); }}><span>{preset.name}</span><small>{preset.name === "Demand Surge" ? "+20% demand" : preset.name === "Commodity Inflation" ? "+12% raw material" : preset.name === "Freight Shock" ? "+25% freight" : preset.name === "Supplier Capacity Loss" ? "−40% major capacity" : "Defect rate deterioration"}</small></button>)}</div>
      <div className="workspace-grid">
        <Section className="span-4" title="Scenario assumptions" description="Percentage changes relative to measured baseline"><div className="form-section"><div className="form-grid"><div className="field"><label htmlFor="scn-name">Scenario name</label><input id="scn-name" value={scenario.name} onChange={(event) => update("name", event.target.value)} /></div>{(["demandChange", "rawMaterialChange", "quotationChange", "freightChange", "leadTimeChange", "defectRateChange", "capacityChange", "carryingRateChange"] as const).map((key) => <div className="field" key={key}><label htmlFor={`scn-${key}`}>{key.replace(/([A-Z])/g, " $1").replace("Change", " change")} (%)</label><input id={`scn-${key}`} type="number" step="1" value={scenario[key] * 100} onChange={(event) => update(key, Number(event.target.value) / 100)} /></div>)}</div></div><div className="optimizer-run"><button className="button button-primary" onClick={run}><Play size={15} />Run scenario</button></div></Section>
        <div className="span-8">
          <div className="scenario-comparison-grid"><article><span>Metric</span><b>Baseline</b><b>{result.name}</b><em>Delta</em></article>{[
            ["Procurement spend", baseline.spend, result.spend, result.deltas.spend, true],
            ["Expected TCO", baseline.tco, result.tco, result.deltas.tco, true],
            ["Savings potential", baseline.savings, result.savings, result.deltas.savings, true],
            ["Operational risk", baseline.riskScore, result.riskScore, result.deltas.riskScore, false],
            ["Inventory carrying", baseline.inventory, result.inventory, result.inventory - baseline.inventory, true],
            ["Quality cost", baseline.qualityCost, result.qualityCost, result.qualityCost - baseline.qualityCost, true],
          ].map(([label, before, after, delta, currency]) => <article key={String(label)}><span>{label}</span><b>{currency ? formatInr(Number(before)) : `${Number(before).toFixed(1)}/100`}</b><b>{currency ? formatInr(Number(after)) : `${Number(after).toFixed(1)}/100`}</b><em className={Number(delta) > 0 && label !== "Savings potential" ? "negative" : Number(delta) < 0 ? "positive" : ""}>{Number(delta) >= 0 ? "+" : ""}{currency ? formatInr(Number(delta)) : Number(delta).toFixed(1)}</em></article>)}</div>
          <div className="explanation-callout scenario-insight"><Badge tone={result.riskScore >= 55 ? "critical" : "warning"}>Decision impact</Badge><div><strong>{result.name} changes the preferred sourcing posture.</strong><p>Expected TCO changes by {formatInr(result.deltas.tco)} and operational risk by {result.deltas.riskScore >= 0 ? "+" : ""}{result.deltas.riskScore}. Re-run the sourcing optimizer with adjusted demand and capacity before committing allocation.</p></div></div>
        </div>
      </div>
    </>
  );
}
