import type { Itinerary, StopType } from "@/lib/schemas";
import { fromCents, toCents } from "./money";

export interface DayCost {
  date: string;
  total: number;
  byCategory: Record<StopType, number>;
}

export interface BudgetSummary {
  currency: string;
  budgetTotal: number;
  estimatedTotal: number;
  /** budgetTotal - estimatedTotal; negative when over budget. */
  remaining: number;
  overBudget: boolean;
  perDay: DayCost[];
  byCategory: Record<StopType, number>;
}

const emptyCategories = (): Record<StopType, number> => ({
  activity: 0,
  meal: 0,
  transit: 0,
  lodging: 0,
});

/**
 * Sum the itinerary's estimated costs per day and per category and compare
 * against the budget. Costs are the per-stop estimates as given; no
 * adjustments, taxes or buffers are applied here.
 */
export function summarizeBudget(itinerary: Itinerary, budgetTotal: number): BudgetSummary {
  const tripCents = emptyCategories();
  let totalCents = 0;

  const perDay: DayCost[] = itinerary.days.map((day) => {
    const dayCents = emptyCategories();
    let dayTotal = 0;
    for (const stop of day.stops) {
      const c = toCents(stop.estimatedCost);
      dayCents[stop.type] += c;
      tripCents[stop.type] += c;
      dayTotal += c;
    }
    totalCents += dayTotal;
    return {
      date: day.date,
      total: fromCents(dayTotal),
      byCategory: mapValues(dayCents, fromCents),
    };
  });

  const budgetCents = toCents(budgetTotal);
  return {
    currency: itinerary.currency,
    budgetTotal: fromCents(budgetCents),
    estimatedTotal: fromCents(totalCents),
    remaining: fromCents(budgetCents - totalCents),
    overBudget: totalCents > budgetCents,
    perDay,
    byCategory: mapValues(tripCents, fromCents),
  };
}

function mapValues<K extends string>(obj: Record<K, number>, fn: (v: number) => number): Record<K, number> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v as number)])) as Record<K, number>;
}
