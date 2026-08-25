import { apiError, parseJson } from "@/app/api/_lib/handler";
import { negotiationSchema } from "@/app/api/_lib/schemas";
import { simulateNegotiation } from "@/domain/procurement/negotiation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, negotiationSchema);
    return Response.json({ ok: true, result: simulateNegotiation(input) });
  } catch (error) {
    return apiError(error);
  }
}
