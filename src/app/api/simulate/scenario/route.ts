import { z } from "zod";
import { apiError, parseJson } from "@/app/api/_lib/handler";
import { scenarioBaselineSchema, scenarioSchema } from "@/app/api/_lib/schemas";
import { simulateScenario } from "@/domain/procurement/scenario-engine";

const schema = z.object({ baseline: scenarioBaselineSchema, scenario: scenarioSchema });

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    return Response.json({ ok: true, result: simulateScenario(input.baseline, input.scenario) });
  } catch (error) {
    return apiError(error);
  }
}
