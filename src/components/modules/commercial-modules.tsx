"use client";

import { useMemo, useState } from "react";
import { Check, Download, Play, ShieldCheck } from "lucide-react";
import { Badge, PageHeading, ProgressBar, Section } from "@/components/ui/primitives";
import { evaluateRfq } from "@/domain/procurement/rfq-analysis";
import { optimizeSourcing } from "@/domain/procurement/sourcing-optimizer";
import { scoreAllSuppliers } from "@/domain/procurement/supplier-scoring";
import { downloadBlob, formatInr, formatNumber, formatPercent } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace-store";
import type { OptimizationResult, OptimizationSupplier } from "@/types/procurement";

export function RfqModule() {
  const { dataset, settings } = useWorkspace();
  const [rfqId, setRfqId] = useState(dataset.rfqs[0]?.id ?? "");
  const rfq = dataset.rfqs.find((item) => item.id === rfqId) ?? dataset.rfqs[0]!;
  const line = rfq.lines[0]!;
  const material = dataset.materials.find((item) => item.id === line.materialId)!;
  const analysis = evaluateRfq(dataset, rfq, settings.carryingRate);
  const exportAnalysis = () => downloadBlob(`${rfq.id}-evaluation.json`, JSON.stringify({ rfq, analysis }, null, 2), "application/json");
  return (
    <>
      <PageHeading eyebrow="Evaluate" title="RFQ analysis" description="Normalize supplier quotations for freight, expected quality, inventory, payment terms and operational risk before recommending an offer." actions={<button className="button button-secondary button-small" onClick={exportAnalysis}><Download size={14} />Export evaluation</button>} />
      <div className="rfq-selector"><div className="select-field"><label htmlFor="rfq-select">Request for quotation</label><select id="rfq-select" value={rfqId} onChange={(event) => setRfqId(event.target.value)}>{dataset.rfqs.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></div><div><span>Material</span><strong>{material.sku} · {material.name}</strong></div><div><span>Requested quantity</span><strong>{formatNumber(line.quantity)} {material.unit}</strong></div><div><span>Target lead time</span><strong>{line.targetDeliveryDays} days</strong></div><Badge tone={rfq.status === "Open" ? "info" : "positive"}>{rfq.status}</Badge></div>
      <div className="comparison-headline-grid"><article><span>Lowest quotation</span><strong>{analysis.lowestQuote?.supplierName}</strong><b>{formatInr(analysis.lowestQuote?.quotation ?? 0)}</b><p>Purchase price before adjustments</p></article><article><span>Lowest evaluated cost</span><strong>{analysis.lowestEvaluated?.supplierName}</strong><b>{formatInr(analysis.lowestEvaluated?.totalEvaluatedCost ?? 0)}</b><p>Expected annual total cost</p></article><article className="recommended"><span>Recommended offer</span><strong>{analysis.recommended?.supplierName}</strong><b>{analysis.recommended?.score.toFixed(1)}/100</b><p>Cost-performance and risk-adjusted result</p></article></div>
      <Section title="Normalized bid comparison" description={`All quotations evaluated for ${formatNumber(line.quantity)} ${material.unit} with ${(settings.carryingRate * 100).toFixed(0)}% annual carrying rate`}>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Supplier</th><th className="numeric">Unit quote</th><th className="numeric">Quotation</th><th className="numeric">Landed cost</th><th className="numeric">Quality cost</th><th className="numeric">Inventory cost</th><th className="numeric">Terms effect</th><th className="numeric">Risk adjustment</th><th className="numeric">Evaluated cost</th><th className="numeric">Score</th></tr></thead><tbody>{analysis.evaluated.map((item) => <tr key={item.quote.id}><td><strong>{item.supplierName}</strong><small className="cell-subtitle">MOQ {formatNumber(item.quote.moq)} · {item.quote.leadTimeDays} days</small></td><td className="numeric">{formatInr(item.quote.unitPrice, false)}</td><td className="numeric">{formatInr(item.quotation)}</td><td className="numeric">{formatInr(item.landedCost)}</td><td className="numeric">{formatInr(item.qualityCost)}</td><td className="numeric">{formatInr(item.inventoryCost)}</td><td className="numeric">{formatInr(item.paymentTermEffect)}</td><td className="numeric">{formatInr(item.riskAdjustment)}</td><td className="numeric"><strong>{formatInr(item.totalEvaluatedCost)}</strong></td><td className="numeric"><Badge tone={item === analysis.recommended ? "positive" : "neutral"}>{item.score}</Badge></td></tr>)}</tbody></table></div>
      </Section>
      <div className="workspace-grid rfq-evidence-grid">{analysis.evaluated.map((item) => <Section className="span-4" key={item.quote.id} title={item.supplierName} description={`Effective unit cost ${formatInr(item.effectiveUnitCost, false)}`} action={item === analysis.recommended ? <Badge tone="positive"><Check size={10} /> Recommended</Badge> : null}><div className="bid-score"><strong>{item.score}</strong><span>/ 100 evaluated score</span><ProgressBar value={item.score} tone={item.score >= 80 ? "positive" : "gold"} /><p>{item.quote.paymentTermsDays}-day terms · {formatNumber(item.quote.capacity)} capacity · {item.quote.leadTimeDays}-day lead time</p></div></Section>)}</div>
      <div className="assumption-note"><Badge tone="warning">Expected cost</Badge><p>Quality, inventory and risk adjustments are estimates based on supplier history. Award decisions should include technical approval and commercial due diligence.</p></div>
    </>
  );
}

export function OptimizerModule() {
  const { dataset, settings } = useWorkspace();
  const scores = useMemo(() => scoreAllSuppliers(dataset, settings.scoringWeights), [dataset, settings.scoringWeights]);
  const [rfqId, setRfqId] = useState(dataset.rfqs[0]?.id ?? "");
  const rfq = dataset.rfqs.find((item) => item.id === rfqId) ?? dataset.rfqs[0]!;
  const analysis = evaluateRfq(dataset, rfq, settings.carryingRate);
  const demandDefault = rfq.lines[0]?.quantity ?? 25_000;
  const [demand, setDemand] = useState(demandDefault);
  const [maxShare, setMaxShare] = useState(settings.maxSupplierShare);
  const [minQuality, setMinQuality] = useState(55);
  const [maxRisk, setMaxRisk] = useState(75);
  const [excluded, setExcluded] = useState<string[]>([]);

  const candidates: OptimizationSupplier[] = analysis.evaluated.map((item) => {
    const score = scores.find((entry) => entry.supplier.id === item.quote.supplierId)!;
    return { supplierId: item.quote.supplierId, capacity: item.quote.capacity, minimumAllocation: 0, moq: item.quote.moq, unitTco: item.effectiveUnitCost, qualityScore: score.score.quality, riskScore: score.risk.score };
  });
  const run = () => optimizeSourcing(candidates, { demand, maxSupplierShare: maxShare, minQualityScore: minQuality, maxRiskScore: maxRisk, excludedSupplierIds: excluded });
  const [result, setResult] = useState<OptimizationResult>(() => optimizeSourcing(candidates, { demand: demandDefault, maxSupplierShare: settings.maxSupplierShare, minQualityScore: 55, maxRiskScore: 75, excludedSupplierIds: [] }));
  const supplierNames = new Map(dataset.suppliers.map((supplier) => [supplier.id, supplier.name]));
  const cheapestUnit = Math.min(...candidates.map((candidate) => candidate.unitTco));
  const cheapestSingle = cheapestUnit * demand;
  const baselineCost = candidates.reduce((total, candidate, index) => total + candidate.unitTco * demand * ([.72, .18, .1][index] ?? 0), 0);
  const savings = result.feasible ? baselineCost - result.objectiveValue : 0;
  const exportOptimization = () => downloadBlob(`${rfq.id}-sourcing-optimization.json`, JSON.stringify({ constraints: { demand, maxShare, minQuality, maxRisk, excluded }, result }, null, 2), "application/json");
  return (
    <>
      <PageHeading eyebrow="Optimize" title="Sourcing optimizer" description="Minimize expected sourcing cost while satisfying demand, supplier capacity, MOQ, quality, risk and concentration constraints." actions={<button className="button button-secondary button-small" onClick={exportOptimization} disabled={!result.feasible}><Download size={14} />Export result</button>} />
      <div className="optimizer-layout">
        <Section className="optimizer-controls" title="Optimization model" description="Configure constraints, then solve locally with deterministic allocation logic">
          <div className="form-section"><div className="select-field"><label htmlFor="optimizer-rfq">RFQ / sourcing event</label><select id="optimizer-rfq" value={rfqId} onChange={(event) => { const next = dataset.rfqs.find((item) => item.id === event.target.value)!; setRfqId(next.id); setDemand(next.lines[0]?.quantity ?? 0); }}>{dataset.rfqs.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></div></div>
          <div className="form-section"><h3>Demand and allocation</h3><div className="form-grid"><div className="field"><label htmlFor="optimizer-demand">Demand quantity</label><input id="optimizer-demand" type="number" min="1" value={demand} onChange={(event) => setDemand(Number(event.target.value))} /></div><div className="field"><label htmlFor="optimizer-share">Maximum supplier share (%)</label><input id="optimizer-share" type="number" min="10" max="100" value={maxShare * 100} onChange={(event) => setMaxShare(Number(event.target.value) / 100)} /></div><div className="field"><label htmlFor="optimizer-quality">Minimum quality score</label><input id="optimizer-quality" type="number" min="0" max="100" value={minQuality} onChange={(event) => setMinQuality(Number(event.target.value))} /></div><div className="field"><label htmlFor="optimizer-risk">Maximum risk score</label><input id="optimizer-risk" type="number" min="0" max="100" value={maxRisk} onChange={(event) => setMaxRisk(Number(event.target.value))} /></div></div></div>
          <div className="form-section"><h3>Supplier eligibility</h3><div className="eligibility-list">{candidates.map((candidate) => <label key={candidate.supplierId}><input type="checkbox" checked={!excluded.includes(candidate.supplierId)} onChange={(event) => setExcluded((current) => event.target.checked ? current.filter((id) => id !== candidate.supplierId) : [...current, candidate.supplierId])} /><span><strong>{supplierNames.get(candidate.supplierId)}</strong><small>{formatNumber(candidate.capacity)} cap · MOQ {formatNumber(candidate.moq)}</small></span><Badge tone={candidate.riskScore > 55 ? "warning" : "positive"}>Risk {candidate.riskScore.toFixed(0)}</Badge></label>)}</div></div>
          <div className="optimizer-run"><button className="button button-primary" onClick={() => setResult(run())}><Play size={15} />Run optimization</button><small>Solver runs locally; no remote optimization API.</small></div>
        </Section>
        <div className="optimizer-result">
          {result.feasible ? <>
            <div className="optimizer-summary"><div><span>Optimized expected spend</span><strong>{formatInr(result.objectiveValue)}</strong><small>{formatInr(result.objectiveValue / demand, false)} per unit</small></div><div><span>Estimated savings vs current</span><strong className={savings >= 0 ? "text-positive" : "text-critical"}>{formatInr(savings)}</strong><small>{baselineCost ? formatPercent(savings / baselineCost * 100) : "0%"}</small></div><div><span>Supplier concentration HHI</span><strong>{result.concentration.toFixed(0)}</strong><small>{maxShare * 100}% maximum share</small></div></div>
            <Section title="Recommended allocation" description={`${formatNumber(result.demandFulfilled)} units fully allocated within constraints`} action={<Badge tone="positive"><ShieldCheck size={11} /> Feasible</Badge>}>
              <div className="allocation-list">{result.allocations.map((allocation, index) => <div key={allocation.supplierId}><span className="allocation-rank">{String(index + 1).padStart(2, "0")}</span><div><strong>{supplierNames.get(allocation.supplierId)}</strong><small>{formatNumber(allocation.quantity)} units · {formatInr(allocation.unitTco, false)} TCO/unit</small><ProgressBar value={allocation.share} tone={index === 0 ? "brand" : index === 1 ? "gold" : "positive"} /></div><b>{formatPercent(allocation.share)}</b></div>)}</div>
            </Section>
            <div className="optimizer-comparison"><article><span>Current allocation</span><strong>{formatInr(baselineCost)}</strong><small>72 / 18 / 10 baseline</small></article><article><span>Cheapest single supplier</span><strong>{formatInr(cheapestSingle)}</strong><small>Cost only; capacity not guaranteed</small></article><article className="recommended"><span>Optimized allocation</span><strong>{formatInr(result.objectiveValue)}</strong><small>Capacity and constraints enforced</small></article></div>
            <div className="explanation-callout"><ShieldCheck size={18} /><div><strong>Why this recommendation?</strong><p>{result.explanation} The result uses evaluated TCO, not quoted price alone, and every positive allocation respects supplier capacity and MOQ.</p></div></div>
          </> : <div className="infeasible-state"><ShieldCheck size={30} /><h2>No feasible allocation</h2><p>{result.explanation}</p><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><button className="button button-secondary button-small" onClick={() => { setMaxShare(.75); setMaxRisk(90); }}>Relax constraints</button></div>}
        </div>
      </div>
    </>
  );
}
