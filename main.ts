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
  SettingsTab,
} from "./src/settings";
import { PROVIDER_REGISTRY, setSpobBaseUrl } from "./src/providers/registry";
import { RecordingModal } from "./src/recording-modal";
import { SpeakerModal } from "./src/speaker-modal";
import { ChoiceModal } from "./src/choice-modal";
import { pickAudioFile, pickMultipleAudioFiles } from "./src/file-picker";
import { runTranscription } from "./src/transcription-runner";
import { SpeakerMapping } from "./src/types";
import { DashboardView, VIEW_TYPE_DASHBOARD } from "./src/premium/dashboard-view";
import { t, type LocaleStrings } from "./src/locales";

export default class DiaryTranscriberPlugin extends Plugin {
  settings!: PluginSettings;
  private activeNotice: Notice | null = null;
  private abortController: AbortController | null = null;
  private statusBarItemEl: HTMLElement | null = null;

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

    this.registerView(
      VIEW_TYPE_DASHBOARD,
      (leaf) => new DashboardView(leaf, this)
    );

    this.addRibbonIcon("layout-dashboard", "Dashboard de transcripciones", () => {
      this.activateDashboard();
    });

    this.addCommand({
      id: "open-dashboard",
      name: "Abrir dashboard de transcripciones",
      callback: () => this.activateDashboard(),
    });

    this.statusBarItemEl = this.addStatusBarItem();
    this.statusBarItemEl.setText(this.getStatusBarText());

    if (this.hasLLMProvider()) {
      this.updateStatusBarCredits();
    }
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

  private get providerMeta() {
    return PROVIDER_REGISTRY[this.settings.provider];
  }

  private getApiKey(): string {
    const field = this.providerMeta.apiKeyField;
    return (this.settings as unknown as Record<string, string>)[field] ?? "";
  }

  private async startRecording(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const blob = await new RecordingModal(this.app, this.getLocale(), this.settings.recordingSampleRate, this.settings.recordingMode).start();
    if (!blob) return;

    await this.runTranscription(editor, blob);
  }

  private async transcribeFile(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const file = await pickAudioFile();
    if (!file) return;

    await this.runTranscription(editor, file);
  }

  private async transcribeBatch(editor: Editor) {
    if (this.providerMeta.requiresApiKey && !this.getApiKey()) {
      new Notice(
        `${this.L("noApiKey")} ${this.providerMeta.label}. Settings → Audio Transcript.`
      );
      return;
    }

    const files = await pickMultipleAudioFiles();
    if (!files || files.length === 0) return;

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
        await this.runTranscription(
          editor,
          file,
          speakerMapping,
          true
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

  private async activateDashboard() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD)[0];
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
        leaf = rightLeaf;
      }
    }
    if (leaf) workspace.revealLeaf(leaf);
  }

  private hasLLMProvider(): boolean {
    if (this.settings.llmProvider === "deepseek" && this.settings.deepseekApiKey) return true;
    if (this.settings.llmProvider === "spob" && this.settings.spobApiKey) return true;
    return false;
  }

  private getStatusBarText(): string {
    if (!this.hasLLMProvider()) return "";
    return this.settings.llmProvider === "spob" ? "spob: —" : "DeepSeek directo";
  }

  private async updateStatusBarCredits() {
    if (this.settings.llmProvider !== "spob" || !this.settings.spobApiKey) return;
    try {
      const baseUrl = this.settings.spobBaseUrl || "https://spob-backend.fly.dev";
      const res = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${this.settings.spobApiKey}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { credits?: number };
        if (data.credits != null && this.statusBarItemEl) {
          this.statusBarItemEl.setText(`spob: $${Number(data.credits).toFixed(2)}`);
        }
      }
    } catch { /* offline */ }
  }

  private async runTranscription(
    editor: Editor,
    blob: Blob,
    speakerMapping?: SpeakerMapping,
    skipSpeakerModal = false
  ) {
    await runTranscription(
      {
        app: this.app,
        settings: this.settings,
        activeNotice: { current: this.activeNotice },
        abortRef: { current: this.abortController },
        getLocale: () => this.getLocale(),
        insertAtCursor: (ed, text) => this.insertAtCursor(ed, text),
      },
      editor,
      blob,
      speakerMapping,
      skipSpeakerModal
    );
  }

  private insertAtCursor(editor: Editor, text: string) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
  }
}
