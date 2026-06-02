import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../main";
import { TranscriptionProvider, RecordingSampleRate, RecordingMode, PROVIDERS, DIARIZATION_WARNING } from "./types";
import { PROVIDER_REGISTRY } from "./providers/registry";
import { t, type LocaleStrings } from "./locales";

export interface PluginSettings {
  provider: TranscriptionProvider;
  gladiaApiKey: string;
  deepgramApiKey: string;
  assemblyaiApiKey: string;
  assemblyaiModel: "universal-2" | "universal-3-pro";
  whisperApiKey: string;
  groqApiKey: string;
  whisperLocalUrl: string;
  spobApiKey: string;
  spobBaseUrl: string;
  defaultLanguage: string;
  languageDetection: "auto" | "manual";
  insertAsCallout: boolean;
  outputTemplate: string;
  audioFolder: string;
  recordingSampleRate: RecordingSampleRate;
  recordingMode: RecordingMode;
  saveAudioAfterTranscription: boolean;
}

export const DEFAULT_TEMPLATE = "**{speaker}** {time}\n{text}";

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: "spob",
  gladiaApiKey: "",
  deepgramApiKey: "",
  assemblyaiApiKey: "",
  assemblyaiModel: "universal-3-pro",
  whisperApiKey: "",
  groqApiKey: "",
  whisperLocalUrl: "http://localhost:8080",
  spobApiKey: "",
  spobBaseUrl: "https://spob-backend.fly.dev",
  defaultLanguage: "es",
  languageDetection: "manual",
  insertAsCallout: true,
  outputTemplate: DEFAULT_TEMPLATE,
  audioFolder: "",
  recordingSampleRate: 16000,
  recordingMode: "desktop",
  saveAudioAfterTranscription: true,
};

export class SettingsTab extends PluginSettingTab {
  plugin: DiaryTranscriberPlugin;

  constructor(app: App, plugin: DiaryTranscriberPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const L = (k: keyof LocaleStrings) => t(k, this.plugin.getLocale());

    containerEl.createEl("h2", { text: "Audio Transcript" });

    // ── Provider selector ─────────────────────────────────
    new Setting(containerEl)
      .setName("Proveedor")
      .setDesc("Proveedor de voz a texto")
      .addDropdown((dropdown) => {
        for (const { value, label } of PROVIDERS) {
          dropdown.addOption(value, label);
        }
        dropdown
          .setValue(this.plugin.settings.provider)
          .onChange(async (v: string) => {
            this.plugin.settings.provider = v as TranscriptionProvider;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    const meta = PROVIDER_REGISTRY[this.plugin.settings.provider];

    // ── Diarization warning ────────────────────────────────
    if (!meta.supportsDiarization) {
      const warning = containerEl.createDiv({
        cls: "audio-transcript-warning",
        text: DIARIZATION_WARNING[meta.id] ?? "",
      });
      warning.style.cssText =
        "background: var(--background-modifier-warning); color: var(--text-warning); padding: 8px 12px; border-radius: 4px; margin-bottom: 12px;";
    }

    // ── Provider-specific API key / URL ────────────────────
    if (meta.requiresApiKey) {
      this.addApiKeyField(
        containerEl,
        `${meta.label} API Key`,
        meta.apiKeyField
      );
    } else {
      this.addWhisperLocalUrlField(containerEl);
    }

    // ── Model selector ──────────────────────────────
    if (meta.modelField) {
      this.addModelField(containerEl);
    }

    // ── spob URL ───────────────────────────────────
    if (this.plugin.settings.provider === "spob") {
      new Setting(containerEl)
        .setName("spob Backend URL")
        .setDesc("URL del servidor spob (por defecto localhost:8080)")
        .addText((text) => {
          text
            .setPlaceholder("http://localhost:8080")
            .setValue(this.plugin.settings.spobBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.spobBaseUrl = value;
              await this.plugin.saveSettings();
            });
        });
    }

    // ── Test API Key button ────────────────────────────────
    if (meta.testEndpoint) {
      new Setting(containerEl)
        .setName("Probar conexión")
        .setDesc(`Verifica que la API key de ${meta.label} funciona`)
        .addButton((btn) =>
          btn.setButtonText("Probar").onClick(async () => {
            btn.setDisabled(true);
            btn.setButtonText("Probando...");
            const key = this.plugin.settings[
              meta.apiKeyField
            ] as string;
            const ok = await this.testApiKey(
              meta.testEndpoint!,
              meta.id,
              key
            );
            btn.setButtonText(ok ? "✓ Conectado" : "✗ Falló");
            btn.setDisabled(false);
            setTimeout(() => btn.setButtonText("Probar"), 3000);
          })
        );
    }

    // ── Language ───────────────────────────────────────────
    containerEl.createEl("h3", { text: "Idioma" });

    new Setting(containerEl)
      .setName("Detección de idioma")
      .setDesc(
        "Auto: el proveedor detecta el idioma. Manual: usás el idioma de abajo."
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("manual", "Manual")
          .addOption("auto", "Automática")
          .setValue(this.plugin.settings.languageDetection)
          .onChange(async (v: string) => {
            this.plugin.settings.languageDetection = v as
              | "auto"
              | "manual";
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.languageDetection === "manual") {
      const LANGUAGES: { value: string; label: string }[] = [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
        { value: "pt", label: "Português" },
        { value: "fr", label: "Français" },
        { value: "de", label: "Deutsch" },
        { value: "it", label: "Italiano" },
        { value: "ja", label: "日本語" },
        { value: "zh", label: "中文" },
        { value: "ar", label: "العربية" },
        { value: "ru", label: "Русский" },
        { value: "hi", label: "हिन्दी" },
        { value: "nl", label: "Nederlands" },
        { value: "pl", label: "Polski" },
        { value: "tr", label: "Türkçe" },
        { value: "ko", label: "한국어" },
      ];

      new Setting(containerEl)
        .setName("Idioma predeterminado")
        .setDesc("Idioma del audio a transcribir")
        .addDropdown((dropdown) => {
          for (const { value, label } of LANGUAGES) {
            dropdown.addOption(value, label);
          }
          dropdown
            .setValue(this.plugin.settings.defaultLanguage)
            .onChange(async (v: string) => {
              this.plugin.settings.defaultLanguage = v;
              await this.plugin.saveSettings();
            });
        });
    }

    // ── Output format ──────────────────────────────────────
    containerEl.createEl("h3", { text: "Formato de salida" });

    new Setting(containerEl)
      .setName("Plantilla de salida")
      .setDesc(
        "Variables: {speaker}, {time}, {text}. Cada bloque de hablante se separa con un salto de línea doble."
      )
      .addTextArea((text) => {
        text
          .setPlaceholder(DEFAULT_TEMPLATE)
          .setValue(this.plugin.settings.outputTemplate)
          .onChange(async (value) => {
            this.plugin.settings.outputTemplate =
              value || DEFAULT_TEMPLATE;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 3;
        text.inputEl.style.width = "100%";
      });

    new Setting(containerEl)
      .setName("Insertar en callout")
      .setDesc(
        "Envuelve la transcripción en un bloque >[!transcription] plegable"
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.insertAsCallout)
          .onChange(async (value) => {
            this.plugin.settings.insertAsCallout = value;
            await this.plugin.saveSettings();
          })
      );

    // ── Audio folder ───────────────────────────────────────
    containerEl.createEl("h3", { text: "Archivos de audio" });

    new Setting(containerEl)
      .setName("Carpeta de grabaciones")
      .setDesc(
        "Ruta relativa al vault donde guardar los audios. Vacío = misma carpeta que la nota activa."
      )
      .addText((text) => {
        text
          .setPlaceholder("Ej: Audios/Grabaciones")
          .setValue(this.plugin.settings.audioFolder)
          .onChange(async (value) => {
            this.plugin.settings.audioFolder = value;
            await this.plugin.saveSettings();
          });
      });

    // ── Recording quality ──────────────────────────────────
    new Setting(containerEl)
      .setName(L("recordingQualityLabel"))
      .setDesc(L("recordingQualityDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("16000", L("sampleRate16kHz"))
          .addOption("22050", L("sampleRate22kHz"))
          .addOption("44100", L("sampleRate44kHz"))
          .setValue(String(this.plugin.settings.recordingSampleRate))
          .onChange(async (v: string) => {
            this.plugin.settings.recordingSampleRate = Number(v) as RecordingSampleRate;
            await this.plugin.saveSettings();
          })
      );

    // ── Recording mode ──────────────────────────────────
    new Setting(containerEl)
      .setName("Modo de grabación")
      .setDesc(
        "Desktop: mejor calidad, usa ScriptProcessor + WAV. Mobile: más estable en iOS/Android, usa MediaRecorder nativo."
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("desktop", "Desktop (PC/Mac)")
          .addOption("mobile", "Mobile (iOS/Android)")
          .setValue(this.plugin.settings.recordingMode)
          .onChange(async (v: string) => {
            this.plugin.settings.recordingMode = v as RecordingMode;
            await this.plugin.saveSettings();
          })
      );

    // ── Save audio toggle ──────────────────────────────────
    new Setting(containerEl)
      .setName(L("saveAudioLabel"))
      .setDesc(L("saveAudioDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.saveAudioAfterTranscription)
          .onChange(async (value) => {
            this.plugin.settings.saveAudioAfterTranscription = value;
            await this.plugin.saveSettings();
          })
      );

    // ── All API keys ───────────────────────────────────────
    containerEl.createEl("h3", { text: "Todas las API Keys" });
    containerEl.createEl("p", {
      text: "Las claves se almacenan localmente en los datos del plugin.",
      cls: "setting-item-description",
    });

    this.addApiKeyField(containerEl, "Gladia", "gladiaApiKey");
    this.addApiKeyField(containerEl, "Deepgram", "deepgramApiKey");
    this.addApiKeyField(containerEl, "AssemblyAI", "assemblyaiApiKey");
    this.addApiKeyField(containerEl, "OpenAI Whisper", "whisperApiKey");
    this.addApiKeyField(containerEl, "Groq", "groqApiKey");
    this.addApiKeyField(containerEl, "Smart Plugins Obsidian", "spobApiKey");

    const spobLink = containerEl.createDiv({
      cls: "setting-item-description",
      attr: { style: "margin-top: -8px; margin-bottom: 16px;" },
    });
    spobLink.createEl("a", {
      text: "Obtén tu API key en spob-backend.fly.dev →",
      href: "https://spob-backend.fly.dev",
    });

    this.addWhisperLocalUrlField(containerEl, true);

    // ── Support ───────────────────────────────────────────
    const support = containerEl.createDiv({
      attr: {
        style:
          "margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--background-modifier-border); text-align: center;",
      },
    });
    support.createEl("a", {
      text: "☕ Support this plugin",
      href: "https://paypal.me/jesusgarciapsi",
    });
    support.createEl("span", {
      text: " · Free and open source",
      cls: "setting-item-description",
    });
  }

  // ── Helpers ────────────────────────────────────────────

  private addApiKeyField(
    container: HTMLElement,
    name: string,
    key: keyof PluginSettings
  ): void {
    new Setting(container).setName(name).addText((text) => {
      text
        .setPlaceholder("Ingresa tu API key")
        .setValue(String(this.plugin.settings[key] ?? ""));
      text.inputEl.type = "password";

      const toggleBtn = text.inputEl.parentElement?.createEl("button", {
        text: "Mostrar",
        cls: "audio-transcript-toggle-key",
      });
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const isPassword = text.inputEl.type === "password";
          text.inputEl.type = isPassword ? "text" : "password";
          toggleBtn.textContent = isPassword ? "Ocultar" : "Mostrar";
        };
      }

      text.onChange(async (value) => {
        (this.plugin.settings as unknown as Record<string, string>)[key] = value;
        await this.plugin.saveSettings();
      });
    });
  }

  private addWhisperLocalUrlField(
    container: HTMLElement,
    showLabel = false
  ): void {
    new Setting(container)
      .setName(showLabel ? "Whisper Local URL" : "URL del servidor")
      .setDesc("URL del servidor whisper.cpp (ej: http://localhost:8080)")
      .addText((text) => {
        text
          .setPlaceholder("http://localhost:8080")
          .setValue(this.plugin.settings.whisperLocalUrl)
          .onChange(async (value) => {
            this.plugin.settings.whisperLocalUrl = value;
            await this.plugin.saveSettings();
          });
      });
  }

  private addModelField(container: HTMLElement): void {
    new Setting(container)
      .setName("Modelo")
      .setDesc(
        "Universal-3 Pro: máxima precisión, diarización avanzada. Universal-2: más rápido."
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("universal-3-pro", "Universal-3 Pro")
          .addOption("universal-2", "Universal-2")
          .setValue(this.plugin.settings.assemblyaiModel)
          .onChange(async (v: string) => {
            this.plugin.settings.assemblyaiModel = v as
              | "universal-2"
              | "universal-3-pro";
            await this.plugin.saveSettings();
          })
      );
  }

  private async testApiKey(
    endpoint: string,
    provider: TranscriptionProvider,
    key: string
  ): Promise<boolean> {
    try {
      let headers: Record<string, string> = {};
      let url = endpoint;

      switch (provider) {
        case "gladia":
          headers = { "x-gladia-key": key };
          break;
        case "deepgram":
          headers = { Authorization: `Token ${key}` };
          break;
        case "assemblyai":
        case "spob":
          headers = { authorization: key };
          break;
        case "whisper":
        case "groq":
          headers = { Authorization: `Bearer ${key}` };
          break;
      }

      const res = await fetch(url, {
        method: "GET",
        headers,
      });

      // 200/401/403 are valid responses (key works or has wrong scope,
      // but the key format/network is fine). 404/500 = endpoint issue.
      return res.status < 500;
    } catch {
      return false;
    }
  }
}
