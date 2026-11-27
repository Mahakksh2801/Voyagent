import { describe, expect, it } from "vitest";
import { lisbonInvalidItinerary, lisbonValidItinerary } from "@/mocks/lisbon";
import { summarizeBudget } from "./summary";

describe("summarizeBudget", () => {
  it("totals per day and per category", () => {
    const s = summarizeBudget(lisbonValidItinerary, 400);
    expect(s.estimatedTotal).toBe(252);
    expect(s.remaining).toBe(148);
    expect(s.overBudget).toBe(false);
    expect(s.perDay.map((d) => d.total)).toEqual([78, 113, 61]);
    expect(s.byCategory).toEqual({ activity: 62, meal: 181, transit: 9, lodging: 0 });
    expect(s.perDay[1].byCategory).toEqual({ activity: 40, meal: 70, transit: 3, lodging: 0 });
  });

  it("flags over budget with a negative remaining amount", () => {
    const s = summarizeBudget(lisbonInvalidItinerary, 400);
    expect(s.estimatedTotal).toBe(412);
    expect(s.remaining).toBe(-12);
    expect(s.overBudget).toBe(true);
  });

  it("handles an empty day", () => {
    const it = structuredClone(lisbonValidItinerary);
    it.days[0].stops = [];
    expect(summarizeBudget(it, 400).perDay[0].total).toBe(0);
  });
});
