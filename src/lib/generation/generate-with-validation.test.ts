import { describe, expect, it, vi } from "vitest";
import { extractCompletionContent } from "@/lib/adapters";
import { lisbonCompletionInvalid, lisbonCompletionValid, lisbonValidItinerary } from "@/mocks/lisbon";
import { lisbonContext } from "@/lib/test-helpers";
import { generateWithValidation } from "./generate-with-validation";

const text = (r: typeof lisbonCompletionValid) => {
  const c = extractCompletionContent(r);
  if (!c.ok) throw new Error(c.reason);
  return c.content;
};

describe("generateWithValidation", () => {
  it("returns the first attempt when it is valid", async () => {
    const generate = vi.fn().mockResolvedValue(text(lisbonCompletionValid));
    const out = await generateWithValidation(generate, lisbonContext());
    expect(out).toMatchObject({ ok: true, attempts: 1, itinerary: lisbonValidItinerary });
    expect(generate).toHaveBeenCalledWith(null);
  });

  it("retries once with the errors in the prompt, then succeeds", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(text(lisbonCompletionInvalid))
      .mockResolvedValueOnce(text(lisbonCompletionValid));
    const out = await generateWithValidation(generate, lisbonContext());
    expect(out).toMatchObject({ ok: true, attempts: 2 });
    expect(generate).toHaveBeenCalledTimes(2);
    const feedback = generate.mock.calls[1][0] as string;
    expect(feedback).toContain("[OVER_BUDGET]");
    expect(feedback).toContain("[PLACE_NOT_IN_CANDIDATES]");
    expect(feedback).toContain("[WEATHER_DEPENDENT_ON_WET_DAY]");
  });

  it("gives up after one retry and returns the last errors", async () => {
    const generate = vi.fn().mockResolvedValue(text(lisbonCompletionInvalid));
    const out = await generateWithValidation(generate, lisbonContext());
    expect(generate).toHaveBeenCalledTimes(2);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.map((e) => e.code)).toContain("OVER_BUDGET");
  });

  it("retries after malformed JSON", async () => {
    const generate = vi.fn().mockResolvedValueOnce("not json").mockResolvedValueOnce(text(lisbonCompletionValid));
    const out = await generateWithValidation(generate, lisbonContext());
    expect(out).toMatchObject({ ok: true, attempts: 2 });
    expect(generate.mock.calls[1][0]).toContain("[SCHEMA]");
  });
});
