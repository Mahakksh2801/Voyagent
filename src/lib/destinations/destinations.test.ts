import { describe, expect, it } from "vitest";
import { extractCompletionContent } from "@/lib/adapters";
import { beachJanuaryCompletion, offListCompletion } from "@/mocks/destinations";
import { DestinationPreferencesSchema, TripRequestSchema } from "@/lib/schemas";
import { lisbonTripRequest } from "@/mocks/lisbon";
import { DESTINATION_CATALOG } from "./catalog";
import { MAX_CANDIDATES, planDestinations } from "./candidates";
import { fallbackSuggestions, validateDestinationSuggestions } from "./validate-suggestions";

const january = { startDate: "2027-01-10", endDate: "2027-01-16" };
const july = { startDate: "2027-07-10", endDate: "2027-07-16" };
const prefs = (p: Record<string, unknown>) => DestinationPreferencesSchema.parse(p);
const content = (r: typeof beachJanuaryCompletion) => {
  const c = extractCompletionContent(r);
  if (!c.ok) throw new Error(c.reason);
  return c.content;
};

describe("DestinationPreferencesSchema", () => {
  it("makes country and state optional", () => {
    expect(prefs({ vibe: "beach" })).toEqual({ country: null, state: null, vibe: "beach" });
  });

  it("normalizes the country code", () => {
    expect(prefs({ vibe: "mountains", country: "in" }).country).toBe("IN");
  });

  it("rejects a state without a country", () => {
    expect(DestinationPreferencesSchema.safeParse({ vibe: "beach", state: "Goa" }).success).toBe(false);
  });

  it("rejects unknown vibes", () => {
    expect(DestinationPreferencesSchema.safeParse({ vibe: "city" }).success).toBe(false);
  });
});

describe("TripRequestSchema with destination preferences", () => {
  const { destinations: _omit, ...base } = lisbonTripRequest;
  void _omit;

  it("accepts a trip with only a vibe and no destination", () => {
    const r = TripRequestSchema.parse({ ...base, destinationPreferences: { vibe: "both" } });
    expect(r.destinations).toEqual([]);
    expect(r.destinationPreferences).toEqual({ country: null, state: null, vibe: "both" });
  });

  it("requires either destinations or destination preferences", () => {
    const r = TripRequestSchema.safeParse(base);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["destinations"]);
  });
});

describe("planDestinations", () => {
  it("uses country and state as given", () => {
    expect(planDestinations(prefs({ vibe: "beach", country: "IN", state: "Goa" }), january)).toEqual({
      mode: "fixed",
      destination: "Goa, India",
    });
  });

  it("names countries outside the catalog when state is given", () => {
    expect(planDestinations(prefs({ vibe: "beach", country: "FR", state: "Provence" }), july)).toEqual({
      mode: "fixed",
      destination: "Provence, France",
    });
  });

  it("ranks states within a country when only the country is given", () => {
    const plan = planDestinations(prefs({ vibe: "mountains", country: "IN" }), { startDate: "2027-10-05", endDate: "2027-10-10" });
    expect(plan.mode).toBe("suggest");
    if (plan.mode !== "suggest") return;
    expect(plan.scope).toBe("country");
    expect(plan.candidates.every((c) => c.country === "IN" && c.vibes.includes("mountains"))).toBe(true);
    // Goa is beach-only, so it is excluded from a mountain trip
    expect(plan.candidates.map((c) => c.id)).not.toContain("in-goa");
    // October is in season for every Indian mountain state in the catalog
    expect(plan.candidates.slice(0, 3).every((c) => c.seasonFit === 1)).toBe(true);
  });

  it("ranks destinations worldwide when nothing is given, with at most two per country", () => {
    const plan = planDestinations(prefs({ vibe: "beach" }), january);
    expect(plan.mode).toBe("suggest");
    if (plan.mode !== "suggest") return;
    expect(plan.scope).toBe("world");
    expect(plan.candidates.length).toBeLessThanOrEqual(MAX_CANDIDATES);
    const perCountry = new Map<string, number>();
    plan.candidates.forEach((c) => perCountry.set(c.country, (perCountry.get(c.country) ?? 0) + 1));
    expect(Math.max(...perCountry.values())).toBeLessThanOrEqual(2);
    expect(plan.candidates.every((c) => c.vibes.includes("beach"))).toBe(true);
    // Mediterranean summer beaches are out of season in January
    expect(plan.candidates.map((c) => c.id)).not.toContain("gr-south-aegean");
    expect(plan.candidates[0].seasonFit).toBe(1);
  });

  it("puts places with both beaches and mountains first for 'both'", () => {
    const plan = planDestinations(prefs({ vibe: "both" }), july);
    if (plan.mode !== "suggest") throw new Error("expected suggestions");
    expect(plan.candidates[0].vibes.sort()).toEqual(["beach", "mountains"]);
    expect(plan.candidates.map((c) => c.id)).toContain("id-bali");
  });

  it("keeps single-vibe places as fallbacks for 'both' within a country", () => {
    const plan = planDestinations(prefs({ vibe: "both", country: "NP" }), { startDate: "2027-10-01", endDate: "2027-10-05" });
    if (plan.mode !== "suggest") throw new Error("expected suggestions");
    expect(plan.candidates.map((c) => c.id).sort()).toEqual(["np-gandaki", "np-koshi"]);
  });

  it("explains when a country has no curated destinations", () => {
    const plan = planDestinations(prefs({ vibe: "beach", country: "FR" }), july);
    expect(plan).toMatchObject({ mode: "no_candidates", reason: expect.stringContaining("France") });
  });

  it("explains when a country has nothing for the vibe", () => {
    const plan = planDestinations(prefs({ vibe: "beach", country: "NP" }), july);
    expect(plan).toMatchObject({ mode: "no_candidates" });
  });

  it("is deterministic", () => {
    const a = planDestinations(prefs({ vibe: "both" }), january);
    const b = planDestinations(prefs({ vibe: "both" }), january);
    expect(a).toEqual(b);
  });
});

describe("catalog", () => {
  it("has unique IDs and valid months", () => {
    const ids = DESTINATION_CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DESTINATION_CATALOG) {
      expect(d.vibes.length).toBeGreaterThan(0);
      expect(d.bestMonths.every((m) => m >= 1 && m <= 12)).toBe(true);
      expect(d.country).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("validateDestinationSuggestions", () => {
  const plan = planDestinations(prefs({ vibe: "beach" }), january);
  const candidates = plan.mode === "suggest" ? plan.candidates : [];

  it("accepts picks from the candidate list", () => {
    const r = validateDestinationSuggestions(content(beachJanuaryCompletion), candidates);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.suggestions.map((s) => s.destination.state)).toEqual(["Goa", "Phuket", "Quintana Roo"]);
  });

  it("rejects picks outside the candidate list", () => {
    const r = validateDestinationSuggestions(content(offListCompletion), candidates);
    expect(r).toEqual({ ok: false, errors: ['"fr-provence" is not in the candidate list.'] });
  });

  it("rejects repeated picks", () => {
    const raw = JSON.stringify({ suggestions: [{ candidateId: "in-goa", reason: "a" }, { candidateId: "in-goa", reason: "b" }] });
    expect(validateDestinationSuggestions(raw, candidates)).toMatchObject({ ok: false });
  });

  it("rejects malformed responses", () => {
    expect(validateDestinationSuggestions("nope", candidates)).toMatchObject({ ok: false });
    expect(validateDestinationSuggestions(JSON.stringify({ suggestions: [] }), candidates)).toMatchObject({ ok: false });
  });

  it("falls back to the top-ranked candidates without the model", () => {
    const f = fallbackSuggestions(candidates);
    expect(f).toHaveLength(3);
    expect(f[0].destination).toBe(candidates[0]);
  });
});
