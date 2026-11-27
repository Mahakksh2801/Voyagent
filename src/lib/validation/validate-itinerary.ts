import { summarizeBudget } from "@/lib/budget";
import { eachDate, timeToMinutes } from "@/lib/dates";
import type { CandidatePlace, DailyForecast, Itinerary } from "@/lib/schemas";
import { classifyDay, forecastByDate } from "@/lib/weather";
import type { ValidationIssue, ValidationResult } from "./types";

export interface DayWindow {
  /** Earliest start, "HH:mm". */
  start: string;
  /** Latest end, "HH:mm". Stops must finish by then. */
  end: string;
}

export const DEFAULT_DAY_WINDOW: DayWindow = { start: "07:00", end: "23:00" };

export interface ValidationContext {
  startDate: string;
  endDate: string;
  budgetTotal: number;
  currency: string;
  candidates: CandidatePlace[];
  forecasts: DailyForecast[];
  dayWindow?: DayWindow;
}

/**
 * Check a schema-valid itinerary against the trip constraints (step 4 of the
 * generation flow). Errors make the itinerary invalid and are fed back to the
 * model on retry; warnings are shown to the user but do not fail validation.
 */
export function validateItinerary(itinerary: Itinerary, ctx: ValidationContext): ValidationResult {
  const issues: ValidationIssue[] = [
    ...checkCurrency(itinerary, ctx),
    ...checkDates(itinerary, ctx),
    ...checkPlaces(itinerary, ctx),
    ...checkTimeWindows(itinerary, ctx.dayWindow ?? DEFAULT_DAY_WINDOW),
    ...checkWeather(itinerary, ctx),
    ...checkBudget(itinerary, ctx),
  ];
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}

function checkCurrency(itinerary: Itinerary, ctx: ValidationContext): ValidationIssue[] {
  if (itinerary.currency === ctx.currency) return [];
  return [
    {
      code: "CURRENCY_MISMATCH",
      severity: "error",
      message: `Itinerary uses ${itinerary.currency} but the trip budget is in ${ctx.currency}.`,
    },
  ];
}

function checkDates(itinerary: Itinerary, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expected = eachDate(ctx.startDate, ctx.endDate);
  const expectedSet = new Set(expected);
  const seen = new Set<string>();

  itinerary.days.forEach((day, dayIndex) => {
    if (!expectedSet.has(day.date)) {
      issues.push({
        code: "DATE_OUT_OF_RANGE",
        severity: "error",
        message: `Day ${day.date} is outside the trip dates ${ctx.startDate} to ${ctx.endDate}.`,
        location: { date: day.date, dayIndex },
      });
    }
    if (seen.has(day.date)) {
      issues.push({
        code: "DATE_DUPLICATE",
        severity: "error",
        message: `Day ${day.date} appears more than once.`,
        location: { date: day.date, dayIndex },
      });
    }
    if (dayIndex > 0 && day.date <= itinerary.days[dayIndex - 1].date && !seen.has(day.date)) {
      issues.push({
        code: "DATES_OUT_OF_ORDER",
        severity: "error",
        message: `Day ${day.date} comes after ${itinerary.days[dayIndex - 1].date}; days must be in date order.`,
        location: { date: day.date, dayIndex },
      });
    }
    seen.add(day.date);
  });

  for (const date of expected) {
    if (!seen.has(date)) {
      issues.push({
        code: "DATE_MISSING",
        severity: "error",
        message: `No plan for ${date}; every trip date needs a day.`,
        location: { date },
      });
    }
  }
  return issues;
}

function checkPlaces(itinerary: Itinerary, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const candidateIds = new Set(ctx.candidates.map((c) => c.placeId));

  itinerary.days.forEach((day, dayIndex) => {
    day.stops.forEach((stop, stopIndex) => {
      const location = { date: day.date, dayIndex, stopIndex };
      if (stop.type === "transit") {
        if (stop.placeId !== null) {
          issues.push({
            code: "TRANSIT_HAS_PLACE",
            severity: "error",
            message: `Transit stop "${stop.name}" on ${day.date} must have placeId null.`,
            location,
          });
        }
        return;
      }
      if (stop.placeId === null) {
        // Lodging may be unspecified (the user books it themselves).
        if (stop.type === "lodging") return;
        issues.push({
          code: "PLACE_MISSING",
          severity: "error",
          message: `${capitalize(stop.type)} "${stop.name}" on ${day.date} needs a placeId from the candidate list.`,
          location,
        });
        return;
      }
      if (!candidateIds.has(stop.placeId)) {
        issues.push({
          code: "PLACE_NOT_IN_CANDIDATES",
          severity: "error",
          message: `"${stop.name}" on ${day.date} uses placeId ${stop.placeId}, which is not in the candidate list.`,
          location,
        });
      }
    });
  });
  return issues;
}

function checkTimeWindows(itinerary: Itinerary, window: DayWindow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const windowStart = timeToMinutes(window.start);
  const windowEnd = timeToMinutes(window.end);

  itinerary.days.forEach((day, dayIndex) => {
    let prevEnd: number | null = null;
    let prevStart: number | null = null;
    day.stops.forEach((stop, stopIndex) => {
      const location = { date: day.date, dayIndex, stopIndex };
      const start = timeToMinutes(stop.startTime);
      const end = start + stop.durationMinutes;

      // Lodging is the overnight anchor, so it is exempt from the day window.
      if (stop.type !== "lodging" && (start < windowStart || end > windowEnd)) {
        issues.push({
          code: "STOP_OUTSIDE_DAY_WINDOW",
          severity: "error",
          message: `"${stop.name}" on ${day.date} runs ${stop.startTime} for ${stop.durationMinutes} min, outside ${window.start}-${window.end}.`,
          location,
        });
      }
      if (prevStart !== null && start < prevStart) {
        issues.push({
          code: "STOPS_OUT_OF_ORDER",
          severity: "error",
          message: `"${stop.name}" on ${day.date} starts before the previous stop; stops must be listed in time order.`,
          location,
        });
      } else if (prevEnd !== null && start < prevEnd) {
        issues.push({
          code: "STOPS_OVERLAP",
          severity: "error",
          message: `"${stop.name}" on ${day.date} starts at ${stop.startTime}, before the previous stop ends.`,
          location,
        });
      }
      if (stop.type !== "lodging") {
        prevStart = start;
        prevEnd = end;
      }
    });
  });
  return issues;
}

function checkWeather(itinerary: Itinerary, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const forecasts = forecastByDate(ctx.forecasts);

  itinerary.days.forEach((day, dayIndex) => {
    const suitability = classifyDay(forecasts.get(day.date));
    day.stops.forEach((stop, stopIndex) => {
      if (!stop.weatherDependent) return;
      const location = { date: day.date, dayIndex, stopIndex };
      if (suitability === "wet") {
        issues.push({
          code: "WEATHER_DEPENDENT_ON_WET_DAY",
          severity: "error",
          message: `Outdoor activity "${stop.name}" is on ${day.date}, which is forecast to be wet. Move it to a clear day or replace it with an indoor option.`,
          location,
        });
      } else if (suitability === "unknown") {
        issues.push({
          code: "WEATHER_UNKNOWN",
          severity: "warning",
          message: `No forecast yet for ${day.date}; "${stop.name}" depends on the weather.`,
          location,
        });
      }
    });
  });
  return issues;
}

function checkBudget(itinerary: Itinerary, ctx: ValidationContext): ValidationIssue[] {
  const summary = summarizeBudget(itinerary, ctx.budgetTotal);
  if (!summary.overBudget) return [];
  return [
    {
      code: "OVER_BUDGET",
      severity: "error",
      message: `Estimated total ${summary.estimatedTotal.toFixed(2)} ${ctx.currency} exceeds the budget of ${summary.budgetTotal.toFixed(2)} ${ctx.currency} by ${(-summary.remaining).toFixed(2)}.`,
    },
  ];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
