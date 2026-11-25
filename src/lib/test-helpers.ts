import { normalizeOwmDaily, normalizePlacesSearch } from "@/lib/adapters";
import { lisbonOwmResponse, lisbonPlacesResponse, lisbonTripRequest } from "@/mocks/lisbon";
import type { Itinerary } from "@/lib/schemas";
import type { ValidationContext } from "@/lib/validation";

export function lisbonContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    startDate: lisbonTripRequest.startDate,
    endDate: lisbonTripRequest.endDate,
    budgetTotal: lisbonTripRequest.budgetTotal,
    currency: lisbonTripRequest.currency,
    candidates: normalizePlacesSearch(lisbonPlacesResponse),
    forecasts: normalizeOwmDaily(lisbonOwmResponse),
    ...overrides,
  };
}

/** Deep copy so tests can mutate fixtures freely. */
export function clone(it: Itinerary): Itinerary {
  return structuredClone(it);
}
