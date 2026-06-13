import { Component, MarkdownRenderer, Modal, Notice, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../../main";
import { getCachedEntries, scanVault } from "./transcription-indexer";
import { getAll } from "./template-store";
import { getFlashConfig, getAdvancedConfig, chatCompletion } from "./llm-client";
import type { ChatMessage, ChatSession, TranscriptionEntry } from "../types";
import { t, type LocaleStrings } from "../locales";
import { createHistoryStore, generateSessionId, buildSessionTitle, showHistoryModal } from "./chat-history";

export class ChatModal extends Modal {
  plugin: DiaryTranscriberPlugin;
  private selectedEntries: TranscriptionEntry[] = [];
  private templatePrompt = "";
  private mode: "flash" | "advanced" = "flash";
  private sessionMessages: ChatMessage[] = [];
  private sessionId = "";
  private get historyStore() {
    return createHistoryStore(
      () => this.plugin.settings.chatHistory,
      (h) => { this.plugin.settings.chatHistory = h; void this.plugin.saveSettings(); }
    );
  }

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
    this.sessionMessages = [];
    this.sessionId = generateSessionId();

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("at-chat-modal");

    new Setting(contentEl).setName(this.L("chatTitle")).setHeading();

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
      const label = cfg ? cfg.model : this.L("notConfigured");
      modeLabel.empty();
      modeLabel.createSpan({ text: label });
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
    new Setting(contentEl).setName(this.L("contextSection")).setHeading();

    const searchInput = contentEl.createEl("input", {
      cls: "at-search-input",
      attr: { placeholder: this.L("searchNotePlaceholder"), type: "text" },
    });
    searchInput.setCssProps({ width: "100%", marginBottom: "8px", padding: "6px", borderRadius: "4px" });

    const ctxContainer = contentEl.createDiv({ cls: "at-context-selector" });

    const renderContext = (filter = "") => {
      ctxContainer.empty();
      const allEntries = getCachedEntries() ?? entries;
      const filtered = filter
        ? allEntries.filter((e) => e.noteName.toLowerCase().includes(filter.toLowerCase()))
        : allEntries;

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
    new Setting(contentEl).setName(this.L("templateSection")).setHeading();
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
    responseArea.setCssProps({
      marginBottom: "12px", padding: "12px",
      background: "var(--background-secondary)", borderRadius: "6px",
      minHeight: "40px", display: "none",
    });

    // Chat input
    new Setting(contentEl).setName(this.L("yourMessage")).setHeading();
    const textarea = contentEl.createEl("textarea", {
      cls: "at-chat-input",
      attr: { rows: "4", placeholder: this.L("writeMessage") },
    });
    textarea.setCssProps({ width: "100%" });

    // Actions
    const btnRow = contentEl.createDiv({ cls: "at-actions", attr: { style: "margin-top:12px;" } });
    const sendBtn = btnRow.createEl("button", {
      text: this.L("send"),
      cls: "at-send-btn",
    });
    const historyBtn = btnRow.createEl("button", { text: "📋 Historial" });
    historyBtn.onclick = () => showHistoryModal(this.app, this.historyStore, (s) => this.loadSession(s), this.plugin.getLocale());
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
        new Notice(`${this.mode === "flash" ? "⚡ Flash" : "🧠 Advanced"} ${this.L("modeNotConfigured")}`);
        return;
      }

      sendBtn.disabled = true;
      sendBtn.setText(this.L("sending"));
      responseArea.setCssProps({ display: "block" });
      responseArea.setText(this.L("thinking"));

      try {
        const messages = this.buildMessages(userText);
        const res = await chatCompletion(config, messages, provider);

        this.sessionMessages.push(
          { role: "user", content: userText },
          { role: "assistant", content: res.content }
        );

        responseArea.empty();
        await MarkdownRenderer.render(
          this.app,
          res.content,
          responseArea,
          "",
          this as unknown as Component
        );
        responseArea.createEl("p", {
          text: `${res.usage.prompt_tokens}P + ${res.usage.completion_tokens}C tokens`,
          cls: "at-cost-info",
        });

        this.saveSession();
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

  private saveSession() {
    if (this.sessionMessages.length === 0) return;
    this.historyStore.save({
      id: this.sessionId,
      timestamp: Date.now(),
      title: buildSessionTitle(this.sessionMessages),
      mode: this.mode,
      messages: [...this.sessionMessages],
    });
  }

  private loadSession(session: ChatSession) {
    this.sessionId = session.id;
    this.mode = session.mode;
    this.sessionMessages = [...session.messages];
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("at-chat-modal");
    new Setting(contentEl).setName(this.L("chatTitle")).setHeading();
    contentEl.createEl("p", {
      text: `Modo: ${this.mode === "flash" ? "⚡ Flash" : "🧠 Advanced"}`,
      cls: "at-cost-info",
    });
    const chatLog = contentEl.createDiv({ cls: "at-chat-history-log" });
    for (const msg of this.sessionMessages) {
      if (msg.role === "user") {
        chatLog.createEl("p", { text: `🙂 ${msg.content}`, cls: "at-chat-user-msg" });
      } else {
        const div = chatLog.createDiv({ cls: "at-chat-assistant-msg" });
        div.createEl("strong", { text: "🤖" });
        void MarkdownRenderer.render(this.app, msg.content, div.createDiv(), "", this as unknown as Component);
      }
    }
    contentEl.createEl("button", { text: this.L("backToChat") }).onclick = () => {
      contentEl.empty();
      contentEl.addClass("at-chat-modal");
      void this.onOpen();
    };
  }
}
