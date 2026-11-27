import { ItinerarySchema, type Itinerary } from "@/lib/schemas";
import type { ValidationIssue } from "./types";

export type ParseResult =
  | { ok: true; itinerary: Itinerary }
  | { ok: false; errors: ValidationIssue[] };

/**
 * Parse the model's raw JSON text and check it against ItinerarySchema.
 * Schema failures come back as SCHEMA issues so they can go into a retry prompt.
 */
export function parseItineraryJson(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errors: [{ code: "SCHEMA", severity: "error", message: "Response was not valid JSON." }],
    };
  }
  const result = ItinerarySchema.safeParse(data);
  if (result.success) return { ok: true, itinerary: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      code: "SCHEMA" as const,
      severity: "error" as const,
      message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    })),
  };
}
