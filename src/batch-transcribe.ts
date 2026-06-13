import { Editor, Notice, TFile } from "obsidian";
import type { PluginSettings } from "./settings";
import { PROVIDER_REGISTRY } from "./providers/registry";
import { SpeakerModal } from "./speaker-modal";
import { pickMultipleAudioFiles } from "./file-picker";
import { SpeakerMapping } from "./types";
import { t, type LocaleStrings } from "./locales";

export interface PluginHost {
  app: import("obsidian").App;
  settings: PluginSettings;
  getLocale(): "es" | "en";
  getApiKey(): string;
  runTranscription(
    editor: Editor,
    blob: Blob,
    speakerMapping?: SpeakerMapping,
    skipSpeakerModal?: boolean
  ): Promise<void>;
}

export async function ensurePluginNote(host: PluginHost): Promise<void> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const folder = host.settings.audioFolder || "";
  const path = folder
    ? `${folder}/Transcripcion-${ts}.md`
    : `Transcripcion-${ts}.md`;

  if (folder) {
    const existing = host.app.vault.getAbstractFileByPath(folder);
    if (!existing) await host.app.vault.createFolder(folder);
  }

  const existing = host.app.vault.getAbstractFileByPath(path);
  if (!existing) {
    const file = await host.app.vault.create(path, "");
    const leaf = host.app.workspace.getLeaf(false);
    if (leaf) await leaf.openFile(file);
  } else if (existing instanceof TFile) {
    const leaf = host.app.workspace.getLeaf(false);
    if (leaf) await leaf.openFile(existing);
  }
}

export async function transcribeBatch(
  host: PluginHost,
  editor: Editor
): Promise<void> {
  const L = (key: keyof LocaleStrings) => t(key, host.getLocale());
  const meta = PROVIDER_REGISTRY[host.settings.provider];

  if (meta.requiresApiKey && !host.getApiKey()) {
    new Notice(
      `${L("noApiKey")} ${meta.label}. Settings → Audio Transcript.`
    );
    return;
  }

  const files = await pickMultipleAudioFiles();
  if (!files || files.length === 0) return;

  let speakerMapping: SpeakerMapping;
  if (meta.supportsDiarization) {
    const mapping = await new SpeakerModal(
      host.app,
      host.getLocale()
    ).prompt();
    if (!mapping) return;
    speakerMapping = mapping;
  } else {
    speakerMapping = { count: 1, names: ["Speaker"] };
  }

  const total = files.length;
  const notice = new Notice("", 0);
  const messageEl = notice.messageEl;
  const titleEl = messageEl.createDiv({
    text: `Transcribiendo 0/${total}...`,
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

  let completed = 0;
  for (const file of files) {
    try {
      await host.runTranscription(editor, file, speakerMapping, true);
      completed++;
      titleEl.textContent = `Transcribiendo ${completed}/${total}...`;
      progressFill.setCssProps({
        width: `${Math.round((completed / total) * 100)}%`,
      });
    } catch (err) {
      completed++;
      console.error(
        `[Audio Transcript] Batch: file ${file.name} failed`,
        err
      );
    }
  }

  notice.hide();
  new Notice(`${completed}/${total} transcripciones completadas`);
}
