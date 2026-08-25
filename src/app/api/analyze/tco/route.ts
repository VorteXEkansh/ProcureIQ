import { apiError, parseJson } from "@/app/api/_lib/handler";
import { tcoSchema } from "@/app/api/_lib/schemas";
import { calculateTco } from "@/domain/procurement/total-cost";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, tcoSchema);
    return Response.json({ ok: true, result: calculateTco(input) });
  } catch (error) {
    return apiError(error);
  }
}
