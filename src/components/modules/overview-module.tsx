"use client";

import Link from "next/link";
import { ArrowRight, Download, ShieldAlert } from "lucide-react";
import { HorizontalBarChart, RiskSpendChart, SpendTrendChart } from "@/components/charts/analytics-charts";
import { Badge, Kpi, PageHeading, Section } from "@/components/ui/primitives";
import { buildRecommendations } from "@/domain/procurement/recommendations";
import { nonOverlappingOpportunityValue } from "@/domain/procurement/savings";
import { calculateOverview, monthlySpend, spendBreakdown } from "@/domain/procurement/spend-analysis";
import { scoreAllSuppliers } from "@/domain/procurement/supplier-scoring";
import { formatInr, formatPercent } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace-store";

export function OverviewModule() {
  const workspace = useWorkspace();
  const { dataset, opportunities } = workspace;
  const overview = calculateOverview(dataset);
  const scores = scoreAllSuppliers(dataset, workspace.settings.scoringWeights);
  const categoryNames = new Map(dataset.categories.map((category) => [category.id, category.name]));
  const months = monthlySpend(dataset.purchaseOrderLines);
  const categories = spendBreakdown(dataset.purchaseOrderLines, (line) => line.categoryId, (id) => categoryNames.get(id) ?? id);
  const recommendations = buildRecommendations(dataset, opportunities);
  const opportunityValue = nonOverlappingOpportunityValue(opportunities);
  const risks = scores.slice(0, 18).map((entry) => ({ name: entry.supplier.name, risk: entry.risk.score, spend: entry.spend, size: entry.spendShare }));

  return (
    <>
      <PageHeading eyebrow="Executive workspace" title="Procurement overview" description="Calculated management view of spend, supplier performance, operational risk and addressable savings across Asteron Components." actions={<><Link className="button button-secondary button-small" href="/workspace/reports"><Download size={14} />Executive report</Link><Link className="button button-primary button-small" href="/workspace/savings">Review opportunities <ArrowRight size={14} /></Link></>} />
      <div className="kpi-grid">
        <Kpi label="Total procurement spend" value={formatInr(overview.totalSpend)} delta={6.8} tone="warning" />
        <Kpi label="Identified savings potential" value={formatInr(opportunityValue)} note="Overlap-adjusted estimate" tone="positive" />
        <Kpi label="Supplier performance" value={formatPercent(overview.supplierPerformance)} delta={1.9} tone="positive" />
        <Kpi label="Adverse purchase-price variance" value={formatInr(overview.adversePpv)} delta={8.3} tone="critical" />
      </div>
      <div className="kpi-grid">
        <Kpi label="High-risk suppliers" value={String(scores.filter((entry) => entry.risk.band === "High" || entry.risk.band === "Critical").length)} note="Operational risk model" tone="critical" />
        <Kpi label="On-time delivery" value={formatPercent(overview.onTimeDelivery)} delta={-1.4} tone="warning" />
        <Kpi label="Weighted rejection rate" value={formatPercent(overview.rejectionRate, 2)} delta={0.6} tone="warning" />
        <Kpi label="Maverick spend" value={formatInr(overview.maverickSpend)} note={`${formatPercent(overview.maverickRate)} of measured spend`} />
      </div>

      <div className="workspace-grid">
        <Section className="span-8" title="Monthly procurement spend" description="Transaction spend including line freight and inspection"><SpendTrendChart data={months.map((month) => ({ label: month.label, value: month.spend }))} /></Section>
        <Section className="span-4" title="Spend by category" description="Where is the procurement budget concentrated?"><HorizontalBarChart data={categories.slice(0, 8).map((category) => ({ label: category.label, value: category.spend }))} /></Section>
      </div>

      <div className="workspace-grid">
        <Section className="span-7" title="Supplier risk vs spend" description="Prioritize suppliers combining material spend with operational exposure"><RiskSpendChart data={risks} /></Section>
        <Section className="span-5" title="Management attention" description="Rule-based signals generated from current procurement evidence">
          <ol className="attention-list">
            {recommendations.slice(0, 3).map((recommendation, index) => (
              <li key={recommendation.id}>
                <span className="attention-index">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{recommendation.title}</h3><p>{recommendation.evidence.join(" · ")}</p></div>
                <span className="attention-value">{formatInr(recommendation.expectedImpact)}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <div className="workspace-grid">
        <Section className="span-12" title="Decision queue" description="Highest-value recommendations with explicit evidence, assumptions and method">
          <div className="decision-table-wrap table-scroll">
            <table className="data-table">
              <thead><tr><th>Recommendation</th><th>Evidence</th><th>Confidence</th><th className="numeric">Expected impact</th><th>Action</th></tr></thead>
              <tbody>{recommendations.map((recommendation) => <tr key={recommendation.id}><td><strong>{recommendation.title}</strong></td><td>{recommendation.evidence[0]}</td><td><Badge tone={recommendation.confidence === "High" ? "positive" : "warning"}>{recommendation.confidence}</Badge></td><td className="numeric"><strong>{formatInr(recommendation.expectedImpact)}</strong></td><td><Link href={recommendation.actionRoute} className="table-action">Review analysis <ArrowRight size={12} /></Link></td></tr>)}</tbody>
            </table>
          </div>
          <div className="privacy-note"><ShieldAlert size={15} /><span>Estimates are decision-support values, not guaranteed savings. Open each analysis to review assumptions and potential overlaps.</span></div>
        </Section>
      </div>
    </>
  );
}
