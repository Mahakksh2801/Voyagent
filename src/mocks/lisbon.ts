/**
 * Mocked API responses for a 3-day Lisbon trip, 12-14 April 2027.
 * Weather: 12th clear, 13th rain, 14th cloudy. Budget 400 EUR.
 * Place IDs are fake ("mock-...") and never sent to Google.
 */
import type { ChatCompletionResponse } from "@/lib/adapters/openai";
import type { PlacesSearchTextResponse } from "@/lib/adapters/google-places";
import type { OwmOneCallResponse } from "@/lib/adapters/openweathermap";
import type { Itinerary, TripRequest } from "@/lib/schemas";

export const lisbonTripRequest: TripRequest = {
  destinations: ["Lisbon"],
  startDate: "2027-04-12",
  endDate: "2027-04-14",
  budgetTotal: 400,
  currency: "EUR",
  preferences: {
    pace: "moderate",
    interests: ["history", "food", "viewpoints"],
    dietaryRestrictions: [],
    travelStyle: "midrange",
  },
};

export const lisbonOwmResponse: OwmOneCallResponse = {
  timezone_offset: 3600,
  daily: [
    {
      dt: 1807527600,
      temp: { min: 13.2, max: 21.4 },
      weather: [{ id: 800, main: "Clear", description: "clear sky" }],
      pop: 0.05,
      summary: "Sunny all day",
    },
    {
      dt: 1807614000,
      temp: { min: 12.1, max: 16.8 },
      weather: [{ id: 501, main: "Rain", description: "moderate rain" }],
      pop: 0.9,
      summary: "Rain through the afternoon",
    },
    {
      dt: 1807700400,
      temp: { min: 12.8, max: 19.0 },
      weather: [{ id: 803, main: "Clouds", description: "broken clouds" }],
      pop: 0.2,
      summary: "Cloudy with sunny spells",
    },
  ],
};

export const lisbonPlacesResponse: PlacesSearchTextResponse = {
  places: [
    place("mock-belem-tower", "Belém Tower", "tourist_attraction", 38.6916, -9.216, 4.6, "PRICE_LEVEL_INEXPENSIVE"),
    place("mock-jeronimos", "Jerónimos Monastery", "museum", 38.6979, -9.2068, 4.7, "PRICE_LEVEL_INEXPENSIVE"),
    place("mock-pasteis-belem", "Pastéis de Belém", "bakery", 38.6975, -9.2032, 4.6, "PRICE_LEVEL_INEXPENSIVE"),
    place("mock-santa-luzia", "Miradouro de Santa Luzia", "tourist_attraction", 38.7118, -9.1301, 4.7),
    place("mock-ramiro", "Cervejaria Ramiro", "restaurant", 38.7206, -9.1355, 4.5, "PRICE_LEVEL_MODERATE"),
    place("mock-gulbenkian", "Calouste Gulbenkian Museum", "museum", 38.7372, -9.1546, 4.7, "PRICE_LEVEL_INEXPENSIVE"),
    place("mock-time-out-market", "Time Out Market Lisboa", "food_court", 38.7069, -9.1459, 4.4, "PRICE_LEVEL_MODERATE"),
    place("mock-oceanario", "Oceanário de Lisboa", "aquarium", 38.7635, -9.0937, 4.6, "PRICE_LEVEL_MODERATE"),
    place("mock-cevicheria", "A Cevicheria", "restaurant", 38.7149, -9.1484, 4.4, "PRICE_LEVEL_EXPENSIVE"),
    place("mock-lx-factory", "LX Factory", "shopping_mall", 38.7033, -9.1784, 4.5, "PRICE_LEVEL_FREE"),
  ],
};

function place(id: string, name: string, primaryType: string, lat: number, lng: number, rating: number, priceLevel?: string) {
  return {
    id,
    displayName: { text: name, languageCode: "en" },
    formattedAddress: `${name}, Lisbon, Portugal`,
    location: { latitude: lat, longitude: lng },
    primaryType,
    types: [primaryType, "point_of_interest", "establishment"],
    rating,
    ...(priceLevel ? { priceLevel } : {}),
  };
}

/** A plan that passes every check: outdoor stops only on the 12th and 14th, total 252 EUR. */
export const lisbonValidItinerary: Itinerary = {
  title: "Three days in Lisbon",
  currency: "EUR",
  days: [
    {
      date: "2027-04-12",
      summary: "Belém and the Alfama viewpoints on the sunny day.",
      stops: [
        stop("activity", "mock-belem-tower", "Belém Tower", "09:00", 60, 10, true),
        stop("activity", "mock-jeronimos", "Jerónimos Monastery", "10:15", 90, 12, false),
        stop("meal", "mock-pasteis-belem", "Pastéis de Belém", "12:00", 45, 8, false),
        stop("transit", null, "Tram 15E and 28E to Alfama", "13:00", 45, 3, false),
        stop("activity", "mock-santa-luzia", "Miradouro de Santa Luzia", "14:00", 60, 0, true),
        stop("meal", "mock-ramiro", "Cervejaria Ramiro", "19:30", 90, 45, false),
      ],
    },
    {
      date: "2027-04-13",
      summary: "Museums and the aquarium while it rains.",
      stops: [
        stop("activity", "mock-gulbenkian", "Calouste Gulbenkian Museum", "10:00", 150, 15, false),
        stop("meal", "mock-time-out-market", "Time Out Market Lisboa", "12:45", 60, 20, false),
        stop("transit", null, "Metro to Oriente", "14:00", 30, 3, false),
        stop("activity", "mock-oceanario", "Oceanário de Lisboa", "14:45", 150, 25, false),
        stop("meal", "mock-cevicheria", "A Cevicheria", "20:00", 90, 50, false),
      ],
    },
    {
      date: "2027-04-14",
      summary: "LX Factory, then a last viewpoint and seafood.",
      stops: [
        stop("activity", "mock-lx-factory", "LX Factory", "10:00", 120, 0, false),
        stop("meal", "mock-time-out-market", "Time Out Market Lisboa", "12:30", 60, 18, false),
        stop("transit", null, "Tram 28E to Alfama", "14:00", 20, 3, false),
        stop("activity", "mock-santa-luzia", "Miradouro de Santa Luzia", "14:30", 60, 0, true),
        stop("meal", "mock-ramiro", "Cervejaria Ramiro", "19:00", 90, 40, false),
      ],
    },
  ],
};

function stop(
  type: "activity" | "meal" | "transit" | "lodging",
  placeId: string | null,
  name: string,
  startTime: string,
  durationMinutes: number,
  estimatedCost: number,
  weatherDependent: boolean,
) {
  return { type, placeId, name, startTime, durationMinutes, estimatedCost, notes: null, weatherDependent };
}

/** Wrap an itinerary (or any text) in a Chat Completions response. */
export function mockChatCompletion(content: string): ChatCompletionResponse {
  return {
    model: "mock-model",
    choices: [{ message: { role: "assistant", content, refusal: null }, finish_reason: "stop" }],
    usage: { prompt_tokens: 2400, completion_tokens: 900, total_tokens: 3300 },
  };
}

/**
 * A first attempt that fails validation: an outdoor viewpoint on the rainy
 * 13th, a restaurant not in the candidates, and an expensive dinner that
 * pushes the total over 400 EUR.
 */
export const lisbonInvalidItinerary: Itinerary = {
  ...lisbonValidItinerary,
  days: [
    lisbonValidItinerary.days[0],
    {
      ...lisbonValidItinerary.days[1],
      stops: [
        ...lisbonValidItinerary.days[1].stops.slice(0, 4),
        stop("activity", "mock-santa-luzia", "Miradouro de Santa Luzia", "17:30", 45, 0, true),
        stop("meal", "mock-belcanto", "Belcanto", "20:00", 150, 210, false),
      ],
    },
    lisbonValidItinerary.days[2],
  ],
};

export const lisbonCompletionValid = mockChatCompletion(JSON.stringify(lisbonValidItinerary));
export const lisbonCompletionInvalid = mockChatCompletion(JSON.stringify(lisbonInvalidItinerary));
