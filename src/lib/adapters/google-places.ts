import { CandidatePlaceSchema, type CandidatePlace } from "@/lib/schemas";

/** Subset of a Places API (New) Text Search response we use. */
export interface PlacesSearchTextResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode?: string };
    formattedAddress?: string;
    location: { latitude: number; longitude: number };
    primaryType?: string;
    types?: string[];
    rating?: number;
    priceLevel?: string;
  }>;
}

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const INDOOR_TYPES = new Set([
  "museum",
  "art_gallery",
  "aquarium",
  "shopping_mall",
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "movie_theater",
  "library",
  "food_court",
  "market",
  "performing_arts_theater",
  "church",
]);

/** Normalize a Text Search response into candidate places. */
export function normalizePlacesSearch(response: PlacesSearchTextResponse): CandidatePlace[] {
  return (response.places ?? []).map((p) => {
    const types = p.types ?? (p.primaryType ? [p.primaryType] : []);
    return CandidatePlaceSchema.parse({
      placeId: p.id,
      name: p.displayName?.text ?? p.id,
      address: p.formattedAddress ?? null,
      lat: p.location.latitude,
      lng: p.location.longitude,
      category: p.primaryType ?? types[0] ?? null,
      rating: p.rating ?? null,
      priceLevel: p.priceLevel !== undefined ? (PRICE_LEVELS[p.priceLevel] ?? null) : null,
      indoor: INDOOR_TYPES.has(p.primaryType ?? "") || types.some((t) => INDOOR_TYPES.has(t)),
    });
  });
}
