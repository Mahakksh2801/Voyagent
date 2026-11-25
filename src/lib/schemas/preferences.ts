import { z } from "zod";

export const PaceSchema = z.enum(["relaxed", "moderate", "packed"]);
export const TravelStyleSchema = z.enum(["budget", "midrange", "luxury"]);

export const UserPreferencesSchema = z.object({
  pace: PaceSchema.default("moderate"),
  interests: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  dietaryRestrictions: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  travelStyle: TravelStyleSchema.default("midrange"),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
