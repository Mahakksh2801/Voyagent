import { z } from "zod";

/** What kind of trip the traveller wants. */
export const TripVibeSchema = z.enum(["beach", "mountains", "both"]);
export type TripVibe = z.infer<typeof TripVibeSchema>;

export const TRIP_VIBE_LABELS: Record<TripVibe, string> = {
  beach: "Beach parties and chill",
  mountains: "Mountain trekking",
  both: "Both",
};

/**
 * Destination preferences. Country and state are optional: when they are
 * left blank, Voyagent suggests the best countries and/or states for the vibe.
 * A state can only be given together with its country.
 */
export const DestinationPreferencesSchema = z
  .object({
    /** ISO 3166-1 alpha-2 country code, e.g. "IN". */
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Expected a 2-letter country code")
      .nullable()
      .default(null),
    /** State, province or region name within the country, e.g. "Goa". */
    state: z.string().trim().min(1).max(120).nullable().default(null),
    vibe: TripVibeSchema,
  })
  .superRefine((p, ctx) => {
    if (p.state && !p.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "Pick a country before picking a state",
      });
    }
  });

export type DestinationPreferences = z.infer<typeof DestinationPreferencesSchema>;

/**
 * The model's destination picks. It must choose from the candidate IDs it
 * was given, best first.
 */
export const DestinationSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        candidateId: z.string().min(1),
        /** One or two sentences on why this fits the traveller. */
        reason: z.string().trim().min(1).max(400),
      }),
    )
    .min(1)
    .max(5),
});

export type DestinationSuggestions = z.infer<typeof DestinationSuggestionsSchema>;
