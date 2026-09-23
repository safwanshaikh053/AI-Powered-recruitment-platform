import { GeminiProvider } from "./gemini";

/**
 * Vendor-agnostic AI provider interface. Business logic (resume parsing,
 * job matching, recommendations) must depend on this interface only,
 * never on a specific vendor SDK. Swapping providers means writing one
 * new adapter file, not touching services/.
 */
export interface AIProvider {
  complete(params: {
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string>;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "anthropic";

  switch (provider) {
    case "gemini": {
      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) throw new Error("AI_API_KEY is not set.");
      return new GeminiProvider(apiKey);
    }
    // case "anthropic": return new AnthropicProvider();
    // case "openai": return new OpenAIProvider();
    default:
      throw new Error(
        `AI provider "${provider}" is not implemented. Set AI_PROVIDER to "gemini" in .env.`
      );
  }
}
