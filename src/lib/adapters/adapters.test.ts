import { describe, expect, it } from "vitest";
import { lisbonOwmResponse, lisbonPlacesResponse } from "@/mocks/lisbon";
import { classifyDay } from "@/lib/weather";
import { normalizePlacesSearch } from "./google-places";
import { normalizeOwmDaily } from "./openweathermap";

describe("normalizeOwmDaily", () => {
  it("maps One Call daily entries to local dates and conditions", () => {
    const f = normalizeOwmDaily(lisbonOwmResponse);
    expect(f.map((d) => [d.date, d.condition, classifyDay(d)])).toEqual([
      ["2027-04-12", "clear", "clear"],
      ["2027-04-13", "rain", "wet"],
      ["2027-04-14", "clouds", "clear"],
    ]);
  });

  it("uses the location's timezone offset to pick the date", () => {
    // 23:30 UTC on the 12th is already the 13th at UTC+1
    const f = normalizeOwmDaily({ timezone_offset: 3600, daily: [{ ...lisbonOwmResponse.daily[0], dt: Date.parse("2027-04-12T23:30:00Z") / 1000 }] });
    expect(f[0].date).toBe("2027-04-13");
  });

  it("maps fog and other conditions to 'atmosphere'", () => {
    const f = normalizeOwmDaily({ timezone_offset: 0, daily: [{ ...lisbonOwmResponse.daily[0], weather: [{ id: 741, main: "Fog", description: "fog" }] }] });
    expect(f[0].condition).toBe("atmosphere");
  });
});

describe("normalizePlacesSearch", () => {
  const places = normalizePlacesSearch(lisbonPlacesResponse);

  it("normalizes every place", () => {
    expect(places).toHaveLength(10);
    expect(places[0]).toEqual({
      placeId: "mock-belem-tower",
      name: "Belém Tower",
      address: "Belém Tower, Lisbon, Portugal",
      lat: 38.6916,
      lng: -9.216,
      category: "tourist_attraction",
      rating: 4.6,
      priceLevel: 1,
      indoor: false,
    });
  });

  it("marks museums, aquariums and restaurants as indoor", () => {
    const indoor = Object.fromEntries(places.map((p) => [p.placeId, p.indoor]));
    expect(indoor["mock-gulbenkian"]).toBe(true);
    expect(indoor["mock-oceanario"]).toBe(true);
    expect(indoor["mock-ramiro"]).toBe(true);
    expect(indoor["mock-santa-luzia"]).toBe(false);
  });

  it("leaves price level null when Google has none", () => {
    expect(places.find((p) => p.placeId === "mock-santa-luzia")?.priceLevel).toBeNull();
  });

  it("handles an empty response", () => {
    expect(normalizePlacesSearch({})).toEqual([]);
  });
});
