import { Modal, Notice } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { getCachedEntries, scanVault } from "./transcription-indexer";
import { getAll } from "./template-store";
import { getFlashConfig, getAdvancedConfig, chatCompletion } from "./llm-client";
import type { ChatMessage, TranscriptionEntry } from "../types";
import { t, type LocaleStrings } from "../locales";

export class ChatModal extends Modal {
  plugin: DiaryTranscriberPlugin;
  private selectedEntries: TranscriptionEntry[] = [];
  private templatePrompt = "";
  private mode: "flash" | "advanced" = "flash";

  constructor(app: import("obsidian").App, plugin: DiaryTranscriberPlugin) {
    super(app);
    this.plugin = plugin;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.plugin.getLocale());
  }

  async onOpen() {
    this.selectedEntries = [];
    this.templatePrompt = "";
    this.mode = "flash";

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("at-chat-modal");

    contentEl.createEl("h2", { text: this.L("chatTitle") });

    const flashCfg = getFlashConfig(this.plugin.settings);
    const advCfg = getAdvancedConfig(this.plugin.settings);

    if (!flashCfg && !advCfg) {
      contentEl.createEl("p", { text: this.L("chatNoConfig") });
      return;
    }

    // Mode tabs
    const modeRow = contentEl.createDiv({ cls: "at-actions", attr: { style: "margin-bottom:12px;" } });
    const flashBtn = modeRow.createEl("button", { text: "⚡ Flash" });
    const advBtn = modeRow.createEl("button", { text: "🧠 Advanced" });
    const modeLabel = modeRow.createSpan({ cls: "at-mode-label" });

    const updateModeUI = () => {
      flashBtn.className = this.mode === "flash" ? "at-mode-active" : "";
      advBtn.className = this.mode === "advanced" ? "at-mode-active" : "";
      const cfg = this.mode === "flash"
        ? getFlashConfig(this.plugin.settings)
        : getAdvancedConfig(this.plugin.settings);
      modeLabel.setText(cfg ? cfg.model : "Sin configurar");
    };

    flashBtn.onclick = () => { this.mode = "flash"; updateModeUI(); };
    advBtn.onclick = () => { this.mode = "advanced"; updateModeUI(); };
    updateModeUI();

    let entries = getCachedEntries();
    if (!entries) {
      entries = await scanVault(this.plugin.app);
    }

    const templates = getAll(this.plugin.settings.promptTemplates);

    // Context selector
    contentEl.createEl("h4", { text: this.L("contextSection") });

    const searchInput = contentEl.createEl("input", {
      cls: "at-search-input",
      attr: { placeholder: "Buscar nota por nombre...", type: "text" },
    }) as HTMLInputElement;
    searchInput.style.cssText = "width:100%;margin-bottom:8px;padding:6px;border-radius:4px;";

    const ctxContainer = contentEl.createDiv({ cls: "at-context-selector" });

    const renderContext = (filter = "") => {
      ctxContainer.empty();
      const allEntries = getCachedEntries() ?? entries;
      const filtered = filter
        ? allEntries.filter((e) => e.noteName.toLowerCase().includes(filter.toLowerCase()))
        : allEntries;

      if (filter) {
        const vaultNotes = this.plugin.app.vault.getMarkdownFiles()
          .filter((f) => f.basename.toLowerCase().includes(filter.toLowerCase()))
          .filter((f) => !allEntries.some((e) => e.path === f.path));
        for (const f of vaultNotes.slice(0, 10)) {
          const row = ctxContainer.createDiv({ cls: "at-context-row" });
          const cb = row.createEl("input", { type: "checkbox" });
          row.createSpan({ text: `📄 ${f.basename}` });
          cb.onchange = async () => {
            if (cb.checked) {
              const content = await this.plugin.app.vault.cachedRead(f);
              this.selectedEntries.push({
                path: f.path, noteName: f.basename, date: "",
                speakerCount: 0, preview: content.slice(0, 120),
                calloutContent: content,
              });
            } else {
              this.selectedEntries = this.selectedEntries.filter((e) => e.path !== f.path);
            }
          };
        }
      }

      if (filtered.length === 0 && !filter) {
        ctxContainer.createEl("p", { text: this.L("noTranscriptions"), cls: "at-empty" });
      }
      for (const entry of filtered) {
        const row = ctxContainer.createDiv({ cls: "at-context-row" });
        const cb = row.createEl("input", { type: "checkbox" });
        row.createSpan({ text: `${entry.noteName} (${entry.date})` });
        cb.onchange = () => {
          if (cb.checked) { this.selectedEntries.push(entry); }
          else { this.selectedEntries = this.selectedEntries.filter((e) => e !== entry); }
        };
      }
    };

    searchInput.oninput = () => renderContext(searchInput.value);
    renderContext();

    // Template dropdown
    contentEl.createEl("h4", { text: this.L("templateSection") });
    const templateDropdown = contentEl.createEl("select", { cls: "at-template-dropdown" });
    templateDropdown.createEl("option", { text: this.L("freePrompt"), value: "" });
    for (const t of templates) {
      templateDropdown.createEl("option", { text: t.name, value: t.prompt });
    }
    templateDropdown.onchange = () => {
      this.templatePrompt = templateDropdown.value;
    };

    // Response area (above input)
    const responseArea = contentEl.createDiv({ cls: "at-chat-response" });
    responseArea.style.cssText =
      "margin-bottom:12px;padding:12px;background:var(--background-secondary);border-radius:6px;min-height:40px;display:none;";

    // Chat input
    contentEl.createEl("h4", { text: this.L("yourMessage") });
    const textarea = contentEl.createEl("textarea", {
      cls: "at-chat-input",
      attr: { rows: "4", placeholder: this.L("writeMessage") },
    }) as HTMLTextAreaElement;
    textarea.style.width = "100%";

    // Actions
    const btnRow = contentEl.createDiv({ cls: "at-actions", attr: { style: "margin-top:12px;" } });
    const sendBtn = btnRow.createEl("button", {
      text: this.L("send"),
      cls: "at-send-btn",
    });
    btnRow.createEl("button", { text: this.L("close") }).onclick = () => this.close();

    sendBtn.onclick = async () => {
      const userText = textarea.value.trim();
      if (!userText) {
        new Notice(this.L("writeMessage"));
        return;
      }

      const config = this.mode === "flash" ? flashCfg : advCfg;
      const provider = this.mode === "flash"
        ? this.plugin.settings.flashProvider
        : this.plugin.settings.advancedProvider;

      if (!config) {
        new Notice(`Modo ${this.mode} no configurado. Revisa Settings → IA.`);
        return;
      }

      sendBtn.disabled = true;
      sendBtn.setText(this.L("sending"));
      responseArea.style.display = "block";
      responseArea.setText(this.L("thinking"));

      try {
        const messages = this.buildMessages(userText);
        const res = await chatCompletion(config, messages, provider);

        responseArea.empty();
        responseArea.createEl("p", { text: res.content });
        responseArea.createEl("p", {
          text: `${res.usage.prompt_tokens}P + ${res.usage.completion_tokens}C tokens`,
          cls: "at-cost-info",
        });
      } catch (err) {
        responseArea.empty();
        responseArea.createEl("p", {
          text: `Error: ${err instanceof Error ? err.message : this.L("unknownError")}`,
          cls: "at-error",
        });
      } finally {
        sendBtn.disabled = false;
        sendBtn.setText(this.L("send"));
      }
    };
  }

  private buildMessages(userText: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    if (this.templatePrompt) {
      messages.push({ role: "system", content: this.templatePrompt });
    }

    if (this.selectedEntries.length > 0) {
      let context = "";
      for (const entry of this.selectedEntries) {
        context += `## Transcripcion ${entry.noteName} (${entry.date})\n`;
        context += entry.calloutContent + "\n\n";
      }
      messages.push({
        role: "system",
        content: `Contexto de transcripciones:\n${context}`,
      });
    }

    messages.push({ role: "user", content: userText });
    return messages;
  }
}
