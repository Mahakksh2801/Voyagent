import { DailyForecastSchema, type DailyForecast, type WeatherCondition } from "@/lib/schemas";

/** Subset of the OpenWeatherMap One Call 3.0 response we use (units=metric). */
export interface OwmOneCallResponse {
  timezone_offset: number;
  daily: Array<{
    dt: number;
    temp: { min: number; max: number };
    weather: Array<{ id: number; main: string; description: string }>;
    pop: number;
    summary?: string;
  }>;
}

const CONDITION_BY_MAIN: Record<string, WeatherCondition> = {
  Clear: "clear",
  Clouds: "clouds",
  Drizzle: "drizzle",
  Rain: "rain",
  Thunderstorm: "thunderstorm",
  Snow: "snow",
};

/** Normalize a One Call response into one DailyForecast per local date. */
export function normalizeOwmDaily(response: OwmOneCallResponse): DailyForecast[] {
  return response.daily.map((d) => {
    const localDate = new Date((d.dt + response.timezone_offset) * 1000).toISOString().slice(0, 10);
    const main = d.weather[0]?.main ?? "Clear";
    return DailyForecastSchema.parse({
      date: localDate,
      condition: CONDITION_BY_MAIN[main] ?? "atmosphere",
      precipitationProbability: d.pop,
      tempMinC: d.temp.min,
      tempMaxC: d.temp.max,
      summary: d.summary ?? d.weather[0]?.description ?? null,
    });
  });
}
