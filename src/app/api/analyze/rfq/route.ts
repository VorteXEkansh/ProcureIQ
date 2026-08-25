import { z } from "zod";
import { apiError, ApiInputError, parseJson } from "@/app/api/_lib/handler";
import { getDemoDataset } from "@/data/demo/generate";
import { evaluateRfq } from "@/domain/procurement/rfq-analysis";

const schema = z.object({ rfqId: z.string().max(80), carryingRate: z.number().min(0).max(1).default(0.18) });

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    const dataset = getDemoDataset();
    const rfq = dataset.rfqs.find((candidate) => candidate.id === input.rfqId);
    if (!rfq) throw new ApiInputError("RFQ not found.", 404);
    return Response.json({ ok: true, result: evaluateRfq(dataset, rfq, input.carryingRate) });
  } catch (error) {
    return apiError(error);
  }
}
