import { App, Notice, TFile } from "obsidian";
import { getFlashConfigWithProvider, getAdvancedConfigWithProvider, chatCompletion } from "./llm-client";
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

  if (NO_SPEECH.some((m) => content.includes(m))) return;

  const flash = getFlashConfigWithProvider(settings);
  const advanced = getAdvancedConfigWithProvider(settings);
  const pair = flash ?? advanced;
  if (!pair) return;
  const { config, provider } = pair;

  const template = settings.autoSummarizeTemplate
    ? settings.promptTemplates.find((tpl) => tpl.name === settings.autoSummarizeTemplate)
    : null;
  const systemPrompt = template?.prompt || t("summarySystemPrompt", locale);

  try {
    const res = await chatCompletion(config, [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ], provider);

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
