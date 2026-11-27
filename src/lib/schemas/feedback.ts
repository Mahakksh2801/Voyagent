import { z } from "zod";

export const FeedbackSchema = z.object({
  stopId: z.string().min(1),
  rating: z.union([z.literal(-1), z.literal(1)]),
  comment: z.string().trim().max(1000).nullable().default(null),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;
