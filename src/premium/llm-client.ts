import { requestUrl } from "obsidian";
import type { ChatMessage, LLMProvider } from "../types";
import type { PluginSettings } from "../settings";

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const BASE_URLS: Record<LLMProvider, string> = {
  openai: "https://api.openai.com",
  deepseek: "https://api.deepseek.com",
  openrouter: "https://openrouter.ai/api",
  grok: "https://api.x.ai",
  glm: "https://api.z.ai",
  spob: "",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com",
};

export function getFlashConfig(settings: PluginSettings): LLMConfig | null {
  return getConfig(settings, settings.flashProvider, settings.flashModel);
}

export function getAdvancedConfig(settings: PluginSettings): LLMConfig | null {
  return getConfig(settings, settings.advancedProvider, settings.advancedModel);
}

export function getProviderConfig(
  settings: PluginSettings,
  provider: LLMProvider,
  model: string
): LLMConfig | null {
  return getConfig(settings, provider, model);
}

export function getFlashConfigWithProvider(settings: PluginSettings): { config: LLMConfig; provider: LLMProvider } | null {
  const config = getFlashConfig(settings);
  return config ? { config, provider: settings.flashProvider } : null;
}

export function getAdvancedConfigWithProvider(settings: PluginSettings): { config: LLMConfig; provider: LLMProvider } | null {
  const config = getAdvancedConfig(settings);
  return config ? { config, provider: settings.advancedProvider } : null;
}

function getConfig(
  settings: PluginSettings,
  provider: LLMProvider,
  model: string
): LLMConfig | null {
  const keyField = `${{ openai: "openai", anthropic: "anthropic", deepseek: "deepseek", gemini: "gemini", openrouter: "openrouter", grok: "grok", glm: "glm", spob: "spob" }[provider]}ApiKey` as keyof PluginSettings;
  const apiKey = (settings[keyField] as string) || "";
  if (!apiKey) return null;

  let baseUrl = BASE_URLS[provider];
  if (provider === "spob") {
    baseUrl = settings.spobBaseUrl || "https://spob-backend.fly.dev";
  }

  return { baseUrl, apiKey, model };
}

export async function chatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  provider?: LLMProvider
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  if (provider === "anthropic") {
    return chatAnthropic(config, messages);
  }
  if (provider === "gemini") {
    return chatGemini(config, messages);
  }
  return chatOpenAICompat(config, messages);
}

async function chatOpenAICompat(
  config: LLMConfig,
  messages: ChatMessage[]
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const res = await requestUrl({
    url: `${config.baseUrl}/v1/chat/completions`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: config.model, messages }),
  });

  if (res.status < 200 || res.status >= 300) {
    const err = res.text.slice(0, 200);
    throw new Error(`LLM request failed (${res.status}): ${err}`);
  }

  const data = res.json as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0 },
  };
}

async function chatAnthropic(
  config: LLMConfig,
  messages: ChatMessage[]
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const res = await requestUrl({
    url: `${config.baseUrl}/v1/messages`,
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      messages: messages.map((m) => ({ role: m.role === "system" ? "user" : m.role, content: m.content })),
    }),
  });

  if (res.status < 200 || res.status >= 300) {
    const err = res.text.slice(0, 200);
    throw new Error(`Anthropic failed (${res.status}): ${err}`);
  }

  const data = res.json as {
    content?: { text?: string }[];
    usage?: { input_tokens: number; output_tokens: number };
  };

  return {
    content: data.content?.[0]?.text ?? "",
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      completion_tokens: data.usage?.output_tokens ?? 0,
    },
  };
}

async function chatGemini(
  config: LLMConfig,
  messages: ChatMessage[]
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const url = `${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const prompt = messages.map((m) => m.content).join("\n");

  const res = await requestUrl({
    url,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (res.status < 200 || res.status >= 300) {
    const err = res.text.slice(0, 200);
    throw new Error(`Gemini failed (${res.status}): ${err}`);
  }

  const data = res.json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
