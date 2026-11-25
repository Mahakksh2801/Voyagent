import { z } from "zod";

/** A candidate place, normalized from a Google Places response. */
export const CandidatePlaceSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  /** 0 (free) to 4 (very expensive); null when Google has no price level. */
  priceLevel: z.number().int().min(0).max(4).nullable(),
  /** True for places that are mostly indoors (museums, restaurants, malls). */
  indoor: z.boolean(),
});

export type CandidatePlace = z.infer<typeof CandidatePlaceSchema>;
