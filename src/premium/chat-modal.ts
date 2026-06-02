import { Modal, Notice } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { getCachedEntries, scanVault } from "./transcription-indexer";
import { getAll } from "./template-store";
import { getLLMConfig, chatCompletion } from "./llm-client";
import type { ChatMessage, TranscriptionEntry } from "../types";
import { t, type LocaleStrings } from "../locales";

export class ChatModal extends Modal {
  plugin: DiaryTranscriberPlugin;
  private selectedEntries: TranscriptionEntry[] = [];
  private templatePrompt = "";

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

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("at-chat-modal");

    contentEl.createEl("h2", { text: this.L("chatTitle") });

    const config = getLLMConfig(
      this.plugin.settings.llmProvider,
      this.plugin.settings.spobBaseUrl,
      this.plugin.settings.spobApiKey,
      this.plugin.settings.deepseekApiKey,
      this.plugin.settings.deepseekModel
    );

    if (!config) {
      contentEl.createEl("p", { text: this.L("chatNoConfig") });
      return;
    }

    let entries = getCachedEntries();
    if (!entries) {
      entries = await scanVault(this.plugin.app);
    }
    const templates = getAll(this.plugin.settings.promptTemplates);

    // Context selector
    contentEl.createEl("h4", { text: this.L("contextSection") });
    const ctxContainer = contentEl.createDiv({ cls: "at-context-selector" });
    if (entries.length === 0) {
      ctxContainer.createEl("p", { text: this.L("noTranscriptions"), cls: "at-empty" });
    } else {
      for (const entry of entries) {
        const row = ctxContainer.createDiv({ cls: "at-context-row" });
        const cb = row.createEl("input", { type: "checkbox" });
        row.createSpan({ text: `${entry.noteName} (${entry.date})` });
        cb.onchange = () => {
          if (cb.checked) {
            this.selectedEntries.push(entry);
          } else {
            this.selectedEntries = this.selectedEntries.filter((e) => e !== entry);
          }
        };
      }
    }

    contentEl.createEl("h4", { text: this.L("templateSection") });
    const templateDropdown = contentEl.createEl("select", { cls: "at-template-dropdown" });
    templateDropdown.createEl("option", { text: this.L("freePrompt"), value: "" });
    for (const t of templates) {
      templateDropdown.createEl("option", { text: t.name, value: t.prompt });
    }
    templateDropdown.onchange = () => {
      this.templatePrompt = templateDropdown.value;
    };

    // Chat input
    contentEl.createEl("h4", { text: this.L("yourMessage") });
    const textarea = contentEl.createEl("textarea", {
      cls: "at-chat-input",
      attr: { rows: "4", placeholder: this.L("writeMessage") },
    }) as HTMLTextAreaElement;
    textarea.style.width = "100%";

    // Response area
    const responseArea = contentEl.createDiv({ cls: "at-chat-response" });
    responseArea.style.cssText =
      "margin-top:12px;padding:12px;background:var(--background-secondary);border-radius:6px;min-height:40px;display:none;";

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

      sendBtn.disabled = true;
      sendBtn.setText(this.L("sending"));
      responseArea.style.display = "block";
      responseArea.setText(this.L("thinking"));

      try {
        const messages = this.buildMessages(userText);

        const res = await chatCompletion(config, messages);

        responseArea.empty();
        responseArea.createEl("p", { text: res.content });
        responseArea.createEl("p", {
          text: `${res.usage.prompt_tokens}P + ${res.usage.completion_tokens}C tokens`,
          cls: "at-cost-info",
        });
      } catch (err) {
        responseArea.empty();
        responseArea.createEl("p", {
          text: `Error: ${err instanceof Error ? err.message : "desconocido"}`,
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
