import {
  App,
  Editor,
  Notice,
} from "obsidian";
import type { PluginSettings } from "./settings";
import { PROVIDER_REGISTRY } from "./providers/registry";
import { SpeakerModal } from "./speaker-modal";
import {
  SpeakerMapping,
  TranscriptionProvider,
  ProviderMeta,
} from "./types";
import { formatTranscription } from "./formatter";
import { t, type LocaleStrings } from "./locales";

export function buildFallbackChain(
  selected: TranscriptionProvider
): TranscriptionProvider[] {
  const chain: TranscriptionProvider[] = [selected];
  const all = Object.keys(PROVIDER_REGISTRY) as TranscriptionProvider[];
  for (const id of all) {
    if (id !== selected) {
      chain.push(id);
    }
  }
  return chain;
}

export function getApiKeyFor(
  settings: PluginSettings,
  meta: ProviderMeta
): string {
  return (settings as unknown as Record<string, string>)[meta.apiKeyField] ?? "";
}

export function getModelFor(
  settings: PluginSettings,
  providerId: TranscriptionProvider
): string | undefined {
  switch (providerId) {
    case "assemblyai":
    case "spob":
      return settings.assemblyaiModel;
    case "gladia":
      return settings.gladiaModel;
    default:
      return undefined;
  }
}

async function defaultFolder(app: App): Promise<string> {
  const activeFile = app.workspace.getActiveFile();
  return activeFile?.parent?.path ?? "";
}

async function saveAudioFile(
  app: App,
  settings: PluginSettings,
  blob: Blob
): Promise<string> {
  const ext = blob.type.split("/")[1]?.split(";")[0] || "webm";
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `grabacion-${ts}.${ext}`;

  const folder = settings.audioFolder || (await defaultFolder(app));
  const filepath = folder ? `${folder}/${filename}` : filename;

  if (folder) {
    const existing = app.vault.getAbstractFileByPath(folder);
    if (!existing) {
      await app.vault.createFolder(folder);
    }
  }

  await app.vault.createBinary(filepath, await blob.arrayBuffer());
  return filepath;
}

export interface TranscriptionDeps {
  app: App;
  settings: PluginSettings;
  activeNotice: { current: Notice | null };
  abortRef: { current: AbortController | null };
  getLocale: () => "es" | "en";
  insertAtCursor: (editor: Editor, text: string) => void;
  onComplete?: (content: string, sourcePath: string) => Promise<void>;
  sourcePath?: string;
}

export async function runTranscription(
  deps: TranscriptionDeps,
  editor: Editor,
  blob: Blob,
  speakerMapping?: SpeakerMapping,
  skipSpeakerModal = false
): Promise<void> {
  const L = (key: keyof LocaleStrings) => t(key, deps.getLocale());
  const primaryMeta = PROVIDER_REGISTRY[deps.settings.provider];
  const fallbackChain = buildFallbackChain(deps.settings.provider);

  if (!primaryMeta.supportsDiarization && !skipSpeakerModal) {
    new Notice(L("diarizationWarning"), 5000);
  }

  let resolvedMapping: SpeakerMapping;
  if (speakerMapping) {
    resolvedMapping = speakerMapping;
  } else if (primaryMeta.supportsDiarization) {
    const mapping = await new SpeakerModal(deps.app, deps.getLocale()).prompt();
    if (!mapping) return;
    resolvedMapping = mapping;
  } else {
    resolvedMapping = { count: 1, names: ["Speaker"] };
  }

  let audioPath: string | undefined;
  if (deps.settings.saveAudioAfterTranscription && blob.size > 0) {
    audioPath = await saveAudioFile(deps.app, deps.settings, blob);
  }

  const notice = new Notice("", 0);
  deps.activeNotice.current = notice;
  const startTime = Date.now();

  const messageEl = notice.messageEl;
  const statusEl = messageEl.createDiv({
    text: `${L("transcribing")}...`,
  });
  const progressBar = messageEl.createDiv({
    attr: {
      style:
        "width:100%;height:4px;background:var(--background-modifier-border);margin-top:4px;border-radius:2px;",
    },
  });
  const progressFill = progressBar.createDiv({
    attr: {
      style:
        "width:0%;height:100%;background:var(--interactive-accent);border-radius:2px;transition:width 0.3s;",
    },
  });

  deps.abortRef.current?.abort();
  const controller = new AbortController();
  deps.abortRef.current = controller;

  const language =
    deps.settings.languageDetection === "auto"
      ? undefined
      : deps.settings.defaultLanguage;

  const errors: string[] = [];

  try {
    for (const providerId of fallbackChain) {
      const meta = PROVIDER_REGISTRY[providerId];
      const apiKey = getApiKeyFor(deps.settings, meta);

      if (meta.requiresApiKey && !apiKey) continue;

      statusEl.textContent = `${L("transcribing")} ${meta.label}...`;
      progressFill.setCssProps({ width: "0%" });

      try {
        const utterances = await meta.transcriber.transcribe(blob, apiKey, {
          speakerNames: resolvedMapping.names,
          language,
          signal: controller.signal,
          model: getModelFor(deps.settings, providerId),
          onProgress: (pct: number) => {
            progressFill.style.width = `${Math.min(pct, 100)}%`;
          },
        });

        const formatted = formatTranscription(
          utterances,
          resolvedMapping.names,
          audioPath,
          deps.settings.outputTemplate,
          deps.settings.insertAsCallout,
          L
        );
        deps.insertAtCursor(editor, formatted);

        if (audioPath) {
          const filename = audioPath.split("/").pop() ?? audioPath;
          deps.insertAtCursor(editor, `\n📁 [[${filename}]]\n`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        notice.hide();
        new Notice(
          `${L("transcriptionReady")} (${meta.label}) ${elapsed}s`
        );
        if (deps.onComplete && deps.sourcePath) {
          void deps.onComplete(formatted, deps.sourcePath);
        }
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          notice.hide();
          return;
        }
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        errors.push(`${meta.label}: ${message}`);
        console.warn(`[Audio Transcript] ${meta.label} failed:`, err);
      }
    }

    notice.hide();
    const summary =
      errors.length > 0
        ? errors.join(" | ")
        : "No hay proveedores configurados";
    new Notice(`${L("transcriptionFailed")}: ${summary}`);
    console.error("[Audio Transcript] All providers failed:", errors);

    if (audioPath) {
      const filename = audioPath.split("/").pop() ?? audioPath;
      deps.insertAtCursor(editor, `\n📁 [[${filename}]]\n`);
    }
  } finally {
    if (deps.activeNotice.current === notice)
      deps.activeNotice.current = null;
    if (deps.abortRef.current === controller)
      deps.abortRef.current = null;
  }
}
