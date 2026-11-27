import { eachDate } from "@/lib/dates";
import type { DestinationPreferences, TripVibe } from "@/lib/schemas";
import { DESTINATION_CATALOG, type CatalogDestination } from "./catalog";

export interface DestinationCandidate extends CatalogDestination {
  /** Higher is better. Vibe fit dominates; season breaks ties. */
  score: number;
  /** Share of trip days that fall in the destination's best months, 0 to 1. */
  seasonFit: number;
}

export type DestinationPlan =
  /** Country and state both given: nothing to suggest. */
  | { mode: "fixed"; destination: string }
  /** Something left blank: rank candidates for the model (or the user) to pick from. */
  | { mode: "suggest"; scope: "country" | "world"; candidates: DestinationCandidate[] }
  /** A country was given that the catalog has no destinations for. */
  | { mode: "no_candidates"; reason: string };

export const MAX_CANDIDATES = 8;

/**
 * Decide what destination work is needed for the preferences:
 * - country + state: use them as is
 * - country only: rank that country's states for the vibe and season
 * - neither: rank destinations worldwide, at most two per country so the
 *   shortlist covers several countries
 */
export function planDestinations(
  prefs: DestinationPreferences,
  trip: { startDate: string; endDate: string },
  catalog: readonly CatalogDestination[] = DESTINATION_CATALOG,
): DestinationPlan {
  if (prefs.country && prefs.state) {
    return { mode: "fixed", destination: `${prefs.state}, ${countryName(prefs.country, catalog)}` };
  }

  const pool = prefs.country ? catalog.filter((d) => d.country === prefs.country) : catalog;
  if (prefs.country && pool.length === 0) {
    return {
      mode: "no_candidates",
      reason: `Voyagent doesn't have suggestions for ${countryName(prefs.country, catalog)} yet. Enter a state or city instead.`,
    };
  }

  const months = tripMonths(trip.startDate, trip.endDate);
  const ranked = pool
    .map((d) => score(d, prefs.vibe, months))
    .filter((c): c is DestinationCandidate => c !== null)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const candidates = prefs.country ? ranked.slice(0, MAX_CANDIDATES) : diversify(ranked, 2).slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) {
    return {
      mode: "no_candidates",
      reason: `No ${prefs.vibe === "beach" ? "beach" : "mountain"} destinations found for ${countryName(prefs.country!, catalog)}.`,
    };
  }
  return { mode: "suggest", scope: prefs.country ? "country" : "world", candidates };
}

function score(d: CatalogDestination, vibe: TripVibe, months: number[]): DestinationCandidate | null {
  let vibeScore: number;
  if (vibe === "both") {
    // Places that offer both rank first; single-vibe places stay as fallbacks.
    vibeScore = d.vibes.length === 2 ? 2 : 1;
  } else {
    if (!d.vibes.includes(vibe)) return null;
    vibeScore = 2;
  }
  const inSeason = months.filter((m) => d.bestMonths.includes(m)).length;
  const seasonFit = months.length ? inSeason / months.length : 0;
  return { ...d, seasonFit, score: vibeScore * 10 + seasonFit * 5 };
}

/** Day-weighted list of trip months, e.g. a trip over a month end counts each day's month. */
function tripMonths(start: string, end: string): number[] {
  return eachDate(start, end).map((d) => Number(d.slice(5, 7)));
}

function diversify(ranked: DestinationCandidate[], perCountry: number): DestinationCandidate[] {
  const counts = new Map<string, number>();
  return ranked.filter((c) => {
    const n = counts.get(c.country) ?? 0;
    counts.set(c.country, n + 1);
    return n < perCountry;
  });
}

function countryName(code: string, catalog: readonly CatalogDestination[]): string {
  const fromCatalog = catalog.find((d) => d.country === code)?.countryName;
  if (fromCatalog) return fromCatalog;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
