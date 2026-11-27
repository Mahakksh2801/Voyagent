import type { DailyForecast, WeatherCondition } from "@/lib/schemas";

/** Conditions that rule out outdoor activities regardless of probability. */
const WET_CONDITIONS: ReadonlySet<WeatherCondition> = new Set(["drizzle", "rain", "thunderstorm", "snow"]);

/** A day with at least this chance of precipitation is treated as not clear. */
export const PRECIPITATION_THRESHOLD = 0.5;

export type DaySuitability = "clear" | "wet" | "unknown";

/** Whether a forecast day is suitable for weather-dependent (outdoor) activities. */
export function classifyDay(forecast: DailyForecast | undefined): DaySuitability {
  if (!forecast) return "unknown";
  if (WET_CONDITIONS.has(forecast.condition)) return "wet";
  if (forecast.precipitationProbability >= PRECIPITATION_THRESHOLD) return "wet";
  return "clear";
}

export function forecastByDate(forecasts: DailyForecast[]): Map<string, DailyForecast> {
  return new Map(forecasts.map((f) => [f.date, f]));
}
