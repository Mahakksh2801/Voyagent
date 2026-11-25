import type { ValidationIssue } from "./types";

/**
 * Turn validation errors into a short message for the single retry
 * ("retry once with the errors included in the prompt").
 */
export function formatIssuesForRetry(errors: ValidationIssue[]): string {
  if (errors.length === 0) return "";
  const lines = errors.map((e, i) => `${i + 1}. [${e.code}] ${e.message}`);
  return [
    "Your previous itinerary failed validation. Fix every problem below and return the full itinerary again in the same JSON format:",
    ...lines,
  ].join("\n");
}
