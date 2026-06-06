import { ItemView, WorkspaceLeaf, Notice, TFile, Modal, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { scanVault, getCachedEntries } from "./transcription-indexer";
import { getAll, remove, update } from "./template-store";
import { DEFAULT_TEMPLATES } from "../types";
import { getFlashConfig, getAdvancedConfig, chatCompletion } from "./llm-client";
import { ChatModal } from "./chat-modal";
import type { TranscriptionEntry } from "../types";
import { t, type LocaleStrings } from "../locales";

export const VIEW_TYPE_DASHBOARD = "at-dashboard";

export class DashboardView extends ItemView {
  plugin: DiaryTranscriberPlugin;
  private entries: TranscriptionEntry[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: DiaryTranscriberPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_DASHBOARD; }
  getDisplayText(): string { return "Audio Transcript"; }
  getIcon(): string { return "mic"; }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.plugin.getLocale());
  }

  async onOpen() {
    this.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => {
        if (this.plugin.app.workspace.getActiveViewOfType(DashboardView)) {
          this.refresh();
        }
      })
    );
    await this.refresh();
  }

  async refresh() {
    const container = this.contentEl;
    container.empty();
    container.addClass("at-dashboard");

    const config = getFlashConfig(this.plugin.settings) || getAdvancedConfig(this.plugin.settings);

    this.entries = (await scanVault(this.plugin.app)) ?? getCachedEntries() ?? [];
    this.renderDashboard(container, config);
  }

  private renderDashboard(container: HTMLElement, config: ReturnType<typeof getFlashConfig>) {
    const flashCfg = getFlashConfig(this.plugin.settings);
    const advCfg = getAdvancedConfig(this.plugin.settings);
    const hasSpob = this.plugin.settings.provider === "spob" || this.plugin.settings.flashProvider === "spob" || this.plugin.settings.advancedProvider === "spob";

    container.createEl("div", { cls: "at-header" }).createEl("h2", {
      text: "🎙️ " + this.L("dashboardTitle"),
    });

    if (!config) {
      const banner = container.createDiv({ cls: "at-banner" });
      banner.createEl("p", { text: this.L("noLLMConfig") });
      banner.createEl("p", { text: this.L("noLLMConfigHint"), cls: "at-banner-hint" });
    }

    const transcribeBtn = container.createEl("button", {
      text: "🎤 " + this.L("transcribe"),
      cls: "at-transcribe-btn",
    });
    transcribeBtn.onclick = async () => {
      transcribeBtn.disabled = true;
      await this.plugin.transcribeFromDashboard();
      transcribeBtn.disabled = false;
      await this.refresh();
    };

    // KPI Grid
    const kpiGrid = container.createDiv({ cls: "at-kpi-grid" });
    if (hasSpob) {
      this.addKPI(kpiGrid, "💰", this.L("credit"), "—", "positive", async (el) => {
        let spobCfg: { baseUrl: string; apiKey: string } | null = flashCfg || advCfg;
        if (!spobCfg && this.plugin.settings.provider === "spob" && this.plugin.settings.spobApiKey) {
          spobCfg = {
            baseUrl: this.plugin.settings.spobBaseUrl || "https://spob-backend.fly.dev",
            apiKey: this.plugin.settings.spobApiKey,
          };
        }
        if (spobCfg) {
          try {
            const res = await fetch(`${spobCfg.baseUrl}/me`, { headers: { Authorization: `Bearer ${spobCfg.apiKey}` } });
            if (res.ok) {
              const d = (await res.json()) as { credits?: number };
              if (d.credits != null) el.setText(`$${Number(d.credits).toFixed(4)}`);
            }
          } catch { /* offline */ }
        }
      });
    }
    this.addKPI(kpiGrid, "📝", this.L("transcriptions"), String(this.entries.length), "neutral");
    const templates = getAll(this.plugin.settings.promptTemplates);
    this.addKPI(kpiGrid, "🧠", this.L("templates"), String(templates.length), "neutral");
    this.addKPI(kpiGrid, "🤖", this.L("aiProvider"),
      `${flashCfg ? "⚡ " + flashCfg.model : "—"} / ${advCfg ? "🧠 " + advCfg.model : "—"}`,
      "neutral",
      undefined,
      () => {
        (this.plugin as any).app.setting?.open();
        const settingTab = (this.plugin as any).app.setting?.pluginTabs?.find(
          (t: any) => t.id === "audio-transcript"
        );
        if (settingTab) (this.plugin as any).app.setting?.openTabById("audio-transcript");
      }
    );

    // Quick actions
    const actions = container.createDiv({ cls: "at-actions" });
    const chatBtn = actions.createEl("button", { text: "💬 " + this.L("newChat") });
    chatBtn.onclick = () => { new ChatModal(this.plugin.app, this.plugin).open(); };
    const refreshBtn = actions.createEl("button", { text: "🔄 " + this.L("refreshBtn") });
    refreshBtn.onclick = () => this.refresh();

    // History table
    container.createEl("h3", { text: this.L("history") });
    if (this.entries.length === 0) {
      container.createEl("p", { text: this.L("historyEmpty"), cls: "at-empty" });
    } else {
      const wrapper = container.createDiv({ cls: "at-table-wrapper" });
      const table = wrapper.createEl("table", { cls: "at-table" });
      const thead = table.createEl("thead");
      const hr = thead.createEl("tr");
      for (const h of [this.L("dateHeader"), this.L("noteHeader"), this.L("speakersHeader"), this.L("previewHeader"), ""]) {
        hr.createEl("th", { text: h });
      }
      const tbody = table.createEl("tbody");
      for (const entry of this.entries) {
        const row = tbody.createEl("tr", { cls: "at-clickable-row" });
        row.createEl("td", { text: entry.date || "—" });
        const nc = row.createEl("td");
        const link = nc.createEl("a", { text: entry.noteName, href: entry.path });
        link.onclick = (e) => { e.preventDefault(); this.plugin.app.workspace.openLinkText(entry.path, "", false); };
        row.createEl("td", { text: String(entry.speakerCount) });
        row.createEl("td", { text: entry.preview || this.L("previewNoText"), cls: "at-preview" });
        const ac = row.createEl("td");
        const sBtn = ac.createEl("button", { text: this.L("summarize") });
        sBtn.onclick = async () => { sBtn.disabled = true; await this.summarizeEntry(entry); sBtn.disabled = false; };
      }
    }

    // Templates
    container.createEl("h3", { text: this.L("templateSection") });
    const tl = container.createDiv({ cls: "at-template-list" });
    const delBtns: HTMLButtonElement[] = [];

    const addRow = tl.createDiv({ cls: "at-template-row", attr: { style: "justify-content:center;" } });
    const addBtn = addRow.createEl("button", { text: "+ Nuevo template" });
    addBtn.onclick = () => this.addTemplate();
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const isDefault = i < DEFAULT_TEMPLATES.length;
      const row = tl.createDiv({ cls: "at-template-row" });
      row.createSpan({ text: (isDefault ? "📌 " : "") + t.name, cls: "at-template-name" });
      row.createSpan({ text: t.prompt.slice(0, 60) + (t.prompt.length > 60 ? "..." : ""), cls: "at-template-preview" });
      if (!isDefault) {
        const customIdx = i - DEFAULT_TEMPLATES.length;
        const editBtn = row.createEl("button", { text: "✎" });
        editBtn.onclick = () => this.editTemplate(customIdx, t);
        const dBtn = row.createEl("button", { text: "×" });
        delBtns.push(dBtn);
        dBtn.onclick = async () => {
          for (const b of delBtns) b.disabled = true;
          try {
            this.plugin.settings.promptTemplates = remove(this.plugin.settings.promptTemplates, customIdx);
            await this.plugin.saveSettings();
            await this.refresh();
          } catch { for (const b of delBtns) b.disabled = false; }
        };
      }
    }
  }

  private async summarizeEntry(entry: TranscriptionEntry) {
    const config = getFlashConfig(this.plugin.settings) || getAdvancedConfig(this.plugin.settings);
    if (!config) { new Notice(this.L("configLLM")); return; }

    const noSpeech = [t("noSpeech", "es"), t("noSpeech", "en")];
    if (noSpeech.some((m) => entry.calloutContent.includes(m))) {
      new Notice(this.L("nothingToSummarize")); return;
    }

    new Notice(this.L("generatingSummary"));
    try {
      const res = await chatCompletion(config, [
        { role: "system", content: this.L("summarySystemPrompt") },
        { role: "user", content: entry.calloutContent },
      ]);
      const file = this.plugin.app.vault.getAbstractFileByPath(entry.path);
      if (file instanceof TFile) {
        const current = await this.plugin.app.vault.read(file);
        await this.plugin.app.vault.modify(file, current + `\n\n### ${this.L("summaryHeading")}\n${res.content}\n`);
        new Notice(this.L("summaryInserted"));
      } else {
        new Notice(`${this.L("summaryDone")}:\n${res.content}`);
      }
    } catch (err) {
      new Notice(`${this.L("summaryError")}: ${err instanceof Error ? err.message : this.L("unknownError")}`);
    }
  }

  private async editTemplate(customIdx: number, current: import("../types").PromptTemplate) {
    new AddTemplateModal(this.plugin.app, async (name, prompt) => {
      this.plugin.settings.promptTemplates = update(
        this.plugin.settings.promptTemplates,
        customIdx,
        name,
        prompt
      );
      await this.plugin.saveSettings();
      await this.refresh();
    }, current.name, current.prompt).open();
  }

  private async addTemplate() {
    new AddTemplateModal(this.plugin.app, async (name, prompt) => {
      this.plugin.settings.promptTemplates = [
        ...this.plugin.settings.promptTemplates,
        { name, prompt },
      ];
      await this.plugin.saveSettings();
      await this.refresh();
    }).open();
  }

  private addKPI(
    container: HTMLElement, icon: string, label: string, value: string,
    colorClass: string, asyncValue?: (el: HTMLElement) => Promise<void>,
    onClick?: () => void
  ) {
    const card = container.createDiv({ cls: "at-kpi-card" });
    if (onClick) {
      card.style.cursor = "pointer";
      card.onclick = onClick;
    }
    card.createSpan({ text: icon, cls: "at-kpi-icon" });
    card.createEl("h4", { text: label });
    const valEl = card.createEl("p", { text: value, cls: `at-kpi-value ${colorClass}` });
    if (asyncValue) asyncValue(valEl);
  }
}

class AddTemplateModal extends Modal {
  private onSubmit: (name: string, prompt: string) => void;
  private defaultName: string;
  private defaultPrompt: string;

  constructor(
    app: import("obsidian").App,
    onSubmit: (name: string, prompt: string) => void,
    defaultName = "",
    defaultPrompt = ""
  ) {
    super(app);
    this.onSubmit = onSubmit;
    this.defaultName = defaultName;
    this.defaultPrompt = defaultPrompt;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.defaultName ? "Editar template" : "Nuevo template" });

    let name = this.defaultName;
    let prompt = this.defaultPrompt;

    new Setting(contentEl).setName("Nombre").addText((t) => {
      t.setValue(this.defaultName).setPlaceholder("Ej: Minuta de reunion").onChange((v) => (name = v));
    });
    new Setting(contentEl).setName("Prompt").addTextArea((t) => {
      t.setValue(this.defaultPrompt).setPlaceholder("Instruccion para el LLM...").onChange((v) => (prompt = v));
      t.inputEl.rows = 4;
      t.inputEl.style.width = "100%";
    });

    const btnRow = contentEl.createDiv({ cls: "at-actions", attr: { style: "margin-top:12px;" } });
    btnRow.createEl("button", { text: "Guardar" }).onclick = () => {
      if (!name.trim() || !prompt.trim()) return;
      this.onSubmit(name.trim(), prompt.trim());
      this.close();
    };
    btnRow.createEl("button", { text: "Cancelar" }).onclick = () => this.close();
  }
}
