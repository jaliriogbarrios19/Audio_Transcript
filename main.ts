import {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Plugin,
  moment,
} from "obsidian";
import {
  PluginSettings,
  DEFAULT_SETTINGS,
  DEFAULT_TEMPLATE,
  SettingsTab,
} from "./src/settings";
import { PROVIDER_REGISTRY, setSpobBaseUrl } from "./src/providers/registry";
import { RecordingModal } from "./src/recording-modal";
import { SpeakerModal } from "./src/speaker-modal";
import { ChoiceModal } from "./src/choice-modal";
import {
  SpeakerMapping,
  Utterance,
  DIARIZATION_WARNING,
} from "./src/types";
import { t, type LocaleStrings } from "./src/locales";

export default class DiaryTranscriberPlugin extends Plugin {
  settings!: PluginSettings;
  private activeNotice: Notice | null = null;
  private abortController: AbortController | null = null;

  private L(key: keyof LocaleStrings): string {
    return t(key, this.getLocale());
  }

  getLocale(): "es" | "en" {
    return moment.locale().startsWith("es") ? "es" : "en";
  }

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));

    this.addRibbonIcon("mic", "Transcribir", async () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice(this.L("openNoteFirst"));
        return;
      }
      const choice = await new ChoiceModal(this.app, this.getLocale()).open();
      if (choice === "record") {
        this.startRecording(view.editor);
      } else if (choice === "file") {
        this.transcribeFile(view.editor);
      }
    });

    this.addCommand({
      id: "record-and-transcribe",
      name: "Grabar y transcribir",
      editorCallback: (
        editor: Editor,
        _ctx: MarkdownView | MarkdownFileInfo
      ) => this.startRecording(editor),
    });

    this.addCommand({
      id: "transcribe-file",
      name: "Transcribir archivo",
      editorCallback: (
        editor: Editor,
        _ctx: MarkdownView | MarkdownFileInfo
      ) => this.transcribeFile(editor),
    });

    this.addCommand({
      id: "transcribe-batch",
      name: "Transcribir varios archivos",
      editorCallback: (
        editor: Editor,
        _ctx: MarkdownView | MarkdownFileInfo
      ) => this.transcribeBatch(editor),
    });
  }

  onunload() {
    this.abortController?.abort();
    this.activeNotice?.hide();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  // ── Provider helpers ──────────────────────────────────────

  private get providerMeta() {
    return PROVIDER_REGISTRY[this.settings.provider];
  }

  private getApiKey(): string {
    const field = this.providerMeta.apiKeyField;
    return (this.settings as unknown as Record<string, string>)[field] ?? "";
  }

  // ── Recording flow ─────────────────────────────────────────

  private async startRecording(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const blob = await new RecordingModal(this.app, this.getLocale(), this.settings.recordingSampleRate, this.settings.recordingMode).start();
    if (!blob) return;

    await this.transcribeBlob(editor, blob);
  }

  // ── File picker flow ───────────────────────────────────────

  private async transcribeFile(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const file = await this.pickAudioFile();
    if (!file) return;

    await this.transcribeBlob(editor, file);
  }

  // ── Batch flow ────────────────────────────────────────────

  private async transcribeBatch(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const files = await this.pickMultipleAudioFiles();
    if (!files || files.length === 0) return;

    // Speaker mapping once for all files (if diarization supported)
    let speakerMapping: SpeakerMapping;
    if (this.providerMeta.supportsDiarization) {
      const mapping = await new SpeakerModal(
        this.app,
        this.getLocale()
      ).open();
      if (!mapping) return;
      speakerMapping = mapping;
    } else {
      speakerMapping = { count: 1, names: ["Speaker"] };
    }

    const total = files.length;
    const notice = new Notice("", 0);
    const noticeEl = notice.noticeEl;
    const titleEl = noticeEl.createDiv({
      text: `Transcribiendo 0/${total}...`,
    });
    const progressBar = noticeEl.createDiv({
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
        await this.transcribeBlob(
          editor,
          file,
          speakerMapping,
          true // skip speaker modal (already got mapping)
        );
        completed++;
        titleEl.textContent = `Transcribiendo ${completed}/${total}...`;
        progressFill.style.width = `${Math.round((completed / total) * 100)}%`;
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

  // ── Shared transcription ───────────────────────────────────

  private async transcribeBlob(
    editor: Editor,
    blob: Blob,
    speakerMapping?: SpeakerMapping,
    skipSpeakerModal = false
  ) {
    const meta = this.providerMeta;
    const apiKey = this.getApiKey();

    // Diarization notice
    if (!meta.supportsDiarization && !skipSpeakerModal) {
      new Notice(this.L("diarizationWarning"), 5000);
    }

    // Speaker mapping — skip for providers without diarization, or when provided
    let resolvedMapping: SpeakerMapping;
    if (speakerMapping) {
      resolvedMapping = speakerMapping;
    } else if (meta.supportsDiarization) {
      const mapping = await new SpeakerModal(
        this.app,
        this.getLocale()
      ).open();
      if (!mapping) return;
      resolvedMapping = mapping;
    } else {
      resolvedMapping = { count: 1, names: ["Speaker"] };
    }

    // Progress bar UI
    const notice = new Notice("", 0);
    this.activeNotice = notice;
    const startTime = Date.now();

    const noticeEl = notice.noticeEl;
    noticeEl.createDiv({
      text: `${this.L("transcribing")} ${meta.label}...`,
    });
    const progressBar = noticeEl.createDiv({
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

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      const language =
        this.settings.languageDetection === "auto"
          ? undefined
          : this.settings.defaultLanguage;

      const utterances = await meta.transcriber.transcribe(blob, apiKey, {
        speakerNames: resolvedMapping.names,
        language,
        signal: controller.signal,
        model:
          this.settings.provider === "assemblyai" || this.settings.provider === "spob"
            ? this.settings.assemblyaiModel
            : undefined,
        onProgress: (pct: number) => {
          progressFill.style.width = `${Math.min(pct, 100)}%`;
        },
      });

      // Save audio first so timestamps can link to it
      let audioPath: string | undefined;
      if (this.settings.saveAudioAfterTranscription && blob.size > 0) {
        audioPath = await this.saveAudioFile(blob);
      }

      const formatted = this.formatTranscription(
        utterances,
        resolvedMapping.names,
        audioPath
      );
      this.insertAtCursor(editor, formatted);

      if (audioPath) {
        const filename = audioPath.split("/").pop() ?? audioPath;
        this.insertAtCursor(editor, `\n📁 [[${filename}]]\n`);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      notice.hide();
      new Notice(`${this.L("transcriptionReady")} ${elapsed}s`);
    } catch (err) {
      notice.hide();
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Error desconocido";
      new Notice(`${this.L("transcriptionFailed")}: ${message}`);
      console.error("[Audio Transcript]", err);
    } finally {
      if (this.activeNotice === notice) this.activeNotice = null;
      if (this.abortController === controller) this.abortController = null;
    }
  }

  // ── Save audio ─────────────────────────────────────────────

  private async saveAudioFile(blob: Blob): Promise<string> {
    const ext = blob.type.split("/")[1]?.split(";")[0] || "webm";
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `grabacion-${ts}.${ext}`;

    const folder = this.settings.audioFolder || this.defaultFolder();
    const filepath = folder ? `${folder}/${filename}` : filename;

    await this.app.vault.createBinary(filepath, await blob.arrayBuffer());
    return filepath;
  }

  private defaultFolder(): string {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile?.parent?.path ?? "";
  }

  // ── File picker ────────────────────────────────────────────

  private pickMultipleAudioFiles(): Promise<File[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.multiple = true;

      let resolved = false;
      const done = (files: File[] | null) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(files);
      };

      const cleanup = () => {
        window.removeEventListener("focus", focusHandler);
        clearTimeout(safetyTimer);
      };

      const focusHandler = () => {
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            done(null);
          }
        }, 300);
      };

      input.onchange = () => {
        const list = input.files;
        if (!list || list.length === 0) {
          done(null);
        } else {
          done(Array.from(list));
        }
      };

      const safetyTimer = setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          done(null);
        }
      }, 120_000);

      window.addEventListener("focus", focusHandler);
      input.click();
    });
  }

  private pickAudioFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";

      let resolved = false;
      const done = (file: File | null) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(file);
      };

      const cleanup = () => {
        window.removeEventListener("focus", focusHandler);
        clearTimeout(safetyTimer);
      };

      const focusHandler = () => {
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            done(null);
          }
        }, 300);
      };

      input.onchange = () => {
        done(input.files?.[0] ?? null);
      };

      const safetyTimer = setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          done(null);
        }
      }, 120_000);

      window.addEventListener("focus", focusHandler);
      input.click();
    });
  }

  // ── Formatting ─────────────────────────────────────────────

  private formatTranscription(
    utterances: Utterance[],
    speakerNames: string[],
    audioPath?: string
  ): string {
    if (utterances.length === 0) {
      return `*(${this.L("noSpeech")})*`;
    }

    const template =
      this.settings.outputTemplate || DEFAULT_TEMPLATE;

    // Merge consecutive utterances from the same speaker
    const merged = this.mergeUtterances(utterances, speakerNames);

    const lines = merged.map((u) => {
      const name = speakerNames[u.speaker - 1] || `Speaker ${u.speaker}`;
      const time = this.formatTimestamp(u.start, audioPath);
      return template
        .replace(/\{speaker\}/g, name)
        .replace(/\{time\}/g, time)
        .replace(/\{text\}/g, u.text);
    });

    if (this.settings.insertAsCallout) {
      return (
        "> [!transcription]- Transcription\n" +
        lines.map((l) => `> ${l}`).join("\n>\n")
      );
    }

    return lines.join("\n\n");
  }

  private mergeUtterances(
    utterances: Utterance[],
    speakerNames: string[]
  ): Utterance[] {
    const merged: Utterance[] = [];
    for (const u of utterances) {
      const last = merged[merged.length - 1];
      if (last && last.speaker === u.speaker) {
        last.text += " " + u.text;
        last.end = u.end;
      } else {
        merged.push({ ...u });
      }
    }
    return merged;
  }

  private formatTimestamp(seconds: number, audioPath?: string): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ts = `${m}:${s.toString().padStart(2, "0")}`;
    if (audioPath) {
      const filename = audioPath.split("/").pop() ?? audioPath;
      return `[${ts}](${encodeURI(filename)})`;
    }
    return `\`${ts}\``;
  }

  // ── Editor insert ──────────────────────────────────────────

  private insertAtCursor(editor: Editor, text: string) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
  }
}
