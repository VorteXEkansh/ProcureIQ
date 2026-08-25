import { z } from "zod";
import { apiError, parseJson } from "@/app/api/_lib/handler";
import { optimizationConstraintSchema, optimizationSupplierSchema } from "@/app/api/_lib/schemas";
import { optimizeSourcing } from "@/domain/procurement/sourcing-optimizer";

const schema = z.object({ suppliers: z.array(optimizationSupplierSchema).min(1).max(100), constraints: optimizationConstraintSchema });

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    return Response.json({ ok: true, result: optimizeSourcing(input.suppliers, input.constraints) });
  } catch (error) {
    return apiError(error);
  }
}
