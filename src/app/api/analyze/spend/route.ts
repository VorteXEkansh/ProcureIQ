import { z } from "zod";
import { apiError, parseJson } from "@/app/api/_lib/handler";
import { spendLineSchema } from "@/app/api/_lib/schemas";
import { calculateConcentration, monthlySpend, spendBreakdown, totalSpend } from "@/domain/procurement/spend-analysis";

const schema = z.object({ lines: z.array(spendLineSchema).min(1).max(5_000) });

export async function POST(request: Request) {
  try {
    const { lines } = await parseJson(request, schema);
    const suppliers = spendBreakdown(lines, (line) => line.supplierId, (id) => id);
    const categories = spendBreakdown(lines, (line) => line.categoryId, (id) => id);
    return Response.json({ ok: true, result: { totalSpend: totalSpend(lines), monthly: monthlySpend(lines), suppliers, categories, concentration: calculateConcentration(suppliers) } });
  } catch (error) {
    return apiError(error);
  }
}
