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
  assemblyaiModel: "universal-3-pro",
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
    containerEl.createEl("h2", { text: "Audio Transcript" });
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
      new import_obsidian.Setting(containerEl).setName("Modelo").setDesc("Universal-3 Pro: m\xE1xima precisi\xF3n, speaker diarization avanzada. Universal-2: m\xE1s r\xE1pido y econ\xF3mico.").addDropdown(
        (dropdown) => dropdown.addOption("universal-3-pro", "Universal-3 Pro").addOption("universal-2", "Universal-2").setValue(this.plugin.settings.assemblyaiModel).onChange(async (v) => {
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
    const LANGUAGES = [
      { value: "es", label: "Espa\xF1ol" },
      { value: "en", label: "English" },
      { value: "pt", label: "Portugu\xEAs" },
      { value: "fr", label: "Fran\xE7ais" },
      { value: "de", label: "Deutsch" },
      { value: "it", label: "Italiano" },
      { value: "ja", label: "\u65E5\u672C\u8A9E" },
      { value: "zh", label: "\u4E2D\u6587" },
      { value: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
      { value: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
      { value: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940" },
      { value: "nl", label: "Nederlands" },
      { value: "pl", label: "Polski" },
      { value: "tr", label: "T\xFCrk\xE7e" },
      { value: "ko", label: "\uD55C\uAD6D\uC5B4" }
    ];
    new import_obsidian.Setting(containerEl).setName("Idioma").setDesc("Idioma del audio a transcribir").addDropdown((dropdown) => {
      for (const { value, label } of LANGUAGES) {
        dropdown.addOption(value, label);
      }
      dropdown.setValue(this.plugin.settings.defaultLanguage).onChange(async (v) => {
        this.plugin.settings.defaultLanguage = v;
        await this.plugin.saveSettings();
      });
    });
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
        cls: "audio-transcript-toggle-key"
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
      "audio-transcript-speaker-names"
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
        "audio-transcript-speaker-row"
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
      cls: "audio-transcript-status loading",
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
        `No API key set for ${this.settings.provider}. Settings \u2192 Audio Transcript.`
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
        `No API key set for ${this.settings.provider}. Settings \u2192 Audio Transcript.`
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
      console.error("[Audio Transcript]", err);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9mZXRjaC11dGlscy50cyIsICJzcmMvcHJvdmlkZXJzL2dsYWRpYS50cyIsICJzcmMvcHJvdmlkZXJzL2RlZXBncmFtLnRzIiwgInNyYy9wcm92aWRlcnMvYXNzZW1ibHlhaS50cyIsICJzcmMvc3BlYWtlci1tb2RhbC50cyIsICJzcmMvY2hvaWNlLW1vZGFsLnRzIiwgInNyYy9yZWNvcmRpbmctbW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEVkaXRvciwgTWFya2Rvd25GaWxlSW5mbywgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUGx1Z2luU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MsIFNldHRpbmdzVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgR2xhZGlhVHJhbnNjcmliZXIgfSBmcm9tIFwiLi9zcmMvcHJvdmlkZXJzL2dsYWRpYVwiO1xuaW1wb3J0IHsgRGVlcGdyYW1UcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvZGVlcGdyYW1cIjtcbmltcG9ydCB7IEFzc2VtYmx5QUlUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvYXNzZW1ibHlhaVwiO1xuaW1wb3J0IHsgU3BlYWtlck1vZGFsIH0gZnJvbSBcIi4vc3JjL3NwZWFrZXItbW9kYWxcIjtcbmltcG9ydCB7IENob2ljZU1vZGFsIH0gZnJvbSBcIi4vc3JjL2Nob2ljZS1tb2RhbFwiO1xuaW1wb3J0IHsgUmVjb3JkaW5nTW9kYWwgfSBmcm9tIFwiLi9zcmMvcmVjb3JkaW5nLW1vZGFsXCI7XG5pbXBvcnQgeyBTcGVha2VyTWFwcGluZywgVXR0ZXJhbmNlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpYXJ5VHJhbnNjcmliZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IFBsdWdpblNldHRpbmdzO1xuICBwcml2YXRlIGFjdGl2ZU5vdGljZTogTm90aWNlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJtaWNcIiwgXCJUcmFuc2NyaWJpclwiLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgIGlmICghdmlldykge1xuICAgICAgICBuZXcgTm90aWNlKFwiQWJyXHUwMEVEIHVuYSBub3RhIHByaW1lcm9cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNob2ljZSA9IGF3YWl0IG5ldyBDaG9pY2VNb2RhbCh0aGlzLmFwcCkub3BlbigpO1xuICAgICAgaWYgKGNob2ljZSA9PT0gXCJyZWNvcmRcIikge1xuICAgICAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nKHZpZXcuZWRpdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hvaWNlID09PSBcImZpbGVcIikge1xuICAgICAgICB0aGlzLnRyYW5zY3JpYmVGaWxlKHZpZXcuZWRpdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJyZWNvcmQtYW5kLXRyYW5zY3JpYmVcIixcbiAgICAgIG5hbWU6IFwiR3JhYmFyIHkgdHJhbnNjcmliaXJcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIF9jdHg6IE1hcmtkb3duVmlldyB8IE1hcmtkb3duRmlsZUluZm8pID0+XG4gICAgICAgIHRoaXMuc3RhcnRSZWNvcmRpbmcoZWRpdG9yKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0cmFuc2NyaWJlLWZpbGVcIixcbiAgICAgIG5hbWU6IFwiVHJhbnNjcmliaXIgYXJjaGl2b1wiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvciwgX2N0eDogTWFya2Rvd25WaWV3IHwgTWFya2Rvd25GaWxlSW5mbykgPT5cbiAgICAgICAgdGhpcy50cmFuc2NyaWJlRmlsZShlZGl0b3IpLFxuICAgIH0pO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5hY3RpdmVOb3RpY2U/LmhpZGUoKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFJlY29yZGluZyBmbG93IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRSZWNvcmRpbmcoZWRpdG9yOiBFZGl0b3IpIHtcbiAgICBjb25zdCBhcGlLZXkgPSB0aGlzLmdldEFwaUtleSgpO1xuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgTm8gQVBJIGtleSBzZXQgZm9yICR7dGhpcy5zZXR0aW5ncy5wcm92aWRlcn0uIFNldHRpbmdzIFx1MjE5MiBBdWRpbyBUcmFuc2NyaXB0LmBcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IG5ldyBSZWNvcmRpbmdNb2RhbCh0aGlzLmFwcCkuc3RhcnQoKTtcbiAgICBpZiAoIWJsb2IpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZWFrZXJNYXBwaW5nID0gYXdhaXQgbmV3IFNwZWFrZXJNb2RhbCh0aGlzLmFwcCkub3BlbigpO1xuICAgIGlmICghc3BlYWtlck1hcHBpbmcpIHJldHVybjtcblxuICAgIGF3YWl0IHRoaXMudHJhbnNjcmliZUJsb2IoZWRpdG9yLCBibG9iLCBzcGVha2VyTWFwcGluZyk7XG5cbiAgICAvLyBJbnNlcnQgbGluayB0byB0aGUgc2F2ZWQgYXVkaW8gZmlsZSBhZnRlciB0cmFuc2NyaXB0aW9uXG4gICAgY29uc3QgYXVkaW9QYXRoID0gYXdhaXQgdGhpcy5zYXZlQXVkaW9GaWxlKGJsb2IpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gYXVkaW9QYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSA/PyBhdWRpb1BhdGg7XG4gICAgdGhpcy5pbnNlcnRBdEN1cnNvcihlZGl0b3IsIGBcXG5cdUQ4M0RcdURDQzEgW1ske2ZpbGVuYW1lfV1dXFxuYCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsZSBwaWNrZXIgZmxvdyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGFzeW5jIHRyYW5zY3JpYmVGaWxlKGVkaXRvcjogRWRpdG9yKSB7XG4gICAgY29uc3QgYXBpS2V5ID0gdGhpcy5nZXRBcGlLZXkoKTtcbiAgICBpZiAoIWFwaUtleSkge1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgYE5vIEFQSSBrZXkgc2V0IGZvciAke3RoaXMuc2V0dGluZ3MucHJvdmlkZXJ9LiBTZXR0aW5ncyBcdTIxOTIgQXVkaW8gVHJhbnNjcmlwdC5gXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLnBpY2tBdWRpb0ZpbGUoKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZWFrZXJNYXBwaW5nID0gYXdhaXQgbmV3IFNwZWFrZXJNb2RhbCh0aGlzLmFwcCkub3BlbigpO1xuICAgIGlmICghc3BlYWtlck1hcHBpbmcpIHJldHVybjtcblxuICAgIGF3YWl0IHRoaXMudHJhbnNjcmliZUJsb2IoZWRpdG9yLCBmaWxlLCBzcGVha2VyTWFwcGluZyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2hhcmVkIHRyYW5zY3JpcHRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBhc3luYyB0cmFuc2NyaWJlQmxvYihcbiAgICBlZGl0b3I6IEVkaXRvcixcbiAgICBibG9iOiBCbG9iLFxuICAgIHNwZWFrZXJNYXBwaW5nOiBTcGVha2VyTWFwcGluZ1xuICApIHtcbiAgICBjb25zdCBhcGlLZXkgPSB0aGlzLmdldEFwaUtleSgpO1xuXG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG5cbiAgICBjb25zdCBub3RpY2UgPSBuZXcgTm90aWNlKFxuICAgICAgYFRyYW5zY3JpYmllbmRvIGNvbiAke3RoaXMuc2V0dGluZ3MucHJvdmlkZXJ9Li4uYCxcbiAgICAgIDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlTm90aWNlID0gbm90aWNlO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdHJhbnNjcmliZXIgPSB0aGlzLmdldFRyYW5zY3JpYmVyKCk7XG4gICAgICBjb25zdCB1dHRlcmFuY2VzID0gYXdhaXQgdHJhbnNjcmliZXIudHJhbnNjcmliZShibG9iLCBhcGlLZXksIHtcbiAgICAgICAgc3BlYWtlck5hbWVzOiBzcGVha2VyTWFwcGluZy5uYW1lcyxcbiAgICAgICAgbGFuZ3VhZ2U6IHRoaXMuc2V0dGluZ3MuZGVmYXVsdExhbmd1YWdlLFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBtb2RlbDpcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLnByb3ZpZGVyID09PSBcImFzc2VtYmx5YWlcIlxuICAgICAgICAgICAgPyB0aGlzLnNldHRpbmdzLmFzc2VtYmx5YWlNb2RlbFxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZm9ybWF0dGVkID0gdGhpcy5mb3JtYXRUcmFuc2NyaXB0aW9uKFxuICAgICAgICB1dHRlcmFuY2VzLFxuICAgICAgICBzcGVha2VyTWFwcGluZy5uYW1lc1xuICAgICAgKTtcbiAgICAgIHRoaXMuaW5zZXJ0QXRDdXJzb3IoZWRpdG9yLCBmb3JtYXR0ZWQpO1xuXG4gICAgICBjb25zdCBlbGFwc2VkID0gKChEYXRlLm5vdygpIC0gc3RhcnRUaW1lKSAvIDEwMDApLnRvRml4ZWQoMSk7XG4gICAgICBub3RpY2UuaGlkZSgpO1xuICAgICAgbmV3IE5vdGljZShgVHJhbnNjcmlwY2lcdTAwRjNuIGxpc3RhIGVuICR7ZWxhcHNlZH1zYCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBub3RpY2UuaGlkZSgpO1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlcnIubmFtZSA9PT0gXCJBYm9ydEVycm9yXCIpIHJldHVybjtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogXCJFcnJvciBkZXNjb25vY2lkb1wiO1xuICAgICAgbmV3IE5vdGljZShgRmFsbFx1MDBGMyBsYSB0cmFuc2NyaXBjaVx1MDBGM246ICR7bWVzc2FnZX1gKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQXVkaW8gVHJhbnNjcmlwdF1cIiwgZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlTm90aWNlID09PSBub3RpY2UpIHRoaXMuYWN0aXZlTm90aWNlID0gbnVsbDtcbiAgICAgIGlmICh0aGlzLmFib3J0Q29udHJvbGxlciA9PT0gY29udHJvbGxlcikgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTYXZlIGF1ZGlvIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUF1ZGlvRmlsZShibG9iOiBCbG9iKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBleHQgPSBibG9iLnR5cGUuc3BsaXQoXCIvXCIpWzFdPy5zcGxpdChcIjtcIilbMF0gfHwgXCJ3ZWJtXCI7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0cyA9IG5vdy50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpLnNsaWNlKDAsIDE5KTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGBncmFiYWNpb24tJHt0c30uJHtleHR9YDtcblxuICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IGZvbGRlciA9IGFjdGl2ZUZpbGU/LnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGZpbGVwYXRoID0gZm9sZGVyID8gYCR7Zm9sZGVyfS8ke2ZpbGVuYW1lfWAgOiBmaWxlbmFtZTtcblxuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUJpbmFyeShmaWxlcGF0aCwgYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICByZXR1cm4gZmlsZXBhdGg7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUHJvdmlkZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZ2V0VHJhbnNjcmliZXIoKTogVHJhbnNjcmliZXIge1xuICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy5wcm92aWRlcikge1xuICAgICAgY2FzZSBcImdsYWRpYVwiOlxuICAgICAgICByZXR1cm4gbmV3IEdsYWRpYVRyYW5zY3JpYmVyKCk7XG4gICAgICBjYXNlIFwiZGVlcGdyYW1cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBEZWVwZ3JhbVRyYW5zY3JpYmVyKCk7XG4gICAgICBjYXNlIFwiYXNzZW1ibHlhaVwiOlxuICAgICAgICByZXR1cm4gbmV3IEFzc2VtYmx5QUlUcmFuc2NyaWJlcigpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3ZpZGVyOiAke3RoaXMuc2V0dGluZ3MucHJvdmlkZXJ9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBcGlLZXkoKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHRoaXMuc2V0dGluZ3MucHJvdmlkZXIpIHtcbiAgICAgIGNhc2UgXCJnbGFkaWFcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuZ2xhZGlhQXBpS2V5O1xuICAgICAgY2FzZSBcImRlZXBncmFtXCI6XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmRlZXBncmFtQXBpS2V5O1xuICAgICAgY2FzZSBcImFzc2VtYmx5YWlcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuYXNzZW1ibHlhaUFwaUtleTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm92aWRlcjogJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWxlIHBpY2tlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHBpY2tBdWRpb0ZpbGUoKTogUHJvbWlzZTxGaWxlIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgICBpbnB1dC5hY2NlcHQgPSBcImF1ZGlvLypcIjtcblxuICAgICAgbGV0IHJlc29sdmVkID0gZmFsc2U7XG4gICAgICBjb25zdCBkb25lID0gKGZpbGU6IEZpbGUgfCBudWxsKSA9PiB7XG4gICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuO1xuICAgICAgICByZXNvbHZlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVzb2x2ZShmaWxlKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNhZmV0eVRpbWVyKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGZvY3VzSGFuZGxlciA9ICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFpbnB1dC5maWxlcyB8fCBpbnB1dC5maWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRvbmUobnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAzMDApO1xuICAgICAgfTtcblxuICAgICAgaW5wdXQub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGRvbmUoaW5wdXQuZmlsZXM/LlswXSA/PyBudWxsKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHNhZmV0eVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICghaW5wdXQuZmlsZXMgfHwgaW5wdXQuZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgZG9uZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSwgMTIwXzAwMCk7XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgZm9jdXNIYW5kbGVyKTtcbiAgICAgIGlucHV0LmNsaWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRm9ybWF0dGluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGZvcm1hdFRyYW5zY3JpcHRpb24oXG4gICAgdXR0ZXJhbmNlczogVXR0ZXJhbmNlW10sXG4gICAgc3BlYWtlck5hbWVzOiBzdHJpbmdbXVxuICApOiBzdHJpbmcge1xuICAgIGlmICh1dHRlcmFuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFwiKihObyBzcGVlY2ggZGV0ZWN0ZWQpKlwiO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVzID0gdXR0ZXJhbmNlcy5tYXAoKHUpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBzcGVha2VyTmFtZXNbdS5zcGVha2VyIC0gMV0gfHwgYFNwZWFrZXIgJHt1LnNwZWFrZXJ9YDtcbiAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLmZvcm1hdFRpbWVzdGFtcCh1LnN0YXJ0KTtcbiAgICAgIHJldHVybiBgKioke25hbWV9KiogXFxgJHt0aW1lfVxcYGAgKyBcIlxcblwiICsgdS50ZXh0O1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaW5zZXJ0QXNDYWxsb3V0KSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBcIj4gWyF0cmFuc2NyaXB0aW9uXS0gVHJhbnNjcmlwdGlvblxcblwiICtcbiAgICAgICAgbGluZXMubWFwKChsKSA9PiBgPiAke2x9YCkuam9pbihcIlxcbj5cXG5cIilcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdFRpbWVzdGFtcChzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgY29uc3QgcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcbiAgICByZXR1cm4gYCR7bX06JHtzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRWRpdG9yIGluc2VydCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGluc2VydEF0Q3Vyc29yKGVkaXRvcjogRWRpdG9yLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XG4gICAgZWRpdG9yLnJlcGxhY2VSYW5nZSh0ZXh0LCBjdXJzb3IpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBEaWFyeVRyYW5zY3JpYmVyUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBUcmFuc2NyaXB0aW9uUHJvdmlkZXIsIFBST1ZJREVSUyB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luU2V0dGluZ3Mge1xuICBwcm92aWRlcjogVHJhbnNjcmlwdGlvblByb3ZpZGVyO1xuICBnbGFkaWFBcGlLZXk6IHN0cmluZztcbiAgZGVlcGdyYW1BcGlLZXk6IHN0cmluZztcbiAgYXNzZW1ibHlhaUFwaUtleTogc3RyaW5nO1xuICBhc3NlbWJseWFpTW9kZWw6IFwidW5pdmVyc2FsLTJcIiB8IFwidW5pdmVyc2FsLTMtcHJvXCI7XG4gIGRlZmF1bHRMYW5ndWFnZTogc3RyaW5nO1xuICBpbnNlcnRBc0NhbGxvdXQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBQbHVnaW5TZXR0aW5ncyA9IHtcbiAgcHJvdmlkZXI6IFwiZ2xhZGlhXCIsXG4gIGdsYWRpYUFwaUtleTogXCJcIixcbiAgZGVlcGdyYW1BcGlLZXk6IFwiXCIsXG4gIGFzc2VtYmx5YWlBcGlLZXk6IFwiXCIsXG4gIGFzc2VtYmx5YWlNb2RlbDogXCJ1bml2ZXJzYWwtMy1wcm9cIixcbiAgZGVmYXVsdExhbmd1YWdlOiBcImVzXCIsXG4gIGluc2VydEFzQ2FsbG91dDogdHJ1ZSxcbn07XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5nc1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IERpYXJ5VHJhbnNjcmliZXJQbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogRGlhcnlUcmFuc2NyaWJlclBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQXVkaW8gVHJhbnNjcmlwdFwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlByb3ZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlNwZWVjaC10by10ZXh0IHByb3ZpZGVyIHRvIHVzZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHsgdmFsdWUsIGxhYmVsIH0gb2YgUFJPVklERVJTKSB7XG4gICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKHZhbHVlLCBsYWJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyID0gdiBhcyBUcmFuc2NyaXB0aW9uUHJvdmlkZXI7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvLyAtLS0gUHJvdmlkZXItc3BlY2lmaWMgQVBJIGtleSBmaWVsZHMgLS0tXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyID09PSBcImdsYWRpYVwiKSB7XG4gICAgICB0aGlzLmFkZEFwaUtleUZpZWxkKGNvbnRhaW5lckVsLCBcIkdsYWRpYSBBUEkgS2V5XCIsIFwiZ2xhZGlhQXBpS2V5XCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPT09IFwiZGVlcGdyYW1cIikge1xuICAgICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJEZWVwZ3JhbSBBUEkgS2V5XCIsIFwiZGVlcGdyYW1BcGlLZXlcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQXBpS2V5RmllbGQoXG4gICAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgICBcIkFzc2VtYmx5QUkgQVBJIEtleVwiLFxuICAgICAgICBcImFzc2VtYmx5YWlBcGlLZXlcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPT09IFwiYXNzZW1ibHlhaVwiKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJNb2RlbG9cIilcbiAgICAgICAgLnNldERlc2MoXCJVbml2ZXJzYWwtMyBQcm86IG1cdTAwRTF4aW1hIHByZWNpc2lcdTAwRjNuLCBzcGVha2VyIGRpYXJpemF0aW9uIGF2YW56YWRhLiBVbml2ZXJzYWwtMjogbVx1MDBFMXMgclx1MDBFMXBpZG8geSBlY29uXHUwMEYzbWljby5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cbiAgICAgICAgICBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbihcInVuaXZlcnNhbC0zLXByb1wiLCBcIlVuaXZlcnNhbC0zIFByb1wiKVxuICAgICAgICAgICAgLmFkZE9wdGlvbihcInVuaXZlcnNhbC0yXCIsIFwiVW5pdmVyc2FsLTJcIilcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWwpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHY6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWwgPSB2IGFzXG4gICAgICAgICAgICAgICAgfCBcInVuaXZlcnNhbC0yXCJcbiAgICAgICAgICAgICAgICB8IFwidW5pdmVyc2FsLTMtcHJvXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTaG93IGFsbCBrZXlzIGluIGFuIGFkdmFuY2VkIHNlY3Rpb25cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBbGwgQVBJIEtleXNcIiB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJLZXlzIGFyZSBzdG9yZWQgbG9jYWxseSBpbiB5b3VyIHZhdWx0J3MgcGx1Z2luIGRhdGEuXCIsXG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZEFwaUtleUZpZWxkKGNvbnRhaW5lckVsLCBcIkdsYWRpYVwiLCBcImdsYWRpYUFwaUtleVwiKTtcbiAgICB0aGlzLmFkZEFwaUtleUZpZWxkKGNvbnRhaW5lckVsLCBcIkRlZXBncmFtXCIsIFwiZGVlcGdyYW1BcGlLZXlcIik7XG4gICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJBc3NlbWJseUFJXCIsIFwiYXNzZW1ibHlhaUFwaUtleVwiKTtcblxuICAgIGNvbnN0IExBTkdVQUdFUzogeyB2YWx1ZTogc3RyaW5nOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwiZXNcIiwgbGFiZWw6IFwiRXNwYVx1MDBGMW9sXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiZW5cIiwgbGFiZWw6IFwiRW5nbGlzaFwiIH0sXG4gICAgICB7IHZhbHVlOiBcInB0XCIsIGxhYmVsOiBcIlBvcnR1Z3VcdTAwRUFzXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiZnJcIiwgbGFiZWw6IFwiRnJhblx1MDBFN2Fpc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRlXCIsIGxhYmVsOiBcIkRldXRzY2hcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpdFwiLCBsYWJlbDogXCJJdGFsaWFub1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImphXCIsIGxhYmVsOiBcIlx1NjVFNVx1NjcyQ1x1OEE5RVwiIH0sXG4gICAgICB7IHZhbHVlOiBcInpoXCIsIGxhYmVsOiBcIlx1NEUyRFx1NjU4N1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImFyXCIsIGxhYmVsOiBcIlx1MDYyN1x1MDY0NFx1MDYzOVx1MDYzMVx1MDYyOFx1MDY0QVx1MDYyOVwiIH0sXG4gICAgICB7IHZhbHVlOiBcInJ1XCIsIGxhYmVsOiBcIlx1MDQyMFx1MDQ0M1x1MDQ0MVx1MDQ0MVx1MDQzQVx1MDQzOFx1MDQzOVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImhpXCIsIGxhYmVsOiBcIlx1MDkzOVx1MDkzRlx1MDkyOFx1MDk0RFx1MDkyNlx1MDk0MFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIm5sXCIsIGxhYmVsOiBcIk5lZGVybGFuZHNcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJwbFwiLCBsYWJlbDogXCJQb2xza2lcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJ0clwiLCBsYWJlbDogXCJUXHUwMEZDcmtcdTAwRTdlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwia29cIiwgbGFiZWw6IFwiXHVENTVDXHVBRDZEXHVDNUI0XCIgfSxcbiAgICBdO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIklkaW9tYVwiKVxuICAgICAgLnNldERlc2MoXCJJZGlvbWEgZGVsIGF1ZGlvIGEgdHJhbnNjcmliaXJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZm9yIChjb25zdCB7IHZhbHVlLCBsYWJlbCB9IG9mIExBTkdVQUdFUykge1xuICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbih2YWx1ZSwgbGFiZWwpO1xuICAgICAgICB9XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYW5ndWFnZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHY6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExhbmd1YWdlID0gdjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiV3JhcCBpbiBjYWxsb3V0XCIpXG4gICAgICAuc2V0RGVzYyhcIkluc2VydCB0cmFuc2NyaXB0aW9uIGluc2lkZSBhID5bIXRyYW5zY3JpcHRpb25dIGNhbGxvdXQgYmxvY2tcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluc2VydEFzQ2FsbG91dClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnNlcnRBc0NhbGxvdXQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBcGlLZXlGaWVsZChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBrZXk6IFwiZ2xhZGlhQXBpS2V5XCIgfCBcImRlZXBncmFtQXBpS2V5XCIgfCBcImFzc2VtYmx5YWlBcGlLZXlcIlxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpLnNldE5hbWUobmFtZSkuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciB5b3VyIEFQSSBrZXlcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0pO1xuICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG5cbiAgICAgIGNvbnN0IHRvZ2dsZUJ0biA9IHRleHQuaW5wdXRFbC5wYXJlbnRFbGVtZW50Py5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IFwiU2hvd1wiLFxuICAgICAgICBjbHM6IFwiYXVkaW8tdHJhbnNjcmlwdC10b2dnbGUta2V5XCIsXG4gICAgICB9KTtcbiAgICAgIGlmICh0b2dnbGVCdG4pIHtcbiAgICAgICAgdG9nZ2xlQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNQYXNzd29yZCA9IHRleHQuaW5wdXRFbC50eXBlID09PSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBpc1Bhc3N3b3JkID8gXCJ0ZXh0XCIgOiBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdG9nZ2xlQnRuLnRleHRDb250ZW50ID0gaXNQYXNzd29yZCA/IFwiSGlkZVwiIDogXCJTaG93XCI7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgVXR0ZXJhbmNlIHtcbiAgc3BlYWtlcjogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zY3JpcHRpb25PcHRpb25zIHtcbiAgc3BlYWtlck5hbWVzOiBzdHJpbmdbXTtcbiAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBtb2RlbD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTcGVha2VyTWFwcGluZyB7XG4gIGNvdW50OiBudW1iZXI7XG4gIG5hbWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IHR5cGUgVHJhbnNjcmlwdGlvblByb3ZpZGVyID0gXCJnbGFkaWFcIiB8IFwiZGVlcGdyYW1cIiB8IFwiYXNzZW1ibHlhaVwiO1xuXG5leHBvcnQgY29uc3QgUFJPVklERVJTOiB7IHZhbHVlOiBUcmFuc2NyaXB0aW9uUHJvdmlkZXI7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICB7IHZhbHVlOiBcImdsYWRpYVwiLCBsYWJlbDogXCJHbGFkaWFcIiB9LFxuICB7IHZhbHVlOiBcImRlZXBncmFtXCIsIGxhYmVsOiBcIkRlZXBncmFtXCIgfSxcbiAgeyB2YWx1ZTogXCJhc3NlbWJseWFpXCIsIGxhYmVsOiBcIkFzc2VtYmx5QUlcIiB9LFxuXTtcbiIsICJleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoUmV0cnkoXG4gIGlucHV0OiBSZXF1ZXN0SW5mbyxcbiAgaW5pdDogUmVxdWVzdEluaXQsXG4gIHJldHJpZXMgPSAzXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDw9IHJldHJpZXM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChpbnB1dCwgaW5pdCk7XG4gICAgICBpZiAocmVzLm9rIHx8IChyZXMuc3RhdHVzIDwgNTAwICYmIHJlcy5zdGF0dXMgIT09IDQyOSkpIHJldHVybiByZXM7XG4gICAgICBpZiAoYXR0ZW1wdCA8IHJldHJpZXMpIHtcbiAgICAgICAgYXdhaXQgc2xlZXAoMTAwMCAqIChhdHRlbXB0ICsgMSkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGVyci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgdGhyb3cgZXJyO1xuICAgICAgaWYgKGF0dGVtcHQgPCByZXRyaWVzKSB7XG4gICAgICAgIGF3YWl0IHNsZWVwKDEwMDAgKiAoYXR0ZW1wdCArIDEpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcImZldGNoV2l0aFJldHJ5OiB1bnJlYWNoYWJsZVwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgcmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKSk7XG4gICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICB9KTtcbn1cbiIsICJpbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuLi90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgVXR0ZXJhbmNlLCBUcmFuc2NyaXB0aW9uT3B0aW9ucyB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmV0Y2hXaXRoUmV0cnksIHNsZWVwIH0gZnJvbSBcIi4uL2ZldGNoLXV0aWxzXCI7XG5cbmludGVyZmFjZSBHbGFkaWFFcnJvciB7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgR2xhZGlhVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkdsYWRpYVwiO1xuXG4gIGFzeW5jIHRyYW5zY3JpYmUoXG4gICAgYXVkaW9CbG9iOiBCbG9iLFxuICAgIGFwaUtleTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFRyYW5zY3JpcHRpb25PcHRpb25zXG4gICk6IFByb21pc2U8VXR0ZXJhbmNlW10+IHtcbiAgICBjb25zdCBiYXNlVXJsID0gXCJodHRwczovL2FwaS5nbGFkaWEuaW8vdjJcIjtcbiAgICBjb25zdCBzaWduYWwgPSBvcHRpb25zLnNpZ25hbDtcblxuICAgIGNvbnN0IGF1ZGlvVXJsID0gYXdhaXQgdGhpcy51cGxvYWQoYXVkaW9CbG9iLCBhcGlLZXksIGJhc2VVcmwsIHNpZ25hbCk7XG5cbiAgICBjb25zdCByZXN1bHRVcmwgPSBhd2FpdCB0aGlzLnJlcXVlc3RUcmFuc2NyaXB0aW9uKFxuICAgICAgYXVkaW9VcmwsXG4gICAgICBhcGlLZXksXG4gICAgICBiYXNlVXJsLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wb2xsUmVzdWx0KHJlc3VsdFVybCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB1cGxvYWQoXG4gICAgYmxvYjogQmxvYixcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmb3JtID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybS5hcHBlbmQoXCJhdWRpb1wiLCBibG9iKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke2Jhc2VVcmx9L3VwbG9hZGAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSB9LFxuICAgICAgYm9keTogZm9ybSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcblxuICAgIGlmICghcmVzLm9rKSB7XG4gICAgICBjb25zdCBlcnIgPSAoYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKSkgYXMgR2xhZGlhRXJyb3IgfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgR2xhZGlhIHVwbG9hZCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8ubWVzc2FnZSA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBhdWRpb191cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLmF1ZGlvX3VybDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdFRyYW5zY3JpcHRpb24oXG4gICAgYXVkaW9Vcmw6IHN0cmluZyxcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBkaWFyaXphdGlvbjogdHJ1ZSxcbiAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuZGlhcml6YXRpb25fY29uZmlnID0ge1xuICAgICAgICBudW1iZXJfb2Zfc3BlYWtlcnM6IG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0vdHJhbnNjcmlwdGlvbmAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgICBzaWduYWw6IG9wdGlvbnMuc2lnbmFsLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnN0IGVyciA9IChhd2FpdCByZXMuanNvbigpLmNhdGNoKCgpID0+IG51bGwpKSBhcyBHbGFkaWFFcnJvciB8IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBHbGFkaWEgdHJhbnNjcmlwdGlvbiByZXF1ZXN0IGZhaWxlZCAoJHtyZXMuc3RhdHVzfSk6ICR7ZXJyPy5tZXNzYWdlID8/IFwidW5rbm93blwifWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyB7IGlkOiBzdHJpbmc7IHJlc3VsdF91cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLnJlc3VsdF91cmw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvbGxSZXN1bHQoXG4gICAgcmVzdWx0VXJsOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShyZXN1bHRVcmwsIHtcbiAgICAgICAgaGVhZGVyczogeyBcIngtZ2xhZGlhLWtleVwiOiBhcGlLZXkgfSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2xhZGlhIHBvbGxpbmcgZmFpbGVkICgke3Jlcy5zdGF0dXN9KWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHtcbiAgICAgICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgICAgIHJlc3VsdD86IHtcbiAgICAgICAgICB0cmFuc2NyaXB0aW9uPzoge1xuICAgICAgICAgICAgdXR0ZXJhbmNlcz86IEFycmF5PHtcbiAgICAgICAgICAgICAgc3BlYWtlcjogbnVtYmVyO1xuICAgICAgICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgICAgICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgICAgICAgICAgIGVuZDogbnVtYmVyO1xuICAgICAgICAgICAgfT47XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJkb25lXCIpIHtcbiAgICAgICAgY29uc3QgdXR0ZXJhbmNlcyA9IGRhdGEucmVzdWx0Py50cmFuc2NyaXB0aW9uPy51dHRlcmFuY2VzID8/IFtdO1xuICAgICAgICByZXR1cm4gdXR0ZXJhbmNlcy5tYXAoKHUpID0+ICh7XG4gICAgICAgICAgc3BlYWtlcjogdS5zcGVha2VyLFxuICAgICAgICAgIHRleHQ6IHUudGV4dC50cmltKCksXG4gICAgICAgICAgc3RhcnQ6IHUuc3RhcnQsXG4gICAgICAgICAgZW5kOiB1LmVuZCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbGFkaWEgdHJhbnNjcmlwdGlvbiBmYWlsZWRcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMDAsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiR2xhZGlhIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIERlZXBncmFtVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkRlZXBncmFtXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoe1xuICAgICAgZGlhcml6ZTogXCJ0cnVlXCIsXG4gICAgICBzbWFydF9mb3JtYXQ6IFwidHJ1ZVwiLFxuICAgICAgdXR0ZXJhbmNlczogXCJ0cnVlXCIsXG4gICAgfSk7XG5cbiAgICBpZiAob3B0aW9ucy5sYW5ndWFnZSkge1xuICAgICAgcGFyYW1zLnNldChcImxhbmd1YWdlXCIsIG9wdGlvbnMubGFuZ3VhZ2UpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMuc2V0KFwiZGlhcml6ZV92ZXJzaW9uXCIsIFwiMjAyNC0wMS0yNlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZGVlcGdyYW0uY29tL3YxL2xpc3Rlbj8ke3BhcmFtcy50b1N0cmluZygpfWA7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IGBUb2tlbiAke2FwaUtleX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBhdWRpb0Jsb2IudHlwZSB8fCBcImF1ZGlvL3dhdlwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IGF1ZGlvQmxvYixcbiAgICAgIHNpZ25hbDogb3B0aW9ucy5zaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlcy5vaykge1xuICAgICAgY29uc3QgZXJyID0gKGF3YWl0IHJlcy5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIHtcbiAgICAgICAgZXJyX21zZz86IHN0cmluZztcbiAgICAgIH0gfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRGVlcGdyYW0gcmVxdWVzdCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8uZXJyX21zZyA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgRGVlcGdyYW1SZXNwb25zZTtcbiAgICBjb25zdCByYXcgPSBkYXRhLnJlc3VsdHM/LnV0dGVyYW5jZXM7XG5cbiAgICBpZiAoIXJhdyB8fCByYXcubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiRGVlcGdyYW0gcmV0dXJuZWQgbm8gZGlhcml6ZWQgdXR0ZXJhbmNlcy4gVGhlIGF1ZGlvIG1heSBoYXZlIG9ubHkgb25lIHNwZWFrZXIgb3IgZGlhcml6YXRpb24gaXMgbm90IGF2YWlsYWJsZS5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmF3Lm1hcCgodSkgPT4gKHtcbiAgICAgIHNwZWFrZXI6ICh1LnNwZWFrZXIgPz8gMCkgKyAxLCAvLyBEZWVwZ3JhbSB1c2VzIDAtYmFzZWQgc3BlYWtlcnNcbiAgICAgIHRleHQ6IHUudHJhbnNjcmlwdD8udHJpbSgpID8/IFwiXCIsXG4gICAgICBzdGFydDogdS5zdGFydCA/PyAwLFxuICAgICAgZW5kOiB1LmVuZCA/PyAwLFxuICAgIH0pKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1VdHRlcmFuY2Uge1xuICBzcGVha2VyPzogbnVtYmVyO1xuICB0cmFuc2NyaXB0Pzogc3RyaW5nO1xuICBzdGFydD86IG51bWJlcjtcbiAgZW5kPzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1SZXNwb25zZSB7XG4gIHJlc3VsdHM/OiB7XG4gICAgdXR0ZXJhbmNlcz86IERlZXBncmFtVXR0ZXJhbmNlW107XG4gIH07XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGZldGNoV2l0aFJldHJ5LCBzbGVlcCB9IGZyb20gXCIuLi9mZXRjaC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgQXNzZW1ibHlBSVRyYW5zY3JpYmVyIGltcGxlbWVudHMgVHJhbnNjcmliZXIge1xuICByZWFkb25seSBuYW1lID0gXCJBc3NlbWJseUFJXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsO1xuICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICBhdXRob3JpemF0aW9uOiBhcGlLZXksXG4gICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9O1xuXG4gICAgLy8gMS4gVXBsb2FkIGF1ZGlvXG4gICAgY29uc3QgdXBsb2FkUmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2FwaS5hc3NlbWJseWFpLmNvbS92Mi91cGxvYWRcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHsgYXV0aG9yaXphdGlvbjogYXBpS2V5IH0sXG4gICAgICBib2R5OiBhdWRpb0Jsb2IsXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXVwbG9hZFJlcy5vaykge1xuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHVwbG9hZFJlcy50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBBc3NlbWJseUFJIHVwbG9hZCBmYWlsZWQgKCR7dXBsb2FkUmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdXBsb2FkX3VybDogYXVkaW9VcmwgfSA9IChhd2FpdCB1cGxvYWRSZXMuanNvbigpKSBhcyB7XG4gICAgICB1cGxvYWRfdXJsOiBzdHJpbmc7XG4gICAgfTtcblxuICAgIC8vIDIuIFN0YXJ0IHRyYW5zY3JpcHRpb25cbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBzcGVlY2hfbW9kZWxzOiBbb3B0aW9ucy5tb2RlbCB8fCBcInVuaXZlcnNhbC0yXCJdLFxuICAgICAgc3BlYWtlcl9sYWJlbHM6IHRydWUsXG4gICAgICBsYW5ndWFnZV9jb2RlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuc3BlYWtlcnNfZXhwZWN0ZWQgPSBvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhcnRSZXMgPSBhd2FpdCBmZXRjaChcbiAgICAgIFwiaHR0cHM6Ly9hcGkuYXNzZW1ibHlhaS5jb20vdjIvdHJhbnNjcmlwdFwiLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXN0YXJ0UmVzLm9rKSB7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgc3RhcnRSZXMudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQXNzZW1ibHlBSSB0cmFuc2NyaXB0aW9uIHJlcXVlc3QgZmFpbGVkICgke3N0YXJ0UmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgaWQgfSA9IChhd2FpdCBzdGFydFJlcy5qc29uKCkpIGFzIHsgaWQ6IHN0cmluZyB9O1xuXG4gICAgLy8gMy4gUG9sbCB1bnRpbCBkb25lXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9sbChpZCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb2xsKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShcbiAgICAgICAgYGh0dHBzOi8vYXBpLmFzc2VtYmx5YWkuY29tL3YyL3RyYW5zY3JpcHQvJHtpZH1gLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogeyBhdXRob3JpemF0aW9uOiBhcGlLZXkgfSxcbiAgICAgICAgICBzaWduYWwsXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZW1ibHlBSSBwb2xsaW5nIGZhaWxlZCAoJHtyZXMuc3RhdHVzfSlgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyBBc3NlbWJseUFJUmVzcG9uc2U7XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgICByZXR1cm4gKGRhdGEudXR0ZXJhbmNlcyA/PyBbXSkubWFwKCh1KSA9PiAoe1xuICAgICAgICAgIHNwZWFrZXI6IHRoaXMuc3BlYWtlckxhYmVsVG9OdW1iZXIodS5zcGVha2VyKSxcbiAgICAgICAgICB0ZXh0OiB1LnRleHQudHJpbSgpLFxuICAgICAgICAgIHN0YXJ0OiB1LnN0YXJ0IC8gMTAwMCxcbiAgICAgICAgICBlbmQ6IHUuZW5kIC8gMTAwMCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEFzc2VtYmx5QUkgdHJhbnNjcmlwdGlvbiBlcnJvcjogJHtkYXRhLmVycm9yID8/IFwidW5rbm93blwifWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2xlZXAoMTAwMCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlbWJseUFJIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzcGVha2VyTGFiZWxUb051bWJlcihsYWJlbDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbGFiZWwudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApIC0gNjQ7XG4gIH1cbn1cblxuaW50ZXJmYWNlIEFzc2VtYmx5QUlVdHRlcmFuY2Uge1xuICBzcGVha2VyOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhcnQ6IG51bWJlcjsgLy8gbXNcbiAgZW5kOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBBc3NlbWJseUFJUmVzcG9uc2Uge1xuICBzdGF0dXM6IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIHV0dGVyYW5jZXM/OiBBc3NlbWJseUFJVXR0ZXJhbmNlW107XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3BlYWtlck1hcHBpbmcgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgU3BlYWtlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICByZXNvbHZlOiAoKHZhbHVlOiBTcGVha2VyTWFwcGluZyB8IG51bGwpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbmFtZUZpZWxkczogSFRNTElucHV0RWxlbWVudFtdID0gW107XG4gIHByaXZhdGUgbmFtZXNDb250YWluZXI6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgb3BlbigpOiBQcm9taXNlPFNwZWFrZXJNYXBwaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3BlYWtlciBDb25maWd1cmF0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIk51bWJlciBvZiBzcGVha2Vyc1wiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjJcIik7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5pbnB1dEVsLm1pbiA9IFwiMVwiO1xuICAgICAgICB0ZXh0LmlucHV0RWwubWF4ID0gXCIxMFwiO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFwiMlwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZSgodmFsdWUpID0+IHRoaXMucmVuZGVyTmFtZUZpZWxkcyhOdW1iZXIodmFsdWUpIHx8IDIpKTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5uYW1lc0NvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXG4gICAgICBcImF1ZGlvLXRyYW5zY3JpcHQtc3BlYWtlci1uYW1lc1wiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbCkuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJTdGFydCBUcmFuc2NyaXB0aW9uXCIpXG4gICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLnN1Ym1pdCgpKVxuICAgICk7XG5cbiAgICB0aGlzLnJlbmRlck5hbWVGaWVsZHMoMik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck5hbWVGaWVsZHMoY291bnQ6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5uYW1lc0NvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMubmFtZXNDb250YWluZXIuZW1wdHkoKTtcbiAgICB0aGlzLm5hbWVGaWVsZHMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgcm93ID0gdGhpcy5uYW1lc0NvbnRhaW5lci5jcmVhdGVEaXYoXG4gICAgICAgICAgXCJhdWRpby10cmFuc2NyaXB0LXNwZWFrZXItcm93XCJcbiAgICAgICk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGBTcGVha2VyICR7aSArIDF9YCB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IGBOYW1lIGZvciBzcGVha2VyICR7aSArIDF9YCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5uYW1lRmllbGRzLnB1c2goaW5wdXQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3VibWl0KCkge1xuICAgIGNvbnN0IG5hbWVzID0gdGhpcy5uYW1lRmllbGRzLm1hcChcbiAgICAgIChmLCBpKSA9PiBmLnZhbHVlLnRyaW0oKSB8fCBgU3BlYWtlciAke2kgKyAxfWBcbiAgICApO1xuICAgIHRoaXMucmVzb2x2ZT8uKHsgY291bnQ6IG5hbWVzLmxlbmd0aCwgbmFtZXMgfSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5yZXNvbHZlKSB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLnJlc29sdmUgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIENob2ljZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmU6ICgoY2hvaWNlOiBcInJlY29yZFwiIHwgXCJmaWxlXCIgfCBudWxsKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIG9wZW4oKTogUHJvbWlzZTxcInJlY29yZFwiIHwgXCJmaWxlXCIgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgc3VwZXIub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTAwQkZRdVx1MDBFOSBxdWVyXHUwMEU5cyBoYWNlcj9cIiB9KTtcblxuICAgIGNvbnN0IGJ0bkNvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgYXR0cjogeyBzdHlsZTogXCJkaXNwbGF5OiBmbGV4OyBnYXA6IDEycHg7IG1hcmdpbi10b3A6IDE2cHg7XCIgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlY29yZEJ0biA9IGJ0bkNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICB0ZXh0OiBcIlx1RDgzQ1x1REY5OVx1RkUwRiBHcmFiYXIgYXVkaW9cIixcbiAgICAgIGNsczogXCJtb2QtY3RhXCIsXG4gICAgfSk7XG4gICAgcmVjb3JkQnRuLnN0eWxlLmZsZXggPSBcIjFcIjtcbiAgICByZWNvcmRCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZT8uKFwicmVjb3JkXCIpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH07XG5cbiAgICBjb25zdCBmaWxlQnRuID0gYnRuQ29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiXHVEODNEXHVEQ0MxIEVsZWdpciBhcmNoaXZvXCIsXG4gICAgfSk7XG4gICAgZmlsZUJ0bi5zdHlsZS5mbGV4ID0gXCIxXCI7XG4gICAgZmlsZUJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlPy4oXCJmaWxlXCIpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH07XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKHRoaXMucmVzb2x2ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKG51bGwpO1xuICAgICAgdGhpcy5yZXNvbHZlID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgTm90aWNlLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWNvcmRpbmdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBjaHVua3M6IEJsb2JbXSA9IFtdO1xuICBwcml2YXRlIG1lZGlhUmVjb3JkZXI6IE1lZGlhUmVjb3JkZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdHJlYW06IE1lZGlhU3RyZWFtIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2Vjb25kcyA9IDA7XG4gIHByaXZhdGUgdGltZXJJbnRlcnZhbDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZXJFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdGF0dXNFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXNvbHZlOiAoKGJsb2I6IEJsb2IgfCBudWxsKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIHN0YXJ0KCk6IFByb21pc2U8QmxvYiB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoe1xuICAgICAgICAgIGF1ZGlvOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBuZXcgTm90aWNlKFwiTm8gc2UgcHVkbyBhY2NlZGVyIGFsIG1pY3JcdTAwRjNmb25vLiBWZXJpZmljXHUwMEUxIGxvcyBwZXJtaXNvcy5cIik7XG4gICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWltZVR5cGUgPSBNZWRpYVJlY29yZGVyLmlzVHlwZVN1cHBvcnRlZChcImF1ZGlvL3dlYm07Y29kZWNzPW9wdXNcIilcbiAgICAgICAgPyBcImF1ZGlvL3dlYm07Y29kZWNzPW9wdXNcIlxuICAgICAgICA6IE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKFwiYXVkaW8vd2VibVwiKVxuICAgICAgICA/IFwiYXVkaW8vd2VibVwiXG4gICAgICAgIDogTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoXCJhdWRpby9tcDRcIilcbiAgICAgICAgPyBcImF1ZGlvL21wNFwiXG4gICAgICAgIDogTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoXCJhdWRpby9hYWNcIilcbiAgICAgICAgPyBcImF1ZGlvL2FhY1wiXG4gICAgICAgIDogXCJhdWRpby9vZ2c7Y29kZWNzPW9wdXNcIjtcblxuICAgICAgdGhpcy5tZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIodGhpcy5zdHJlYW0sIHsgbWltZVR5cGUgfSk7XG4gICAgICB0aGlzLmNodW5rcyA9IFtdO1xuXG4gICAgICB0aGlzLm1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGUpID0+IHtcbiAgICAgICAgaWYgKGUuZGF0YS5zaXplID4gMCkgdGhpcy5jaHVua3MucHVzaChlLmRhdGEpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5tZWRpYVJlY29yZGVyLm9uc3RvcCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYih0aGlzLmNodW5rcywgeyB0eXBlOiBtaW1lVHlwZSB9KTtcbiAgICAgICAgdGhpcy5yZXNvbHZlPy4oYmxvYik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICAgIHRoaXMuc3RhcnRUaW1lcigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJHcmFiYW5kby4uLlwiIH0pO1xuXG4gICAgdGhpcy5zdGF0dXNFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcImF1ZGlvLXRyYW5zY3JpcHQtc3RhdHVzIGxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiXHUyNUNGIEdyYWJhbmRvXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLnRpbWVyRWwgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiMDA6MDBcIixcbiAgICAgIGF0dHI6IHsgc3R5bGU6IFwiZm9udC1zaXplOiAyZW07IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luOiAxNnB4IDA7XCIgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbCkuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEZXRlbmVyIGdyYWJhY2lcdTAwRjNuXCIpXG4gICAgICAgIC5zZXRXYXJuaW5nKClcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5zdG9wUmVjb3JkaW5nKCkpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnRUaW1lcigpIHtcbiAgICB0aGlzLnNlY29uZHMgPSAwO1xuICAgIHRoaXMudGltZXJJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMuc2Vjb25kcysrO1xuICAgICAgaWYgKHRoaXMudGltZXJFbCkge1xuICAgICAgICBjb25zdCBtID0gTWF0aC5mbG9vcih0aGlzLnNlY29uZHMgLyA2MCk7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLnNlY29uZHMgJSA2MDtcbiAgICAgICAgdGhpcy50aW1lckVsLnRleHRDb250ZW50ID1cbiAgICAgICAgICBgJHttLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpfToke3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCBcIjBcIil9YDtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcFJlY29yZGluZygpIHtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXI/LnN0b3AoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cCgpIHtcbiAgICBpZiAodGhpcy50aW1lckludGVydmFsKSBjbGVhckludGVydmFsKHRoaXMudGltZXJJbnRlcnZhbCk7XG4gICAgdGhpcy5zdHJlYW0/LmdldFRyYWNrcygpLmZvckVhY2goKHQpID0+IHQuc3RvcCgpKTtcbiAgICB0aGlzLnN0cmVhbSA9IG51bGw7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyID0gbnVsbDtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5yZXNvbHZlKSB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLnJlc29sdmUgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXVFOzs7QUNBdkUsc0JBQStDOzs7QUNxQnhDLElBQU0sWUFBK0Q7QUFBQSxFQUMxRSxFQUFFLE9BQU8sVUFBVSxPQUFPLFNBQVM7QUFBQSxFQUNuQyxFQUFFLE9BQU8sWUFBWSxPQUFPLFdBQVc7QUFBQSxFQUN2QyxFQUFFLE9BQU8sY0FBYyxPQUFPLGFBQWE7QUFDN0M7OztBRFhPLElBQU0sbUJBQW1DO0FBQUEsRUFDOUMsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQUEsRUFDaEIsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQ25CO0FBRU8sSUFBTSxjQUFOLGNBQTBCLGlDQUFpQjtBQUFBLEVBR2hELFlBQVksS0FBVSxRQUFnQztBQUNwRCxVQUFNLEtBQUssTUFBTTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxVQUFNLEVBQUUsWUFBWSxJQUFJO0FBQ3hCLGdCQUFZLE1BQU07QUFFbEIsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUV2RCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxVQUFVLEVBQ2xCLFFBQVEsZ0NBQWdDLEVBQ3hDLFlBQVksQ0FBQyxhQUFhO0FBQ3pCLGlCQUFXLEVBQUUsT0FBTyxNQUFNLEtBQUssV0FBVztBQUN4QyxpQkFBUyxVQUFVLE9BQU8sS0FBSztBQUFBLE1BQ2pDO0FBQ0EsZUFDRyxTQUFTLEtBQUssT0FBTyxTQUFTLFFBQVEsRUFDdEMsU0FBUyxPQUFPLE1BQWM7QUFDN0IsYUFBSyxPQUFPLFNBQVMsV0FBVztBQUNoQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0wsQ0FBQztBQUdILFFBQUksS0FBSyxPQUFPLFNBQVMsYUFBYSxVQUFVO0FBQzlDLFdBQUssZUFBZSxhQUFhLGtCQUFrQixjQUFjO0FBQUEsSUFDbkUsV0FBVyxLQUFLLE9BQU8sU0FBUyxhQUFhLFlBQVk7QUFDdkQsV0FBSyxlQUFlLGFBQWEsb0JBQW9CLGdCQUFnQjtBQUFBLElBQ3ZFLE9BQU87QUFDTCxXQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssT0FBTyxTQUFTLGFBQWEsY0FBYztBQUNsRCxVQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxRQUFRLEVBQ2hCLFFBQVEsc0hBQXVHLEVBQy9HO0FBQUEsUUFBWSxDQUFDLGFBQ1osU0FDRyxVQUFVLG1CQUFtQixpQkFBaUIsRUFDOUMsVUFBVSxlQUFlLGFBQWEsRUFDdEMsU0FBUyxLQUFLLE9BQU8sU0FBUyxlQUFlLEVBQzdDLFNBQVMsT0FBTyxNQUFjO0FBQzdCLGVBQUssT0FBTyxTQUFTLGtCQUFrQjtBQUd2QyxnQkFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLFFBQ2pDLENBQUM7QUFBQSxNQUNMO0FBQUEsSUFDSjtBQUdBLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELGdCQUFZLFNBQVMsS0FBSztBQUFBLE1BQ3hCLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxTQUFLLGVBQWUsYUFBYSxVQUFVLGNBQWM7QUFDekQsU0FBSyxlQUFlLGFBQWEsWUFBWSxnQkFBZ0I7QUFDN0QsU0FBSyxlQUFlLGFBQWEsY0FBYyxrQkFBa0I7QUFFakUsVUFBTSxZQUFnRDtBQUFBLE1BQ3BELEVBQUUsT0FBTyxNQUFNLE9BQU8sYUFBVTtBQUFBLE1BQ2hDLEVBQUUsT0FBTyxNQUFNLE9BQU8sVUFBVTtBQUFBLE1BQ2hDLEVBQUUsT0FBTyxNQUFNLE9BQU8sZUFBWTtBQUFBLE1BQ2xDLEVBQUUsT0FBTyxNQUFNLE9BQU8sY0FBVztBQUFBLE1BQ2pDLEVBQUUsT0FBTyxNQUFNLE9BQU8sVUFBVTtBQUFBLE1BQ2hDLEVBQUUsT0FBTyxNQUFNLE9BQU8sV0FBVztBQUFBLE1BQ2pDLEVBQUUsT0FBTyxNQUFNLE9BQU8scUJBQU07QUFBQSxNQUM1QixFQUFFLE9BQU8sTUFBTSxPQUFPLGVBQUs7QUFBQSxNQUMzQixFQUFFLE9BQU8sTUFBTSxPQUFPLDZDQUFVO0FBQUEsTUFDaEMsRUFBRSxPQUFPLE1BQU0sT0FBTyw2Q0FBVTtBQUFBLE1BQ2hDLEVBQUUsT0FBTyxNQUFNLE9BQU8sdUNBQVM7QUFBQSxNQUMvQixFQUFFLE9BQU8sTUFBTSxPQUFPLGFBQWE7QUFBQSxNQUNuQyxFQUFFLE9BQU8sTUFBTSxPQUFPLFNBQVM7QUFBQSxNQUMvQixFQUFFLE9BQU8sTUFBTSxPQUFPLGVBQVM7QUFBQSxNQUMvQixFQUFFLE9BQU8sTUFBTSxPQUFPLHFCQUFNO0FBQUEsSUFDOUI7QUFFQSxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxRQUFRLEVBQ2hCLFFBQVEsZ0NBQWdDLEVBQ3hDLFlBQVksQ0FBQyxhQUFhO0FBQ3pCLGlCQUFXLEVBQUUsT0FBTyxNQUFNLEtBQUssV0FBVztBQUN4QyxpQkFBUyxVQUFVLE9BQU8sS0FBSztBQUFBLE1BQ2pDO0FBQ0EsZUFDRyxTQUFTLEtBQUssT0FBTyxTQUFTLGVBQWUsRUFDN0MsU0FBUyxPQUFPLE1BQWM7QUFDN0IsYUFBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQ3ZDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDTCxDQUFDO0FBRUgsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsaUJBQWlCLEVBQ3pCLFFBQVEsK0RBQStELEVBQ3ZFO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FDRyxTQUFTLEtBQUssT0FBTyxTQUFTLGVBQWUsRUFDN0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQ3ZDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0o7QUFBQSxFQUVRLGVBQ04sV0FDQSxNQUNBLEtBQ007QUFDTixRQUFJLHdCQUFRLFNBQVMsRUFBRSxRQUFRLElBQUksRUFBRSxRQUFRLENBQUMsU0FBUztBQW5KM0Q7QUFvSk0sV0FDRyxlQUFlLG9CQUFvQixFQUNuQyxTQUFTLEtBQUssT0FBTyxTQUFTLEdBQUcsQ0FBQztBQUNyQyxXQUFLLFFBQVEsT0FBTztBQUVwQixZQUFNLGFBQVksVUFBSyxRQUFRLGtCQUFiLG1CQUE0QixTQUFTLFVBQVU7QUFBQSxRQUMvRCxNQUFNO0FBQUEsUUFDTixLQUFLO0FBQUEsTUFDUDtBQUNBLFVBQUksV0FBVztBQUNiLGtCQUFVLFVBQVUsTUFBTTtBQUN4QixnQkFBTSxhQUFhLEtBQUssUUFBUSxTQUFTO0FBQ3pDLGVBQUssUUFBUSxPQUFPLGFBQWEsU0FBUztBQUMxQyxvQkFBVSxjQUFjLGFBQWEsU0FBUztBQUFBLFFBQ2hEO0FBQUEsTUFDRjtBQUVBLFdBQUssU0FBUyxPQUFPLFVBQVU7QUFDN0IsYUFBSyxPQUFPLFNBQVMsR0FBRyxJQUFJO0FBQzVCLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBQUEsRUFDSDtBQUNGOzs7QUUzS0EsZUFBc0IsZUFDcEIsT0FDQSxNQUNBLFVBQVUsR0FDUztBQUNuQixXQUFTLFVBQVUsR0FBRyxXQUFXLFNBQVMsV0FBVztBQUNuRCxRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxPQUFPLElBQUk7QUFDbkMsVUFBSSxJQUFJLE1BQU8sSUFBSSxTQUFTLE9BQU8sSUFBSSxXQUFXLElBQU0sUUFBTztBQUMvRCxVQUFJLFVBQVUsU0FBUztBQUNyQixjQUFNLE1BQU0sT0FBUSxVQUFVLEVBQUU7QUFDaEM7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1QsU0FBUyxLQUFLO0FBQ1osVUFBSSxlQUFlLGdCQUFnQixJQUFJLFNBQVMsYUFBYyxPQUFNO0FBQ3BFLFVBQUksVUFBVSxTQUFTO0FBQ3JCLGNBQU0sTUFBTSxPQUFRLFVBQVUsRUFBRTtBQUNoQztBQUFBLE1BQ0Y7QUFDQSxZQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLElBQUksTUFBTSw2QkFBNkI7QUFDL0M7QUFFTyxTQUFTLE1BQU0sSUFBWSxRQUFxQztBQUNyRSxTQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUN0QyxVQUFNLFFBQVEsV0FBVyxTQUFTLEVBQUU7QUFDcEMscUNBQVEsaUJBQWlCLFNBQVMsTUFBTTtBQUN0QyxtQkFBYSxLQUFLO0FBQ2xCLGFBQU8sSUFBSSxhQUFhLFdBQVcsWUFBWSxDQUFDO0FBQUEsSUFDbEQsR0FBRyxFQUFFLE1BQU0sS0FBSztBQUFBLEVBQ2xCLENBQUM7QUFDSDs7O0FDekJPLElBQU0sb0JBQU4sTUFBK0M7QUFBQSxFQUEvQztBQUNMLFNBQVMsT0FBTztBQUFBO0FBQUEsRUFFaEIsTUFBTSxXQUNKLFdBQ0EsUUFDQSxTQUNzQjtBQUN0QixVQUFNLFVBQVU7QUFDaEIsVUFBTSxTQUFTLFFBQVE7QUFFdkIsVUFBTSxXQUFXLE1BQU0sS0FBSyxPQUFPLFdBQVcsUUFBUSxTQUFTLE1BQU07QUFFckUsVUFBTSxZQUFZLE1BQU0sS0FBSztBQUFBLE1BQzNCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFdBQU8sTUFBTSxLQUFLLFdBQVcsV0FBVyxRQUFRLE1BQU07QUFBQSxFQUN4RDtBQUFBLEVBRUEsTUFBYyxPQUNaLE1BQ0EsUUFDQSxTQUNBLFFBQ2lCO0FBckNyQjtBQXNDSSxVQUFNLE9BQU8sSUFBSSxTQUFTO0FBQzFCLFNBQUssT0FBTyxTQUFTLElBQUk7QUFFekIsVUFBTSxNQUFNLE1BQU0sTUFBTSxHQUFHLE9BQU8sV0FBVztBQUFBLE1BQzNDLFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxnQkFBZ0IsT0FBTztBQUFBLE1BQ2xDLE1BQU07QUFBQSxNQUNOO0FBQUEsSUFDRixDQUFDO0FBRUQsUUFBSSxDQUFDLElBQUksSUFBSTtBQUNYLFlBQU0sTUFBTyxNQUFNLElBQUksS0FBSyxFQUFFLE1BQU0sTUFBTSxJQUFJO0FBQzlDLFlBQU0sSUFBSTtBQUFBLFFBQ1IseUJBQXlCLElBQUksTUFBTSxPQUFNLGdDQUFLLFlBQUwsWUFBZ0IsU0FBUztBQUFBLE1BQ3BFO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxNQUFjLHFCQUNaLFVBQ0EsUUFDQSxTQUNBLFNBQ2lCO0FBaEVyQjtBQWlFSSxVQUFNLE9BQWdDO0FBQUEsTUFDcEMsV0FBVztBQUFBLE1BQ1gsYUFBYTtBQUFBLE1BQ2IsVUFBVSxRQUFRLFlBQVk7QUFBQSxJQUNoQztBQUVBLFFBQUksUUFBUSxhQUFhLFNBQVMsR0FBRztBQUNuQyxXQUFLLHFCQUFxQjtBQUFBLFFBQ3hCLG9CQUFvQixRQUFRLGFBQWE7QUFBQSxNQUMzQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsT0FBTyxrQkFBa0I7QUFBQSxNQUNsRCxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLE1BQ0EsTUFBTSxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQ3pCLFFBQVEsUUFBUTtBQUFBLElBQ2xCLENBQUM7QUFFRCxRQUFJLENBQUMsSUFBSSxJQUFJO0FBQ1gsWUFBTSxNQUFPLE1BQU0sSUFBSSxLQUFLLEVBQUUsTUFBTSxNQUFNLElBQUk7QUFDOUMsWUFBTSxJQUFJO0FBQUEsUUFDUix3Q0FBd0MsSUFBSSxNQUFNLE9BQU0sZ0NBQUssWUFBTCxZQUFnQixTQUFTO0FBQUEsTUFDbkY7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFRLE1BQU0sSUFBSSxLQUFLO0FBQzdCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVBLE1BQWMsV0FDWixXQUNBLFFBQ0EsUUFDc0I7QUF0RzFCO0FBdUdJLFVBQU0sY0FBYztBQUNwQixhQUFTLElBQUksR0FBRyxJQUFJLGFBQWEsS0FBSztBQUNwQyxVQUFJLGlDQUFRLFFBQVMsT0FBTSxJQUFJLGFBQWEsV0FBVyxZQUFZO0FBRW5FLFlBQU0sTUFBTSxNQUFNLGVBQWUsV0FBVztBQUFBLFFBQzFDLFNBQVMsRUFBRSxnQkFBZ0IsT0FBTztBQUFBLFFBQ2xDO0FBQUEsTUFDRixDQUFDO0FBRUQsVUFBSSxDQUFDLElBQUksSUFBSTtBQUNYLGNBQU0sSUFBSSxNQUFNLDBCQUEwQixJQUFJLE1BQU0sR0FBRztBQUFBLE1BQ3pEO0FBRUEsWUFBTSxPQUFRLE1BQU0sSUFBSSxLQUFLO0FBYzdCLFVBQUksS0FBSyxXQUFXLFFBQVE7QUFDMUIsY0FBTSxjQUFhLHNCQUFLLFdBQUwsbUJBQWEsa0JBQWIsbUJBQTRCLGVBQTVCLFlBQTBDLENBQUM7QUFDOUQsZUFBTyxXQUFXLElBQUksQ0FBQyxPQUFPO0FBQUEsVUFDNUIsU0FBUyxFQUFFO0FBQUEsVUFDWCxNQUFNLEVBQUUsS0FBSyxLQUFLO0FBQUEsVUFDbEIsT0FBTyxFQUFFO0FBQUEsVUFDVCxLQUFLLEVBQUU7QUFBQSxRQUNULEVBQUU7QUFBQSxNQUNKO0FBRUEsVUFBSSxLQUFLLFdBQVcsU0FBUztBQUMzQixjQUFNLElBQUksTUFBTSw2QkFBNkI7QUFBQSxNQUMvQztBQUVBLFlBQU0sTUFBTSxLQUFNLE1BQU07QUFBQSxJQUMxQjtBQUVBLFVBQU0sSUFBSSxNQUFNLGdDQUFnQztBQUFBLEVBQ2xEO0FBQ0Y7OztBQ2xKTyxJQUFNLHNCQUFOLE1BQWlEO0FBQUEsRUFBakQ7QUFDTCxTQUFTLE9BQU87QUFBQTtBQUFBLEVBRWhCLE1BQU0sV0FDSixXQUNBLFFBQ0EsU0FDc0I7QUFWMUI7QUFXSSxVQUFNLFNBQVMsSUFBSSxnQkFBZ0I7QUFBQSxNQUNqQyxTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsTUFDZCxZQUFZO0FBQUEsSUFDZCxDQUFDO0FBRUQsUUFBSSxRQUFRLFVBQVU7QUFDcEIsYUFBTyxJQUFJLFlBQVksUUFBUSxRQUFRO0FBQUEsSUFDekM7QUFFQSxRQUFJLFFBQVEsYUFBYSxTQUFTLEdBQUc7QUFDbkMsYUFBTyxJQUFJLG1CQUFtQixZQUFZO0FBQUEsSUFDNUM7QUFFQSxVQUFNLE1BQU0sc0NBQXNDLE9BQU8sU0FBUyxDQUFDO0FBRW5FLFVBQU0sTUFBTSxNQUFNLE1BQU0sS0FBSztBQUFBLE1BQzNCLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGVBQWUsU0FBUyxNQUFNO0FBQUEsUUFDOUIsZ0JBQWdCLFVBQVUsUUFBUTtBQUFBLE1BQ3BDO0FBQUEsTUFDQSxNQUFNO0FBQUEsTUFDTixRQUFRLFFBQVE7QUFBQSxJQUNsQixDQUFDO0FBRUQsUUFBSSxDQUFDLElBQUksSUFBSTtBQUNYLFlBQU0sTUFBTyxNQUFNLElBQUksS0FBSyxFQUFFLE1BQU0sTUFBTSxJQUFJO0FBRzlDLFlBQU0sSUFBSTtBQUFBLFFBQ1IsNEJBQTRCLElBQUksTUFBTSxPQUFNLGdDQUFLLFlBQUwsWUFBZ0IsU0FBUztBQUFBLE1BQ3ZFO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixVQUFNLE9BQU0sVUFBSyxZQUFMLG1CQUFjO0FBRTFCLFFBQUksQ0FBQyxPQUFPLElBQUksV0FBVyxHQUFHO0FBQzVCLFlBQU0sSUFBSTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFdBQU8sSUFBSSxJQUFJLENBQUMsTUFBRztBQXZEdkIsVUFBQUMsS0FBQUMsS0FBQTtBQXVEMkI7QUFBQSxRQUNyQixXQUFVRCxNQUFBLEVBQUUsWUFBRixPQUFBQSxNQUFhLEtBQUs7QUFBQTtBQUFBLFFBQzVCLE9BQU0sTUFBQUMsTUFBQSxFQUFFLGVBQUYsZ0JBQUFBLElBQWMsV0FBZCxZQUF3QjtBQUFBLFFBQzlCLFFBQU8sT0FBRSxVQUFGLFlBQVc7QUFBQSxRQUNsQixNQUFLLE9BQUUsUUFBRixZQUFTO0FBQUEsTUFDaEI7QUFBQSxLQUFFO0FBQUEsRUFDSjtBQUNGOzs7QUMxRE8sSUFBTSx3QkFBTixNQUFtRDtBQUFBLEVBQW5EO0FBQ0wsU0FBUyxPQUFPO0FBQUE7QUFBQSxFQUVoQixNQUFNLFdBQ0osV0FDQSxRQUNBLFNBQ3NCO0FBQ3RCLFVBQU0sU0FBUyxRQUFRO0FBQ3ZCLFVBQU0sVUFBVTtBQUFBLE1BQ2QsZUFBZTtBQUFBLE1BQ2YsZ0JBQWdCO0FBQUEsSUFDbEI7QUFHQSxVQUFNLFlBQVksTUFBTSxNQUFNLHdDQUF3QztBQUFBLE1BQ3BFLFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxlQUFlLE9BQU87QUFBQSxNQUNqQyxNQUFNO0FBQUEsTUFDTjtBQUFBLElBQ0YsQ0FBQztBQUVELFFBQUksQ0FBQyxVQUFVLElBQUk7QUFDakIsWUFBTUMsUUFBTyxNQUFNLFVBQVUsS0FBSyxFQUFFLE1BQU0sTUFBTSxFQUFFO0FBQ2xELFlBQU0sSUFBSTtBQUFBLFFBQ1IsNkJBQTZCLFVBQVUsTUFBTSxNQUFNQSxNQUFLLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFBQSxNQUN2RTtBQUFBLElBQ0Y7QUFFQSxVQUFNLEVBQUUsWUFBWSxTQUFTLElBQUssTUFBTSxVQUFVLEtBQUs7QUFLdkQsVUFBTSxPQUFnQztBQUFBLE1BQ3BDLFdBQVc7QUFBQSxNQUNYLGVBQWUsQ0FBQyxRQUFRLFNBQVMsYUFBYTtBQUFBLE1BQzlDLGdCQUFnQjtBQUFBLE1BQ2hCLGVBQWUsUUFBUSxZQUFZO0FBQUEsSUFDckM7QUFFQSxRQUFJLFFBQVEsYUFBYSxTQUFTLEdBQUc7QUFDbkMsV0FBSyxvQkFBb0IsUUFBUSxhQUFhO0FBQUEsSUFDaEQ7QUFFQSxVQUFNLFdBQVcsTUFBTTtBQUFBLE1BQ3JCO0FBQUEsTUFDQTtBQUFBLFFBQ0UsUUFBUTtBQUFBLFFBQ1I7QUFBQSxRQUNBLE1BQU0sS0FBSyxVQUFVLElBQUk7QUFBQSxRQUN6QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLFNBQVMsSUFBSTtBQUNoQixZQUFNQSxRQUFPLE1BQU0sU0FBUyxLQUFLLEVBQUUsTUFBTSxNQUFNLEVBQUU7QUFDakQsWUFBTSxJQUFJO0FBQUEsUUFDUiw0Q0FBNEMsU0FBUyxNQUFNLE1BQU1BLE1BQUssTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUFBLE1BQ3JGO0FBQUEsSUFDRjtBQUVBLFVBQU0sRUFBRSxHQUFHLElBQUssTUFBTSxTQUFTLEtBQUs7QUFHcEMsV0FBTyxNQUFNLEtBQUssS0FBSyxJQUFJLFFBQVEsTUFBTTtBQUFBLEVBQzNDO0FBQUEsRUFFQSxNQUFjLEtBQ1osSUFDQSxRQUNBLFFBQ3NCO0FBNUUxQjtBQTZFSSxVQUFNLGNBQWM7QUFDcEIsYUFBUyxJQUFJLEdBQUcsSUFBSSxhQUFhLEtBQUs7QUFDcEMsVUFBSSxpQ0FBUSxRQUFTLE9BQU0sSUFBSSxhQUFhLFdBQVcsWUFBWTtBQUVuRSxZQUFNLE1BQU0sTUFBTTtBQUFBLFFBQ2hCLDRDQUE0QyxFQUFFO0FBQUEsUUFDOUM7QUFBQSxVQUNFLFNBQVMsRUFBRSxlQUFlLE9BQU87QUFBQSxVQUNqQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsVUFBSSxDQUFDLElBQUksSUFBSTtBQUNYLGNBQU0sSUFBSSxNQUFNLDhCQUE4QixJQUFJLE1BQU0sR0FBRztBQUFBLE1BQzdEO0FBRUEsWUFBTSxPQUFRLE1BQU0sSUFBSSxLQUFLO0FBRTdCLFVBQUksS0FBSyxXQUFXLGFBQWE7QUFDL0IsaUJBQVEsVUFBSyxlQUFMLFlBQW1CLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTztBQUFBLFVBQ3pDLFNBQVMsS0FBSyxxQkFBcUIsRUFBRSxPQUFPO0FBQUEsVUFDNUMsTUFBTSxFQUFFLEtBQUssS0FBSztBQUFBLFVBQ2xCLE9BQU8sRUFBRSxRQUFRO0FBQUEsVUFDakIsS0FBSyxFQUFFLE1BQU07QUFBQSxRQUNmLEVBQUU7QUFBQSxNQUNKO0FBRUEsVUFBSSxLQUFLLFdBQVcsU0FBUztBQUMzQixjQUFNLElBQUk7QUFBQSxVQUNSLG9DQUFtQyxVQUFLLFVBQUwsWUFBYyxTQUFTO0FBQUEsUUFDNUQ7QUFBQSxNQUNGO0FBRUEsWUFBTSxNQUFNLEtBQU0sTUFBTTtBQUFBLElBQzFCO0FBRUEsVUFBTSxJQUFJLE1BQU0sb0NBQW9DO0FBQUEsRUFDdEQ7QUFBQSxFQUVRLHFCQUFxQixPQUF1QjtBQUNsRCxXQUFPLE1BQU0sWUFBWSxFQUFFLFdBQVcsQ0FBQyxJQUFJO0FBQUEsRUFDN0M7QUFDRjs7O0FDdkhBLElBQUFDLG1CQUFvQztBQUc3QixJQUFNLGVBQU4sY0FBMkIsdUJBQU07QUFBQSxFQUFqQztBQUFBO0FBQ0wsbUJBQTJEO0FBQzNELFNBQVEsYUFBaUMsQ0FBQztBQUMxQyxTQUFRLGlCQUF3QztBQUFBO0FBQUEsRUFFaEQsT0FBdUM7QUFDckMsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLFdBQUssVUFBVTtBQUNmLFlBQU0sS0FBSztBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFNBQVM7QUFDUCxVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUUxRCxRQUFJLHlCQUFRLFNBQVMsRUFDbEIsUUFBUSxvQkFBb0IsRUFDNUIsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxlQUFlLEdBQUc7QUFDdkIsV0FBSyxRQUFRLE9BQU87QUFDcEIsV0FBSyxRQUFRLE1BQU07QUFDbkIsV0FBSyxRQUFRLE1BQU07QUFDbkIsV0FBSyxTQUFTLEdBQUc7QUFDakIsV0FBSyxTQUFTLENBQUMsVUFBVSxLQUFLLGlCQUFpQixPQUFPLEtBQUssS0FBSyxDQUFDLENBQUM7QUFBQSxJQUNwRSxDQUFDO0FBRUgsU0FBSyxpQkFBaUIsVUFBVTtBQUFBLE1BQzlCO0FBQUEsSUFDRjtBQUVBLFFBQUkseUJBQVEsU0FBUyxFQUFFO0FBQUEsTUFBVSxDQUFDLFFBQ2hDLElBQ0csY0FBYyxxQkFBcUIsRUFDbkMsT0FBTyxFQUNQLFFBQVEsTUFBTSxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ2hDO0FBRUEsU0FBSyxpQkFBaUIsQ0FBQztBQUFBLEVBQ3pCO0FBQUEsRUFFUSxpQkFBaUIsT0FBZTtBQUN0QyxRQUFJLENBQUMsS0FBSyxlQUFnQjtBQUMxQixTQUFLLGVBQWUsTUFBTTtBQUMxQixTQUFLLGFBQWEsQ0FBQztBQUVuQixhQUFTLElBQUksR0FBRyxJQUFJLE9BQU8sS0FBSztBQUM5QixZQUFNLE1BQU0sS0FBSyxlQUFlO0FBQUEsUUFDNUI7QUFBQSxNQUNKO0FBQ0EsVUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFNLFdBQVcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNsRCxZQUFNLFFBQVEsSUFBSSxTQUFTLFNBQVM7QUFBQSxRQUNsQyxNQUFNO0FBQUEsUUFDTixhQUFhLG9CQUFvQixJQUFJLENBQUM7QUFBQSxNQUN4QyxDQUFDO0FBQ0QsV0FBSyxXQUFXLEtBQUssS0FBSztBQUFBLElBQzVCO0FBQUEsRUFDRjtBQUFBLEVBRVEsU0FBUztBQTlEbkI7QUErREksVUFBTSxRQUFRLEtBQUssV0FBVztBQUFBLE1BQzVCLENBQUMsR0FBRyxNQUFNLEVBQUUsTUFBTSxLQUFLLEtBQUssV0FBVyxJQUFJLENBQUM7QUFBQSxJQUM5QztBQUNBLGVBQUssWUFBTCw4QkFBZSxFQUFFLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFDNUMsU0FBSyxNQUFNO0FBQUEsRUFDYjtBQUFBLEVBRUEsVUFBVTtBQUNSLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLFFBQUksS0FBSyxTQUFTO0FBQ2hCLFdBQUssUUFBUSxJQUFJO0FBQ2pCLFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUNGOzs7QUM5RUEsSUFBQUMsbUJBQTJCO0FBRXBCLElBQU0sY0FBTixjQUEwQix1QkFBTTtBQUFBLEVBQWhDO0FBQUE7QUFDTCxTQUFRLFVBQStEO0FBQUE7QUFBQSxFQUV2RSxPQUEwQztBQUN4QyxXQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDOUIsV0FBSyxVQUFVO0FBQ2YsWUFBTSxLQUFLO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBUztBQUNQLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxTQUFTLE1BQU0sRUFBRSxNQUFNLDhCQUFxQixDQUFDO0FBRXZELFVBQU0sZUFBZSxVQUFVLFVBQVU7QUFBQSxNQUN2QyxNQUFNLEVBQUUsT0FBTyw4Q0FBOEM7QUFBQSxJQUMvRCxDQUFDO0FBRUQsVUFBTSxZQUFZLGFBQWEsU0FBUyxVQUFVO0FBQUEsTUFDaEQsTUFBTTtBQUFBLE1BQ04sS0FBSztBQUFBLElBQ1AsQ0FBQztBQUNELGNBQVUsTUFBTSxPQUFPO0FBQ3ZCLGNBQVUsVUFBVSxNQUFNO0FBekI5QjtBQTBCTSxpQkFBSyxZQUFMLDhCQUFlO0FBQ2YsV0FBSyxNQUFNO0FBQUEsSUFDYjtBQUVBLFVBQU0sVUFBVSxhQUFhLFNBQVMsVUFBVTtBQUFBLE1BQzlDLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxZQUFRLE1BQU0sT0FBTztBQUNyQixZQUFRLFVBQVUsTUFBTTtBQWxDNUI7QUFtQ00saUJBQUssWUFBTCw4QkFBZTtBQUNmLFdBQUssTUFBTTtBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQUEsRUFFQSxVQUFVO0FBQ1IsU0FBSyxVQUFVLE1BQU07QUFDckIsUUFBSSxLQUFLLFNBQVM7QUFDaEIsV0FBSyxRQUFRLElBQUk7QUFDakIsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBQ0Y7OztBQy9DQSxJQUFBQyxtQkFBdUM7QUFFaEMsSUFBTSxpQkFBTixjQUE2Qix1QkFBTTtBQUFBLEVBQW5DO0FBQUE7QUFDTCxTQUFRLFNBQWlCLENBQUM7QUFDMUIsU0FBUSxnQkFBc0M7QUFDOUMsU0FBUSxTQUE2QjtBQUNyQyxTQUFRLFVBQVU7QUFDbEIsU0FBUSxnQkFBdUQ7QUFDL0QsU0FBUSxVQUE4QjtBQUN0QyxTQUFRLFdBQStCO0FBQ3ZDLFNBQVEsVUFBZ0Q7QUFBQTtBQUFBLEVBRXhELE1BQU0sUUFBOEI7QUFDbEMsV0FBTyxJQUFJLFFBQVEsT0FBTyxZQUFZO0FBQ3BDLFdBQUssVUFBVTtBQUVmLFVBQUk7QUFDRixhQUFLLFNBQVMsTUFBTSxVQUFVLGFBQWEsYUFBYTtBQUFBLFVBQ3RELE9BQU87QUFBQSxRQUNULENBQUM7QUFBQSxNQUNILFNBQVE7QUFDTixZQUFJLHdCQUFPLCtEQUF5RDtBQUNwRSxnQkFBUSxJQUFJO0FBQ1o7QUFBQSxNQUNGO0FBRUEsWUFBTSxXQUFXLGNBQWMsZ0JBQWdCLHdCQUF3QixJQUNuRSwyQkFDQSxjQUFjLGdCQUFnQixZQUFZLElBQzFDLGVBQ0EsY0FBYyxnQkFBZ0IsV0FBVyxJQUN6QyxjQUNBLGNBQWMsZ0JBQWdCLFdBQVcsSUFDekMsY0FDQTtBQUVKLFdBQUssZ0JBQWdCLElBQUksY0FBYyxLQUFLLFFBQVEsRUFBRSxTQUFTLENBQUM7QUFDaEUsV0FBSyxTQUFTLENBQUM7QUFFZixXQUFLLGNBQWMsa0JBQWtCLENBQUMsTUFBTTtBQUMxQyxZQUFJLEVBQUUsS0FBSyxPQUFPLEVBQUcsTUFBSyxPQUFPLEtBQUssRUFBRSxJQUFJO0FBQUEsTUFDOUM7QUFFQSxXQUFLLGNBQWMsU0FBUyxNQUFNO0FBM0N4QztBQTRDUSxhQUFLLFFBQVE7QUFDYixjQUFNLE9BQU8sSUFBSSxLQUFLLEtBQUssUUFBUSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3JELG1CQUFLLFlBQUwsOEJBQWU7QUFDZixhQUFLLE1BQU07QUFBQSxNQUNiO0FBRUEsV0FBSyxjQUFjLE1BQU0sR0FBSTtBQUM3QixZQUFNLEtBQUs7QUFDWCxXQUFLLFdBQVc7QUFBQSxJQUNsQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBUztBQUNQLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFaEQsU0FBSyxXQUFXLFVBQVUsVUFBVTtBQUFBLE1BQ2xDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxTQUFLLFVBQVUsVUFBVSxTQUFTLEtBQUs7QUFBQSxNQUNyQyxNQUFNO0FBQUEsTUFDTixNQUFNLEVBQUUsT0FBTyxzREFBc0Q7QUFBQSxJQUN2RSxDQUFDO0FBRUQsUUFBSSx5QkFBUSxTQUFTLEVBQUU7QUFBQSxNQUFVLENBQUMsUUFDaEMsSUFDRyxjQUFjLHNCQUFtQixFQUNqQyxXQUFXLEVBQ1gsUUFBUSxNQUFNLEtBQUssY0FBYyxDQUFDO0FBQUEsSUFDdkM7QUFBQSxFQUNGO0FBQUEsRUFFUSxhQUFhO0FBQ25CLFNBQUssVUFBVTtBQUNmLFNBQUssZ0JBQWdCLFlBQVksTUFBTTtBQUNyQyxXQUFLO0FBQ0wsVUFBSSxLQUFLLFNBQVM7QUFDaEIsY0FBTSxJQUFJLEtBQUssTUFBTSxLQUFLLFVBQVUsRUFBRTtBQUN0QyxjQUFNLElBQUksS0FBSyxVQUFVO0FBQ3pCLGFBQUssUUFBUSxjQUNYLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFBQSxNQUNyRTtBQUFBLElBQ0YsR0FBRyxHQUFJO0FBQUEsRUFDVDtBQUFBLEVBRVEsZ0JBQWdCO0FBNUYxQjtBQTZGSSxlQUFLLGtCQUFMLG1CQUFvQjtBQUFBLEVBQ3RCO0FBQUEsRUFFUSxVQUFVO0FBaEdwQjtBQWlHSSxRQUFJLEtBQUssY0FBZSxlQUFjLEtBQUssYUFBYTtBQUN4RCxlQUFLLFdBQUwsbUJBQWEsWUFBWSxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUs7QUFDL0MsU0FBSyxTQUFTO0FBQ2QsU0FBSyxnQkFBZ0I7QUFBQSxFQUN2QjtBQUFBLEVBRUEsVUFBVTtBQUNSLFNBQUssUUFBUTtBQUNiLFNBQUssVUFBVSxNQUFNO0FBQ3JCLFFBQUksS0FBSyxTQUFTO0FBQ2hCLFdBQUssUUFBUSxJQUFJO0FBQ2pCLFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUNGOzs7QVRwR0EsSUFBcUIseUJBQXJCLGNBQW9ELHdCQUFPO0FBQUEsRUFBM0Q7QUFBQTtBQUVFLFNBQVEsZUFBOEI7QUFDdEMsU0FBUSxrQkFBMEM7QUFBQTtBQUFBLEVBRWxELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBQ3hCLFNBQUssY0FBYyxJQUFJLFlBQVksS0FBSyxLQUFLLElBQUksQ0FBQztBQUVsRCxTQUFLLGNBQWMsT0FBTyxlQUFlLFlBQVk7QUFDbkQsWUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw2QkFBWTtBQUNoRSxVQUFJLENBQUMsTUFBTTtBQUNULFlBQUksd0JBQU8sMEJBQXVCO0FBQ2xDO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBUyxNQUFNLElBQUksWUFBWSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQ3BELFVBQUksV0FBVyxVQUFVO0FBQ3ZCLGFBQUssZUFBZSxLQUFLLE1BQU07QUFBQSxNQUNqQyxXQUFXLFdBQVcsUUFBUTtBQUM1QixhQUFLLGVBQWUsS0FBSyxNQUFNO0FBQUEsTUFDakM7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLGdCQUFnQixDQUFDLFFBQWdCLFNBQy9CLEtBQUssZUFBZSxNQUFNO0FBQUEsSUFDOUIsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sZ0JBQWdCLENBQUMsUUFBZ0IsU0FDL0IsS0FBSyxlQUFlLE1BQU07QUFBQSxJQUM5QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsV0FBVztBQWpEYjtBQWtESSxlQUFLLG9CQUFMLG1CQUFzQjtBQUN0QixlQUFLLGlCQUFMLG1CQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsU0FBSyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ25DO0FBQUE7QUFBQSxFQUlBLE1BQWMsZUFBZSxRQUFnQjtBQWhFL0M7QUFpRUksVUFBTSxTQUFTLEtBQUssVUFBVTtBQUM5QixRQUFJLENBQUMsUUFBUTtBQUNYLFVBQUk7QUFBQSxRQUNGLHNCQUFzQixLQUFLLFNBQVMsUUFBUTtBQUFBLE1BQzlDO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLE1BQU0sSUFBSSxlQUFlLEtBQUssR0FBRyxFQUFFLE1BQU07QUFDdEQsUUFBSSxDQUFDLEtBQU07QUFFWCxVQUFNLGlCQUFpQixNQUFNLElBQUksYUFBYSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQzdELFFBQUksQ0FBQyxlQUFnQjtBQUVyQixVQUFNLEtBQUssZUFBZSxRQUFRLE1BQU0sY0FBYztBQUd0RCxVQUFNLFlBQVksTUFBTSxLQUFLLGNBQWMsSUFBSTtBQUMvQyxVQUFNLFlBQVcsZUFBVSxNQUFNLEdBQUcsRUFBRSxJQUFJLE1BQXpCLFlBQThCO0FBQy9DLFNBQUssZUFBZSxRQUFRO0FBQUEsY0FBVSxRQUFRO0FBQUEsQ0FBTTtBQUFBLEVBQ3REO0FBQUE7QUFBQSxFQUlBLE1BQWMsZUFBZSxRQUFnQjtBQUMzQyxVQUFNLFNBQVMsS0FBSyxVQUFVO0FBQzlCLFFBQUksQ0FBQyxRQUFRO0FBQ1gsVUFBSTtBQUFBLFFBQ0Ysc0JBQXNCLEtBQUssU0FBUyxRQUFRO0FBQUEsTUFDOUM7QUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQU8sTUFBTSxLQUFLLGNBQWM7QUFDdEMsUUFBSSxDQUFDLEtBQU07QUFFWCxVQUFNLGlCQUFpQixNQUFNLElBQUksYUFBYSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQzdELFFBQUksQ0FBQyxlQUFnQjtBQUVyQixVQUFNLEtBQUssZUFBZSxRQUFRLE1BQU0sY0FBYztBQUFBLEVBQ3hEO0FBQUE7QUFBQSxFQUlBLE1BQWMsZUFDWixRQUNBLE1BQ0EsZ0JBQ0E7QUFqSEo7QUFrSEksVUFBTSxTQUFTLEtBQUssVUFBVTtBQUU5QixlQUFLLG9CQUFMLG1CQUFzQjtBQUN0QixVQUFNLGFBQWEsSUFBSSxnQkFBZ0I7QUFDdkMsU0FBSyxrQkFBa0I7QUFFdkIsVUFBTSxTQUFTLElBQUk7QUFBQSxNQUNqQixzQkFBc0IsS0FBSyxTQUFTLFFBQVE7QUFBQSxNQUM1QztBQUFBLElBQ0Y7QUFDQSxTQUFLLGVBQWU7QUFDcEIsVUFBTSxZQUFZLEtBQUssSUFBSTtBQUUzQixRQUFJO0FBQ0YsWUFBTSxjQUFjLEtBQUssZUFBZTtBQUN4QyxZQUFNLGFBQWEsTUFBTSxZQUFZLFdBQVcsTUFBTSxRQUFRO0FBQUEsUUFDNUQsY0FBYyxlQUFlO0FBQUEsUUFDN0IsVUFBVSxLQUFLLFNBQVM7QUFBQSxRQUN4QixRQUFRLFdBQVc7QUFBQSxRQUNuQixPQUNFLEtBQUssU0FBUyxhQUFhLGVBQ3ZCLEtBQUssU0FBUyxrQkFDZDtBQUFBLE1BQ1IsQ0FBQztBQUVELFlBQU0sWUFBWSxLQUFLO0FBQUEsUUFDckI7QUFBQSxRQUNBLGVBQWU7QUFBQSxNQUNqQjtBQUNBLFdBQUssZUFBZSxRQUFRLFNBQVM7QUFFckMsWUFBTSxZQUFZLEtBQUssSUFBSSxJQUFJLGFBQWEsS0FBTSxRQUFRLENBQUM7QUFDM0QsYUFBTyxLQUFLO0FBQ1osVUFBSSx3QkFBTyw2QkFBMEIsT0FBTyxHQUFHO0FBQUEsSUFDakQsU0FBUyxLQUFLO0FBQ1osYUFBTyxLQUFLO0FBQ1osVUFBSSxlQUFlLGdCQUFnQixJQUFJLFNBQVMsYUFBYztBQUM5RCxZQUFNLFVBQVUsZUFBZSxRQUFRLElBQUksVUFBVTtBQUNyRCxVQUFJLHdCQUFPLGlDQUEyQixPQUFPLEVBQUU7QUFDL0MsY0FBUSxNQUFNLHNCQUFzQixHQUFHO0FBQUEsSUFDekMsVUFBRTtBQUNBLFVBQUksS0FBSyxpQkFBaUIsT0FBUSxNQUFLLGVBQWU7QUFDdEQsVUFBSSxLQUFLLG9CQUFvQixXQUFZLE1BQUssa0JBQWtCO0FBQUEsSUFDbEU7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUlBLE1BQWMsY0FBYyxNQUE2QjtBQWxLM0Q7QUFtS0ksVUFBTSxRQUFNLFVBQUssS0FBSyxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQXRCLG1CQUF5QixNQUFNLEtBQUssT0FBTTtBQUN0RCxVQUFNLE1BQU0sb0JBQUksS0FBSztBQUNyQixVQUFNLEtBQUssSUFBSSxZQUFZLEVBQUUsUUFBUSxTQUFTLEdBQUcsRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUM5RCxVQUFNLFdBQVcsYUFBYSxFQUFFLElBQUksR0FBRztBQUV2QyxVQUFNLGFBQWEsS0FBSyxJQUFJLFVBQVUsY0FBYztBQUNwRCxVQUFNLFVBQVMsb0RBQVksV0FBWixtQkFBb0IsU0FBcEIsWUFBNEI7QUFDM0MsVUFBTSxXQUFXLFNBQVMsR0FBRyxNQUFNLElBQUksUUFBUSxLQUFLO0FBRXBELFVBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxVQUFVLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFDcEUsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBLEVBSVEsaUJBQThCO0FBQ3BDLFlBQVEsS0FBSyxTQUFTLFVBQVU7QUFBQSxNQUM5QixLQUFLO0FBQ0gsZUFBTyxJQUFJLGtCQUFrQjtBQUFBLE1BQy9CLEtBQUs7QUFDSCxlQUFPLElBQUksb0JBQW9CO0FBQUEsTUFDakMsS0FBSztBQUNILGVBQU8sSUFBSSxzQkFBc0I7QUFBQSxNQUNuQztBQUNFLGNBQU0sSUFBSSxNQUFNLHFCQUFxQixLQUFLLFNBQVMsUUFBUSxFQUFFO0FBQUEsSUFDakU7QUFBQSxFQUNGO0FBQUEsRUFFUSxZQUFvQjtBQUMxQixZQUFRLEtBQUssU0FBUyxVQUFVO0FBQUEsTUFDOUIsS0FBSztBQUNILGVBQU8sS0FBSyxTQUFTO0FBQUEsTUFDdkIsS0FBSztBQUNILGVBQU8sS0FBSyxTQUFTO0FBQUEsTUFDdkIsS0FBSztBQUNILGVBQU8sS0FBSyxTQUFTO0FBQUEsTUFDdkI7QUFDRSxjQUFNLElBQUksTUFBTSxxQkFBcUIsS0FBSyxTQUFTLFFBQVEsRUFBRTtBQUFBLElBQ2pFO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFJUSxnQkFBc0M7QUFDNUMsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLFlBQU0sUUFBUSxTQUFTLGNBQWMsT0FBTztBQUM1QyxZQUFNLE9BQU87QUFDYixZQUFNLFNBQVM7QUFFZixVQUFJLFdBQVc7QUFDZixZQUFNLE9BQU8sQ0FBQyxTQUFzQjtBQUNsQyxZQUFJLFNBQVU7QUFDZCxtQkFBVztBQUNYLGdCQUFRO0FBQ1IsZ0JBQVEsSUFBSTtBQUFBLE1BQ2Q7QUFFQSxZQUFNLFVBQVUsTUFBTTtBQUNwQixlQUFPLG9CQUFvQixTQUFTLFlBQVk7QUFDaEQscUJBQWEsV0FBVztBQUFBLE1BQzFCO0FBRUEsWUFBTSxlQUFlLE1BQU07QUFDekIsbUJBQVcsTUFBTTtBQUNmLGNBQUksQ0FBQyxNQUFNLFNBQVMsTUFBTSxNQUFNLFdBQVcsR0FBRztBQUM1QyxpQkFBSyxJQUFJO0FBQUEsVUFDWDtBQUFBLFFBQ0YsR0FBRyxHQUFHO0FBQUEsTUFDUjtBQUVBLFlBQU0sV0FBVyxNQUFNO0FBek83QjtBQTBPUSxjQUFLLGlCQUFNLFVBQU4sbUJBQWMsT0FBZCxZQUFvQixJQUFJO0FBQUEsTUFDL0I7QUFFQSxZQUFNLGNBQWMsV0FBVyxNQUFNO0FBQ25DLFlBQUksQ0FBQyxNQUFNLFNBQVMsTUFBTSxNQUFNLFdBQVcsR0FBRztBQUM1QyxlQUFLLElBQUk7QUFBQSxRQUNYO0FBQUEsTUFDRixHQUFHLElBQU87QUFFVixhQUFPLGlCQUFpQixTQUFTLFlBQVk7QUFDN0MsWUFBTSxNQUFNO0FBQUEsSUFDZCxDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUEsRUFJUSxvQkFDTixZQUNBLGNBQ1E7QUFDUixRQUFJLFdBQVcsV0FBVyxHQUFHO0FBQzNCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxRQUFRLFdBQVcsSUFBSSxDQUFDLE1BQU07QUFDbEMsWUFBTSxPQUFPLGFBQWEsRUFBRSxVQUFVLENBQUMsS0FBSyxXQUFXLEVBQUUsT0FBTztBQUNoRSxZQUFNLE9BQU8sS0FBSyxnQkFBZ0IsRUFBRSxLQUFLO0FBQ3pDLGFBQU8sS0FBSyxJQUFJLFFBQVEsSUFBSTtBQUFBLElBQWMsRUFBRTtBQUFBLElBQzlDLENBQUM7QUFFRCxRQUFJLEtBQUssU0FBUyxpQkFBaUI7QUFDakMsYUFDRSx3Q0FDQSxNQUFNLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxPQUFPO0FBQUEsSUFFM0M7QUFFQSxXQUFPLE1BQU0sS0FBSyxNQUFNO0FBQUEsRUFDMUI7QUFBQSxFQUVRLGdCQUFnQixTQUF5QjtBQUMvQyxVQUFNLElBQUksS0FBSyxNQUFNLFVBQVUsRUFBRTtBQUNqQyxVQUFNLElBQUksS0FBSyxNQUFNLFVBQVUsRUFBRTtBQUNqQyxXQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUM5QztBQUFBO0FBQUEsRUFJUSxlQUFlLFFBQWdCLE1BQWM7QUFDbkQsVUFBTSxTQUFTLE9BQU8sVUFBVTtBQUNoQyxXQUFPLGFBQWEsTUFBTSxNQUFNO0FBQUEsRUFDbEM7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgImJvZHkiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
