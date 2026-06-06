import {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Platform,
  Plugin,
  requestUrl,
  TFile,
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
      ) => this.transcribeBatch(editor),
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
    this.statusBarItemEl.setText(this.getStatusBarText());

    if (this.hasLLMProvider()) {
      void this.updateStatusBarCredits();
    }
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
        await this.runTranscription(
          editor,
          file,
          speakerMapping,
          true
        );
        completed++;
        titleEl.textContent = `Transcribiendo ${completed}/${total}...`;
        progressFill.setCssProps({ width: `${Math.round((completed / total) * 100)}%` });
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
      if (Platform.isMobile) {
        leaf = workspace.getLeaf(true);
        await leaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
      } else {
        const rightLeaf = workspace.getRightLeaf(false);
        if (rightLeaf) {
          await rightLeaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
          leaf = rightLeaf;
        }
      }
    }
    if (leaf) workspace.setActiveLeaf(leaf, { focus: true });
  }

  async transcribeFromDashboard(): Promise<void> {
    const choice = await new ChoiceModal(this.app, this.getLocale()).prompt();
    if (!choice) return;

    await this.ensurePluginNote();
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

  private async ensurePluginNote(): Promise<void> {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const folder = this.settings.audioFolder || "";
    const path = folder ? `${folder}/Transcripcion-${ts}.md` : `Transcripcion-${ts}.md`;

    if (folder) {
      const existing = this.app.vault.getAbstractFileByPath(folder);
      if (!existing) await this.app.vault.createFolder(folder);
    }

    const existing = this.app.vault.getAbstractFileByPath(path);
    if (!existing) {
      const file = await this.app.vault.create(path, "");
      const leaf = this.app.workspace.getLeaf(false);
      if (leaf) await leaf.openFile(file);
    } else if (existing instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      if (leaf) await leaf.openFile(existing);
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

  private getStatusBarText(): string {
    if (!this.hasLLMProvider()) return "";
    return "IA configurada";
  }

  private async updateStatusBarCredits() {
    const s = this.settings;
    const spobActive = s.flashProvider === "spob" || s.advancedProvider === "spob";
    if (!spobActive || !s.spobApiKey) return;
    try {
      const baseUrl = s.spobBaseUrl || "https://spob-backend.fly.dev";
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
