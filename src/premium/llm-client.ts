import type { ChatMessage } from "../types";

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

export function getLLMConfig(
  llmProvider: "spob" | "deepseek",
  spobBaseUrl: string,
  spobApiKey: string,
  deepseekApiKey: string,
  model: string
): LLMConfig | null {
  if (llmProvider === "spob") {
    if (!spobApiKey) return null;
    return {
      baseUrl: spobBaseUrl || "https://spob-backend.fly.dev",
      apiKey: spobApiKey,
      model,
    };
  }
  if (!deepseekApiKey) return null;
  return {
    baseUrl: "https://api.deepseek.com",
    apiKey: deepseekApiKey,
    model,
  };
}

export async function chatCompletion(
  config: LLMConfig,
  messages: ChatMessage[]
): Promise<ChatResponse> {
  const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0 },
  };
}
