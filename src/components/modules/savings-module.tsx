"use client";

import { Download, Search } from "lucide-react";
import { useState } from "react";
import { Badge, Kpi, PageHeading, ProgressBar, Section } from "@/components/ui/primitives";
import { nonOverlappingOpportunityValue } from "@/domain/procurement/savings";
import { downloadBlob, formatInr } from "@/lib/format";
import { sum } from "@/lib/math";
import { useWorkspace } from "@/stores/workspace-store";
import type { OpportunityStatus } from "@/types/procurement";

const statuses: OpportunityStatus[] = ["Identified", "Reviewing", "Approved", "In Progress", "Realized", "Rejected"];
const statusTone = (status: OpportunityStatus): "neutral" | "info" | "warning" | "positive" | "critical" => status === "Realized" ? "positive" : status === "In Progress" || status === "Approved" ? "info" : status === "Reviewing" ? "warning" : status === "Rejected" ? "critical" : "neutral";

export function SavingsModule() {
  const workspace = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const opportunities = workspace.opportunities;
  const filtered = opportunities.filter((item) => (!query || `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())) && (!status || item.status === status));
  const identified = nonOverlappingOpportunityValue(opportunities.filter((item) => !["Rejected", "Realized"].includes(item.status)));
  const approved = sum(opportunities.filter((item) => ["Approved", "In Progress"].includes(item.status)).map((item) => item.estimatedValue));
  const realized = sum(opportunities.filter((item) => item.status === "Realized").map((item) => item.estimatedValue));
  const highConfidence = sum(opportunities.filter((item) => item.confidence === "High").map((item) => item.estimatedValue));
  const exportPipeline = () => downloadBlob("procureiq-savings-pipeline.csv", ["opportunity,type,supplier,estimated_value,confidence,difficulty,priority,status,suggested_action", ...filtered.map((item) => `"${item.title}",${item.type},${item.supplierId ?? ""},${item.estimatedValue.toFixed(2)},${item.confidence},${item.difficulty},${item.priority},${item.status},"${item.suggestedAction}"`)].join("\n"), "text/csv;charset=utf-8");
  return (
    <>
      <PageHeading eyebrow="Manage value" title="Savings opportunities" description="Prioritized, explainable pipeline of procurement value levers with conservative estimates and overlap controls." actions={<button className="button button-secondary button-small" onClick={exportPipeline}><Download size={14} />Export pipeline</button>} />
      <div className="kpi-grid"><Kpi label="Open identified value" value={formatInr(identified)} note="Overlap-adjusted estimate" tone="positive" /><Kpi label="Approved / in progress" value={formatInr(approved)} note="Execution pipeline" /><Kpi label="Realized" value={formatInr(realized)} note="User-managed status" /><Kpi label="High-confidence gross value" value={formatInr(highConfidence)} note="Before overlap adjustment" tone="warning" /></div>
      <div className="workspace-grid decision-card-grid">{opportunities.slice(0, 3).map((item, index) => <article className={`decision-card span-4 ${index === 0 ? "featured" : ""}`} key={item.id}><header><Badge tone={item.confidence === "High" ? "positive" : "warning"}>{item.confidence} confidence</Badge><span>Priority {item.priority}</span></header><h2>{item.title}</h2><div><small>Potential benefit</small><strong>{formatInr(item.estimatedValue)} / year</strong></div><p>{item.suggestedAction}</p><footer><span>{item.type}</span><a href="#pipeline">Review analysis</a></footer></article>)}</div>
      <Section title="Opportunity pipeline" description="Statuses persist locally in this browser" action={<div className="pipeline-filters"><div className="search-field"><Search size={14} /><input aria-label="Search opportunities" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search opportunity…" /></div><select className="compact-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter opportunity status"><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>}>
        <div className="table-scroll" id="pipeline"><table className="data-table"><thead><tr><th>Opportunity</th><th>Type</th><th className="numeric">Estimated value</th><th>Confidence</th><th>Difficulty</th><th>Priority</th><th>Suggested action</th><th>Status</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.title}</strong>{item.overlapGroup ? <small className="cell-subtitle">Overlap group: {item.overlapGroup}</small> : null}</td><td>{item.type}</td><td className="numeric"><strong>{formatInr(item.estimatedValue)}</strong></td><td><Badge tone={item.confidence === "High" ? "positive" : item.confidence === "Medium" ? "warning" : "neutral"}>{item.confidence}</Badge></td><td>{item.difficulty}</td><td><div className="priority-cell"><ProgressBar value={item.priority} tone={item.priority >= 85 ? "positive" : "gold"} /><span>{item.priority}</span></div></td><td>{item.suggestedAction}</td><td><select className="status-select" value={item.status} onChange={(event) => workspace.setOpportunityStatus(item.id, event.target.value as OpportunityStatus)} aria-label={`Status for ${item.title}`}>{statuses.map((candidate) => <option key={candidate}>{candidate}</option>)}</select><Badge tone={statusTone(item.status)}>{item.status}</Badge></td></tr>)}</tbody></table></div>
      </Section>
      <div className="assumption-note"><Badge tone="warning">Overlap control</Badge><p>Price-variance, should-cost and allocation levers can address the same spend. ProcureIQ reports the first ranked value within each overlap group in its executive total.</p></div>
    </>
  );
}
