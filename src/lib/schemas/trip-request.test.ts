import { describe, expect, it } from "vitest";
import { lisbonTripRequest } from "@/mocks/lisbon";
import { MAX_TRIP_DAYS, TripRequestSchema } from "./trip-request";

const parse = (overrides: Record<string, unknown>) => TripRequestSchema.safeParse({ ...lisbonTripRequest, ...overrides });

describe("TripRequestSchema", () => {
  it("accepts a complete request", () => {
    expect(TripRequestSchema.safeParse(lisbonTripRequest).success).toBe(true);
  });

  it("fills preference defaults", () => {
    const r = TripRequestSchema.parse({ ...lisbonTripRequest, preferences: {} });
    expect(r.preferences).toEqual({ pace: "moderate", interests: [], dietaryRestrictions: [], travelStyle: "midrange" });
  });

  it.each([
    ["destinations", undefined],
    ["startDate", undefined],
    ["endDate", undefined],
    ["budgetTotal", undefined],
    ["currency", undefined],
  ])("requires %s", (field, value) => {
    expect(parse({ [field]: value }).success).toBe(false);
  });

  it("rejects an empty destination list and blank destinations", () => {
    expect(parse({ destinations: [] }).success).toBe(false);
    expect(parse({ destinations: ["  "] }).success).toBe(false);
  });

  it("rejects zero or negative budgets", () => {
    expect(parse({ budgetTotal: 0 }).success).toBe(false);
    expect(parse({ budgetTotal: -50 }).success).toBe(false);
  });

  it("rejects malformed currency codes", () => {
    expect(parse({ currency: "eur" }).success).toBe(false);
    expect(parse({ currency: "EURO" }).success).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(parse({ startDate: "2027-02-30" }).success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const r = parse({ startDate: "2027-04-14", endDate: "2027-04-12" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["endDate"]);
  });

  it("allows a single-day trip", () => {
    expect(parse({ startDate: "2027-04-12", endDate: "2027-04-12" }).success).toBe(true);
  });

  it(`caps trips at ${MAX_TRIP_DAYS} days`, () => {
    expect(parse({ startDate: "2027-04-01", endDate: "2027-04-30" }).success).toBe(true);
    expect(parse({ startDate: "2027-04-01", endDate: "2027-05-01" }).success).toBe(false);
  });
});
