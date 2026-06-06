import { App, Notice, TFile } from "obsidian";
import { getFlashConfig, getAdvancedConfig, chatCompletion } from "./llm-client";
import type { PluginSettings } from "../settings";
import { t } from "../locales";

const NO_SPEECH = [
  "No se detectó habla en la transcripción.",
  "No speech detected in transcription.",
];

export function hasSpobApi(settings: PluginSettings): boolean {
  return !!settings.spobApiKey;
}

export async function autoSummarizeContent(
  app: App,
  settings: PluginSettings,
  content: string,
  sourcePath: string,
  locale: string
): Promise<void> {
  if (!settings.autoSummarize || !hasSpobApi(settings)) return;

  const L = (key: string) => t(key as any, locale);

  if (NO_SPEECH.some((m) => content.includes(m))) return;

  const config = getFlashConfig(settings) || getAdvancedConfig(settings);
  if (!config) return;

  try {
    const res = await chatCompletion(config, [
      { role: "system", content: t("summarySystemPrompt", locale) },
      { role: "user", content },
    ]);

    const file = app.vault.getAbstractFileByPath(sourcePath);
    if (file instanceof TFile) {
      const current = await app.vault.read(file);
      const heading = t("summaryHeading", locale);
      await app.vault.modify(file, `${current}\n\n### ${heading}\n${res.content}\n`);
      new Notice(`${t("summaryInserted", locale)} (auto)`);
    }
  } catch {
    // Auto-summarize fails silently — don't block transcription
  }
}
