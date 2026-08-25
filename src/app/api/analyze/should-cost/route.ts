import { apiError, parseJson } from "@/app/api/_lib/handler";
import { shouldCostSchema } from "@/app/api/_lib/schemas";
import { calculateShouldCost } from "@/domain/procurement/should-cost";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, shouldCostSchema);
    return Response.json({ ok: true, result: calculateShouldCost(input) });
  } catch (error) {
    return apiError(error);
  }
}
