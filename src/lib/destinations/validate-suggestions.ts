import { DestinationSuggestionsSchema, type DestinationSuggestions } from "@/lib/schemas";
import type { DestinationCandidate } from "./candidates";

export type SuggestionCheck =
  | { ok: true; suggestions: Array<DestinationSuggestions["suggestions"][number] & { destination: DestinationCandidate }> }
  | { ok: false; errors: string[] };

/**
 * Check the model's destination picks: valid JSON matching the schema, every
 * pick from the candidate list, and no repeats.
 */
export function validateDestinationSuggestions(raw: string, candidates: DestinationCandidate[]): SuggestionCheck {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["Response was not valid JSON."] };
  }
  const parsed = DestinationSuggestionsSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const s of parsed.data.suggestions) {
    if (!byId.has(s.candidateId)) errors.push(`"${s.candidateId}" is not in the candidate list.`);
    if (seen.has(s.candidateId)) errors.push(`"${s.candidateId}" is suggested more than once.`);
    seen.add(s.candidateId);
  }
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    suggestions: parsed.data.suggestions.map((s) => ({ ...s, destination: byId.get(s.candidateId)! })),
  };
}

/** Fallback when the model is unavailable: the top-ranked candidates with their highlights. */
export function fallbackSuggestions(candidates: DestinationCandidate[], count = 3) {
  return candidates.slice(0, count).map((c) => ({ candidateId: c.id, reason: c.highlights, destination: c }));
}
