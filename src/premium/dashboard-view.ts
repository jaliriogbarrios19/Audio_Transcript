import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { scanVault, getCachedEntries } from "./transcription-indexer";
import { getAll, remove } from "./template-store";
import { getLLMConfig } from "./llm-client";
import type { TranscriptionEntry } from "../types";

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

  async onOpen() {
    await this.refresh();
  }

  async refresh() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("at-dashboard");

    const config = getLLMConfig(
      this.plugin.settings.llmProvider,
      this.plugin.settings.spobBaseUrl,
      this.plugin.settings.spobApiKey,
      this.plugin.settings.deepseekApiKey,
      this.plugin.settings.deepseekModel
    );

    if (!config) {
      this.renderNoProvider(container);
      return;
    }

    this.entries = (await scanVault(this.plugin.app)) ?? getCachedEntries() ?? [];
    this.renderDashboard(container, config);
  }

  private renderNoProvider(container: HTMLElement) {
    container.createEl("h2", { text: "Audio Transcript — Dashboard" });
    const banner = container.createDiv({ cls: "at-banner" });
    banner.createEl("p", {
      text: "Activa un proveedor LLM en Settings para desbloquear resumenes y chat con IA.",
    });
    banner.createEl("p", {
      text: "Settings → Audio Transcript → IA (Proveedor LLM)",
      cls: "at-banner-hint",
    });
  }

  private async renderDashboard(container: HTMLElement, config: ReturnType<typeof getLLMConfig>) {
    let credits = "—";
    if (this.plugin.settings.llmProvider === "spob" && config) {
      try {
        const res = await fetch(`${config.baseUrl}/me`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { credits?: number };
          credits = data.credits != null ? `$${data.credits.toFixed(2)}` : "—";
        }
      } catch { /* offline or unreachable */ }
    }

    const templates = getAll(this.plugin.settings.promptTemplates);

    container.createEl("h2", { text: "Audio Transcript — Dashboard" });

    // KPI Grid
    const kpiGrid = container.createDiv({ cls: "at-kpi-grid" });
    this.addKPI(kpiGrid, "Credito",
      this.plugin.settings.llmProvider === "spob" ? credits : "DeepSeek directo",
      this.plugin.settings.llmProvider === "spob" ? "positive" : "neutral"
    );
    this.addKPI(kpiGrid, "Transcripciones", String(this.entries.length), "neutral");
    this.addKPI(kpiGrid, "Templates", String(templates.length), "neutral");
    this.addKPI(kpiGrid, "Proveedor IA",
      this.plugin.settings.llmProvider === "spob" ? "spob" : "DeepSeek",
      "neutral"
    );

    // Quick actions
    const actions = container.createDiv({ cls: "at-actions" });
    const chatBtn = actions.createEl("button", { text: "Nuevo chat" });
    chatBtn.onclick = () => {
      new Notice("Chat disponible en la proxima actualizacion");
    };
    const refreshBtn = actions.createEl("button", { text: "Refrescar" });
    refreshBtn.onclick = () => this.refresh();

    // History table
    container.createEl("h3", { text: "Historial de transcripciones" });
    if (this.entries.length === 0) {
      container.createEl("p", {
        text: "No hay transcripciones todavia. Graba o transcribe un audio para empezar.",
        cls: "at-empty",
      });
    } else {
      const table = container.createEl("table", { cls: "at-table" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      for (const h of ["Fecha", "Nota", "Hab.", "Vista previa"]) {
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
        row.createEl("td", { text: entry.preview, cls: "at-preview" });
      }
    }

    // Templates
    container.createEl("h3", { text: "Templates de prompt" });
    const templateList = container.createDiv({ cls: "at-template-list" });
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const row = templateList.createDiv({ cls: "at-template-row" });
      row.createSpan({ text: t.name, cls: "at-template-name" });
      row.createSpan({ text: t.prompt.slice(0, 60) + (t.prompt.length > 60 ? "..." : ""), cls: "at-template-preview" });
      const delBtn = row.createEl("button", { text: "x" });
      delBtn.onclick = async () => {
        this.plugin.settings.promptTemplates = remove(
          this.plugin.settings.promptTemplates,
          i
        );
        await this.plugin.saveSettings();
        this.refresh();
      };
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
