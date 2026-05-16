import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS, SettingsTab } from "./src/settings";
import { Transcriber } from "./src/transcriber";
import { GladiaTranscriber } from "./src/providers/gladia";
import { DeepgramTranscriber } from "./src/providers/deepgram";
import { AssemblyAITranscriber } from "./src/providers/assemblyai";
import { SpeakerModal } from "./src/speaker-modal";
import { ChoiceModal } from "./src/choice-modal";
import { RecordingModal } from "./src/recording-modal";
import { SpeakerMapping, Utterance } from "./src/types";

export default class DiaryTranscriberPlugin extends Plugin {
  settings!: PluginSettings;
  private activeNotice: Notice | null = null;
  private abortController: AbortController | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));

    this.addRibbonIcon("mic", "Transcribir", async () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice("Abrí una nota primero");
        return;
      }
      const choice = await new ChoiceModal(this.app).open();
      if (choice === "record") {
        this.startRecording(view.editor);
      } else if (choice === "file") {
        this.transcribeFile(view.editor);
      }
    });

    this.addCommand({
      id: "record-and-transcribe",
      name: "Grabar y transcribir",
      editorCallback: (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) =>
        this.startRecording(editor),
    });

    this.addCommand({
      id: "transcribe-file",
      name: "Transcribir archivo",
      editorCallback: (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) =>
        this.transcribeFile(editor),
    });
  }

  onunload() {
    this.abortController?.abort();
    this.activeNotice?.hide();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // ── Recording flow ─────────────────────────────────────────────

  private async startRecording(editor: Editor) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      new Notice(
        `No API key set for ${this.settings.provider}. Settings → Transcripción Obsidian.`
      );
      return;
    }

    const blob = await new RecordingModal(this.app).start();
    if (!blob) return;

    const speakerMapping = await new SpeakerModal(this.app).open();
    if (!speakerMapping) return;

    await this.transcribeBlob(editor, blob, speakerMapping);

    // Insert link to the saved audio file after transcription
    const audioPath = await this.saveAudioFile(blob);
    const filename = audioPath.split("/").pop() ?? audioPath;
    this.insertAtCursor(editor, `\n📁 [[${filename}]]\n`);
  }

  // ── File picker flow ───────────────────────────────────────────

  private async transcribeFile(editor: Editor) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      new Notice(
        `No API key set for ${this.settings.provider}. Settings → Transcripción Obsidian.`
      );
      return;
    }

    const file = await this.pickAudioFile();
    if (!file) return;

    const speakerMapping = await new SpeakerModal(this.app).open();
    if (!speakerMapping) return;

    await this.transcribeBlob(editor, file, speakerMapping);
  }

  // ── Shared transcription ───────────────────────────────────────

  private async transcribeBlob(
    editor: Editor,
    blob: Blob,
    speakerMapping: SpeakerMapping
  ) {
    const apiKey = this.getApiKey();

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    const notice = new Notice(
      `Transcribiendo con ${this.settings.provider}...`,
      0
    );
    this.activeNotice = notice;
    const startTime = Date.now();

    try {
      const transcriber = this.getTranscriber();
      const utterances = await transcriber.transcribe(blob, apiKey, {
        speakerNames: speakerMapping.names,
        language: this.settings.defaultLanguage,
        signal: controller.signal,
        model:
          this.settings.provider === "assemblyai"
            ? this.settings.assemblyaiModel
            : undefined,
      });

      const formatted = this.formatTranscription(
        utterances,
        speakerMapping.names
      );
      this.insertAtCursor(editor, formatted);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      notice.hide();
      new Notice(`Transcripción lista en ${elapsed}s`);
    } catch (err) {
      notice.hide();
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Error desconocido";
      new Notice(`Falló la transcripción: ${message}`);
      console.error("[Transcripción Obsidian]", err);
    } finally {
      if (this.activeNotice === notice) this.activeNotice = null;
      if (this.abortController === controller) this.abortController = null;
    }
  }

  // ── Save audio ─────────────────────────────────────────────────

  private async saveAudioFile(blob: Blob): Promise<string> {
    const ext = blob.type.split("/")[1]?.split(";")[0] || "webm";
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `grabacion-${ts}.${ext}`;

    const activeFile = this.app.workspace.getActiveFile();
    const folder = activeFile?.parent?.path ?? "";
    const filepath = folder ? `${folder}/${filename}` : filename;

    await this.app.vault.createBinary(filepath, await blob.arrayBuffer());
    return filepath;
  }

  // ── Providers ──────────────────────────────────────────────────

  private getTranscriber(): Transcriber {
    switch (this.settings.provider) {
      case "gladia":
        return new GladiaTranscriber();
      case "deepgram":
        return new DeepgramTranscriber();
      case "assemblyai":
        return new AssemblyAITranscriber();
      default:
        throw new Error(`Unknown provider: ${this.settings.provider}`);
    }
  }

  private getApiKey(): string {
    switch (this.settings.provider) {
      case "gladia":
        return this.settings.gladiaApiKey;
      case "deepgram":
        return this.settings.deepgramApiKey;
      case "assemblyai":
        return this.settings.assemblyaiApiKey;
      default:
        throw new Error(`Unknown provider: ${this.settings.provider}`);
    }
  }

  // ── File picker ────────────────────────────────────────────────

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

  // ── Formatting ─────────────────────────────────────────────────

  private formatTranscription(
    utterances: Utterance[],
    speakerNames: string[]
  ): string {
    if (utterances.length === 0) {
      return "*(No speech detected)*";
    }

    const lines = utterances.map((u) => {
      const name = speakerNames[u.speaker - 1] || `Speaker ${u.speaker}`;
      const time = this.formatTimestamp(u.start);
      return `**${name}** \`${time}\`` + "\n" + u.text;
    });

    if (this.settings.insertAsCallout) {
      return (
        "> [!transcription]- Transcription\n" +
        lines.map((l) => `> ${l}`).join("\n>\n")
      );
    }

    return lines.join("\n\n");
  }

  private formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ── Editor insert ──────────────────────────────────────────────

  private insertAtCursor(editor: Editor, text: string) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
  }
}
