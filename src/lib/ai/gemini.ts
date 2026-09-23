import { GoogleGenAI } from "@google/genai";
import type { AIProvider } from "./provider";

/**
 * Gemini adapter. Business logic never imports @google/genai directly —
 * only this file does, so swapping to Anthropic/OpenAI later means adding
 * one sibling adapter file and a case in getAIProvider(), not touching
 * services/.
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete(params: {
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const response = await this.client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: params.prompt,
      config: {
        systemInstruction: params.system,
        maxOutputTokens: params.maxTokens ?? 500,
      },
    });

    return response.text ?? "";
  }
}
