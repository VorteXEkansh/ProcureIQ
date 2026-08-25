import type { ProcurementDataset, Recommendation, SavingsOpportunity } from "@/types/procurement";
import { formatInr } from "@/lib/format";
import { scoreAllSuppliers } from "./supplier-scoring";

export const buildRecommendations = (
  dataset: ProcurementDataset,
  opportunities: SavingsOpportunity[],
): Recommendation[] => {
  const scores = scoreAllSuppliers(dataset);
  const highRisk = scores.find((entry) => entry.risk.band === "Critical" || entry.risk.band === "High");
  const topOpportunity = opportunities[0];
  const recommendations: Recommendation[] = [];
  if (topOpportunity) {
    recommendations.push({
      id: "REC-001",
      title: topOpportunity.title,
      expectedImpact: topOpportunity.estimatedValue,
      evidence: [
        `${formatInr(topOpportunity.estimatedValue)} conservative annual value`,
        `${topOpportunity.confidence} calculation confidence`,
      ],
      confidence: topOpportunity.confidence,
      assumptions: ["Historic demand remains representative", "Overlapping opportunities are not added twice"],
      methodology: `Rule-based ${topOpportunity.type.toLowerCase()} opportunity using transaction, quality and commercial data.`,
      actionRoute: topOpportunity.type === "Should-Cost Gap" ? "/workspace/should-cost" : "/workspace/savings",
    });
  }
  if (highRisk) {
    recommendations.push({
      id: "REC-002",
      title: `Reduce exposure to ${highRisk.supplier.name}`,
      expectedImpact: highRisk.spend * 0.015,
      evidence: [
        `${highRisk.risk.band} operational risk (${highRisk.risk.score}/100)`,
        `${highRisk.spendShare.toFixed(1)}% of measured spend`,
        `${(highRisk.supplier.onTimeDelivery * 100).toFixed(1)}% on-time delivery`,
      ],
      confidence: "High",
      assumptions: ["Alternative supplier capacity can be qualified", "No tooling transfer lead-time is included"],
      methodology: "Weighted operational-risk model combining delivery, quality, capacity, concentration and trend.",
      actionRoute: "/workspace/optimizer",
    });
  }
  const fragmentation = opportunities.find((opportunity) => opportunity.type === "Supplier Consolidation");
  if (fragmentation) {
    recommendations.push({
      id: "REC-003",
      title: fragmentation.title,
      expectedImpact: fragmentation.estimatedValue,
      evidence: ["Fragmented category tail", `${formatInr(fragmentation.estimatedValue)} estimated value`],
      confidence: fragmentation.confidence,
      assumptions: ["Specifications can be bundled", "Incumbent capacity supports consolidation"],
      methodology: "Category fragmentation rule with conservative addressable-spend factor.",
      actionRoute: "/workspace/spend",
    });
  }
  return recommendations;
};
