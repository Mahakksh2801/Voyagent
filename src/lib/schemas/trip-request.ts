import { z } from "zod";
import { CurrencySchema, IsoDateSchema } from "./common";
import { DestinationPreferencesSchema } from "./destination";
import { UserPreferencesSchema } from "./preferences";
import { daysBetweenInclusive } from "@/lib/dates";

/** Longest trip a single generation may cover. */
export const MAX_TRIP_DAYS = 30;

/**
 * Input to itinerary generation (step 1 of the generation flow).
 * Dates, budget and currency are required. The traveller either names
 * destinations or gives destination preferences (vibe, and optionally a
 * country and state) so Voyagent can pick destinations for them.
 */
export const TripRequestSchema = z
  .object({
    destinations: z
      .array(z.string().trim().min(1, "Destination cannot be empty").max(120))
      .max(10)
      .default([]),
    destinationPreferences: DestinationPreferencesSchema.optional(),
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    budgetTotal: z.number().finite().positive("Budget must be greater than 0"),
    currency: CurrencySchema,
    preferences: UserPreferencesSchema.optional(),
  })
  .superRefine((req, ctx) => {
    if (req.destinations.length === 0 && !req.destinationPreferences) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinations"],
        message: "Enter a destination, or pick a trip vibe so Voyagent can suggest one",
      });
    }
    if (req.endDate < req.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
      return;
    }
    const days = daysBetweenInclusive(req.startDate, req.endDate);
    if (days > MAX_TRIP_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: `Trips can be at most ${MAX_TRIP_DAYS} days`,
      });
    }
  });

export type TripRequest = z.infer<typeof TripRequestSchema>;
