import { App, Setting } from "obsidian";
import type { PluginSettings } from "./settings";
import type { RecordingSampleRate, RecordingMode, LLMProvider } from "./types";
import { LLM_PROVIDERS, LLM_MODELS, API_KEY_FIELDS } from "./types";
import type { LocaleStrings } from "./locales";
import {
  addApiKeyField,
  addWhisperLocalUrlField,
  getVaultFolders,
} from "./settings-helpers";

const DEFAULT_TEMPLATE = "**{speaker}** {time}\n{text}";

export function buildCommonSections(
  containerEl: HTMLElement,
  app: App,
  settings: PluginSettings,
  saveSettings: () => Promise<void>,
  render: () => void,
  L: (key: keyof LocaleStrings) => string
): void {
  // Language
  containerEl.createEl("h3", { text: "Idioma" });

  new Setting(containerEl)
    .setName("Deteccion de idioma")
    .setDesc(
      "Auto: el proveedor detecta el idioma. Manual: usas el idioma de abajo."
    )
    .addDropdown((dropdown) =>
      dropdown
        .addOption("manual", "Manual")
        .addOption("auto", "Automatica")
        .setValue(settings.languageDetection)
        .onChange(async (v: string) => {
          settings.languageDetection = v as "auto" | "manual";
          await saveSettings();
          render();
        })
    );

  if (settings.languageDetection === "manual") {
    const LANGUAGES: { value: string; label: string }[] = [
      { value: "es", label: "Espanol" },
      { value: "en", label: "English" },
      { value: "pt", label: "Portugues" },
      { value: "fr", label: "Francais" },
      { value: "de", label: "Deutsch" },
      { value: "it", label: "Italiano" },
      { value: "ja", label: "日本語" },
      { value: "zh", label: "中文" },
      { value: "ar", label: "العربية" },
      { value: "ru", label: "Русский" },
      { value: "hi", label: "हिन्दी" },
      { value: "nl", label: "Nederlands" },
      { value: "pl", label: "Polski" },
      { value: "tr", label: "Turkce" },
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
          .setValue(settings.defaultLanguage)
          .onChange(async (v: string) => {
            settings.defaultLanguage = v;
            await saveSettings();
          });
      });
  }

  // Output format
  containerEl.createEl("h3", { text: "Formato de salida" });

  new Setting(containerEl)
    .setName("Plantilla de salida")
    .setDesc(
      "Variables: {speaker}, {time}, {text}. Cada bloque de hablante se separa con un salto de linea doble."
    )
    .addTextArea((text) => {
      text
        .setPlaceholder(DEFAULT_TEMPLATE)
        .setValue(settings.outputTemplate)
        .onChange(async (value) => {
          settings.outputTemplate = value || DEFAULT_TEMPLATE;
          await saveSettings();
        });
      text.inputEl.rows = 3;
      text.inputEl.setCssProps({ width: "100%" });
    });

  new Setting(containerEl)
    .setName("Insertar en callout")
    .setDesc(
      "Envuelve la transcripcion en un bloque >[!transcription] plegable"
    )
    .addToggle((toggle) =>
      toggle
        .setValue(settings.insertAsCallout)
        .onChange(async (value) => {
          settings.insertAsCallout = value;
          await saveSettings();
        })
    );

  // Audio folder
  containerEl.createEl("h3", { text: "Archivos de audio" });

  new Setting(containerEl)
    .setName("Carpeta de grabaciones")
    .setDesc("Carpeta del vault donde guardar los audios. Elegi una existente.")
    .addDropdown((dropdown) => {
      dropdown.addOption("", "Misma carpeta que la nota activa");
      for (const folder of getVaultFolders(app)) {
        dropdown.addOption(folder, folder);
      }
      dropdown
        .setValue(settings.audioFolder)
        .onChange(async (value) => {
          settings.audioFolder = value;
          await saveSettings();
        });
    });

  // Recording quality
  new Setting(containerEl)
    .setName(L("recordingQualityLabel"))
    .setDesc(L("recordingQualityDesc"))
    .addDropdown((dropdown) =>
      dropdown
        .addOption("16000", L("sampleRate16kHz"))
        .addOption("22050", L("sampleRate22kHz"))
        .addOption("44100", L("sampleRate44kHz"))
        .setValue(String(settings.recordingSampleRate))
        .onChange(async (v: string) => {
          settings.recordingSampleRate = Number(v) as RecordingSampleRate;
          await saveSettings();
        })
    );

  // Recording mode
  new Setting(containerEl)
    .setName("Modo de grabacion")
    .setDesc(
      "Desktop: mejor calidad, usa ScriptProcessor + WAV. Mobile: mas estable en iOS/Android, usa MediaRecorder nativo."
    )
    .addDropdown((dropdown) =>
      dropdown
        .addOption("desktop", "Desktop (PC/Mac)")
        .addOption("mobile", "Mobile (iOS/Android)")
        .setValue(settings.recordingMode)
        .onChange(async (v: string) => {
          settings.recordingMode = v as RecordingMode;
          await saveSettings();
        })
    );

  // Save audio toggle
  new Setting(containerEl)
    .setName(L("saveAudioLabel"))
    .setDesc(L("saveAudioDesc"))
    .addToggle((toggle) =>
      toggle
        .setValue(settings.saveAudioAfterTranscription)
        .onChange(async (value) => {
          settings.saveAudioAfterTranscription = value;
          await saveSettings();
        })
    );

  const save = () => saveSettings();
  const s = settings;

  // LLM Providers
  containerEl.createEl("h3", { text: "IA (Proveedores LLM)" });
  containerEl.createEl("p", {
    text: "Configura los proveedores de IA para chat y resumenes. Elegi cual usar en modo Flash y Advanced.",
    cls: "setting-item-description",
  });

  for (const { value: provider, label } of LLM_PROVIDERS) {
    const apiKeyField = API_KEY_FIELDS[provider] as keyof PluginSettings;
    addApiKeyField(containerEl, s, save, `${label} API Key`, apiKeyField);
    if (provider === "spob") {
      const link = containerEl.createDiv({
        cls: "setting-item-description",
        attr: { style: "margin-top: -8px; margin-bottom: 8px;" },
      });
      link.createEl("a", {
        text: "Obten tu API key y creditos en spob-backend.fly.dev ->",
        href: "https://spob-backend.fly.dev",
      });
    }
  }

  // Flash / Advanced mode
  containerEl.createEl("h3", { text: "Modos de chat" });

  const buildModeSetting = (
    modeLabel: string,
    providerKey: keyof PluginSettings,
    modelKey: keyof PluginSettings
  ) => {
    const currentProvider = (settings[providerKey] as LLMProvider) || "spob";
    const currentModel = (settings[modelKey] as string) || "";

    new Setting(containerEl)
      .setName(`${modeLabel} — Proveedor`)
      .setDesc("Proveedor LLM a usar en este modo")
      .addDropdown((dd) => {
        for (const { value, label } of LLM_PROVIDERS) {
          dd.addOption(value, label);
        }
        dd.setValue(currentProvider).onChange(async (v) => {
          (settings as unknown as Record<string, unknown>)[providerKey] = v;
          await saveSettings();
          render();
        });
      });

    const models = LLM_MODELS[currentProvider] ?? [];
    new Setting(containerEl)
      .setName(`${modeLabel} — Modelo`)
      .setDesc(models.find((m) => m.modelId === currentModel)?.description ?? "")
      .addDropdown((dd) => {
        for (const m of models) {
          dd.addOption(m.modelId, m.label);
        }
        dd.setValue(currentModel || models[0]?.modelId || "").onChange(async (v) => {
          (settings as unknown as Record<string, unknown>)[modelKey] = v;
          await saveSettings();
        });
      });
  };

  buildModeSetting("Flash", "flashProvider", "flashModel");
  buildModeSetting("Advanced", "advancedProvider", "advancedModel");

  // All API keys
  containerEl.createEl("h3", { text: "Todas las API Keys" });
  containerEl.createEl("p", {
    text: "Las claves se almacenan localmente en los datos del plugin.",
    cls: "setting-item-description",
  });

  addApiKeyField(containerEl, s, save, "Gladia", "gladiaApiKey");
  addApiKeyField(containerEl, s, save, "Deepgram", "deepgramApiKey");
  addApiKeyField(containerEl, s, save, "AssemblyAI", "assemblyaiApiKey");
  addApiKeyField(containerEl, s, save, "OpenAI Whisper", "whisperApiKey");
  addApiKeyField(containerEl, s, save, "Groq", "groqApiKey");
  addApiKeyField(containerEl, s, save, "Smart Plugins Obsidian", "spobApiKey");

  const spobLink = containerEl.createDiv({
    cls: "setting-item-description",
    attr: { style: "margin-top: -8px; margin-bottom: 16px;" },
  });
  spobLink.createEl("a", {
    text: "Obten tu API key en spob-backend.fly.dev ->",
    href: "https://spob-backend.fly.dev",
  });

  addWhisperLocalUrlField(containerEl, s, save, true);

  const support = containerEl.createDiv({
    attr: {
      style:
        "margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--background-modifier-border); text-align: center;",
    },
  });
  support.createEl("a", {
    text: ":coffee: Support this plugin",
    href: "https://paypal.me/jesusgarciapsi",
  });
  support.createEl("span", {
    text: " . Free and open source",
    cls: "setting-item-description",
  });
}
