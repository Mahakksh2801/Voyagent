import { describe, expect, it } from "vitest";
import { lisbonInvalidItinerary, lisbonValidItinerary } from "@/mocks/lisbon";
import { clone, lisbonContext } from "@/lib/test-helpers";
import { validateItinerary } from "./validate-itinerary";

const codes = (it = lisbonValidItinerary, ctx = lisbonContext()) =>
  validateItinerary(it, ctx).errors.map((e) => e.code);

describe("validateItinerary", () => {
  it("accepts the valid Lisbon itinerary", () => {
    const result = validateItinerary(lisbonValidItinerary, lisbonContext());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("reports every problem in the invalid itinerary", () => {
    expect(codes(lisbonInvalidItinerary).sort()).toEqual(
      ["OVER_BUDGET", "PLACE_NOT_IN_CANDIDATES", "WEATHER_DEPENDENT_ON_WET_DAY"].sort(),
    );
  });

  describe("budget totals", () => {
    it("passes when the total equals the budget exactly", () => {
      // valid itinerary totals 252.00
      expect(codes(lisbonValidItinerary, lisbonContext({ budgetTotal: 252 }))).toEqual([]);
    });

    it("fails when the total is one cent over", () => {
      const result = validateItinerary(lisbonValidItinerary, lisbonContext({ budgetTotal: 251.99 }));
      expect(result.errors.map((e) => e.code)).toEqual(["OVER_BUDGET"]);
      expect(result.errors[0].message).toContain("252.00 EUR");
      expect(result.errors[0].message).toContain("by 0.01");
    });

    it("sums fractional costs without float drift", () => {
      const it = clone(lisbonValidItinerary);
      // 0.1 + 0.2 style amounts: make every stop cost 0.1 -> 16 stops = 1.60
      it.days.forEach((d) => d.stops.forEach((s) => (s.estimatedCost = 0.1)));
      expect(codes(it, lisbonContext({ budgetTotal: 1.6 }))).toEqual([]);
    });

    it("rejects a currency that differs from the budget's", () => {
      const it = clone(lisbonValidItinerary);
      it.currency = "USD";
      expect(codes(it)).toEqual(["CURRENCY_MISMATCH"]);
    });
  });

  describe("date ranges", () => {
    it("flags a day outside the trip dates and the date it replaced", () => {
      const it = clone(lisbonValidItinerary);
      it.days[2].date = "2027-04-15";
      expect(codes(it).sort()).toEqual(["DATE_MISSING", "DATE_OUT_OF_RANGE"]);
    });

    it("flags a day before the start date", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].date = "2027-04-11";
      expect(codes(it)).toContain("DATE_OUT_OF_RANGE");
    });

    it("flags missing days", () => {
      const it = clone(lisbonValidItinerary);
      it.days.pop();
      const result = validateItinerary(it, lisbonContext());
      expect(result.errors).toEqual([
        expect.objectContaining({ code: "DATE_MISSING", location: { date: "2027-04-14" } }),
      ]);
    });

    it("flags duplicate days", () => {
      const it = clone(lisbonValidItinerary);
      it.days[2] = { ...clone(lisbonValidItinerary).days[1] };
      expect(codes(it).sort()).toEqual(["DATE_DUPLICATE", "DATE_MISSING"]);
    });

    it("flags days out of order", () => {
      const it = clone(lisbonValidItinerary);
      it.days = [it.days[1], it.days[0], it.days[2]];
      expect(codes(it)).toEqual(["DATES_OUT_OF_ORDER"]);
    });
  });

  describe("place IDs present in candidates", () => {
    it("rejects a place ID that is not a candidate", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[1].placeId = "mock-made-up";
      const result = validateItinerary(it, lisbonContext());
      expect(result.errors).toEqual([
        expect.objectContaining({
          code: "PLACE_NOT_IN_CANDIDATES",
          location: { date: "2027-04-12", dayIndex: 0, stopIndex: 1 },
        }),
      ]);
    });

    it("requires a place ID on activities and meals", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[0].placeId = null;
      it.days[0].stops[2].placeId = null;
      expect(codes(it)).toEqual(["PLACE_MISSING", "PLACE_MISSING"]);
    });

    it("allows lodging without a place ID", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops.push({
        type: "lodging",
        placeId: null,
        name: "Your hotel",
        startTime: "22:00",
        durationMinutes: 600,
        estimatedCost: 0,
        notes: null,
        weatherDependent: false,
      });
      expect(codes(it)).toEqual([]);
    });

    it("rejects transit stops that carry a place ID", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[3].placeId = "mock-belem-tower";
      expect(codes(it)).toEqual(["TRANSIT_HAS_PLACE"]);
    });

    it("fails every place when the candidate list is empty", () => {
      const placed = lisbonValidItinerary.days.flatMap((d) => d.stops).filter((s) => s.placeId).length;
      const result = validateItinerary(lisbonValidItinerary, lisbonContext({ candidates: [] }));
      expect(result.errors.filter((e) => e.code === "PLACE_NOT_IN_CANDIDATES")).toHaveLength(placed);
    });
  });

  describe("weather-dependent activities on clear days", () => {
    it("rejects an outdoor activity on the rainy day", () => {
      const it = clone(lisbonValidItinerary);
      it.days[1].stops[0].weatherDependent = true;
      const result = validateItinerary(it, lisbonContext());
      expect(result.errors).toEqual([
        expect.objectContaining({ code: "WEATHER_DEPENDENT_ON_WET_DAY", location: { date: "2027-04-13", dayIndex: 1, stopIndex: 0 } }),
      ]);
    });

    it("allows outdoor activities on cloudy days with low rain chance", () => {
      // day 3 (14th) is cloudy with pop 0.2 and has an outdoor viewpoint
      expect(lisbonValidItinerary.days[2].stops.some((s) => s.weatherDependent)).toBe(true);
      expect(codes()).toEqual([]);
    });

    it("treats a high chance of rain as wet even if the condition is cloudy", () => {
      const ctx = lisbonContext();
      ctx.forecasts = ctx.forecasts.map((f) => (f.date === "2027-04-14" ? { ...f, precipitationProbability: 0.6 } : f));
      expect(codes(lisbonValidItinerary, ctx)).toEqual(["WEATHER_DEPENDENT_ON_WET_DAY"]);
    });

    it("allows indoor activities on the rainy day", () => {
      const rainy = lisbonValidItinerary.days[1];
      expect(rainy.stops.every((s) => !s.weatherDependent)).toBe(true);
      expect(codes()).toEqual([]);
    });

    it("warns, without failing, when there is no forecast for a day", () => {
      const result = validateItinerary(lisbonValidItinerary, lisbonContext({ forecasts: [] }));
      expect(result.valid).toBe(true);
      expect(result.warnings.map((w) => w.code)).toEqual(["WEATHER_UNKNOWN", "WEATHER_UNKNOWN", "WEATHER_UNKNOWN"]);
    });
  });

  describe("time window", () => {
    it("rejects a stop that starts before the day window", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[0].startTime = "06:30";
      expect(codes(it)).toEqual(["STOP_OUTSIDE_DAY_WINDOW"]);
    });

    it("rejects a stop that runs past the day window", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[5].startTime = "22:00"; // 90 min -> 23:30
      expect(codes(it)).toEqual(["STOP_OUTSIDE_DAY_WINDOW"]);
    });

    it("respects a custom day window", () => {
      expect(codes(lisbonValidItinerary, lisbonContext({ dayWindow: { start: "09:30", end: "21:00" } }))).toContain(
        "STOP_OUTSIDE_DAY_WINDOW",
      );
    });

    it("rejects overlapping stops", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[1].startTime = "09:30"; // tower runs 09:00-10:00
      expect(codes(it)).toEqual(["STOPS_OVERLAP"]);
    });

    it("rejects stops listed out of time order", () => {
      const it = clone(lisbonValidItinerary);
      const [a, b] = it.days[0].stops;
      it.days[0].stops[0] = b;
      it.days[0].stops[1] = a;
      expect(codes(it)).toContain("STOPS_OUT_OF_ORDER");
    });

    it("allows back-to-back stops", () => {
      const it = clone(lisbonValidItinerary);
      it.days[0].stops[1].startTime = "10:00"; // tower ends exactly 10:00
      expect(codes(it)).toEqual([]);
    });
  });
});
