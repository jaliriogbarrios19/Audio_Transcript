import { ItemView, WorkspaceLeaf, Notice, TFile } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { scanVault, getCachedEntries } from "./transcription-indexer";
import { getAll, remove } from "./template-store";
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

  getViewType(): string {
    return VIEW_TYPE_DASHBOARD;
  }

  getDisplayText(): string {
    return "Audio Transcript — Dashboard";
  }

  getIcon(): string {
    return "mic";
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.plugin.getLocale());
  }

  async onOpen() {
    await this.refresh();
  }

  async refresh() {
    const container = this.contentEl;
    container.empty();
    container.addClass("at-dashboard");

    const config = getFlashConfig(this.plugin.settings) || getAdvancedConfig(this.plugin.settings);

    if (!config) {
      this.renderNoProvider(container);
      return;
    }

    this.entries = (await scanVault(this.plugin.app)) ?? getCachedEntries() ?? [];
    this.renderDashboard(container);
  }

  private renderNoProvider(container: HTMLElement) {
    container.createEl("h2", { text: this.L("dashboardTitle") });
    const banner = container.createDiv({ cls: "at-banner" });
    banner.createEl("p", { text: this.L("noLLMConfig") });
    banner.createEl("p", {
      text: this.L("noLLMConfigHint"),
      cls: "at-banner-hint",
    });
  }

  private async renderDashboard(container: HTMLElement) {
    const flashCfg = getFlashConfig(this.plugin.settings);
    const advCfg = getAdvancedConfig(this.plugin.settings);

    let credits = "—";
    if (flashCfg && flashCfg.baseUrl.includes("spob-backend")) {
      try {
        const res = await fetch(`${flashCfg.baseUrl}/me`, {
          headers: { Authorization: `Bearer ${flashCfg.apiKey}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { credits?: number };
          credits = data.credits != null ? `$${Number(data.credits).toFixed(2)}` : "—";
        }
      } catch { /* offline or unreachable */ }
    }

    const templates = getAll(this.plugin.settings.promptTemplates);

    container.createEl("h2", { text: this.L("dashboardTitle") });

    const kpiGrid = container.createDiv({ cls: "at-kpi-grid" });
    this.addKPI(kpiGrid, this.L("credit"),
      (this.plugin.settings.flashProvider === "spob" || this.plugin.settings.advancedProvider === "spob") ? credits : this.L("deepseekDirect"),
      (this.plugin.settings.flashProvider === "spob" || this.plugin.settings.advancedProvider === "spob") ? "positive" : "neutral"
    );
    this.addKPI(kpiGrid, this.L("transcriptions"), String(this.entries.length), "neutral");
    this.addKPI(kpiGrid, this.L("templates"), String(templates.length), "neutral");
    this.addKPI(kpiGrid, this.L("aiProvider"),
      `${flashCfg ? "Flash: " + flashCfg.model : "—"} / ${advCfg ? "Adv: " + advCfg.model : "—"}`,
      "neutral"
    );

    const actions = container.createDiv({ cls: "at-actions" });
    const chatBtn = actions.createEl("button", { text: this.L("newChat") });
    chatBtn.onclick = () => {
      new ChatModal(this.plugin.app, this.plugin).open();
    };
    const refreshBtn = actions.createEl("button", { text: this.L("refreshBtn") });
    refreshBtn.onclick = () => this.refresh();

    container.createEl("h3", { text: this.L("history") });
    if (this.entries.length === 0) {
      container.createEl("p", {
        text: this.L("historyEmpty"),
        cls: "at-empty",
      });
    } else {
      const table = container.createEl("table", { cls: "at-table" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      for (const h of [this.L("dateHeader"), this.L("noteHeader"), this.L("speakersHeader"), this.L("previewHeader"), ""]) {
        headerRow.createEl("th", { text: h });
      }
      const tbody = table.createEl("tbody");
      for (const entry of this.entries) {
        const row = tbody.createEl("tr", { cls: "at-clickable-row" });
        row.createEl("td", { text: entry.date || "—" });
        const noteCell = row.createEl("td");
        const link = noteCell.createEl("a", {
          text: entry.noteName,
          href: entry.path,
        });
        link.onclick = (e) => {
          e.preventDefault();
          this.plugin.app.workspace.openLinkText(entry.path, "", false);
        };
        row.createEl("td", { text: String(entry.speakerCount) });
        row.createEl("td", { text: entry.preview || this.L("previewNoText"), cls: "at-preview" });
        const actionCell = row.createEl("td");
        const summarizeBtn = actionCell.createEl("button", {
          text: this.L("summarize"),
        });
        summarizeBtn.onclick = async () => {
          summarizeBtn.disabled = true;
          await this.summarizeEntry(entry);
          summarizeBtn.disabled = false;
        };
      }
    }

    container.createEl("h3", { text: this.L("templateSection") });
    const templateList = container.createDiv({ cls: "at-template-list" });
    const deleteButtons: HTMLButtonElement[] = [];
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const row = templateList.createDiv({ cls: "at-template-row" });
      row.createSpan({ text: t.name, cls: "at-template-name" });
      row.createSpan({ text: t.prompt.slice(0, 60) + (t.prompt.length > 60 ? "..." : ""), cls: "at-template-preview" });
      const delBtn = row.createEl("button", { text: "x" });
      deleteButtons.push(delBtn);
      delBtn.onclick = async () => {
        for (const btn of deleteButtons) btn.disabled = true;
        try {
          this.plugin.settings.promptTemplates = remove(
            this.plugin.settings.promptTemplates,
            i
          );
          await this.plugin.saveSettings();
          await this.refresh();
        } catch {
          for (const btn of deleteButtons) btn.disabled = false;
        }
      };
    }
  }

  private async summarizeEntry(entry: TranscriptionEntry) {
    const config = getFlashConfig(this.plugin.settings) || getAdvancedConfig(this.plugin.settings);
    if (!config) {
      new Notice(this.L("configLLM"));
      return;
    }

    const noSpeechMarkers = [t("noSpeech", "es"), t("noSpeech", "en")];

    if (noSpeechMarkers.some((m) => entry.calloutContent.includes(m))) {
      new Notice(this.L("nothingToSummarize"));
      return;
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
        const updated = current + `\n\n### ${this.L("summaryHeading")}\n${res.content}\n`;
        await this.plugin.app.vault.modify(file, updated);
        new Notice(this.L("summaryInserted"));
      } else {
        new Notice(`${this.L("summaryDone")}:\n${res.content}`);
      }
    } catch (err) {
      new Notice(`${this.L("summaryError")}: ${err instanceof Error ? err.message : this.L("unknownError")}`);
    }
  }

  private addKPI(
    container: HTMLElement,
    label: string,
    value: string,
    colorClass: string
  ) {
    const card = container.createDiv({ cls: "at-kpi-card" });
    card.createEl("h4", { text: label });
    card.createEl("p", { text: value, cls: `at-kpi-value ${colorClass}` });
  }
}
