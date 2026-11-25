import { describe, expect, it } from "vitest";
import { extractCompletionContent } from "@/lib/adapters";
import { lisbonCompletionValid, lisbonValidItinerary, mockChatCompletion } from "@/mocks/lisbon";
import { parseItineraryJson } from "./parse-response";
import { formatIssuesForRetry } from "./retry-feedback";

describe("parseItineraryJson", () => {
  it("parses a mocked OpenAI completion into an itinerary", () => {
    const content = extractCompletionContent(lisbonCompletionValid);
    expect(content.ok).toBe(true);
    if (!content.ok) return;
    expect(content.usage).toEqual({ promptTokens: 2400, completionTokens: 900 });
    const parsed = parseItineraryJson(content.content);
    expect(parsed).toEqual({ ok: true, itinerary: lisbonValidItinerary });
  });

  it("reports non-JSON text", () => {
    const parsed = parseItineraryJson("Sure! Here is your itinerary:");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors[0]).toMatchObject({ code: "SCHEMA", message: "Response was not valid JSON." });
  });

  it("reports schema problems with their path", () => {
    const bad = structuredClone(lisbonValidItinerary) as unknown as { days: { stops: { startTime: string; durationMinutes: number }[] }[] };
    bad.days[0].stops[0].startTime = "9am";
    bad.days[1].stops[2].durationMinutes = -5;
    const parsed = parseItineraryJson(JSON.stringify(bad));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    const messages = parsed.errors.map((e) => e.message);
    expect(messages.some((m) => m.startsWith("days.0.stops.0.startTime"))).toBe(true);
    expect(messages.some((m) => m.startsWith("days.1.stops.2.durationMinutes"))).toBe(true);
  });

  it("rejects an unknown stop type", () => {
    const bad = structuredClone(lisbonValidItinerary) as unknown as { days: { stops: { type: string }[] }[] };
    bad.days[0].stops[0].type = "shopping";
    expect(parseItineraryJson(JSON.stringify(bad)).ok).toBe(false);
  });
});

describe("extractCompletionContent", () => {
  it("surfaces refusals", () => {
    const resp = mockChatCompletion("");
    resp.choices[0].message.refusal = "I can't help with that.";
    expect(extractCompletionContent(resp)).toMatchObject({ ok: false, reason: expect.stringContaining("refused") });
  });

  it("surfaces truncated responses", () => {
    const resp = mockChatCompletion("{");
    resp.choices[0].finish_reason = "length";
    expect(extractCompletionContent(resp)).toMatchObject({ ok: false, reason: expect.stringContaining("cut off") });
  });
});

describe("formatIssuesForRetry", () => {
  it("lists each error with its code", () => {
    const text = formatIssuesForRetry([
      { code: "OVER_BUDGET", severity: "error", message: "Too expensive." },
      { code: "DATE_MISSING", severity: "error", message: "No plan for 2027-04-14." },
    ]);
    expect(text).toContain("1. [OVER_BUDGET] Too expensive.");
    expect(text).toContain("2. [DATE_MISSING] No plan for 2027-04-14.");
  });

  it("returns an empty string when there are no errors", () => {
    expect(formatIssuesForRetry([])).toBe("");
  });
});
