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
    new import_obsidian.Setting(containerEl).setName("Proveedor").setDesc("Proveedor de voz a texto").addDropdown((dropdown) => {
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
      new import_obsidian.Setting(containerEl).setName("Modelo").setDesc("Universal-3 Pro: m\xE1xima precisi\xF3n, diarizaci\xF3n de hablantes avanzada. Universal-2: m\xE1s r\xE1pido y econ\xF3mico.").addDropdown(
        (dropdown) => dropdown.addOption("universal-3-pro", "Universal-3 Pro").addOption("universal-2", "Universal-2").setValue(this.plugin.settings.assemblyaiModel).onChange(async (v) => {
          this.plugin.settings.assemblyaiModel = v;
          await this.plugin.saveSettings();
        })
      );
    }
    containerEl.createEl("h3", { text: "Todas las API Keys" });
    containerEl.createEl("p", {
      text: "Las claves se almacenan localmente en los datos del plugin.",
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
    new import_obsidian.Setting(containerEl).setName("Insertar en callout").setDesc("Insertar la transcripci\xF3n dentro de un bloque >[!transcription]").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.insertAsCallout).onChange(async (value) => {
        this.plugin.settings.insertAsCallout = value;
        await this.plugin.saveSettings();
      })
    );
  }
  addApiKeyField(container, name, key) {
    new import_obsidian.Setting(container).setName(name).addText((text) => {
      var _a;
      text.setPlaceholder("Ingresa tu API key").setValue(this.plugin.settings[key]);
      text.inputEl.type = "password";
      const toggleBtn = (_a = text.inputEl.parentElement) == null ? void 0 : _a.createEl("button", {
        text: "Mostrar",
        cls: "audio-transcript-toggle-key"
      });
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const isPassword = text.inputEl.type === "password";
          text.inputEl.type = isPassword ? "text" : "password";
          toggleBtn.textContent = isPassword ? "Ocultar" : "Mostrar";
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
    contentEl.createEl("h3", { text: "Configuraci\xF3n de hablantes" });
    new import_obsidian2.Setting(contentEl).setName("N\xFAmero de hablantes").addText((text) => {
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
      (btn) => btn.setButtonText("Iniciar transcripci\xF3n").setCta().onClick(() => this.submit())
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
      row.createEl("label", { text: `Hablante ${i + 1}` });
      const input = row.createEl("input", {
        type: "text",
        placeholder: `Nombre del hablante ${i + 1}`
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
    contentEl.createEl("h3", { text: "\xBFQu\xE9 quieres hacer?" });
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
        new import_obsidian4.Notice("No se pudo acceder al micr\xF3fono. Verifica los permisos.");
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
        new import_obsidian5.Notice("Abre una nota primero");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9mZXRjaC11dGlscy50cyIsICJzcmMvcHJvdmlkZXJzL2dsYWRpYS50cyIsICJzcmMvcHJvdmlkZXJzL2RlZXBncmFtLnRzIiwgInNyYy9wcm92aWRlcnMvYXNzZW1ibHlhaS50cyIsICJzcmMvc3BlYWtlci1tb2RhbC50cyIsICJzcmMvY2hvaWNlLW1vZGFsLnRzIiwgInNyYy9yZWNvcmRpbmctbW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEVkaXRvciwgTWFya2Rvd25GaWxlSW5mbywgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUGx1Z2luU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MsIFNldHRpbmdzVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgR2xhZGlhVHJhbnNjcmliZXIgfSBmcm9tIFwiLi9zcmMvcHJvdmlkZXJzL2dsYWRpYVwiO1xuaW1wb3J0IHsgRGVlcGdyYW1UcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvZGVlcGdyYW1cIjtcbmltcG9ydCB7IEFzc2VtYmx5QUlUcmFuc2NyaWJlciB9IGZyb20gXCIuL3NyYy9wcm92aWRlcnMvYXNzZW1ibHlhaVwiO1xuaW1wb3J0IHsgU3BlYWtlck1vZGFsIH0gZnJvbSBcIi4vc3JjL3NwZWFrZXItbW9kYWxcIjtcbmltcG9ydCB7IENob2ljZU1vZGFsIH0gZnJvbSBcIi4vc3JjL2Nob2ljZS1tb2RhbFwiO1xuaW1wb3J0IHsgUmVjb3JkaW5nTW9kYWwgfSBmcm9tIFwiLi9zcmMvcmVjb3JkaW5nLW1vZGFsXCI7XG5pbXBvcnQgeyBTcGVha2VyTWFwcGluZywgVXR0ZXJhbmNlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpYXJ5VHJhbnNjcmliZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IFBsdWdpblNldHRpbmdzO1xuICBwcml2YXRlIGFjdGl2ZU5vdGljZTogTm90aWNlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJtaWNcIiwgXCJUcmFuc2NyaWJpclwiLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgIGlmICghdmlldykge1xuICAgICAgICBuZXcgTm90aWNlKFwiQWJyZSB1bmEgbm90YSBwcmltZXJvXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBjaG9pY2UgPSBhd2FpdCBuZXcgQ2hvaWNlTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcbiAgICAgIGlmIChjaG9pY2UgPT09IFwicmVjb3JkXCIpIHtcbiAgICAgICAgdGhpcy5zdGFydFJlY29yZGluZyh2aWV3LmVkaXRvcik7XG4gICAgICB9IGVsc2UgaWYgKGNob2ljZSA9PT0gXCJmaWxlXCIpIHtcbiAgICAgICAgdGhpcy50cmFuc2NyaWJlRmlsZSh2aWV3LmVkaXRvcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwicmVjb3JkLWFuZC10cmFuc2NyaWJlXCIsXG4gICAgICBuYW1lOiBcIkdyYWJhciB5IHRyYW5zY3JpYmlyXCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yLCBfY3R4OiBNYXJrZG93blZpZXcgfCBNYXJrZG93bkZpbGVJbmZvKSA9PlxuICAgICAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nKGVkaXRvciksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwidHJhbnNjcmliZS1maWxlXCIsXG4gICAgICBuYW1lOiBcIlRyYW5zY3JpYmlyIGFyY2hpdm9cIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIF9jdHg6IE1hcmtkb3duVmlldyB8IE1hcmtkb3duRmlsZUluZm8pID0+XG4gICAgICAgIHRoaXMudHJhbnNjcmliZUZpbGUoZWRpdG9yKSxcbiAgICB9KTtcbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICAgIHRoaXMuYWN0aXZlTm90aWNlPy5oaWRlKCk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWNvcmRpbmcgZmxvdyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGFzeW5jIHN0YXJ0UmVjb3JkaW5nKGVkaXRvcjogRWRpdG9yKSB7XG4gICAgY29uc3QgYXBpS2V5ID0gdGhpcy5nZXRBcGlLZXkoKTtcbiAgICBpZiAoIWFwaUtleSkge1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgYE5vIEFQSSBrZXkgc2V0IGZvciAke3RoaXMuc2V0dGluZ3MucHJvdmlkZXJ9LiBTZXR0aW5ncyBcdTIxOTIgQXVkaW8gVHJhbnNjcmlwdC5gXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBuZXcgUmVjb3JkaW5nTW9kYWwodGhpcy5hcHApLnN0YXJ0KCk7XG4gICAgaWYgKCFibG9iKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGVha2VyTWFwcGluZyA9IGF3YWl0IG5ldyBTcGVha2VyTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcbiAgICBpZiAoIXNwZWFrZXJNYXBwaW5nKSByZXR1cm47XG5cbiAgICBhd2FpdCB0aGlzLnRyYW5zY3JpYmVCbG9iKGVkaXRvciwgYmxvYiwgc3BlYWtlck1hcHBpbmcpO1xuXG4gICAgLy8gSW5zZXJ0IGxpbmsgdG8gdGhlIHNhdmVkIGF1ZGlvIGZpbGUgYWZ0ZXIgdHJhbnNjcmlwdGlvblxuICAgIGNvbnN0IGF1ZGlvUGF0aCA9IGF3YWl0IHRoaXMuc2F2ZUF1ZGlvRmlsZShibG9iKTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGF1ZGlvUGF0aC5zcGxpdChcIi9cIikucG9wKCkgPz8gYXVkaW9QYXRoO1xuICAgIHRoaXMuaW5zZXJ0QXRDdXJzb3IoZWRpdG9yLCBgXFxuXHVEODNEXHVEQ0MxIFtbJHtmaWxlbmFtZX1dXVxcbmApO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEZpbGUgcGlja2VyIGZsb3cgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBhc3luYyB0cmFuc2NyaWJlRmlsZShlZGl0b3I6IEVkaXRvcikge1xuICAgIGNvbnN0IGFwaUtleSA9IHRoaXMuZ2V0QXBpS2V5KCk7XG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgIGBObyBBUEkga2V5IHNldCBmb3IgJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfS4gU2V0dGluZ3MgXHUyMTkyIEF1ZGlvIFRyYW5zY3JpcHQuYFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5waWNrQXVkaW9GaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGVha2VyTWFwcGluZyA9IGF3YWl0IG5ldyBTcGVha2VyTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcbiAgICBpZiAoIXNwZWFrZXJNYXBwaW5nKSByZXR1cm47XG5cbiAgICBhd2FpdCB0aGlzLnRyYW5zY3JpYmVCbG9iKGVkaXRvciwgZmlsZSwgc3BlYWtlck1hcHBpbmcpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNoYXJlZCB0cmFuc2NyaXB0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgdHJhbnNjcmliZUJsb2IoXG4gICAgZWRpdG9yOiBFZGl0b3IsXG4gICAgYmxvYjogQmxvYixcbiAgICBzcGVha2VyTWFwcGluZzogU3BlYWtlck1hcHBpbmdcbiAgKSB7XG4gICAgY29uc3QgYXBpS2V5ID0gdGhpcy5nZXRBcGlLZXkoKTtcblxuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuXG4gICAgY29uc3Qgbm90aWNlID0gbmV3IE5vdGljZShcbiAgICAgIGBUcmFuc2NyaWJpZW5kbyBjb24gJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfS4uLmAsXG4gICAgICAwXG4gICAgKTtcbiAgICB0aGlzLmFjdGl2ZU5vdGljZSA9IG5vdGljZTtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRyYW5zY3JpYmVyID0gdGhpcy5nZXRUcmFuc2NyaWJlcigpO1xuICAgICAgY29uc3QgdXR0ZXJhbmNlcyA9IGF3YWl0IHRyYW5zY3JpYmVyLnRyYW5zY3JpYmUoYmxvYiwgYXBpS2V5LCB7XG4gICAgICAgIHNwZWFrZXJOYW1lczogc3BlYWtlck1hcHBpbmcubmFtZXMsXG4gICAgICAgIGxhbmd1YWdlOiB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYW5ndWFnZSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgbW9kZWw6XG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5wcm92aWRlciA9PT0gXCJhc3NlbWJseWFpXCJcbiAgICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWxcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IHRoaXMuZm9ybWF0VHJhbnNjcmlwdGlvbihcbiAgICAgICAgdXR0ZXJhbmNlcyxcbiAgICAgICAgc3BlYWtlck1hcHBpbmcubmFtZXNcbiAgICAgICk7XG4gICAgICB0aGlzLmluc2VydEF0Q3Vyc29yKGVkaXRvciwgZm9ybWF0dGVkKTtcblxuICAgICAgY29uc3QgZWxhcHNlZCA9ICgoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwKS50b0ZpeGVkKDEpO1xuICAgICAgbm90aWNlLmhpZGUoKTtcbiAgICAgIG5ldyBOb3RpY2UoYFRyYW5zY3JpcGNpXHUwMEYzbiBsaXN0YSBlbiAke2VsYXBzZWR9c2ApO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbm90aWNlLmhpZGUoKTtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZXJyLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSByZXR1cm47XG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFwiRXJyb3IgZGVzY29ub2NpZG9cIjtcbiAgICAgIG5ldyBOb3RpY2UoYEZhbGxcdTAwRjMgbGEgdHJhbnNjcmlwY2lcdTAwRjNuOiAke21lc3NhZ2V9YCk7XG4gICAgICBjb25zb2xlLmVycm9yKFwiW0F1ZGlvIFRyYW5zY3JpcHRdXCIsIGVycik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZU5vdGljZSA9PT0gbm90aWNlKSB0aGlzLmFjdGl2ZU5vdGljZSA9IG51bGw7XG4gICAgICBpZiAodGhpcy5hYm9ydENvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIHRoaXMuYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2F2ZSBhdWRpbyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGFzeW5jIHNhdmVBdWRpb0ZpbGUoYmxvYjogQmxvYik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZXh0ID0gYmxvYi50eXBlLnNwbGl0KFwiL1wiKVsxXT8uc3BsaXQoXCI7XCIpWzBdIHx8IFwid2VibVwiO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdHMgPSBub3cudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csIFwiLVwiKS5zbGljZSgwLCAxOSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgZ3JhYmFjaW9uLSR7dHN9LiR7ZXh0fWA7XG5cbiAgICBjb25zdCBhY3RpdmVGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBmb2xkZXIgPSBhY3RpdmVGaWxlPy5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBmaWxlcGF0aCA9IGZvbGRlciA/IGAke2ZvbGRlcn0vJHtmaWxlbmFtZX1gIDogZmlsZW5hbWU7XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkoZmlsZXBhdGgsIGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgcmV0dXJuIGZpbGVwYXRoO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFByb3ZpZGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGdldFRyYW5zY3JpYmVyKCk6IFRyYW5zY3JpYmVyIHtcbiAgICBzd2l0Y2ggKHRoaXMuc2V0dGluZ3MucHJvdmlkZXIpIHtcbiAgICAgIGNhc2UgXCJnbGFkaWFcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBHbGFkaWFUcmFuc2NyaWJlcigpO1xuICAgICAgY2FzZSBcImRlZXBncmFtXCI6XG4gICAgICAgIHJldHVybiBuZXcgRGVlcGdyYW1UcmFuc2NyaWJlcigpO1xuICAgICAgY2FzZSBcImFzc2VtYmx5YWlcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBBc3NlbWJseUFJVHJhbnNjcmliZXIoKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm92aWRlcjogJHt0aGlzLnNldHRpbmdzLnByb3ZpZGVyfWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBpS2V5KCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLnNldHRpbmdzLnByb3ZpZGVyKSB7XG4gICAgICBjYXNlIFwiZ2xhZGlhXCI6XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmdsYWRpYUFwaUtleTtcbiAgICAgIGNhc2UgXCJkZWVwZ3JhbVwiOlxuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5kZWVwZ3JhbUFwaUtleTtcbiAgICAgIGNhc2UgXCJhc3NlbWJseWFpXCI6XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmFzc2VtYmx5YWlBcGlLZXk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcHJvdmlkZXI6ICR7dGhpcy5zZXR0aW5ncy5wcm92aWRlcn1gKTtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsZSBwaWNrZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBwaWNrQXVkaW9GaWxlKCk6IFByb21pc2U8RmlsZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgaW5wdXQudHlwZSA9IFwiZmlsZVwiO1xuICAgICAgaW5wdXQuYWNjZXB0ID0gXCJhdWRpby8qXCI7XG5cbiAgICAgIGxldCByZXNvbHZlZCA9IGZhbHNlO1xuICAgICAgY29uc3QgZG9uZSA9IChmaWxlOiBGaWxlIHwgbnVsbCkgPT4ge1xuICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVybjtcbiAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlc29sdmUoZmlsZSk7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIGZvY3VzSGFuZGxlcik7XG4gICAgICAgIGNsZWFyVGltZW91dChzYWZldHlUaW1lcik7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBmb2N1c0hhbmRsZXIgPSAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICghaW5wdXQuZmlsZXMgfHwgaW5wdXQuZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkb25lKG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMzAwKTtcbiAgICAgIH07XG5cbiAgICAgIGlucHV0Lm9uY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBkb25lKGlucHV0LmZpbGVzPy5bMF0gPz8gbnVsbCk7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBzYWZldHlUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAoIWlucHV0LmZpbGVzIHx8IGlucHV0LmZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRvbmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDEyMF8wMDApO1xuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIGZvY3VzSGFuZGxlcik7XG4gICAgICBpbnB1dC5jbGljaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEZvcm1hdHRpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBmb3JtYXRUcmFuc2NyaXB0aW9uKFxuICAgIHV0dGVyYW5jZXM6IFV0dGVyYW5jZVtdLFxuICAgIHNwZWFrZXJOYW1lczogc3RyaW5nW11cbiAgKTogc3RyaW5nIHtcbiAgICBpZiAodXR0ZXJhbmNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBcIiooTm8gc3BlZWNoIGRldGVjdGVkKSpcIjtcbiAgICB9XG5cbiAgICBjb25zdCBsaW5lcyA9IHV0dGVyYW5jZXMubWFwKCh1KSA9PiB7XG4gICAgICBjb25zdCBuYW1lID0gc3BlYWtlck5hbWVzW3Uuc3BlYWtlciAtIDFdIHx8IGBTcGVha2VyICR7dS5zcGVha2VyfWA7XG4gICAgICBjb25zdCB0aW1lID0gdGhpcy5mb3JtYXRUaW1lc3RhbXAodS5zdGFydCk7XG4gICAgICByZXR1cm4gYCoqJHtuYW1lfSoqIFxcYCR7dGltZX1cXGBgICsgXCJcXG5cIiArIHUudGV4dDtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmluc2VydEFzQ2FsbG91dCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgXCI+IFshdHJhbnNjcmlwdGlvbl0tIFRyYW5zY3JpcHRpb25cXG5cIiArXG4gICAgICAgIGxpbmVzLm1hcCgobCkgPT4gYD4gJHtsfWApLmpvaW4oXCJcXG4+XFxuXCIpXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRUaW1lc3RhbXAoc2Vjb25kczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBtID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjApO1xuICAgIGNvbnN0IHMgPSBNYXRoLmZsb29yKHNlY29uZHMgJSA2MCk7XG4gICAgcmV0dXJuIGAke219OiR7cy50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEVkaXRvciBpbnNlcnQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBpbnNlcnRBdEN1cnNvcihlZGl0b3I6IEVkaXRvciwgdGV4dDogc3RyaW5nKSB7XG4gICAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvcigpO1xuICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UodGV4dCwgY3Vyc29yKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgRGlhcnlUcmFuc2NyaWJlclBsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgVHJhbnNjcmlwdGlvblByb3ZpZGVyLCBQUk9WSURFUlMgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBsdWdpblNldHRpbmdzIHtcbiAgcHJvdmlkZXI6IFRyYW5zY3JpcHRpb25Qcm92aWRlcjtcbiAgZ2xhZGlhQXBpS2V5OiBzdHJpbmc7XG4gIGRlZXBncmFtQXBpS2V5OiBzdHJpbmc7XG4gIGFzc2VtYmx5YWlBcGlLZXk6IHN0cmluZztcbiAgYXNzZW1ibHlhaU1vZGVsOiBcInVuaXZlcnNhbC0yXCIgfCBcInVuaXZlcnNhbC0zLXByb1wiO1xuICBkZWZhdWx0TGFuZ3VhZ2U6IHN0cmluZztcbiAgaW5zZXJ0QXNDYWxsb3V0OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUGx1Z2luU2V0dGluZ3MgPSB7XG4gIHByb3ZpZGVyOiBcImdsYWRpYVwiLFxuICBnbGFkaWFBcGlLZXk6IFwiXCIsXG4gIGRlZXBncmFtQXBpS2V5OiBcIlwiLFxuICBhc3NlbWJseWFpQXBpS2V5OiBcIlwiLFxuICBhc3NlbWJseWFpTW9kZWw6IFwidW5pdmVyc2FsLTMtcHJvXCIsXG4gIGRlZmF1bHRMYW5ndWFnZTogXCJlc1wiLFxuICBpbnNlcnRBc0NhbGxvdXQ6IHRydWUsXG59O1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBEaWFyeVRyYW5zY3JpYmVyUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IERpYXJ5VHJhbnNjcmliZXJQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkF1ZGlvIFRyYW5zY3JpcHRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQcm92ZWVkb3JcIilcbiAgICAgIC5zZXREZXNjKFwiUHJvdmVlZG9yIGRlIHZveiBhIHRleHRvXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgeyB2YWx1ZSwgbGFiZWwgfSBvZiBQUk9WSURFUlMpIHtcbiAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24odmFsdWUsIGxhYmVsKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm92aWRlcilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHY6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPSB2IGFzIFRyYW5zY3JpcHRpb25Qcm92aWRlcjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIC8vIC0tLSBQcm92aWRlci1zcGVjaWZpYyBBUEkga2V5IGZpZWxkcyAtLS1cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXIgPT09IFwiZ2xhZGlhXCIpIHtcbiAgICAgIHRoaXMuYWRkQXBpS2V5RmllbGQoY29udGFpbmVyRWwsIFwiR2xhZGlhIEFQSSBLZXlcIiwgXCJnbGFkaWFBcGlLZXlcIik7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm92aWRlciA9PT0gXCJkZWVwZ3JhbVwiKSB7XG4gICAgICB0aGlzLmFkZEFwaUtleUZpZWxkKGNvbnRhaW5lckVsLCBcIkRlZXBncmFtIEFQSSBLZXlcIiwgXCJkZWVwZ3JhbUFwaUtleVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRBcGlLZXlGaWVsZChcbiAgICAgICAgY29udGFpbmVyRWwsXG4gICAgICAgIFwiQXNzZW1ibHlBSSBBUEkgS2V5XCIsXG4gICAgICAgIFwiYXNzZW1ibHlhaUFwaUtleVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm92aWRlciA9PT0gXCJhc3NlbWJseWFpXCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIk1vZGVsb1wiKVxuICAgICAgICAuc2V0RGVzYyhcIlVuaXZlcnNhbC0zIFBybzogbVx1MDBFMXhpbWEgcHJlY2lzaVx1MDBGM24sIGRpYXJpemFjaVx1MDBGM24gZGUgaGFibGFudGVzIGF2YW56YWRhLiBVbml2ZXJzYWwtMjogbVx1MDBFMXMgclx1MDBFMXBpZG8geSBlY29uXHUwMEYzbWljby5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cbiAgICAgICAgICBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbihcInVuaXZlcnNhbC0zLXByb1wiLCBcIlVuaXZlcnNhbC0zIFByb1wiKVxuICAgICAgICAgICAgLmFkZE9wdGlvbihcInVuaXZlcnNhbC0yXCIsIFwiVW5pdmVyc2FsLTJcIilcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWwpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHY6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NlbWJseWFpTW9kZWwgPSB2IGFzXG4gICAgICAgICAgICAgICAgfCBcInVuaXZlcnNhbC0yXCJcbiAgICAgICAgICAgICAgICB8IFwidW5pdmVyc2FsLTMtcHJvXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTaG93IGFsbCBrZXlzIGluIGFuIGFkdmFuY2VkIHNlY3Rpb25cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJUb2RhcyBsYXMgQVBJIEtleXNcIiB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJMYXMgY2xhdmVzIHNlIGFsbWFjZW5hbiBsb2NhbG1lbnRlIGVuIGxvcyBkYXRvcyBkZWwgcGx1Z2luLlwiLFxuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJHbGFkaWFcIiwgXCJnbGFkaWFBcGlLZXlcIik7XG4gICAgdGhpcy5hZGRBcGlLZXlGaWVsZChjb250YWluZXJFbCwgXCJEZWVwZ3JhbVwiLCBcImRlZXBncmFtQXBpS2V5XCIpO1xuICAgIHRoaXMuYWRkQXBpS2V5RmllbGQoY29udGFpbmVyRWwsIFwiQXNzZW1ibHlBSVwiLCBcImFzc2VtYmx5YWlBcGlLZXlcIik7XG5cbiAgICBjb25zdCBMQU5HVUFHRVM6IHsgdmFsdWU6IHN0cmluZzsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcImVzXCIsIGxhYmVsOiBcIkVzcGFcdTAwRjFvbFwiIH0sXG4gICAgICB7IHZhbHVlOiBcImVuXCIsIGxhYmVsOiBcIkVuZ2xpc2hcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJwdFwiLCBsYWJlbDogXCJQb3J0dWd1XHUwMEVBc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImZyXCIsIGxhYmVsOiBcIkZyYW5cdTAwRTdhaXNcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJkZVwiLCBsYWJlbDogXCJEZXV0c2NoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaXRcIiwgbGFiZWw6IFwiSXRhbGlhbm9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJqYVwiLCBsYWJlbDogXCJcdTY1RTVcdTY3MkNcdThBOUVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJ6aFwiLCBsYWJlbDogXCJcdTRFMkRcdTY1ODdcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJhclwiLCBsYWJlbDogXCJcdTA2MjdcdTA2NDRcdTA2MzlcdTA2MzFcdTA2MjhcdTA2NEFcdTA2MjlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJydVwiLCBsYWJlbDogXCJcdTA0MjBcdTA0NDNcdTA0NDFcdTA0NDFcdTA0M0FcdTA0MzhcdTA0MzlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaVwiLCBsYWJlbDogXCJcdTA5MzlcdTA5M0ZcdTA5MjhcdTA5NERcdTA5MjZcdTA5NDBcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJubFwiLCBsYWJlbDogXCJOZWRlcmxhbmRzXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwicGxcIiwgbGFiZWw6IFwiUG9sc2tpXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwidHJcIiwgbGFiZWw6IFwiVFx1MDBGQ3JrXHUwMEU3ZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImtvXCIsIGxhYmVsOiBcIlx1RDU1Q1x1QUQ2RFx1QzVCNFwiIH0sXG4gICAgXTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJZGlvbWFcIilcbiAgICAgIC5zZXREZXNjKFwiSWRpb21hIGRlbCBhdWRpbyBhIHRyYW5zY3JpYmlyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgeyB2YWx1ZSwgbGFiZWwgfSBvZiBMQU5HVUFHRVMpIHtcbiAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24odmFsdWUsIGxhYmVsKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0TGFuZ3VhZ2UpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYW5ndWFnZSA9IHY7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluc2VydGFyIGVuIGNhbGxvdXRcIilcbiAgICAgIC5zZXREZXNjKFwiSW5zZXJ0YXIgbGEgdHJhbnNjcmlwY2lcdTAwRjNuIGRlbnRybyBkZSB1biBibG9xdWUgPlshdHJhbnNjcmlwdGlvbl1cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluc2VydEFzQ2FsbG91dClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnNlcnRBc0NhbGxvdXQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBcGlLZXlGaWVsZChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBrZXk6IFwiZ2xhZGlhQXBpS2V5XCIgfCBcImRlZXBncmFtQXBpS2V5XCIgfCBcImFzc2VtYmx5YWlBcGlLZXlcIlxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpLnNldE5hbWUobmFtZSkuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJJbmdyZXNhIHR1IEFQSSBrZXlcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0pO1xuICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG5cbiAgICAgIGNvbnN0IHRvZ2dsZUJ0biA9IHRleHQuaW5wdXRFbC5wYXJlbnRFbGVtZW50Py5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IFwiTW9zdHJhclwiLFxuICAgICAgICBjbHM6IFwiYXVkaW8tdHJhbnNjcmlwdC10b2dnbGUta2V5XCIsXG4gICAgICB9KTtcbiAgICAgIGlmICh0b2dnbGVCdG4pIHtcbiAgICAgICAgdG9nZ2xlQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNQYXNzd29yZCA9IHRleHQuaW5wdXRFbC50eXBlID09PSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBpc1Bhc3N3b3JkID8gXCJ0ZXh0XCIgOiBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdG9nZ2xlQnRuLnRleHRDb250ZW50ID0gaXNQYXNzd29yZCA/IFwiT2N1bHRhclwiIDogXCJNb3N0cmFyXCI7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgVXR0ZXJhbmNlIHtcbiAgc3BlYWtlcjogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zY3JpcHRpb25PcHRpb25zIHtcbiAgc3BlYWtlck5hbWVzOiBzdHJpbmdbXTtcbiAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBtb2RlbD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTcGVha2VyTWFwcGluZyB7XG4gIGNvdW50OiBudW1iZXI7XG4gIG5hbWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IHR5cGUgVHJhbnNjcmlwdGlvblByb3ZpZGVyID0gXCJnbGFkaWFcIiB8IFwiZGVlcGdyYW1cIiB8IFwiYXNzZW1ibHlhaVwiO1xuXG5leHBvcnQgY29uc3QgUFJPVklERVJTOiB7IHZhbHVlOiBUcmFuc2NyaXB0aW9uUHJvdmlkZXI7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICB7IHZhbHVlOiBcImdsYWRpYVwiLCBsYWJlbDogXCJHbGFkaWFcIiB9LFxuICB7IHZhbHVlOiBcImRlZXBncmFtXCIsIGxhYmVsOiBcIkRlZXBncmFtXCIgfSxcbiAgeyB2YWx1ZTogXCJhc3NlbWJseWFpXCIsIGxhYmVsOiBcIkFzc2VtYmx5QUlcIiB9LFxuXTtcbiIsICJleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoUmV0cnkoXG4gIGlucHV0OiBSZXF1ZXN0SW5mbyxcbiAgaW5pdDogUmVxdWVzdEluaXQsXG4gIHJldHJpZXMgPSAzXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDw9IHJldHJpZXM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChpbnB1dCwgaW5pdCk7XG4gICAgICBpZiAocmVzLm9rIHx8IChyZXMuc3RhdHVzIDwgNTAwICYmIHJlcy5zdGF0dXMgIT09IDQyOSkpIHJldHVybiByZXM7XG4gICAgICBpZiAoYXR0ZW1wdCA8IHJldHJpZXMpIHtcbiAgICAgICAgYXdhaXQgc2xlZXAoMTAwMCAqIChhdHRlbXB0ICsgMSkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGVyci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgdGhyb3cgZXJyO1xuICAgICAgaWYgKGF0dGVtcHQgPCByZXRyaWVzKSB7XG4gICAgICAgIGF3YWl0IHNsZWVwKDEwMDAgKiAoYXR0ZW1wdCArIDEpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcImZldGNoV2l0aFJldHJ5OiB1bnJlYWNoYWJsZVwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgcmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKSk7XG4gICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICB9KTtcbn1cbiIsICJpbXBvcnQgeyBUcmFuc2NyaWJlciB9IGZyb20gXCIuLi90cmFuc2NyaWJlclwiO1xuaW1wb3J0IHsgVXR0ZXJhbmNlLCBUcmFuc2NyaXB0aW9uT3B0aW9ucyB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmV0Y2hXaXRoUmV0cnksIHNsZWVwIH0gZnJvbSBcIi4uL2ZldGNoLXV0aWxzXCI7XG5cbmludGVyZmFjZSBHbGFkaWFFcnJvciB7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgR2xhZGlhVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkdsYWRpYVwiO1xuXG4gIGFzeW5jIHRyYW5zY3JpYmUoXG4gICAgYXVkaW9CbG9iOiBCbG9iLFxuICAgIGFwaUtleTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFRyYW5zY3JpcHRpb25PcHRpb25zXG4gICk6IFByb21pc2U8VXR0ZXJhbmNlW10+IHtcbiAgICBjb25zdCBiYXNlVXJsID0gXCJodHRwczovL2FwaS5nbGFkaWEuaW8vdjJcIjtcbiAgICBjb25zdCBzaWduYWwgPSBvcHRpb25zLnNpZ25hbDtcblxuICAgIGNvbnN0IGF1ZGlvVXJsID0gYXdhaXQgdGhpcy51cGxvYWQoYXVkaW9CbG9iLCBhcGlLZXksIGJhc2VVcmwsIHNpZ25hbCk7XG5cbiAgICBjb25zdCByZXN1bHRVcmwgPSBhd2FpdCB0aGlzLnJlcXVlc3RUcmFuc2NyaXB0aW9uKFxuICAgICAgYXVkaW9VcmwsXG4gICAgICBhcGlLZXksXG4gICAgICBiYXNlVXJsLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wb2xsUmVzdWx0KHJlc3VsdFVybCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB1cGxvYWQoXG4gICAgYmxvYjogQmxvYixcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmb3JtID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybS5hcHBlbmQoXCJhdWRpb1wiLCBibG9iKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke2Jhc2VVcmx9L3VwbG9hZGAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSB9LFxuICAgICAgYm9keTogZm9ybSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcblxuICAgIGlmICghcmVzLm9rKSB7XG4gICAgICBjb25zdCBlcnIgPSAoYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKSkgYXMgR2xhZGlhRXJyb3IgfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgR2xhZGlhIHVwbG9hZCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8ubWVzc2FnZSA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBhdWRpb191cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLmF1ZGlvX3VybDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdFRyYW5zY3JpcHRpb24oXG4gICAgYXVkaW9Vcmw6IHN0cmluZyxcbiAgICBhcGlLZXk6IHN0cmluZyxcbiAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBkaWFyaXphdGlvbjogdHJ1ZSxcbiAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuZGlhcml6YXRpb25fY29uZmlnID0ge1xuICAgICAgICBudW1iZXJfb2Zfc3BlYWtlcnM6IG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0vdHJhbnNjcmlwdGlvbmAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwieC1nbGFkaWEta2V5XCI6IGFwaUtleSxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgICBzaWduYWw6IG9wdGlvbnMuc2lnbmFsLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnN0IGVyciA9IChhd2FpdCByZXMuanNvbigpLmNhdGNoKCgpID0+IG51bGwpKSBhcyBHbGFkaWFFcnJvciB8IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBHbGFkaWEgdHJhbnNjcmlwdGlvbiByZXF1ZXN0IGZhaWxlZCAoJHtyZXMuc3RhdHVzfSk6ICR7ZXJyPy5tZXNzYWdlID8/IFwidW5rbm93blwifWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyB7IGlkOiBzdHJpbmc7IHJlc3VsdF91cmw6IHN0cmluZyB9O1xuICAgIHJldHVybiBkYXRhLnJlc3VsdF91cmw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvbGxSZXN1bHQoXG4gICAgcmVzdWx0VXJsOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShyZXN1bHRVcmwsIHtcbiAgICAgICAgaGVhZGVyczogeyBcIngtZ2xhZGlhLWtleVwiOiBhcGlLZXkgfSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2xhZGlhIHBvbGxpbmcgZmFpbGVkICgke3Jlcy5zdGF0dXN9KWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHtcbiAgICAgICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgICAgIHJlc3VsdD86IHtcbiAgICAgICAgICB0cmFuc2NyaXB0aW9uPzoge1xuICAgICAgICAgICAgdXR0ZXJhbmNlcz86IEFycmF5PHtcbiAgICAgICAgICAgICAgc3BlYWtlcjogbnVtYmVyO1xuICAgICAgICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgICAgICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgICAgICAgICAgIGVuZDogbnVtYmVyO1xuICAgICAgICAgICAgfT47XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJkb25lXCIpIHtcbiAgICAgICAgY29uc3QgdXR0ZXJhbmNlcyA9IGRhdGEucmVzdWx0Py50cmFuc2NyaXB0aW9uPy51dHRlcmFuY2VzID8/IFtdO1xuICAgICAgICByZXR1cm4gdXR0ZXJhbmNlcy5tYXAoKHUpID0+ICh7XG4gICAgICAgICAgc3BlYWtlcjogdS5zcGVha2VyLFxuICAgICAgICAgIHRleHQ6IHUudGV4dC50cmltKCksXG4gICAgICAgICAgc3RhcnQ6IHUuc3RhcnQsXG4gICAgICAgICAgZW5kOiB1LmVuZCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbGFkaWEgdHJhbnNjcmlwdGlvbiBmYWlsZWRcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMDAsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiR2xhZGlhIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIERlZXBncmFtVHJhbnNjcmliZXIgaW1wbGVtZW50cyBUcmFuc2NyaWJlciB7XG4gIHJlYWRvbmx5IG5hbWUgPSBcIkRlZXBncmFtXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoe1xuICAgICAgZGlhcml6ZTogXCJ0cnVlXCIsXG4gICAgICBzbWFydF9mb3JtYXQ6IFwidHJ1ZVwiLFxuICAgICAgdXR0ZXJhbmNlczogXCJ0cnVlXCIsXG4gICAgfSk7XG5cbiAgICBpZiAob3B0aW9ucy5sYW5ndWFnZSkge1xuICAgICAgcGFyYW1zLnNldChcImxhbmd1YWdlXCIsIG9wdGlvbnMubGFuZ3VhZ2UpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMuc2V0KFwiZGlhcml6ZV92ZXJzaW9uXCIsIFwiMjAyNC0wMS0yNlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZGVlcGdyYW0uY29tL3YxL2xpc3Rlbj8ke3BhcmFtcy50b1N0cmluZygpfWA7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IGBUb2tlbiAke2FwaUtleX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBhdWRpb0Jsb2IudHlwZSB8fCBcImF1ZGlvL3dhdlwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IGF1ZGlvQmxvYixcbiAgICAgIHNpZ25hbDogb3B0aW9ucy5zaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlcy5vaykge1xuICAgICAgY29uc3QgZXJyID0gKGF3YWl0IHJlcy5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIHtcbiAgICAgICAgZXJyX21zZz86IHN0cmluZztcbiAgICAgIH0gfCBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRGVlcGdyYW0gcmVxdWVzdCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycj8uZXJyX21zZyA/PyBcInVua25vd25cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgRGVlcGdyYW1SZXNwb25zZTtcbiAgICBjb25zdCByYXcgPSBkYXRhLnJlc3VsdHM/LnV0dGVyYW5jZXM7XG5cbiAgICBpZiAoIXJhdyB8fCByYXcubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiRGVlcGdyYW0gcmV0dXJuZWQgbm8gZGlhcml6ZWQgdXR0ZXJhbmNlcy4gVGhlIGF1ZGlvIG1heSBoYXZlIG9ubHkgb25lIHNwZWFrZXIgb3IgZGlhcml6YXRpb24gaXMgbm90IGF2YWlsYWJsZS5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmF3Lm1hcCgodSkgPT4gKHtcbiAgICAgIHNwZWFrZXI6ICh1LnNwZWFrZXIgPz8gMCkgKyAxLCAvLyBEZWVwZ3JhbSB1c2VzIDAtYmFzZWQgc3BlYWtlcnNcbiAgICAgIHRleHQ6IHUudHJhbnNjcmlwdD8udHJpbSgpID8/IFwiXCIsXG4gICAgICBzdGFydDogdS5zdGFydCA/PyAwLFxuICAgICAgZW5kOiB1LmVuZCA/PyAwLFxuICAgIH0pKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1VdHRlcmFuY2Uge1xuICBzcGVha2VyPzogbnVtYmVyO1xuICB0cmFuc2NyaXB0Pzogc3RyaW5nO1xuICBzdGFydD86IG51bWJlcjtcbiAgZW5kPzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgRGVlcGdyYW1SZXNwb25zZSB7XG4gIHJlc3VsdHM/OiB7XG4gICAgdXR0ZXJhbmNlcz86IERlZXBncmFtVXR0ZXJhbmNlW107XG4gIH07XG59XG4iLCAiaW1wb3J0IHsgVHJhbnNjcmliZXIgfSBmcm9tIFwiLi4vdHJhbnNjcmliZXJcIjtcbmltcG9ydCB7IFV0dGVyYW5jZSwgVHJhbnNjcmlwdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGZldGNoV2l0aFJldHJ5LCBzbGVlcCB9IGZyb20gXCIuLi9mZXRjaC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgQXNzZW1ibHlBSVRyYW5zY3JpYmVyIGltcGxlbWVudHMgVHJhbnNjcmliZXIge1xuICByZWFkb25seSBuYW1lID0gXCJBc3NlbWJseUFJXCI7XG5cbiAgYXN5bmMgdHJhbnNjcmliZShcbiAgICBhdWRpb0Jsb2I6IEJsb2IsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogVHJhbnNjcmlwdGlvbk9wdGlvbnNcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IHNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsO1xuICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICBhdXRob3JpemF0aW9uOiBhcGlLZXksXG4gICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9O1xuXG4gICAgLy8gMS4gVXBsb2FkIGF1ZGlvXG4gICAgY29uc3QgdXBsb2FkUmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2FwaS5hc3NlbWJseWFpLmNvbS92Mi91cGxvYWRcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHsgYXV0aG9yaXphdGlvbjogYXBpS2V5IH0sXG4gICAgICBib2R5OiBhdWRpb0Jsb2IsXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG5cbiAgICBpZiAoIXVwbG9hZFJlcy5vaykge1xuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHVwbG9hZFJlcy50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBBc3NlbWJseUFJIHVwbG9hZCBmYWlsZWQgKCR7dXBsb2FkUmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdXBsb2FkX3VybDogYXVkaW9VcmwgfSA9IChhd2FpdCB1cGxvYWRSZXMuanNvbigpKSBhcyB7XG4gICAgICB1cGxvYWRfdXJsOiBzdHJpbmc7XG4gICAgfTtcblxuICAgIC8vIDIuIFN0YXJ0IHRyYW5zY3JpcHRpb25cbiAgICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGF1ZGlvX3VybDogYXVkaW9VcmwsXG4gICAgICBzcGVlY2hfbW9kZWxzOiBbb3B0aW9ucy5tb2RlbCB8fCBcInVuaXZlcnNhbC0yXCJdLFxuICAgICAgc3BlYWtlcl9sYWJlbHM6IHRydWUsXG4gICAgICBsYW5ndWFnZV9jb2RlOiBvcHRpb25zLmxhbmd1YWdlIHx8IFwiZXNcIixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuc3BlYWtlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJvZHkuc3BlYWtlcnNfZXhwZWN0ZWQgPSBvcHRpb25zLnNwZWFrZXJOYW1lcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhcnRSZXMgPSBhd2FpdCBmZXRjaChcbiAgICAgIFwiaHR0cHM6Ly9hcGkuYXNzZW1ibHlhaS5jb20vdjIvdHJhbnNjcmlwdFwiLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXN0YXJ0UmVzLm9rKSB7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgc3RhcnRSZXMudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQXNzZW1ibHlBSSB0cmFuc2NyaXB0aW9uIHJlcXVlc3QgZmFpbGVkICgke3N0YXJ0UmVzLnN0YXR1c30pOiAke2JvZHkuc2xpY2UoMCwgMjAwKX1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgaWQgfSA9IChhd2FpdCBzdGFydFJlcy5qc29uKCkpIGFzIHsgaWQ6IHN0cmluZyB9O1xuXG4gICAgLy8gMy4gUG9sbCB1bnRpbCBkb25lXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9sbChpZCwgYXBpS2V5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb2xsKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgYXBpS2V5OiBzdHJpbmcsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWxcbiAgKTogUHJvbWlzZTxVdHRlcmFuY2VbXT4ge1xuICAgIGNvbnN0IG1heEF0dGVtcHRzID0gMTIwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShcbiAgICAgICAgYGh0dHBzOi8vYXBpLmFzc2VtYmx5YWkuY29tL3YyL3RyYW5zY3JpcHQvJHtpZH1gLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogeyBhdXRob3JpemF0aW9uOiBhcGlLZXkgfSxcbiAgICAgICAgICBzaWduYWwsXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZW1ibHlBSSBwb2xsaW5nIGZhaWxlZCAoJHtyZXMuc3RhdHVzfSlgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyBBc3NlbWJseUFJUmVzcG9uc2U7XG5cbiAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgICByZXR1cm4gKGRhdGEudXR0ZXJhbmNlcyA/PyBbXSkubWFwKCh1KSA9PiAoe1xuICAgICAgICAgIHNwZWFrZXI6IHRoaXMuc3BlYWtlckxhYmVsVG9OdW1iZXIodS5zcGVha2VyKSxcbiAgICAgICAgICB0ZXh0OiB1LnRleHQudHJpbSgpLFxuICAgICAgICAgIHN0YXJ0OiB1LnN0YXJ0IC8gMTAwMCxcbiAgICAgICAgICBlbmQ6IHUuZW5kIC8gMTAwMCxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEFzc2VtYmx5QUkgdHJhbnNjcmlwdGlvbiBlcnJvcjogJHtkYXRhLmVycm9yID8/IFwidW5rbm93blwifWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2xlZXAoMTAwMCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlbWJseUFJIHRyYW5zY3JpcHRpb24gdGltZWQgb3V0XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzcGVha2VyTGFiZWxUb051bWJlcihsYWJlbDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbGFiZWwudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApIC0gNjQ7XG4gIH1cbn1cblxuaW50ZXJmYWNlIEFzc2VtYmx5QUlVdHRlcmFuY2Uge1xuICBzcGVha2VyOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhcnQ6IG51bWJlcjsgLy8gbXNcbiAgZW5kOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBBc3NlbWJseUFJUmVzcG9uc2Uge1xuICBzdGF0dXM6IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIHV0dGVyYW5jZXM/OiBBc3NlbWJseUFJVXR0ZXJhbmNlW107XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3BlYWtlck1hcHBpbmcgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgU3BlYWtlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICByZXNvbHZlOiAoKHZhbHVlOiBTcGVha2VyTWFwcGluZyB8IG51bGwpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbmFtZUZpZWxkczogSFRNTElucHV0RWxlbWVudFtdID0gW107XG4gIHByaXZhdGUgbmFtZXNDb250YWluZXI6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgb3BlbigpOiBQcm9taXNlPFNwZWFrZXJNYXBwaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29uZmlndXJhY2lcdTAwRjNuIGRlIGhhYmxhbnRlc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJOXHUwMEZBbWVybyBkZSBoYWJsYW50ZXNcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIyXCIpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuaW5wdXRFbC5taW4gPSBcIjFcIjtcbiAgICAgICAgdGV4dC5pbnB1dEVsLm1heCA9IFwiMTBcIjtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShcIjJcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoKHZhbHVlKSA9PiB0aGlzLnJlbmRlck5hbWVGaWVsZHMoTnVtYmVyKHZhbHVlKSB8fCAyKSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMubmFtZXNDb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFxuICAgICAgXCJhdWRpby10cmFuc2NyaXB0LXNwZWFrZXItbmFtZXNcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpLmFkZEJ1dHRvbigoYnRuKSA9PlxuICAgICAgYnRuXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiSW5pY2lhciB0cmFuc2NyaXBjaVx1MDBGM25cIilcbiAgICAgICAgLnNldEN0YSgpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHRoaXMuc3VibWl0KCkpXG4gICAgKTtcblxuICAgIHRoaXMucmVuZGVyTmFtZUZpZWxkcygyKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTmFtZUZpZWxkcyhjb3VudDogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLm5hbWVzQ29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5uYW1lc0NvbnRhaW5lci5lbXB0eSgpO1xuICAgIHRoaXMubmFtZUZpZWxkcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCByb3cgPSB0aGlzLm5hbWVzQ29udGFpbmVyLmNyZWF0ZURpdihcbiAgICAgICAgICBcImF1ZGlvLXRyYW5zY3JpcHQtc3BlYWtlci1yb3dcIlxuICAgICAgKTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogYEhhYmxhbnRlICR7aSArIDF9YCB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IGBOb21icmUgZGVsIGhhYmxhbnRlICR7aSArIDF9YCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5uYW1lRmllbGRzLnB1c2goaW5wdXQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3VibWl0KCkge1xuICAgIGNvbnN0IG5hbWVzID0gdGhpcy5uYW1lRmllbGRzLm1hcChcbiAgICAgIChmLCBpKSA9PiBmLnZhbHVlLnRyaW0oKSB8fCBgU3BlYWtlciAke2kgKyAxfWBcbiAgICApO1xuICAgIHRoaXMucmVzb2x2ZT8uKHsgY291bnQ6IG5hbWVzLmxlbmd0aCwgbmFtZXMgfSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5yZXNvbHZlKSB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLnJlc29sdmUgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIENob2ljZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmU6ICgoY2hvaWNlOiBcInJlY29yZFwiIHwgXCJmaWxlXCIgfCBudWxsKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIG9wZW4oKTogUHJvbWlzZTxcInJlY29yZFwiIHwgXCJmaWxlXCIgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgc3VwZXIub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTAwQkZRdVx1MDBFOSBxdWllcmVzIGhhY2VyP1wiIH0pO1xuXG4gICAgY29uc3QgYnRuQ29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBhdHRyOiB7IHN0eWxlOiBcImRpc3BsYXk6IGZsZXg7IGdhcDogMTJweDsgbWFyZ2luLXRvcDogMTZweDtcIiB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVjb3JkQnRuID0gYnRuQ29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiXHVEODNDXHVERjk5XHVGRTBGIEdyYWJhciBhdWRpb1wiLFxuICAgICAgY2xzOiBcIm1vZC1jdGFcIixcbiAgICB9KTtcbiAgICByZWNvcmRCdG4uc3R5bGUuZmxleCA9IFwiMVwiO1xuICAgIHJlY29yZEJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlPy4oXCJyZWNvcmRcIik7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGZpbGVCdG4gPSBidG5Db250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgdGV4dDogXCJcdUQ4M0RcdURDQzEgRWxlZ2lyIGFyY2hpdm9cIixcbiAgICB9KTtcbiAgICBmaWxlQnRuLnN0eWxlLmZsZXggPSBcIjFcIjtcbiAgICBmaWxlQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmU/LihcImZpbGVcIik7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5yZXNvbHZlKSB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLnJlc29sdmUgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIFJlY29yZGluZ01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGNodW5rczogQmxvYltdID0gW107XG4gIHByaXZhdGUgbWVkaWFSZWNvcmRlcjogTWVkaWFSZWNvcmRlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0cmVhbTogTWVkaWFTdHJlYW0gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzZWNvbmRzID0gMDtcbiAgcHJpdmF0ZSB0aW1lckludGVydmFsOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRJbnRlcnZhbD4gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0aW1lckVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0YXR1c0VsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlc29sdmU6ICgoYmxvYjogQmxvYiB8IG51bGwpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgc3RhcnQoKTogUHJvbWlzZTxCbG9iIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XG4gICAgICAgICAgYXVkaW86IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJObyBzZSBwdWRvIGFjY2VkZXIgYWwgbWljclx1MDBGM2Zvbm8uIFZlcmlmaWNhIGxvcyBwZXJtaXNvcy5cIik7XG4gICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWltZVR5cGUgPSBNZWRpYVJlY29yZGVyLmlzVHlwZVN1cHBvcnRlZChcImF1ZGlvL3dlYm07Y29kZWNzPW9wdXNcIilcbiAgICAgICAgPyBcImF1ZGlvL3dlYm07Y29kZWNzPW9wdXNcIlxuICAgICAgICA6IE1lZGlhUmVjb3JkZXIuaXNUeXBlU3VwcG9ydGVkKFwiYXVkaW8vd2VibVwiKVxuICAgICAgICA/IFwiYXVkaW8vd2VibVwiXG4gICAgICAgIDogTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoXCJhdWRpby9tcDRcIilcbiAgICAgICAgPyBcImF1ZGlvL21wNFwiXG4gICAgICAgIDogTWVkaWFSZWNvcmRlci5pc1R5cGVTdXBwb3J0ZWQoXCJhdWRpby9hYWNcIilcbiAgICAgICAgPyBcImF1ZGlvL2FhY1wiXG4gICAgICAgIDogXCJhdWRpby9vZ2c7Y29kZWNzPW9wdXNcIjtcblxuICAgICAgdGhpcy5tZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIodGhpcy5zdHJlYW0sIHsgbWltZVR5cGUgfSk7XG4gICAgICB0aGlzLmNodW5rcyA9IFtdO1xuXG4gICAgICB0aGlzLm1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGUpID0+IHtcbiAgICAgICAgaWYgKGUuZGF0YS5zaXplID4gMCkgdGhpcy5jaHVua3MucHVzaChlLmRhdGEpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5tZWRpYVJlY29yZGVyLm9uc3RvcCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYih0aGlzLmNodW5rcywgeyB0eXBlOiBtaW1lVHlwZSB9KTtcbiAgICAgICAgdGhpcy5yZXNvbHZlPy4oYmxvYik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICAgIHRoaXMuc3RhcnRUaW1lcigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJHcmFiYW5kby4uLlwiIH0pO1xuXG4gICAgdGhpcy5zdGF0dXNFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcImF1ZGlvLXRyYW5zY3JpcHQtc3RhdHVzIGxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiXHUyNUNGIEdyYWJhbmRvXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLnRpbWVyRWwgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiMDA6MDBcIixcbiAgICAgIGF0dHI6IHsgc3R5bGU6IFwiZm9udC1zaXplOiAyZW07IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luOiAxNnB4IDA7XCIgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbCkuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEZXRlbmVyIGdyYWJhY2lcdTAwRjNuXCIpXG4gICAgICAgIC5zZXRXYXJuaW5nKClcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5zdG9wUmVjb3JkaW5nKCkpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnRUaW1lcigpIHtcbiAgICB0aGlzLnNlY29uZHMgPSAwO1xuICAgIHRoaXMudGltZXJJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMuc2Vjb25kcysrO1xuICAgICAgaWYgKHRoaXMudGltZXJFbCkge1xuICAgICAgICBjb25zdCBtID0gTWF0aC5mbG9vcih0aGlzLnNlY29uZHMgLyA2MCk7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLnNlY29uZHMgJSA2MDtcbiAgICAgICAgdGhpcy50aW1lckVsLnRleHRDb250ZW50ID1cbiAgICAgICAgICBgJHttLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpfToke3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCBcIjBcIil9YDtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcFJlY29yZGluZygpIHtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXI/LnN0b3AoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cCgpIHtcbiAgICBpZiAodGhpcy50aW1lckludGVydmFsKSBjbGVhckludGVydmFsKHRoaXMudGltZXJJbnRlcnZhbCk7XG4gICAgdGhpcy5zdHJlYW0/LmdldFRyYWNrcygpLmZvckVhY2goKHQpID0+IHQuc3RvcCgpKTtcbiAgICB0aGlzLnN0cmVhbSA9IG51bGw7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyID0gbnVsbDtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5yZXNvbHZlKSB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLnJlc29sdmUgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXVFOzs7QUNBdkUsc0JBQStDOzs7QUNxQnhDLElBQU0sWUFBK0Q7QUFBQSxFQUMxRSxFQUFFLE9BQU8sVUFBVSxPQUFPLFNBQVM7QUFBQSxFQUNuQyxFQUFFLE9BQU8sWUFBWSxPQUFPLFdBQVc7QUFBQSxFQUN2QyxFQUFFLE9BQU8sY0FBYyxPQUFPLGFBQWE7QUFDN0M7OztBRFhPLElBQU0sbUJBQW1DO0FBQUEsRUFDOUMsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQUEsRUFDaEIsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQ25CO0FBRU8sSUFBTSxjQUFOLGNBQTBCLGlDQUFpQjtBQUFBLEVBR2hELFlBQVksS0FBVSxRQUFn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QUFHO0FBQzVDLGVBQUssSUFBSTtBQUFBLFFBQ1g7QUFBQSxNQUNGLEdBQUcsSUFBTztBQUVWLGFBQU8saUJBQWlCLFNBQVMsWUFBWTtBQUM3QyxZQUFNLE1BQU07QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQSxFQUlRLG9CQUNOLFlBQ0EsY0FDUTtBQUNSLFFBQUksV0FBVyxXQUFXLEdBQUc7QUFDM0IsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFFBQVEsV0FBVyxJQUFJLENBQUMsTUFBTTtBQUNsQyxZQUFNLE9BQU8sYUFBYSxFQUFFLFVBQVUsQ0FBQyxLQUFLLFdBQVcsRUFBRSxPQUFPO0FBQ2hFLFlBQU0sT0FBTyxLQUFLLGdCQUFnQixFQUFFLEtBQUs7QUFDekMsYUFBTyxLQUFLLElBQUksUUFBUSxJQUFJO0FBQUEsSUFBYyxFQUFFO0FBQUEsSUFDOUMsQ0FBQztBQUVELFFBQUksS0FBSyxTQUFTLGlCQUFpQjtBQUNqQyxhQUNFLHdDQUNBLE1BQU0sSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLE9BQU87QUFBQSxJQUUzQztBQUVBLFdBQU8sTUFBTSxLQUFLLE1BQU07QUFBQSxFQUMxQjtBQUFBLEVBRVEsZ0JBQWdCLFNBQXlCO0FBQy9DLFVBQU0sSUFBSSxLQUFLLE1BQU0sVUFBVSxFQUFFO0FBQ2pDLFVBQU0sSUFBSSxLQUFLLE1BQU0sVUFBVSxFQUFFO0FBQ2pDLFdBQU8sR0FBRyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQzlDO0FBQUE7QUFBQSxFQUlRLGVBQWUsUUFBZ0IsTUFBYztBQUNuRCxVQUFNLFNBQVMsT0FBTyxVQUFVO0FBQ2hDLFdBQU8sYUFBYSxNQUFNLE1BQU07QUFBQSxFQUNsQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiYm9keSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
