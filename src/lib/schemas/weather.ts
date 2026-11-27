import { z } from "zod";
import { IsoDateSchema } from "./common";

export const WeatherConditionSchema = z.enum([
  "clear",
  "clouds",
  "drizzle",
  "rain",
  "thunderstorm",
  "snow",
  "atmosphere", // mist, fog, haze, dust...
]);
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;

/** One day of forecast, normalized from an OpenWeatherMap response. */
export const DailyForecastSchema = z.object({
  date: IsoDateSchema,
  condition: WeatherConditionSchema,
  /** Probability of precipitation, 0 to 1. */
  precipitationProbability: z.number().min(0).max(1),
  tempMinC: z.number(),
  tempMaxC: z.number(),
  summary: z.string().nullable(),
});

export type DailyForecast = z.infer<typeof DailyForecastSchema>;
