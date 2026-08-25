import { z } from "zod";
import { apiError, parseJson } from "@/app/api/_lib/handler";
import { getDemoDataset } from "@/data/demo/generate";
import { calculateOverview } from "@/domain/procurement/spend-analysis";
import { identifySavingsOpportunities, nonOverlappingOpportunityValue } from "@/domain/procurement/savings";
import { buildRecommendations } from "@/domain/procurement/recommendations";

const schema = z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() });

export async function POST(request: Request) {
  try {
    const filters = await parseJson(request, schema);
    const dataset = getDemoDataset();
    const opportunities = identifySavingsOpportunities(dataset);
    return Response.json({ ok: true, result: { company: dataset.company, period: filters, overview: calculateOverview(dataset, filters), opportunityValue: nonOverlappingOpportunityValue(opportunities), recommendations: buildRecommendations(dataset, opportunities) } });
  } catch (error) {
    return apiError(error);
  }
}
