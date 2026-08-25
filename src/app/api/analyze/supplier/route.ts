import { z } from "zod";
import { apiError, parseJson } from "@/app/api/_lib/handler";
import { supplierSchema, weightsSchema } from "@/app/api/_lib/schemas";
import { DEFAULT_SCORING_WEIGHTS, scoreSupplier } from "@/domain/procurement/supplier-scoring";

const schema = z.object({ supplier: supplierSchema, priceIndex: z.number().positive(), riskScore: z.number().min(0).max(100), weights: weightsSchema.optional() });

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    return Response.json({ ok: true, result: scoreSupplier(input.supplier, input.priceIndex, input.riskScore, input.weights ?? DEFAULT_SCORING_WEIGHTS) });
  } catch (error) {
    return apiError(error);
  }
}
