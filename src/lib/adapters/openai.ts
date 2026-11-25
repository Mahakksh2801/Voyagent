/** Subset of an OpenAI Chat Completions response we use. */
export interface ChatCompletionResponse {
  model: string;
  choices: Array<{
    message: { role: "assistant"; content: string | null; refusal?: string | null };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export type CompletionContent =
  | { ok: true; content: string; usage: TokenUsage | null }
  | { ok: false; reason: string; usage: TokenUsage | null };

/** Pull the JSON text and token usage out of a completion response. */
export function extractCompletionContent(response: ChatCompletionResponse): CompletionContent {
  const usage = response.usage
    ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens }
    : null;
  const choice = response.choices[0];
  if (!choice) return { ok: false, reason: "No choices in response", usage };
  if (choice.message.refusal) return { ok: false, reason: `Model refused: ${choice.message.refusal}`, usage };
  if (choice.finish_reason === "length") return { ok: false, reason: "Response was cut off (length)", usage };
  if (!choice.message.content) return { ok: false, reason: "Empty response content", usage };
  return { ok: true, content: choice.message.content, usage };
}
