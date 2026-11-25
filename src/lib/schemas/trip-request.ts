import { z } from "zod";
import { CurrencySchema, IsoDateSchema } from "./common";
import { UserPreferencesSchema } from "./preferences";
import { daysBetweenInclusive } from "@/lib/dates";

/** Longest trip a single generation may cover. */
export const MAX_TRIP_DAYS = 30;

/**
 * Input to itinerary generation (step 1 of the generation flow).
 * Destination, dates, budget and currency are required.
 */
export const TripRequestSchema = z
  .object({
    destinations: z
      .array(z.string().trim().min(1, "Destination cannot be empty").max(120))
      .min(1, "At least one destination is required")
      .max(10),
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    budgetTotal: z.number().finite().positive("Budget must be greater than 0"),
    currency: CurrencySchema,
    preferences: UserPreferencesSchema.optional(),
  })
  .superRefine((req, ctx) => {
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
