import { ZodType } from "zod";

const MAX_BODY_BYTES = 1_000_000;

export class ApiInputError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export const parseJson = async <T>(request: Request, schema: ZodType<T>): Promise<T> => {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) throw new ApiInputError("Payload exceeds the 1 MB limit.", 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new ApiInputError("Payload exceeds the 1 MB limit.", 413);
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiInputError("Request body must be valid JSON.");
  }
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiInputError(
      `Invalid request: ${result.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ")}`,
    );
  }
  return result.data;
};

export const apiError = (error: unknown): Response => {
  if (error instanceof ApiInputError) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }
  return Response.json({ ok: false, error: "Unable to complete the analysis." }, { status: 500 });
};
