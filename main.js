"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DiaryTranscriberPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");

// src/types.ts
var PROVIDERS = [
  { value: "gladia", label: "Gladia" },
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" }
];

// src/settings.ts
var DEFAULT_SETTINGS = {
  provider: "gladia",
  gladiaApiKey: "",
  deepgramApiKey: "",
  assemblyaiApiKey: "",
  assemblyaiModel: "universal-3",
  defaultLanguage: "es",
  insertAsCallout: true
};
var SettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Transcripci\xF3n Obsidian" });
    new import_obsidian.Setting(containerEl).setName("Provider").setDesc("Speech-to-text provider to use").addDropdown((dropdown) => {
      for (const { value, label } of PROVIDERS) {
        dropdown.addOption(value, label);
      }
      dropdown.setValue(this.plugin.settings.provider).onChange(async (v) => {
        this.plugin.settings.provider = v;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    if (this.plugin.settings.provider === "gladia") {
      this.addApiKeyField(containerEl, "Gladia API Key", "gladiaApiKey");
    } else if (this.plugin.settings.provider === "deepgram") {
      this.addApiKeyField(containerEl, "Deepgram API Key", "deepgramApiKey");
    } else {
      this.addApiKeyField(
        containerEl,
        "AssemblyAI API Key",
        "assemblyaiApiKey"
      );
    }
    if (this.plugin.settings.provider === "assemblyai") {
      new import_obsidian.Setting(containerEl).setName("Modelo").setDesc("Universal-3: m\xE1s preciso, speaker diarization mejorada. Universal-2: m\xE1s r\xE1pido y econ\xF3mico.").addDropdown(
        (dropdown) => dropdown.addOption("universal-3", "Universal-3").addOption("universal-2", "Universal-2").setValue(this.plugin.settings.assemblyaiModel).onChange(async (v) => {
          this.plugin.settings.assemblyaiModel = v;
          await this.plugin.saveSettings();
        })
      );
    }
    containerEl.createEl("h3", { text: "All API Keys" });
    containerEl.createEl("p", {
      text: "Keys are stored locally in your vault's plugin data.",
      cls: "setting-item-description"
    });
    this.addApiKeyField(containerEl, "Gladia", "gladiaApiKey");
    this.addApiKeyField(containerEl, "Deepgram", "deepgramApiKey");
    this.addApiKeyField(containerEl, "AssemblyAI", "assemblyaiApiKey");
    new import_obsidian.Setting(containerEl).setName("Default language").setDesc("ISO code: es, en, fr, pt...").addText(
      (text) => text.setPlaceholder("es").setValue(this.plugin.settings.defaultLanguage).onChange(async (value) => {
        this.plugin.settings.defaultLanguage = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Wrap in callout").setDesc("Insert transcription inside a >[!transcription] callout block").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.insertAsCallout).onChange(async (value) => {
        this.plugin.settings.insertAsCallout = value;
        await this.plugin.saveSettings();
      })
    );
  }
  addApiKeyField(container, name, key) {
    new import_obsidian.Setting(container).setName(name).addText((text) => {
      var _a;
      text.setPlaceholder("Enter your API key").setValue(this.plugin.settings[key]);
      text.inputEl.type = "password";
      const toggleBtn = (_a = text.inputEl.parentElement) == null ? void 0 : _a.createEl("button", {
        text: "Show",
        cls: "transcripcion-obsidian-toggle-key"
      });
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const isPassword = text.inputEl.type === "password";
          text.inputEl.type = isPassword ? "text" : "password";
          toggleBtn.textContent = isPassword ? "Hide" : "Show";
        };
      }
      text.onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      });
    });
  }
};

// src/fetch-utils.ts
async function fetchWithRetry(input, init, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || res.status < 500 && res.status !== 429) return res;
      if (attempt < retries) {
        await sleep(1e3 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (attempt < retries) {
        await sleep(1e3 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal == null ? void 0 : signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

// src/providers/gladia.ts
var GladiaTranscriber = class {
  constructor() {
    this.name = "Gladia";
  }
  async transcribe(audioBlob, apiKey, options) {
    const baseUrl = "https://api.gladia.io/v2";
    const signal = options.signal;
    const audioUrl = await this.upload(audioBlob, apiKey, baseUrl, signal);
    const resultUrl = await this.requestTranscription(
      audioUrl,
      apiKey,
      baseUrl,
      options
    );
    return await this.pollResult(resultUrl, apiKey, signal);
  }
  async upload(blob, apiKey, baseUrl, signal) {
    var _a;
    const form = new FormData();
    form.append("audio", blob);
    const res = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      headers: { "x-gladia-key": apiKey },
      body: form,
      signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        `Gladia upload failed (${res.status}): ${(_a = err == null ? void 0 : err.message) != null ? _a : "unknown"}`
      );
    }
    const data = await res.json();
    return data.audio_url;
  }
  async requestTranscription(audioUrl, apiKey, baseUrl, options) {
    var _a;
    const body = {
      audio_url: audioUrl,
      diarization: true,
      language: options.language || "es"
    };
    if (options.speakerNames.length > 0) {
      body.diarization_config = {
        number_of_speakers: options.speakerNames.length
      };
    }
    const res = await fetch(`${baseUrl}/transcription`, {
      method: "POST",
      headers: {
        "x-gladia-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: options.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        `Gladia transcription request failed (${res.status}): ${(_a = err == null ? void 0 : err.message) != null ? _a : "unknown"}`
      );
    }
    const data = await res.json();
    return data.result_url;
  }
  async pollResult(resultUrl, apiKey, signal) {
    var _a, _b, _c;
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (signal == null ? void 0 : signal.aborted) throw new DOMException("Aborted", "AbortError");
      const res = await fetchWithRetry(resultUrl, {
        headers: { "x-gladia-key": apiKey },
        signal
      });
      if (!res.ok) {
        throw new Error(`Gladia polling failed (${res.status})`);
      }
      const data = await res.json();
      if (data.status === "done") {
        const utterances = (_c = (_b = (_a = data.result) == null ? void 0 : _a.transcription) == null ? void 0 : _b.utterances) != null ? _c : [];
        return utterances.map((u) => ({
          speaker: u.speaker,
          text: u.text.trim(),
          start: u.start,
          end: u.end
        }));
      }
      if (data.status === "error") {
        throw new Error("Gladia transcription failed");
      }
      await sleep(1e3, signal);
    }
    throw new Error("Gladia transcription timed out");
  }
};

// src/providers/deepgram.ts
var DeepgramTranscriber = class {
  constructor() {
    this.name = "Deepgram";
  }
  async transcribe(audioBlob, apiKey, options) {
    var _a, _b;
    const params = new URLSearchParams({
      diarize: "true",
      smart_format: "true",
      utterances: "true"
    });
    if (options.language) {
      params.set("language", options.language);
    }
    if (options.speakerNames.length > 0) {
      params.set("diarize_version", "2024-01-26");
    }
    const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioBlob.type || "audio/wav"
      },
      body: audioBlob,
      signal: options.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        `Deepgram request failed (${res.status}): ${(_a = err == null ? void 0 : err.err_msg) != null ? _a : "unknown"}`
      );
    }
    const data = await res.json();
    const raw = (_b = data.results) == null ? void 0 : _b.utterances;
    if (!raw || raw.length === 0) {
      throw new Error(
        "Deepgram returned no diarized utterances. The audio may have only one speaker or diarization is not available."
      );
    }
    return raw.map((u) => {
      var _a2, _b2, _c, _d, _e;
      return {
        speaker: ((_a2 = u.speaker) != null ? _a2 : 0) + 1,
        // Deepgram uses 0-based speakers
        text: (_c = (_b2 = u.transcript) == null ? void 0 : _b2.trim()) != null ? _c : "",
        start: (_d = u.start) != null ? _d : 0,
        end: (_e = u.end) != null ? _e : 0
      };
    });
  }
};

// src/providers/assemblyai.ts
var AssemblyAITranscriber = class {
  constructor() {
    this.name = "AssemblyAI";
  }
  async transcribe(audioBlob, apiKey, options) {
    const signal = options.signal;
    const headers = {
      authorization: apiKey,
      "content-type": "application/json"
    };
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: apiKey },
      body: audioBlob,
      signal
    });
    if (!uploadRes.ok) {
      const body2 = await uploadRes.text().catch(() => "");
      throw new Error(
        `AssemblyAI upload failed (${uploadRes.status}): ${body2.slice(0, 200)}`
      );
    }
    const { upload_url: audioUrl } = await uploadRes.json();
    const body = {
      audio_url: audioUrl,
      speech_models: [options.model || "universal-2"],
      speaker_labels: true,
      language_code: options.language || "es"
    };
    if (options.speakerNames.length > 0) {
      body.speakers_expected = options.speakerNames.length;
    }
    const startRes = await fetch(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal
      }
    );
    if (!startRes.ok) {
      const body2 = await startRes.text().catch(() => "");
      throw new Error(
        `AssemblyAI transcription request failed (${startRes.status}): ${body2.slice(0, 200)}`
      );
    }
    const { id } = await startRes.json();
    return await this.poll(id, apiKey, signal);
  }
  async poll(id, apiKey, signal) {
    var _a, _b;
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (signal == null ? void 0 : signal.aborted) throw new DOMException("Aborted", "AbortError");
      const res = await fetchWithRetry(
        `https://api.assemblyai.com/v2/transcript/${id}`,
        {
          headers: { authorization: apiKey },
          signal
        }
      );
      if (!res.ok) {
        throw new Error(`AssemblyAI polling failed (${res.status})`);
      }
      const data = await res.json();
      if (data.status === "completed") {
        return ((_a = data.utterances) != null ? _a : []).map((u) => ({
          speaker: this.speakerLabelToNumber(u.speaker),
          text: u.text.trim(),
          start: u.start / 1e3,
          end: u.end / 1e3
        }));
      }
      if (data.status === "error") {
        throw new Error(
          `AssemblyAI transcription error: ${(_b = data.error) != null ? _b : "unknown"}`
        );
      }
      await sleep(1e3, signal);
    }
    throw new Error("AssemblyAI transcription timed out");
  }
  speakerLabelToNumber(label) {
    return label.toUpperCase().charCodeAt(0) - 64;
  }
};

// src/speaker-modal.ts
var import_obsidian2 = require("obsidian");
var SpeakerModal = class extends import_obsidian2.Modal {
  constructor() {
    super(...arguments);
    this.resolve = null;
    this.nameFields = [];
    this.namesContainer = null;
  }
  open() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Speaker Configuration" });
    new import_obsidian2.Setting(contentEl).setName("Number of speakers").addText((text) => {
      text.setPlaceholder("2");
      text.inputEl.type = "number";
      text.inputEl.min = "1";
      text.inputEl.max = "10";
      text.setValue("2");
      text.onChange((value) => this.renderNameFields(Number(value) || 2));
    });
    this.namesContainer = contentEl.createDiv(
      "transcripcion-obsidian-speaker-names"
    );
    new import_obsidian2.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Start Transcription").setCta().onClick(() => this.submit())
    );
    this.renderNameFields(2);
  }
  renderNameFields(count) {
    if (!this.namesContainer) return;
    this.namesContainer.empty();
    this.nameFields = [];
    for (let i = 0; i < count; i++) {
      const row = this.namesContainer.createDiv(
        "transcripcion-obsidian-speaker-row"
      );
      row.createEl("label", { text: `Speaker ${i + 1}` });
      const input = row.createEl("input", {
        type: "text",
        placeholder: `Name for speaker ${i + 1}`
      });
      this.nameFields.push(input);
    }
  }
  submit() {
    var _a;
    const names = this.nameFields.map(
      (f, i) => f.value.trim() || `Speaker ${i + 1}`
    );
    (_a = this.resolve) == null ? void 0 : _a.call(this, { count: names.length, names });
    this.close();
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
};

// src/choice-modal.ts
var import_obsidian3 = require("obsidian");
var ChoiceModal = class extends import_obsidian3.Modal {
  constructor() {
    super(...arguments);
    this.resolve = null;
  }
  open() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "\xBFQu\xE9 quer\xE9s hacer?" });
    const btnContainer = contentEl.createDiv({
      attr: { style: "display: flex; gap: 12px; margin-top: 16px;" }
    });
    const recordBtn = btnContainer.createEl("button", {
      text: "\u{1F399}\uFE0F Grabar audio",
      cls: "mod-cta"
    });
    recordBtn.style.flex = "1";
    recordBtn.onclick = () => {
      var _a;
      (_a = this.resolve) == null ? void 0 : _a.call(this, "record");
      this.close();
    };
    const fileBtn = btnContainer.createEl("button", {
      text: "\u{1F4C1} Elegir archivo"
    });
    fileBtn.style.flex = "1";
    fileBtn.onclick = () => {
      var _a;
      (_a = this.resolve) == null ? void 0 : _a.call(this, "file");
      this.close();
    };
  }
  onClose() {
    this.contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
};

// src/recording-modal.ts
var import_obsidian4 = require("obsidian");
var RecordingModal = class extends import_obsidian4.Modal {
  constructor() {
    super(...arguments);
    this.chunks = [];
    this.mediaRecorder = null;
    this.stream = null;
    this.seconds = 0;
    this.timerInterval = null;
    this.timerEl = null;
    this.statusEl = null;
    this.resolve = null;
  }
  async start() {
    return new Promise(async (resolve) => {
      this.resolve = resolve;
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      } catch (e) {
        new import_obsidian4.Notice("No se pudo acceder al micr\xF3fono. Verific\xE1 los permisos.");
        resolve(null);
        return;
      }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : MediaRecorder.isTypeSupported("audio/aac") ? "audio/aac" : "audio/ogg;codecs=opus";
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        var _a;
        this.cleanup();
        const blob = new Blob(this.chunks, { type: mimeType });
        (_a = this.resolve) == null ? void 0 : _a.call(this, blob);
        this.close();
      };
      this.mediaRecorder.start(1e3);
      super.open();
      this.startTimer();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Grabando..." });
    this.statusEl = contentEl.createDiv({
      cls: "transcripcion-obsidian-status loading",
      text: "\u25CF Grabando"
    });
    this.timerEl = contentEl.createEl("p", {
      text: "00:00",
      attr: { style: "font-size: 2em; text-align: center; margin: 16px 0;" }
    });
    new import_obsidian4.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Detener grabaci\xF3n").setWarning().onClick(() => this.stopRecording())
    );
  }
  startTimer() {
    this.seconds = 0;
    this.timerInterval = setInterval(() => {
      this.seconds++;
      if (this.timerEl) {
        const m = Math.floor(this.seconds / 60);
        const s = this.seconds % 60;
        this.timerEl.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      }
    }, 1e3);
  }
  stopRecording() {
    var _a;
    (_a = this.mediaRecorder) == null ? void 0 : _a.stop();
  }
  cleanup() {
    var _a;
    if (this.timerInterval) clearInterval(this.timerInterval);
    (_a = this.stream) == null ? void 0 : _a.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }
  onClose() {
    this.cleanup();
    this.contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
};

// main.ts
var DiaryTranscriberPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.activeNotice = null;
    this.abortController = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));
    this.addRibbonIcon("mic", "Transcribir", async () => {
      const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
      if (!view) {
        new import_obsidian5.Notice("Abr\xED una nota primero");
        return;
      }
      const choice = await new ChoiceModal(this.app).open();
      if (choice === "record") {
        this.startRecording(view.editor);
      } else if (choice === "file") {
        this.transcribeFile(view.editor);
      }
    });
    this.addCommand({
      id: "record-and-transcribe",
      name: "Grabar y transcribir",
      editorCallback: (editor, _ctx) => this.startRecording(editor)
    });
    this.addCommand({
      id: "transcribe-file",
      name: "Transcribir archivo",
      editorCallback: (editor, _ctx) => this.transcribeFile(editor)
    });
  }
  onunload() {
    var _a, _b;
    (_a = this.abortController) == null ? void 0 : _a.abort();
    (_b = this.activeNotice) == null ? void 0 : _b.hide();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ── Recording flow ─────────────────────────────────────────────
  async startRecording(editor) {
    var _a;
    const apiKey = this.getApiKey();
    if (!apiKey) {
      new import_obsidian5.Notice(
        `No API key set for ${this.settings.provider}. Settings \u2192 Transcripci\xF3n Obsidian.`
      );
      return;
    }
    const blob = await new RecordingModal(this.app).start();
    if (!blob) return;
    const speakerMapping = await new SpeakerModal(this.app).open();
    if (!speakerMapping) return;
    await this.transcribeBlob(editor, blob, speakerMapping);
    const audioPath = await this.saveAudioFile(blob);
    const filename = (_a = audioPath.split("/").pop()) != null ? _a : audioPath;
    this.insertAtCursor(editor, `
\u{1F4C1} [[${filename}]]
`);
  }
  // ── File picker flow ───────────────────────────────────────────
  async transcribeFile(editor) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      new import_obsidian5.Notice(
        `No API key set for ${this.settings.provider}. Settings \u2192 Transcripci\xF3n Obsidian.`
      );
      return;
    }
    const file = await this.pickAudioFile();
    if (!file) return;
    const speakerMapping = await new SpeakerModal(this.app).open();
    if (!speakerMapping) return;
    await this.transcribeBlob(editor, file, speakerMapping);
  }
  // ── Shared transcription ───────────────────────────────────────
  async transcribeBlob(editor, blob, speakerMapping) {
    var _a;
    const apiKey = this.getApiKey();
    (_a = this.abortController) == null ? void 0 : _a.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const notice = new import_obsidian5.Notice(
      `Transcribiendo con ${this.settings.provider}...`,
      0
    );
    this.activeNotice = notice;
    const startTime = Date.now();
    try {
      const transcriber = this.getTranscriber();
      const utterances = await transcriber.transcribe(blob, apiKey, {
        speakerNames: speakerMapping.names,
        language: this.settings.defaultLanguage,
        signal: controller.signal,
        model: this.settings.provider === "assemblyai" ? this.settings.assemblyaiModel : void 0
      });
      const formatted = this.formatTranscription(
        utterances,
        speakerMapping.names
      );
      this.insertAtCursor(editor, formatted);
      const elapsed = ((Date.now() - startTime) / 1e3).toFixed(1);
      notice.hide();
      new import_obsidian5.Notice(`Transcripci\xF3n lista en ${elapsed}s`);
    } catch (err) {
      notice.hide();
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Error desconocido";
      new import_obsidian5.Notice(`Fall\xF3 la transcripci\xF3n: ${message}`);
      console.error("[Transcripci\xF3n Obsidian]", err);
    } finally {
      if (this.activeNotice === notice) this.activeNotice = null;
      if (this.abortController === controller) this.abortController = null;
    }
  }
  // ── Save audio ─────────────────────────────────────────────────
  async saveAudioFile(blob) {
    var _a, _b, _c;
    const ext = ((_a = blob.type.split("/")[1]) == null ? void 0 : _a.split(";")[0]) || "webm";
    const now = /* @__PURE__ */ new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `grabacion-${ts}.${ext}`;
    const activeFile = this.app.workspace.getActiveFile();
    const folder = (_c = (_b = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _b.path) != null ? _c : "";
    const filepath = folder ? `${folder}/${filename}` : filename;
    await this.app.vault.createBinary(filepath, await blob.arrayBuffer());
    return filepath;
  }
  // ── Providers ──────────────────────────────────────────────────
  getTranscriber() {
    switch (this.settings.provider) {
      case "gladia":
        return new GladiaTranscriber();
      case "deepgram":
        return new DeepgramTranscriber();
      case "assemblyai":
        return new AssemblyAITranscriber();
      default:
        throw new Error(`Unknown provider: ${this.settings.provider}`);
    }
  }
  getApiKey() {
    switch (this.settings.provider) {
      case "gladia":
        return this.settings.gladiaApiKey;
      case "deepgram":
        return this.settings.deepgramApiKey;
      case "assemblyai":
        return this.settings.assemblyaiApiKey;
      default:
        throw new Error(`Unknown provider: ${this.settings.provider}`);
    }
  }
  // ── File picker ────────────────────────────────────────────────
  pickAudioFile() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      let resolved = false;
      const done = (file) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(file);
      };
      const cleanup = () => {
        window.removeEventListener("focus", focusHandler);
        clearTimeout(safetyTimer);
      };
      const focusHandler = () => {
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            done(null);
          }
        }, 300);
      };
      input.onchange = () => {
        var _a, _b;
        done((_b = (_a = input.files) == null ? void 0 : _a[0]) != null ? _b : null);
      };
      const safetyTimer = setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          done(null);
        }
      }, 12e4);
      window.addEventListener("focus", focusHandler);
      input.click();
    });
  }
  // ── Formatting ─────────────────────────────────────────────────
  formatTranscription(utterances, speakerNames) {
    if (utterances.length === 0) {
      return "*(No speech detected)*";
    }
    const lines = utterances.map((u) => {
      const name = speakerNames[u.speaker - 1] || `Speaker ${u.speaker}`;
      const time = this.formatTimestamp(u.start);
      return `**${name}** \`${time}\`
` + u.text;
    });
    if (this.settings.insertAsCallout) {
      return "> [!transcription]- Transcription\n" + lines.map((l) => `> ${l}`).join("\n>\n");
    }
    return lines.join("\n\n");
  }
  formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  // ── Editor insert ──────────────────────────────────────────────
  insertAtCursor(editor, text) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9mZXRjaC11dGlscy50cyIsICJzcmMvcHJvdmlkZXJzL2dsYWRpYS50cyIsICJzcmMvcHJvdmlkZXJzL2RlZXBncmFtLnRzIiwgInNyYy9wcm92aWRlcnMvYXNzZW1ibHlhaS50cyIsICJzcmMvc3BlYWtlci1tb2RhbC50cyIsICJzcmMvY2hvaWNlLW1vZGFsLnRzIiwgInNyYy9yZWNvcmRpbmctbW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEVkaXRvciwgTWFya2Rvd25GaWxlSW5mbywgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUGx1Z2luU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MsIFNldHRpbmdzVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgR2xhZGlhVHJhbnNjcmliZXIgfSBmcm9tIFwiLi9zcmMvcHJvdmlkZXJzL2dsYWRpYVwiO1xuaW1wb3J0IHsgRGVlcGdyYW1UcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvZGVlcGdyYW1cIjtcbmltcG9ydCB7IEFzc2VtYmx5QUlUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvYXNzZW1ibHlhaVwiO1xuaW1wb3J0IHsgU3BlYWtlck1vZGFsIH0gZnJvbSBcIi4vc3JjL3NwZWFrZXItbW9kYWxcIjtcbmltcG9ydCB7IENob2ljZU1vZGFsIH0gZnJvbSBcIi4vc3JjL2Nob2ljZS1tb2RhbFwiO1xuaW1wb3J0IHsgUmVjb3JkaW5nTW9kYWwgfSBmcm9tIFwiLi9zcmMvcmVjb3JkaW5nLW1vZGFsXCI7XG5pbXBvcnQgeyBTcGVha2VyTWFwcGluZywgVXR0ZXJhbmNlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpYXJ5VHJhbnNjcmliZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IFBsdWdpblNldHRpbmdzO1xuICBwcml2YXRlIGFjdGl2ZU5vdGljZTogTm90aWNlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJtaWNcIiwgXCJUcmFuc2NyaWJpclwiLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgIGlmICghdmlldykge1xuICAgICAgICBuZXcgTm90aWNlKFwiQWJyXHUwMEVEIHVuYSBub3RhIHByaW1lcm9cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNob2ljZSA9IGF3YWl0IG5ldyBDaG9pY2VNb2RhbCh0aGlzLmFwcCkub3BlbigpO1xuICAgICAgaWYgKGNob2ljZSA9PT0gXCJyZWNvcmRcIikge1xuICAgICAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nKHZpZXcuZWRpdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hvaWNlID09PSBcImZpbGVcIikge1xuICAgICAgICB0aGlzLnRyYW5zY3JpYmVGaWxlKHZpZXcuZWRpdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJyZWNvcmQtYW5kLXRyYW5zY3JpYmVcIixcbiAgICAgIG5hbWU6IFwiR3JhYmFyIHkgdHJhbnNjcmliaXJcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIF9jdHg6IE1hcmtkb3duVmlldyB8IE1hcmtkb3duRmlsZUluZm8pID0+XG4gICAgICAgIHRoaXMuc3RhcnRSZWNvcmRpbmcoZWRpdG9yKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0cmFuc2NyaWJlLWZpbGVcIixcbiAgICAgIG5hbWU6IFwiVHJhbnNjcmliaXIgYXJjaGl2b1wiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvciwgX2N0eDogTWFya2Rvd25WaWV3IHwgTWFya2Rvd25GaWxlSW5mbykgPT5cbiAgICAgICAgdGhpcy50cmFuc2NyaWJlRmlsZShlZGl0b3IpLFxuICAgIH0pO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5hY3RpdmVOb3RpY2U/LmhpZGUoKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFJlY29yZGluZyBmbG93IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRSZWNvcmRpbmcoZWRpdG9yOiBFZGl0b3IpIHtcbiAgICBjb25zdCBhcGlLZXkgPSB0aGlzLmdldEFwaUtleSgpO1xuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgTm8gQVBJIGtleSBzZXQgZm9yICR7dGhpcy5zZXR0aW5ncy5wcm92aWRlcn0uIFNldHRpbmdzIFx1MjE5MiBUcmFuc2NyaXBjaVx1MDBGM24gT2JzaWRpYW4uYFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibG9iID0gYXdhaXQgbmV3IFJlY29yZGluZ01vZGFsKHRoaXMuYXBwKS5zdGFydCgpO1xuICAgIGlmICghYmxvYikgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BlYWtlck1hcHBpbmcgPSBhd2FpdCBuZXcgU3BlYWtlck1vZGFsKHRoaXMuYXBwKS5vcGVuKCk7XG4gICAgaWYgKCFzcGVha2VyTWFwcGluZykgcmV0dXJuO1xuXG4gICAgYXdhaXQgdGhpcy50cmFuc2NyaWJlQmxvYihlZGl0b3IsIGJsb2IsIHNwZWFrZXJNYXBwaW5nKTtcblxuICAgIC8vIEluc2VydCBsaW5rIHRvIHRoZSBzYXZlZCBhdWRpbyBmaWxlIGFmdGVyIHRyYW5zY3JpcHRpb25cbiAgICBjb25zdCBhdWRpb1BhdGggPSBhd2FpdCB0aGlzLnNhdmVBdWRpb0ZpbGUoYmxvYik7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBhdWRpb1BhdGguc3BsaXQoXCIvXCIpLnBvcCgpID8/IGF1ZGlvUGF0aDtcbiAgICB0aGlzLmluc2VydEF0Q3Vyc29yKGVkaXRvciwgYFxcblx1RDgzRFx1RENDMSBbWyR7ZmlsZW5hbWV9XV1cXG5gKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWxlIHBpY2tlciBmbG93IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgdHJhbnNjcmliZUZpbGUoZWRpdG9yOiBFZGl0b3IpIHtcbiAgICBjb25zdCBhcGlLZXkgPSB0aGlzLmdldEFwaUtleSgpO1xuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgTm8gQVBJIGtleSBzZXQgZm9yICR7dGhpcy5zZXR0aW5ncy5wcm92aWRlcn0uIFNldHRpbmdzIFx1MjE5MiBUcmFuc2NyaXBjaVx1MDBGM24gT2JzaWRpYW4uYFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5waWNrQXVkaW9GaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGVha2VyTWFwcGluZyA9IGF3YWl0IG5ldyBTcGVha2VyTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcbiAgICBpZiAoIXNwZWFrZXJNYXBwaW5nKSByZXR1cm47XG5cbiAgICBhd2FpdCB0aGlzLnRyYW5zY3JpYmVCbG9iKGVkaXRvciwgZmlsZSwgc3BlYWtlck1hcHBpbmcpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNoYXJlZCB0cmFuc2NyaXB0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgdHJhbnNjcmliZUJsb2IoXG4gICAgZWRpdG9yOiBFZGl0b3IsXG4gICAgYmxvYjogQmxvYixcbiAgICBzcGVha2VyTWFwcGluZzogU3BlYWtlck1hcHBpbmdcbiAgKSB7XG4gICAgY29uc3QgYXBpS2V5ID0gdGhpcy5nZXRBcGlLZXkoKTtcblxuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuXG4gICAgY29uc3Qgbm90aWNlID0gbmV3IE5vdGljZShcbiAgICAgIGBUcmFuc2NyaWJpZW5kbyBjb24gJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfS4uLmAsXG4gICAgICAwXG4gICAgKTtcbiAgICB0aGlzLmFjdGl2ZU5vdGljZSA9IG5vdGljZTtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRyYW5zY3JpYmVyID0gdGhpcy5nZXRUcmFuc2NyaWJlcigpO1xuICAgICAgY29uc3QgdXR0ZXJhbmNlcyA9IGF3YWl0IHRyYW5zY3JpYmVyLnRyYW5zY3JpYmUoYmxvYiwgYXBpS2V5LCB7XG4gICAgICAgIHNwZWFrZXJOYW1lczogc3BlYWtlck1hcHBpbmcubmFtZXMsXG4gICAgICAgIGxhbmd1YWdlOiB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYW5ndWFnZSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgbW9kZWw6XG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5wcm92aWRlciA9PT0gXCJhc3NlbWJseWFpXCJcbiAgICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWxcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IHRoaXMuZm9ybWF0VHJhbnNjcmlwdGlvbihcbiAgICAgICAgdXR0ZXJhbmNlcyxcbiAgICAgICAgc3BlYWtlck1hcHBpbmcubmFtZXNcbiAgICAgICk7XG4gICAgICB0aGlzLmluc2VydEF0Q3Vyc29yKGVkaXRvciwgZm9ybWF0dGVkKTtcblxuICAgICAgY29uc3QgZWxhcHNlZCA9ICgoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwKS50b0ZpeGVkKDEpO1xuICAgICAgbm90aWNlLmhpZGUoKTtcbiAgICAgIG5ldyBOb3RpY2UoYFRyYW5zY3JpcGNpXHUwMEYzbiBsaXN0YSBlbiAke2VsYXBzZWR9c2ApO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbm90aWNlLmhpZGUoKTtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZXJyLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSByZXR1cm47XG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFwiRXJyb3IgZGVzY29ub2NpZG9cIjtcbiAgICAgIG5ldyBOb3RpY2UoYEZhbGxcdTAwRjMgbGEgdHJhbnNjcmlwY2lcdTAwRjNuOiAke21lc3NhZ2V9YCk7XG4gICAgICBjb25zb2xlLmVycm9yKFwiW1RyYW5zY3JpcGNpXHUwMEYzbiBPYnNpZGlhbl1cIiwgZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlTm90aWNlID09PSBub3RpY2UpIHRoaXMuYWN0aXZlTm90aWNlID0gbnVsbDtcbiAgICAgIGlmICh0aGlzLmFib3J0Q29udHJvbGxlciA9PT0gY29udHJvbGxlcikgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTYXZlIGF1ZGlvIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUF1ZGlvRmlsZShibG9iOiBCbG9iKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBleHQgPSBibG9iLnR5cGUuc3BsaXQoXCIvXCIpWzFdPy5zcGxpdChcIjtcIilbMF0gfHwgXCJ3ZWJtXCI7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0cyA9IG5vdy50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpLnNsaWNlKDAsIDE5KTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGBncmFiYWNpb24tJHt0c30uJHtleHR9YDtcblxuICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IGZvbGRlciA9IGFjdGl2ZUZpbGU/LnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGZpbGVwYXRoID0gZm9sZGVyID8gYCR7Zm9sZGVyfS8ke2ZpbGVuYW1lfWAgOiBmaWxlbmFtZTtcblxuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUJpbmFyeShmaWxlcGF0aCwgYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICByZXR1cm4gZmlsZXBhdGg7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUHJvdmlkZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZ2V0VHJhbnNjcmliZXIoKTogVHJhbnNjcmliZXIge1xuICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy5wcm92aWRlcikge1xuICAgICAgY2FzZSBcImdsYWRpYVwiOlxuICAgICAgICByZXR1cm4gbmV3IEdsYWRpYVRyYW5zY3JpYmVyKCk7XG4gICAgICBjYXNlIFwiZGVlcGdyYW1cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBEZWVwZ3JhbVRyYW5zY3JpYmVyKCk7XG4gICAgICBjYXNlIFwiYXNzZW1ibHlhaVwiOlxuICAgICAgICByZXR1cm4gbmV3IEFzc2VtYmx5QUlUcmFuc2NyaWJlcigpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3ZpZGVyOiAke3RoaXMuc2V0dGluZ3MucHJvdmlkZXJ9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBcGlLZXkoKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHRoaXMuc2V0dGluZ3MucHJvdmlkZXIpIHtcbiAgICAgIGNhc2UgXCJnbGFkaWFcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuZ2xhZGlhQXBpS2V5O1xuICAgICAgY2FzZSBcImRlZXBncmFtXCI6XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmRlZXBncmFtQXBpS2V5O1xuICAgICAgY2FzZSBcImFzc2VtYmx5YWlcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuYXNzZW1ibHlhaUFwaUtleTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm92aWRlcjogJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWxlIHBpY2tlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHBpY2tBdWRpb0ZpbGUoKTogUHJvbWlzZTxGaWxlIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgICBpbnB1dC5hY2NlcHQgPSBcImF1ZGlvLypcIjtcblxuICAgICAgbGV0IHJlc29sdmVkID0gZmFsc2U7XG4gICAgICBjb25zdCBkb25lID0gKGZpbGU6IEZpbGUgfCBudWxsKSA9PiB7XG4gICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuO1xuICAgICAgICByZXNvbHZlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVzb2x2ZShmaWxlKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNhZmV0eVRpbWVyKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGZvY3VzSGFuZGxlciA9ICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFpbnB1dC5maWxlcyB8fCBpbnB1dC5maWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRvbmUobnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAzMDApO1xuICAgICAgfTtcblxuICAgICAgaW5wdXQub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGRvbmUoaW5wdXQuZmlsZXM/LlswXSA/PyBudWxsKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHNhZmV0eVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICghaW5wdXQuZmlsZXMgfHwgaW5wdXQuZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgZG9uZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSwgMTIwXzAwMCk7XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgZm9jdXNIYW5kbGVyKTtcbiAgICAgIGlucHV0LmNsaWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRm9ybWF0dGluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGZvcm1hdFRyYW5zY3JpcHRpb24oXG4gICAgdXR0ZXJhbmNlczogVXR0ZXJhbmNlW10sXG4gICAgc3BlYWtlck5hbWVzOiBzdHJpbmdbXVxuICApOiBzdHJpbmcge1xuICAgIGlmICh1dHRlcmFuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFwiKihObyBzcGVlY2ggZGV0ZWN0ZWQpKlwiO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVzID0gdXR0ZXJhbmNlcy5tYXAoKHUpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBzcGVha2VyTmFtZXNbdS5zcGVha2VyIC0gMV0gfHwgYFNwZWFrZXIgJHt1LnNwZWFrZXJ9YDtcbiAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLmZvcm1hdFRpbWVzdGFtcCh1LnN0YXJ0KTtcbiAgICAgIHJldHVybiBgKioke25hbWV9KiogXFxgJHt0aW1lfVxcYGAgKyBcIlxcblwiICsgdS50ZXh0O1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaW5zZXJ0QXNDYWxsb3V0KSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBcIj4gWyF0cmFuc2NyaXB0aW9uXS0gVHJhbnNjcmlwdGlvblxcblwiICtcbiAgICAgICAgbGluZXMubWFwKChsKSA9PiBgPiAke2x9YCkuam9pbihcIlxcbj5cXG5cIilcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdFRpbWVzdGFtcChzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgY29uc3QgcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcbiAgICByZXR1cm4gYCR7bX06JHtzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRWRpdG9yIGluc2VydCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGluc2VydEF0Q3Vyc29yKGVkaXRvcjogRWRpdG9yLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XG4gICAgZWRpdG9yLnJlcGxhY2VSYW5nZSh0ZXh0LCBjdXJzb3IpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBEaWFyeVRyYW5zY3JpYmVyUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBUcmFuc2NyaXB0aW9uUHJvdmlkZXIsIFBST1ZJREVSUyB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luU2V0dGluZ3Mge1xuICBwcm92aWRlcjogVHJhbnNjcmlwdGlvblByb3ZpZGVyO1xuICBnbGFkaWFBcGlLZXk6IHN0cmluZztcbiAgZGVlcGdyYW1BcGlLZXk6IHN0cmluZztcbiAgYXNzZW1ibHlhaUFwaUtleTogc3RyaW5nO1xuICBhc3NlbWJseWFpTW9kZWw6IFwidW5pdmVyc2FsLTJcIiB8IFwidW5pdmVyc2FsLTNcIjtcbiAgZGVmYXVsdExhbmd1YWdlOiBzdHJpbmc7XG4gIGluc2VydEFzQ2FsbG91dDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFBsdWdpblNldHRpbmdzID0ge1xuICBwcm92aWRlcjogXCJnbGFkaWFcIixcbiAgZ2xhZGlhQXBpS2V5OiBcIlwiLFxuICBkZWVwZ3JhbUFwaUtleTogXCJcIixcbiAgYXNzZW1ibHlhaUFwaUtleTogXCJcIixcbiAgYXNzZW1ibHlhaU1vZGVsOiBcInVuaXZlcnNhbC0zXCIsXG4gIGRlZmF1bHRMYW5ndWFnZTogXCJlc1wiLFxuICBpbnNlcnRBc0NhbGxvdXQ6IHRydWUsXG59O1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBEaWFyeVRyYW5zY3JpYmVyUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IERpYXJ5VHJhbnNjcmliZXJQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlRyYW5zY3JpcGNpXHUwMEYzbiBPYnNpZGlhblwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlByb3ZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlNwZWVjaC10by10ZXh0IHByb3ZpZGVyIHRvIHVzZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHsgdmFsdWUsIGxhYmVsIH0gb2YgUFJPVklERVJTKSB7XG4gICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKHZhbHVlLCBsYWJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyID0gdiBhcyBUcmFuc2NyaXB0aW9uUHJvdmlkZXI7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvLyAtLS0gUHJvdmlkZXItc3BlY2lmaWMgQVBJIGtleSBmaWVsZHMgLS0tXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyID09PSBcImdsYWRpYVwiKSB7XG4gICAgICB0aGlzLmFkZEFwaUtleUZpZWxkKGNvbnRhaW5lckVsLCBcIkdsYWRpYSBBUEkgS2V5XCIsIFwiZ2xhZGlhQXBpS2V5XCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPT09IFwiZGVlcGdyYW1cIikge1xuICAgICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJEZWVwZ3JhbSBBUEkgS2V5XCIsIFwiZGVlcGdyYW1BcGlLZXlcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQXBpS2V5RmllbGQoXG4gICAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgICBcIkFzc2VtYmx5QUkgQVBJIEtleVwiLFxuICAgICAgICBcImFzc2VtYmx5YWlBcGlLZXlcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPT09IFwiYXNzZW1ibHlhaVwiKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJNb2RlbG9cIilcbiAgICAgICAgLnNldERlc2MoXCJVbml2ZXJzYWwtMzogbVx1MDBFMXMgcHJlY2lzbywgc3BlYWtlciBkaWFyaXphdGlvbiBtZWpvcmFkYS4gVW5pdmVyc2FsLTI6IG1cdTAwRTFzIHJcdTAwRTFwaWRvIHkgZWNvblx1MDBGM21pY28uXCIpXG4gICAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+XG4gICAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRPcHRpb24oXCJ1bml2ZXJzYWwtM1wiLCBcIlVuaXZlcnNhbC0zXCIpXG4gICAgICAgICAgICAuYWRkT3B0aW9uKFwidW5pdmVyc2FsLTJcIiwgXCJVbml2ZXJzYWwtMlwiKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2VtYmx5YWlNb2RlbClcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2VtYmx5YWlNb2RlbCA9IHYgYXNcbiAgICAgICAgICAgICAgICB8IFwidW5pdmVyc2FsLTJcIlxuICAgICAgICAgICAgICAgIHwgXCJ1bml2ZXJzYWwtM1wiO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gU2hvdyBhbGwga2V5cyBpbiBhbiBhZHZhbmNlZCBzZWN0aW9uXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQWxsIEFQSSBLZXlzXCIgfSk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiS2V5cyBhcmUgc3RvcmVkIGxvY2FsbHkgaW4geW91ciB2YXVsdCdzIHBsdWdpbiBkYXRhLlwiLFxuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJHbGFkaWFcIiwgXCJnbGFkaWFBcGlLZXlcIik7XG4gICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJEZWVwZ3JhbVwiLCBcImRlZXBncmFtQXBpS2V5XCIpO1xuICAgIHRoaXMuYWRkQXBpS2V5RmllbGQoY29udGFpbmVyRWwsIFwiQXNzZW1ibHlBSVwiLCBcImFzc2VtYmx5YWlBcGlLZXlcIik7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBsYW5ndWFnZVwiKVxuICAgICAgLnNldERlc2MoXCJJU08gY29kZTogZXMsIGVuLCBmciwgcHQuLi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZXNcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExhbmd1YWdlKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYW5ndWFnZSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiV3JhcCBpbiBjYWxsb3V0XCIpXG4gICAgICAuc2V0RGVzYyhcIkluc2VydCB0cmFuc2NyaXB0aW9uIGluc2lkZSBhID5bIXRyYW5zY3JpcHRpb25dIGNhbGxvdXQgYmxvY2tcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluc2VydEFzQ2FsbG91dClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnNlcnRBc0NhbGxvdXQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBcGlLZXlGaWVsZChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBrZXk6IFwiZ2xhZGlhQXBpS2V5XCIgfCBcImRlZXBncmFtQXBpS2V5XCIgfCBcImFzc2VtYmx5YWlBcGlLZXlcIlxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpLnNldE5hbWUobmFtZSkuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciB5b3VyIEFQSSBrZXlcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0pO1xuICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG5cbiAgICAgIGNvbnN0IHRvZ2dsZUJ0biA9IHRleHQuaW5wdXRFbC5wYXJlbnRFbGVtZW50Py5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IFwiU2hvd1wiLFxuICAgICAgICBjbHM6IFwidHJhbnNjcmlwY2lvbi1vYnNpZGlhbi10b2dnbGUta2V5XCIsXG4gICAgICB9KTtcbiAgICAgIGlmICh0b2dnbGVCdG4pIHtcbiAgICAgICAgdG9nZ2xlQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNQYXNzd29yZCA9IHRleHQuaW5wdXRFbC50eXBlID09PSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBpc1Bhc3N3b3JkID8gXCJ0ZXh0XCIgOiBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdG9nZ2xlQnRuLnRleHRDb250ZW50ID0gaXNQYXNzd29yZCA/IFwiSGlkZVwiIDogXCJTaG93XCI7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgVXR0ZXJhbmNlIHtcbiAgc3BlYWtlcjogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zY3JpcHRpb25PcHRpb25zIHtcbiAgc3BlYWtlck5hbWVzOiBzdHJpbmdbXTtcbiAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBtb2RlbD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTcGVha2VyTWFwcGluZyB7XG4gIGNvdW50OiBudW1iZXI7XG4gIG5hbWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IHR5cGUgVHJhbnNjcmlwdGlvblByb3ZpZGVyID0gXCJnbGFkaWFcIiB8IFwiZGVlcGdyYW1cIiB8IFwiYXNzZW1ibHlhaVwiO1xuXG5leHBvcnQgY29uc3QgUFJPVklERVJTOiB7IHZhbHVlOiBUcmFuc2NyaXB0aW9uUHJvdmlkZXI7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICB7IHZhbHVlOiBcImdsYWRpYVwiLCBsYWJlbDogXCJHbGFkaWFcIiB9LFxuICB7IHZhbHVlOiBcImRlZXBncmFtXCIsIGxhYmVsOiBcIkRlZXBncmFtXCIgfSxcbiAgeyB2YWx1ZTogXCJhc3NlbWJseWFpXCIsIGxhYmVsOiBcIkFzc2VtYmx5QUlcIiB9LFxuXTtcbiIsICJleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoUmV0cnkoXG4gIGlucHV0OiBSZXF1ZXN0SW5mbyxcbiAgaW5pdDogUmVxdWVzdEluaXQsXG4gIHJldHJpZXMgPSAzXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDw9IHJldHJpZXM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChpbnB1dCwgaW5pdCk7XG4gICAgICBpZiAocmVzLm9rIHx8IChyZXMuc3RhdHVzIDwgNTAwICYmIHJlcy5zdGF0dXMgIT09IDQyOSkpIHJldHVybiByZXM7XG4gICAgICBpZiAoYXR0ZW1wdCA8IHJldHJpZXMpIHtcbiAgICAgICAgYXdhaXQgc2xlZXAoMTAwMCAqIChhdHRlbXB0ICsgMSkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGVyci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgdGhyb3cgZXJyO1xuICAgICAgaWYgKGF0dGVtcHQgPCByZXRyaWVzKSB7XG4gICAgICAgIGF3YWl0IHNsZWVwKDEwMDAgKiAoYXR0ZW1wdCArIDEpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcImZldGNoV2l0aFJldHJ5OiB1bnJlYWNoYWJsZVwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgcmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKSk7XG4gICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICB9KTtcbn1cbiIsICJpbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuLi90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgVXR0ZXJhbmNlLCBUcmFuc2NyaXB0aW9uT3B0aW9ucyB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmV0Y2hXaXRoUmV0cnksIHNsZWVwIH0gZnJvbSBcIi4uL2ZldGNoLXV0aWxzXCI7XG5cbmludGVyZmFjZSBHbGFkaWFFcnJvciB7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgR2xhZGlhVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkdsYWRpYVwiO1xuXG4gIGFzeW5jIHRyYW5zY3JpYmUoXG4gICAgYXVkaW9CbG9iOiBCbG9iLFxuICAgIGFwaUtleTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFRyYW5zY3JpcHRpb25PcHRpb25zXG4gICk6IFByb21pc2U8VXR0ZXJhbmNlW10+IHtcbiAgICBjb25zdCBiYXNlVXJsID0gXCJodHRwczovL2FwaS5nbGFkaWEuaW8vdjJcIjtcbiAgICBjb25zdCBzaWduYWwgPSBvcHRpb25zLnNpZ25hbDtcblxuICAgIGNvbnN0IGF1ZGlvVXJsID0gYXdhaXQgdGhpcy51cGxvYWQoYXVkaW9CbG9iLCBhcGlLZXksIGJhc2VVcmwsIHNpZ25hbCk7XG5cbiAgICBjb25zdCByZXN1bHRVcmwgPSBhd2FpdCB0aGlzLnJlcXVlc3RUcmFuc2NyaXB0aW9uKFxuICAgICAgYXVkaW9VcmwsXG4gICAgICBhcGlLZXksXG4gICAgICBiYXNlVXJsLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wb2xsUmVzdWx0KHJlc3VsdFVybCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB1cGxvYWQoXG4gICAgYmxvYjogQmxvYixcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmb3JtID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybS5hcHBlbmQoXCJhdWRpb1wiLCBibG9iKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke2Jhc2VVcmx9L3VwbG9hZGAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSB9LFxuICAgICAgYm9keTogZm9ybSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcblxuICAgIGlmICghcmVzLm9rKSB7XG4gICAgICBjb25zdCBlcnIgPSAoYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKSkgYXMgR2xhZGlhRXJyb3IgfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgR2xhZGlhIHVwbG9hZCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8ubWVzc2FnZSA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBhdWRpb191cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLmF1ZGlvX3VybDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdFRyYW5zY3JpcHRpb24oXG4gICAgYXVkaW9Vcmw6IHN0cmluZyxcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBkaWFyaXphdGlvbjogdHJ1ZSxcbiAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuZGlhcml6YXRpb25fY29uZmlnID0ge1xuICAgICAgICBudW1iZXJfb2Zfc3BlYWtlcnM6IG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0vdHJhbnNjcmlwdGlvbmAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgICBzaWduYWw6IG9wdGlvbnMuc2lnbmFsLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnN0IGVyciA9IChhd2FpdCByZXMuanNvbigpLmNhdGNoKCgpID0+IG51bGwpKSBhcyBHbGFkaWFFcnJvciB8IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBHbGFkaWEgdHJhbnNjcmlwdGlvbiByZXF1ZXN0IGZhaWxlZCAoJHtyZXMuc3RhdHVzfSk6ICR7ZXJyPy5tZXNzYWdlID8/IFwidW5rbm93blwifWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyB7IGlkOiBzdHJpbmc7IHJlc3VsdF91cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLnJlc3VsdF91cmw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvbGxSZXN1bHQoXG4gICAgcmVzdWx0VXJsOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShyZXN1bHRVcmwsIHtcbiAgICAgICAgaGVhZGVyczogeyBcIngtZ2xhZGlhLWtleVwiOiBhcGlLZXkgfSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2xhZGlhIHBvbGxpbmcgZmFpbGVkICgke3Jlcy5zdGF0dXN9KWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHtcbiAgICAgICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgICAgIHJlc3VsdD86IHtcbiAgICAgICAgICB0cmFuc2NyaXB0aW9uPzoge1xuICAgICAgICAgICAgdXR0ZXJhbmNlcz86IEFycmF5PHtcbiAgICAgICAgICAgICAgc3BlYWtlcjogbnVtYmVyO1xuICAgICAgICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgICAgICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgICAgICAgICAgIGVuZDogbnVtYmVyO1xuICAgICAgICAgICAgfT47XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJkb25lXCIpIHtcbiAgICAgICAgY29uc3QgdXR0ZXJhbmNlcyA9IGRhdGEucmVzdWx0Py50cmFuc2NyaXB0aW9uPy51dHRlcmFuY2VzID8/IFtdO1xuICAgICAgICByZXR1cm4gdXR0ZXJhbmNlcy5tYXAoKHUpID0+ICh7XG4gICAgICAgICAgc3BlYWtlcjogdS5zcGVha2VyLFxuICAgICAgICAgIHRleHQ6IHUudGV4dC50cmltKCksXG4gICAgICAgICAgc3RhcnQ6IHUuc3RhcnQsXG4gICAgICAgICAgZW5kOiB1LmVuZCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbGFkaWEgdHJhbnNjcmlwdGlvbiBmYWlsZWRcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMDAsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiR2xhZGlhIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIERlZXBncmFtVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkRlZXBncmFtXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoe1xuICAgICAgZGlhcml6ZTogXCJ0cnVlXCIsXG4gICAgICBzbWFydF9mb3JtYXQ6IFwidHJ1ZVwiLFxuICAgICAgdXR0ZXJhbmNlczogXCJ0cnVlXCIsXG4gICAgfSk7XG5cbiAgICBpZiAob3B0aW9ucy5sYW5ndWFnZSkge1xuICAgICAgcGFyYW1zLnNldChcImxhbmd1YWdlXCIsIG9wdGlvbnMubGFuZ3VhZ2UpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMuc2V0KFwiZGlhcml6ZV92ZXJzaW9uXCIsIFwiMjAyNC0wMS0yNlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZGVlcGdyYW0uY29tL3YxL2xpc3Rlbj8ke3BhcmFtcy50b1N0cmluZygpfWA7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IGBUb2tlbiAke2FwaUtleX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBhdWRpb0Jsb2IudHlwZSB8fCBcImF1ZGlvL3dhdlwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IGF1ZGlvQmxvYixcbiAgICAgIHNpZ25hbDogb3B0aW9ucy5zaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlcy5vaykge1xuICAgICAgY29uc3QgZXJyID0gKGF3YWl0IHJlcy5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIHtcbiAgICAgICAgZXJyX21zZz86IHN0cmluZztcbiAgICAgIH0gfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRGVlcGdyYW0gcmVxdWVzdCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8uZXJyX21zZyA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgRGVlcGdyYW1SZXNwb25zZTtcbiAgICBjb25zdCByYXcgPSBkYXRhLnJlc3VsdHM/LnV0dGVyYW5jZXM7XG5cbiAgICBpZiAoIXJhdyB8fCByYXcubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiRGVlcGdyYW0gcmV0dXJuZWQgbm8gZGlhcml6ZWQgdXR0ZXJhbmNlcy4gVGhlIGF1ZGlvIG1heSBoYXZlIG9ubHkgb25lIHNwZWFrZXIgb3IgZGlhcml6YXRpb24gaXMgbm90IGF2YWlsYWJsZS5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmF3Lm1hcCgodSkgPT4gKHtcbiAgICAgIHNwZWFrZXI6ICh1LnNwZWFrZXIgPz8gMCkgKyAxLCAvLyBEZWVwZ3JhbSB1c2VzIDAtYmFzZWQgc3BlYWtlcnNcbiAgICAgIHRleHQ6IHUudHJhbnNjcmlwdD8udHJpbSgpID8/IFwiXCIsXG4gICAgICBzdGFydDogdS5zdGFydCA/PyAwLFxuICAgICAgZW5kOiB1LmVuZCA/PyAwLFxuICAgIH0pKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1VdHRlcmFuY2Uge1xuICBzcGVha2VyPzogbnVtYmVyO1xuICB0cmFuc2NyaXB0Pzogc3RyaW5nO1xuICBzdGFydD86IG51bWJlcjtcbiAgZW5kPzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1SZXNwb25zZSB7XG4gIHJlc3VsdHM/OiB7XG4gICAgdXR0ZXJhbmNlcz86IERlZXBncmFtVXR0ZXJhbmNlW107XG4gIH07XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGZldGNoV2l0aFJldHJ5LCBzbGVlcCB9IGZyb20gXCIuLi9mZXRjaC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgQXNzZW1ibHlBSVRyYW5zY3JpYmVyIGltcGxlbWVudHMgVHJhbnNjcmliZXIge1xuICByZWFkb25seSBuYW1lID0gXCJBc3NlbWJseUFJXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsO1xuICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICBhdXRob3JpemF0aW9uOiBhcGlLZXksXG4gICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9O1xuXG4gICAgLy8gMS4gVXBsb2FkIGF1ZGlvXG4gICAgY29uc3QgdXBsb2FkUmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2FwaS5hc3NlbWJseWFpLmNvbS92Mi91cGxvYWRcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHsgYXV0aG9yaXphdGlvbjogYXBpS2V5IH0sXG4gICAgICBib2R5OiBhdWRpb0Jsb2IsXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXVwbG9hZFJlcy5vaykge1xuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHVwbG9hZFJlcy50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBBc3NlbWJseUFJIHVwbG9hZCBmYWlsZWQgKCR7dXBsb2FkUmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdXBsb2FkX3VybDogYXVkaW9VcmwgfSA9IChhd2FpdCB1cGxvYWRSZXMuanNvbigpKSBhcyB7XG4gICAgICB1cGxvYWRfdXJsOiBzdHJpbmc7XG4gICAgfTtcblxuICAgIC8vIDIuIFN0YXJ0IHRyYW5zY3JpcHRpb25cbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBzcGVlY2hfbW9kZWxzOiBbb3B0aW9ucy5tb2RlbCB8fCBcInVuaXZlcnNhbC0yXCJdLFxuICAgICAgc3BlYWtlcl9sYWJlbHM6IHRydWUsXG4gICAgICBsYW5ndWFnZV9jb2RlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuc3BlYWtlcnNfZXhwZWN0ZWQgPSBvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhcnRSZXMgPSBhd2FpdCBmZXRjaChcbiAgICAgIFwiaHR0cHM6Ly9hcGkuYXNzZW1ibHlhaS5jb20vdjIvdHJhbnNjcmlwdFwiLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXN0YXJ0UmVzLm9rKSB7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgc3RhcnRSZXMudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQXNzZW1ibHlBSSB0cmFuc2NyaXB0aW9uIHJlcXVlc3QgZmFpbGVkICgke3N0YXJ0UmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgaWQgfSA9IChhd2FpdCBzdGFydFJlcy5qc29uKCkpIGFzIHsgaWQ6IHN0cmluZyB9O1xuXG4gICAgLy8gMy4gUG9sbCB1bnRpbCBkb25lXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9sbChpZCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb2xsKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShcbiAgICAgICAgYGh0dHBzOi8vYXBpLmFzc2VtYmx5YWkuY29tL3YyL3RyYW5zY3JpcHQvJHtpZH1gLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogeyBhdXRob3JpemF0aW9uOiBhcGlLZXkgfSxcbiAgICAgICAgICBzaWduYWwsXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZW1ibHlBSSBwb2xsaW5nIGZhaWxlZCAoJHtyZXMuc3RhdHVzfSlgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyBBc3NlbWJseUFJUmVzcG9uc2U7XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgICByZXR1cm4gKGRhdGEudXR0ZXJhbmNlcyA/PyBbXSkubWFwKCh1KSA9PiAoe1xuICAgICAgICAgIHNwZWFrZXI6IHRoaXMuc3BlYWtlckxhYmVsVG9OdW1iZXIodS5zcGVha2VyKSxcbiAgICAgICAgICB0ZXh0OiB1LnRleHQudHJpbSgpLFxuICAgICAgICAgIHN0YXJ0OiB1LnN0YXJ0IC8gMTAwMCxcbiAgICAgICAgICBlbmQ6IHUuZW5kIC8gMTAwMCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEFzc2VtYmx5QUkgdHJhbnNjcmlwdGlvbiBlcnJvcjogJHtkYXRhLmVycm9yID8/IFwidW5rbm93blwifWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2xlZXAoMTAwMCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlbWJseUFJIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzcGVha2VyTGFiZWxUb051bWJlcihsYWJlbDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbGFiZWwudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApIC0gNjQ7XG4gIH1cbn1cblxuaW50ZXJmYWNlIEFzc2VtYmx5QUlVdHRlcmFuY2Uge1xuICBzcGVha2VyOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhcnQ6IG51bWJlcjsgLy8gbXNcbiAgZW5kOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBBc3NlbWJseUFJUmVzcG9uc2Uge1xuICBzdGF0dXM6IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIHV0dGVyYW5jZXM/OiBBc3NlbWJseUFJVXR0ZXJhbmNlW107XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3BlYWtlck1hcHBpbmcgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgU3BlYWtlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICByZXNvbHZlOiAoKHZhbHVlOiBTcGVha2VyTWFwcGluZyB8IG51bGwpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbmFtZUZpZWxkczogSFRNTElucHV0RWxlbWVudFtdID0gW107XG4gIHByaXZhdGUgbmFtZXNDb250YWluZXI6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgb3BlbigpOiBQcm9taXNlPFNwZWFrZXJNYXBwaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3BlYWtlciBDb25maWd1cmF0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIk51bWJlciBvZiBzcGVha2Vyc1wiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjJcIik7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5pbnB1dEVsLm1pbiA9IFwiMVwiO1xuICAgICAgICB0ZXh0LmlucHV0RWwubWF4ID0gXCIxMFwiO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFwiMlwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZSgodmFsdWUpID0+IHRoaXMucmVuZGVyTmFtZUZpZWxkcyhOdW1iZXIodmFsdWUpIHx8IDIpKTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5uYW1lc0NvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXG4gICAgICBcInRyYW5zY3JpcGNpb24tb2JzaWRpYW4tc3BlYWtlci1uYW1lc1wiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbCkuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJTdGFydCBUcmFuc2NyaXB0aW9uXCIpXG4gICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLnN1Ym1pdCgpKVxuICAgICk7XG5cbiAgICB0aGlzLnJlbmRlck5hbWVGaWVsZHMoMik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck5hbWVGaWVsZHMoY291bnQ6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5uYW1lc0NvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMubmFtZXNDb250YWluZXIuZW1wdHkoKTtcbiAgICB0aGlzLm5hbWVGaWVsZHMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgcm93ID0gdGhpcy5uYW1lc0NvbnRhaW5lci5jcmVhdGVEaXYoXG4gICAgICAgIFwidHJhbnNjcmlwY2lvbi1vYnNpZGlhbi1zcGVha2VyLXJvd1wiXG4gICAgICApO1xuICAgICAgcm93LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBgU3BlYWtlciAke2kgKyAxfWAgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBgTmFtZSBmb3Igc3BlYWtlciAke2kgKyAxfWAsXG4gICAgICB9KTtcbiAgICAgIHRoaXMubmFtZUZpZWxkcy5wdXNoKGlucHV0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN1Ym1pdCgpIHtcbiAgICBjb25zdCBuYW1lcyA9IHRoaXMubmFtZUZpZWxkcy5tYXAoXG4gICAgICAoZiwgaSkgPT4gZi52YWx1ZS50cmltKCkgfHwgYFNwZWFrZXIgJHtpICsgMX1gXG4gICAgKTtcbiAgICB0aGlzLnJlc29sdmU/Lih7IGNvdW50OiBuYW1lcy5sZW5ndGgsIG5hbWVzIH0pO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKHRoaXMucmVzb2x2ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKG51bGwpO1xuICAgICAgdGhpcy5yZXNvbHZlID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBDaG9pY2VNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlOiAoKGNob2ljZTogXCJyZWNvcmRcIiB8IFwiZmlsZVwiIHwgbnVsbCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICBvcGVuKCk6IFByb21pc2U8XCJyZWNvcmRcIiB8IFwiZmlsZVwiIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHUwMEJGUXVcdTAwRTkgcXVlclx1MDBFOXMgaGFjZXI/XCIgfSk7XG5cbiAgICBjb25zdCBidG5Db250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGF0dHI6IHsgc3R5bGU6IFwiZGlzcGxheTogZmxleDsgZ2FwOiAxMnB4OyBtYXJnaW4tdG9wOiAxNnB4O1wiIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCByZWNvcmRCdG4gPSBidG5Db250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgdGV4dDogXCJcdUQ4M0NcdURGOTlcdUZFMEYgR3JhYmFyIGF1ZGlvXCIsXG4gICAgICBjbHM6IFwibW9kLWN0YVwiLFxuICAgIH0pO1xuICAgIHJlY29yZEJ0bi5zdHlsZS5mbGV4ID0gXCIxXCI7XG4gICAgcmVjb3JkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmU/LihcInJlY29yZFwiKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZmlsZUJ0biA9IGJ0bkNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICB0ZXh0OiBcIlx1RDgzRFx1RENDMSBFbGVnaXIgYXJjaGl2b1wiLFxuICAgIH0pO1xuICAgIGZpbGVCdG4uc3R5bGUuZmxleCA9IFwiMVwiO1xuICAgIGZpbGVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZT8uKFwiZmlsZVwiKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICh0aGlzLnJlc29sdmUpIHtcbiAgICAgIHRoaXMucmVzb2x2ZShudWxsKTtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IG51bGw7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgUmVjb3JkaW5nTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgY2h1bmtzOiBCbG9iW10gPSBbXTtcbiAgcHJpdmF0ZSBtZWRpYVJlY29yZGVyOiBNZWRpYVJlY29yZGVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RyZWFtOiBNZWRpYVN0cmVhbSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNlY29uZHMgPSAwO1xuICBwcml2YXRlIHRpbWVySW50ZXJ2YWw6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRpbWVyRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdHVzRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVzb2x2ZTogKChibG9iOiBCbG9iIHwgbnVsbCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBzdGFydCgpOiBQcm9taXNlPEJsb2IgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuXG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHtcbiAgICAgICAgICBhdWRpbzogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgbmV3IE5vdGljZShcIk5vIHNlIHB1ZG8gYWNjZWRlciBhbCBtaWNyXHUwMEYzZm9uby4gVmVyaWZpY1x1MDBFMSBsb3MgcGVybWlzb3MuXCIpO1xuICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1pbWVUeXBlID0gTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoXCJhdWRpby93ZWJtO2NvZGVjcz1vcHVzXCIpXG4gICAgICAgID8gXCJhdWRpby93ZWJtO2NvZGVjcz1vcHVzXCJcbiAgICAgICAgOiBNZWRpYVJlY29yZGVyLmlzVHlwZVN1cHBvcnRlZChcImF1ZGlvL3dlYm1cIilcbiAgICAgICAgPyBcImF1ZGlvL3dlYm1cIlxuICAgICAgICA6IE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKFwiYXVkaW8vbXA0XCIpXG4gICAgICAgID8gXCJhdWRpby9tcDRcIlxuICAgICAgICA6IE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKFwiYXVkaW8vYWFjXCIpXG4gICAgICAgID8gXCJhdWRpby9hYWNcIlxuICAgICAgICA6IFwiYXVkaW8vb2dnO2NvZGVjcz1vcHVzXCI7XG5cbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHRoaXMuc3RyZWFtLCB7IG1pbWVUeXBlIH0pO1xuICAgICAgdGhpcy5jaHVua3MgPSBbXTtcblxuICAgICAgdGhpcy5tZWRpYVJlY29yZGVyLm9uZGF0YWF2YWlsYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIGlmIChlLmRhdGEuc2l6ZSA+IDApIHRoaXMuY2h1bmtzLnB1c2goZS5kYXRhKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5vbnN0b3AgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IodGhpcy5jaHVua3MsIHsgdHlwZTogbWltZVR5cGUgfSk7XG4gICAgICAgIHRoaXMucmVzb2x2ZT8uKGJsb2IpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLm1lZGlhUmVjb3JkZXIuc3RhcnQoMTAwMCk7XG4gICAgICBzdXBlci5vcGVuKCk7XG4gICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiR3JhYmFuZG8uLi5cIiB9KTtcblxuICAgIHRoaXMuc3RhdHVzRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJ0cmFuc2NyaXBjaW9uLW9ic2lkaWFuLXN0YXR1cyBsb2FkaW5nXCIsXG4gICAgICB0ZXh0OiBcIlx1MjVDRiBHcmFiYW5kb1wiLFxuICAgIH0pO1xuXG4gICAgdGhpcy50aW1lckVsID0gY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIjAwOjAwXCIsXG4gICAgICBhdHRyOiB7IHN0eWxlOiBcImZvbnQtc2l6ZTogMmVtOyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbjogMTZweCAwO1wiIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpLmFkZEJ1dHRvbigoYnRuKSA9PlxuICAgICAgYnRuXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRGV0ZW5lciBncmFiYWNpXHUwMEYzblwiKVxuICAgICAgICAuc2V0V2FybmluZygpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHRoaXMuc3RvcFJlY29yZGluZygpKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN0YXJ0VGltZXIoKSB7XG4gICAgdGhpcy5zZWNvbmRzID0gMDtcbiAgICB0aGlzLnRpbWVySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnNlY29uZHMrKztcbiAgICAgIGlmICh0aGlzLnRpbWVyRWwpIHtcbiAgICAgICAgY29uc3QgbSA9IE1hdGguZmxvb3IodGhpcy5zZWNvbmRzIC8gNjApO1xuICAgICAgICBjb25zdCBzID0gdGhpcy5zZWNvbmRzICUgNjA7XG4gICAgICAgIHRoaXMudGltZXJFbC50ZXh0Q29udGVudCA9XG4gICAgICAgICAgYCR7bS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKX06JHtzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG4gICAgICB9XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BSZWNvcmRpbmcoKSB7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyPy5zdG9wKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgaWYgKHRoaXMudGltZXJJbnRlcnZhbCkgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySW50ZXJ2YWwpO1xuICAgIHRoaXMuc3RyZWFtPy5nZXRUcmFja3MoKS5mb3JFYWNoKCh0KSA9PiB0LnN0b3AoKSk7XG4gICAgdGhpcy5zdHJlYW0gPSBudWxsO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlciA9IG51bGw7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKHRoaXMucmVzb2x2ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKG51bGwpO1xuICAgICAgdGhpcy5yZXNvbHZlID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUF1RTs7O0FDQXZFLHNCQUErQzs7O0FDcUJ4QyxJQUFNLFlBQStEO0FBQUEsRUFDMUUsRUFBRSxPQUFPLFVBQVUsT0FBTyxTQUFTO0FBQUEsRUFDbkMsRUFBRSxPQUFPLFlBQVksT0FBTyxXQUFXO0FBQUEsRUFDdkMsRUFBRSxPQUFPLGNBQWMsT0FBTyxhQUFhO0FBQzdDOzs7QURYTyxJQUFNLG1CQUFtQztBQUFBLEVBQzlDLFVBQVU7QUFBQSxFQUNWLGNBQWM7QUFBQSxFQUNkLGdCQUFnQjtBQUFBLEVBQ2hCLGtCQUFrQjtBQUFBLEVBQ2xCLGlCQUFpQjtBQUFBLEVBQ2pCLGlCQUFpQjtBQUFBLEVBQ2pCLGlCQUFpQjtBQUNuQjtBQUVPLElBQU0sY0FBTixjQUEwQixpQ0FBaUI7QUFBQSxFQUdoRCxZQUFZLEtBQVUsUUFBZ0M7QUFDcEQsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBRWxCLGdCQUFZ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
