import { z } from "zod";
import { CurrencySchema, IsoDateSchema, MoneySchema, StopTypeSchema, TimeOfDaySchema } from "./common";

/**
 * Shape the model must return. Every field is required (nullable instead of
 * optional) so the schema can be used with OpenAI structured outputs.
 */
export const ItineraryStopSchema = z.object({
  type: StopTypeSchema,
  /** Google place ID from the candidate set; null for transit. */
  placeId: z.string().min(1).nullable(),
  name: z.string().trim().min(1).max(200),
  startTime: TimeOfDaySchema,
  durationMinutes: z.number().int().positive().max(24 * 60),
  estimatedCost: MoneySchema,
  notes: z.string().max(1000).nullable(),
  /** True for outdoor activities that should be scheduled on clear days. */
  weatherDependent: z.boolean(),
});

export const ItineraryDaySchema = z.object({
  date: IsoDateSchema,
  summary: z.string().max(500),
  stops: z.array(ItineraryStopSchema).max(20),
});

export const ItinerarySchema = z.object({
  title: z.string().trim().min(1).max(200),
  currency: CurrencySchema,
  days: z.array(ItineraryDaySchema).min(1),
});

export type ItineraryStop = z.infer<typeof ItineraryStopSchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
