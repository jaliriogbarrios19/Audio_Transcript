import { Modal, Notice } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { getCachedEntries } from "./transcription-indexer";
import { getAll } from "./template-store";
import { getLLMConfig, chatCompletion } from "./llm-client";
import type { ChatMessage, TranscriptionEntry } from "../types";

export class ChatModal extends Modal {
  plugin: DiaryTranscriberPlugin;
  private selectedEntries: TranscriptionEntry[] = [];
  private templatePrompt = "";

  constructor(app: import("obsidian").App, plugin: DiaryTranscriberPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("at-chat-modal");

    contentEl.createEl("h2", { text: "Chat con IA" });

    const config = getLLMConfig(
      this.plugin.settings.llmProvider,
      this.plugin.settings.spobBaseUrl,
      this.plugin.settings.spobApiKey,
      this.plugin.settings.deepseekApiKey,
      this.plugin.settings.deepseekModel
    );

    if (!config) {
      contentEl.createEl("p", { text: "Configura un proveedor LLM en Settings para usar el chat." });
      return;
    }

    const entries = getCachedEntries() ?? [];
    const templates = getAll(this.plugin.settings.promptTemplates);

    // Context selector
    contentEl.createEl("h4", { text: "Contexto (transcripciones)" });
    const ctxContainer = contentEl.createDiv({ cls: "at-context-selector" });
    if (entries.length === 0) {
      ctxContainer.createEl("p", { text: "No hay transcripciones. El chat funciona sin contexto.", cls: "at-empty" });
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

    // Template dropdown
    contentEl.createEl("h4", { text: "Template de prompt" });
    const templateDropdown = contentEl.createEl("select", { cls: "at-template-dropdown" });
    templateDropdown.createEl("option", { text: "Prompt libre", value: "" });
    for (const t of templates) {
      templateDropdown.createEl("option", { text: t.name, value: t.prompt });
    }
    templateDropdown.onchange = () => {
      this.templatePrompt = templateDropdown.value;
    };

    // Chat input
    contentEl.createEl("h4", { text: "Tu mensaje" });
    const textarea = contentEl.createEl("textarea", {
      cls: "at-chat-input",
      attr: { rows: "4", placeholder: "Escribi tu pregunta..." },
    }) as HTMLTextAreaElement;
    textarea.style.width = "100%";

    // Response area
    const responseArea = contentEl.createDiv({ cls: "at-chat-response" });
    responseArea.style.cssText =
      "margin-top:12px;padding:12px;background:var(--background-secondary);border-radius:6px;min-height:40px;display:none;";

    // Actions
    const btnRow = contentEl.createDiv({ cls: "at-actions", attr: { style: "margin-top:12px;" } });
    const sendBtn = btnRow.createEl("button", {
      text: "Enviar",
      cls: "at-send-btn",
    });
    btnRow.createEl("button", { text: "Cerrar" }).onclick = () => this.close();

    sendBtn.onclick = async () => {
      const userText = textarea.value.trim();
      if (!userText) {
        new Notice("Escribi un mensaje");
        return;
      }

      sendBtn.disabled = true;
      sendBtn.setText("Enviando...");
      responseArea.style.display = "block";
      responseArea.setText("Pensando...");

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
        sendBtn.setText("Enviar");
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
