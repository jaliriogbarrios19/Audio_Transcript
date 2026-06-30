import {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Plugin,
  requestUrl,
  moment,
} from "obsidian";
import {
  PluginSettings,
  DEFAULT_SETTINGS,
  SettingsTab,
} from "./src/settings";
import { PROVIDER_REGISTRY, setSpobBaseUrl } from "./src/providers/registry";
import { RecordingModal } from "./src/recording-modal";
import { ChoiceModal } from "./src/choice-modal";
import { pickAudioFile } from "./src/file-picker";
import { runTranscription } from "./src/transcription-runner";
import { autoSummarizeContent } from "./src/premium/auto-summarize";
import { SpeakerMapping } from "./src/types";
import { DashboardView, VIEW_TYPE_DASHBOARD } from "./src/premium/dashboard-view";
import { t, type LocaleStrings } from "./src/locales";
import { ensurePluginNote, transcribeBatch, type PluginHost } from "./src/batch-transcribe";
import { WhatsNewModal } from "./src/whats-new-modal";

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
      const choice = await new ChoiceModal(this.app, this.getLocale()).prompt();
      if (choice === "record") {
        void this.startRecording(view.editor);
      } else if (choice === "file") {
        void this.transcribeFile(view.editor);
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
      ) => void transcribeBatch(this.getHost(), editor),
    });

    this.registerView(
      VIEW_TYPE_DASHBOARD,
      (leaf) => new DashboardView(leaf, this)
    );

    this.addRibbonIcon("layout-dashboard", "Dashboard de transcripciones", () => {
      void this.activateDashboard();
    });

    this.addCommand({
      id: "open-dashboard",
      name: "Abrir dashboard de transcripciones",
      callback: () => {
        void this.activateDashboard();
      },
    });

    this.statusBarItemEl = this.addStatusBarItem();
    if (this.hasLLMProvider()) {
      this.statusBarItemEl.setText("IA configurada");
      void this.updateStatusBarCredits();
    }

    this.checkWhatsNew();
  }

  onunload() {
    this.abortController?.abort();
    this.activeNotice?.hide();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as PluginSettings;
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  private checkWhatsNew(): void {
    const currentVersion = this.manifest.version;
    const lastSeen = this.settings.lastSeenVersion;

    if (lastSeen !== currentVersion) {
      window.setTimeout(() => {
        new WhatsNewModal(this.app, lastSeen).open();
        this.settings.lastSeenVersion = currentVersion;
        void this.saveSettings();
      }, 1000);
    }
  }

  private get providerMeta() {
    return PROVIDER_REGISTRY[this.settings.provider];
  }

  private getApiKey(): string {
    const field = this.providerMeta.apiKeyField;
    return (this.settings as unknown as Record<string, string>)[field] ?? "";
  }

  private getHost(): PluginHost {
    return {
      app: this.app,
      settings: this.settings,
      getLocale: () => this.getLocale(),
      getApiKey: () => this.getApiKey(),
      runTranscription: (editor, blob, speakerMapping, skipSpeakerModal) =>
        this.runTranscription(editor, blob, speakerMapping, skipSpeakerModal),
    };
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

  private async activateDashboard() {
    try {
      const { workspace } = this.app;
      let leaf = workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD)[0];
      if (!leaf) {
        leaf = workspace.getLeaf("tab");
        await leaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
      }
      workspace.setActiveLeaf(leaf, { focus: true });
    } catch (err) {
      console.error("[Audio Transcript] activateDashboard error:", err);
      new Notice(`Dashboard error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async transcribeFromDashboard(): Promise<void> {
    const choice = await new ChoiceModal(this.app, this.getLocale()).prompt();
    if (!choice) return;

    await ensurePluginNote(this.getHost());
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (!editor) {
      new Notice("No se pudo abrir una nota para la transcripcion.");
      return;
    }

    if (choice === "record") {
      const blob = await new RecordingModal(this.app, this.getLocale(), this.settings.recordingSampleRate, this.settings.recordingMode).start();
      if (!blob) return;
      await this.runTranscription(editor, blob);
    } else if (choice === "file") {
      const file = await pickAudioFile();
      if (!file) return;
      await this.runTranscription(editor, file);
    }
  }

  private hasLLMProvider(): boolean {
    const s = this.settings;
    const providers = ["openai","anthropic","deepseek","gemini","openrouter","grok","glm","spob"];
    for (const p of providers) {
      const key = `${p}ApiKey` as keyof PluginSettings;
      if (s[key]) return true;
    }
    return false;
  }

  private async updateStatusBarCredits() {
    const s = this.settings;
    const spobActive = s.flashProvider === "spob" || s.advancedProvider === "spob";
    if (!spobActive || !s.spobApiKey) return;
    try {
      const baseUrl = s.spobBaseUrl || "https://spob.fly.dev";
      const res = await requestUrl({
        url: `${baseUrl}/me`,
        headers: { Authorization: `Bearer ${s.spobApiKey}` },
      });
      if (res.status >= 200 && res.status < 300) {
        const data = res.json as { credits?: number };
        if (data.credits != null && this.statusBarItemEl) {
          this.statusBarItemEl.setText(`spob: $${Number(data.credits).toFixed(4)}`);
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
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    await runTranscription(
      {
        app: this.app,
        settings: this.settings,
        activeNotice: { current: this.activeNotice },
        abortRef: { current: this.abortController },
        getLocale: () => this.getLocale(),
        insertAtCursor: (ed, text) => this.insertAtCursor(ed, text),
        onComplete: (content, sourcePath) =>
          autoSummarizeContent(this.app, this.settings, content, sourcePath, this.getLocale()),
        sourcePath: view?.file?.path ?? "",
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
