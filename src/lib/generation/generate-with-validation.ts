import type { Itinerary } from "@/lib/schemas";
import {
  formatIssuesForRetry,
  parseItineraryJson,
  validateItinerary,
  type ValidationContext,
  type ValidationIssue,
} from "@/lib/validation";

/**
 * Produces raw itinerary JSON. In production this will call OpenAI with the
 * candidates and constraints; tests pass a mock. `retryFeedback` is set on the
 * second attempt and holds the previous attempt's errors.
 */
export type ItineraryGenerator = (retryFeedback: string | null) => Promise<string>;

export type GenerationOutcome =
  | { ok: true; itinerary: Itinerary; attempts: number; warnings: ValidationIssue[] }
  | { ok: false; attempts: number; errors: ValidationIssue[] };

const MAX_ATTEMPTS = 2; // first try + one retry with errors in the prompt

/** Steps 3-4 of the generation flow: generate, validate, retry once on failure. */
export async function generateWithValidation(
  generate: ItineraryGenerator,
  ctx: ValidationContext,
): Promise<GenerationOutcome> {
  let feedback: string | null = null;
  let lastErrors: ValidationIssue[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await generate(feedback);
    const parsed = parseItineraryJson(raw);
    if (!parsed.ok) {
      lastErrors = parsed.errors;
    } else {
      const result = validateItinerary(parsed.itinerary, ctx);
      if (result.valid) {
        return { ok: true, itinerary: parsed.itinerary, attempts: attempt, warnings: result.warnings };
      }
      lastErrors = result.errors;
    }
    feedback = formatIssuesForRetry(lastErrors);
  }
  return { ok: false, attempts: MAX_ATTEMPTS, errors: lastErrors };
}
