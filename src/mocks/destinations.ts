import { mockChatCompletion } from "./lisbon";

/** Model picks for a worldwide beach trip in January (valid against the ranked candidates). */
export const beachJanuarySuggestions = {
  suggestions: [
    { candidateId: "in-goa", reason: "Peak season with beach parties in the north and quiet coves in the south." },
    { candidateId: "th-phuket", reason: "Dry season, lively nightlife and easy island hopping." },
    { candidateId: "mx-quintana-roo", reason: "Warm and dry, with beach clubs in Tulum and cenotes inland." },
  ],
};

export const beachJanuaryCompletion = mockChatCompletion(JSON.stringify(beachJanuarySuggestions));

/** A pick that isn't in the candidate list. */
export const offListCompletion = mockChatCompletion(
  JSON.stringify({ suggestions: [{ candidateId: "fr-provence", reason: "Lovely in summer." }] }),
);
