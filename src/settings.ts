import { App, PluginSettingTab, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../main";
import { TranscriptionProvider, RecordingSampleRate, RecordingMode, PROVIDERS, DIARIZATION_WARNING, LLMProvider, PromptTemplate, DEFAULT_TEMPLATES, ChatSession } from "./types";
import { PROVIDER_REGISTRY } from "./providers/registry";
import { t, type LocaleStrings } from "./locales";
import {
  addApiKeyField,
  addWhisperLocalUrlField,
  addModelField,
  testApiKey,
} from "./settings-helpers";
import { buildCommonSections } from "./settings-sections";
import { hasSpobApi } from "./premium/auto-summarize";

export interface PluginSettings {
  provider: TranscriptionProvider;
  gladiaApiKey: string;
  deepgramApiKey: string;
  assemblyaiApiKey: string;
  assemblyaiModel: "universal-2" | "universal-3-pro";
  gladiaModel: "solaria-1" | "solaria-3";
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
  openaiApiKey: string;
  anthropicApiKey: string;
  deepseekApiKey: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  grokApiKey: string;
  glmApiKey: string;
  flashProvider: LLMProvider;
  flashModel: string;
  advancedProvider: LLMProvider;
  advancedModel: string;
  promptTemplates: PromptTemplate[];
  chatHistory: ChatSession[];
  autoSummarize: boolean;
  autoSummarizeTemplate: string;
  lastSeenVersion: string;
}

export const DEFAULT_TEMPLATE = "**{speaker}** {time}\n{text}";

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: "spob",
  gladiaApiKey: "",
  deepgramApiKey: "",
  assemblyaiApiKey: "",
  assemblyaiModel: "universal-3-pro",
  gladiaModel: "solaria-3",
  whisperApiKey: "",
  groqApiKey: "",
  whisperLocalUrl: "http://localhost:8080",
  spobApiKey: "",
  spobBaseUrl: "https://spob.fly.dev",
  defaultLanguage: "es",
  languageDetection: "manual",
  insertAsCallout: true,
  outputTemplate: DEFAULT_TEMPLATE,
  audioFolder: "",
  recordingSampleRate: 16000,
  recordingMode: "desktop",
  saveAudioAfterTranscription: true,
  openaiApiKey: "",
  anthropicApiKey: "",
  deepseekApiKey: "",
  geminiApiKey: "",
  openrouterApiKey: "",
  grokApiKey: "",
  glmApiKey: "",
  flashProvider: "spob",
  flashModel: "deepseek-v4-flash",
  advancedProvider: "spob",
  advancedModel: "deepseek-v4-pro",
  promptTemplates: DEFAULT_TEMPLATES,
  chatHistory: [],
  autoSummarize: false,
  autoSummarizeTemplate: "",
  lastSeenVersion: "",
};

export class SettingsTab extends PluginSettingTab {
  plugin: DiaryTranscriberPlugin;

  constructor(app: App, plugin: DiaryTranscriberPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.render();
  }

  private render(): void {
    const { containerEl } = this;
    containerEl.empty();
    const L = (k: keyof LocaleStrings) => t(k, this.plugin.getLocale());

    new Setting(containerEl)
      .setName("Configuración")
      .setHeading();

    this.addSpobBanner(containerEl);

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
            this.render();
          });
      });

    const meta = PROVIDER_REGISTRY[this.plugin.settings.provider];

    if (!meta.supportsDiarization) {
      const warning = containerEl.createDiv({
        cls: "audio-transcript-warning",
        text: DIARIZATION_WARNING[meta.id] ?? "",
      });
      warning.setCssProps({
        background: "var(--background-modifier-warning)", color: "var(--text-warning)",
        padding: "8px 12px", borderRadius: "4px", marginBottom: "12px",
      });
    }

    if (meta.requiresApiKey) {
      addApiKeyField(
        containerEl,
        this.plugin.settings,
        () => this.plugin.saveSettings(),
        `${meta.label} API Key`,
        meta.apiKeyField
      );
    } else {
      addWhisperLocalUrlField(
        containerEl,
        this.plugin.settings,
        () => this.plugin.saveSettings()
      );
    }

    if (meta.modelField) {
      addModelField(
        containerEl,
        this.plugin.settings,
        () => this.plugin.saveSettings(),
        meta.id
      );
    }

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

    if (hasSpobApi(this.plugin.settings)) {
      new Setting(containerEl)
        .setName("Auto-resumen")
        .setDesc("Resumir automáticamente después de cada transcripción (usa créditos spob)")
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.autoSummarize)
            .onChange(async (value) => {
              this.plugin.settings.autoSummarize = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Template de resumen")
        .setDesc("Prompt a usar para el auto-resumen (Predeterminado = genérico)")
        .addDropdown((dd) => {
          dd.addOption("", "Predeterminado");
          for (const t of this.plugin.settings.promptTemplates) {
            dd.addOption(t.name, t.name);
          }
          dd.setValue(this.plugin.settings.autoSummarizeTemplate)
            .onChange(async (v) => {
              this.plugin.settings.autoSummarizeTemplate = v;
              await this.plugin.saveSettings();
            });
        });
    }

    if (meta.testEndpoint) {
      new Setting(containerEl)
        .setName("Probar conexion")
        .setDesc(`Verifica que la API key de ${meta.label} funciona`)
        .addButton((btn) =>
          btn.setButtonText("Probar").onClick(() => {
            void (async () => {
              btn.setDisabled(true);
              btn.setButtonText("Probando...");
              const key = this.plugin.settings[meta.apiKeyField] as string;
              try {
                const ok = await testApiKey(meta.testEndpoint!, meta.id, key);
                btn.setButtonText(ok ? "✓ Conectado" : "✗ Fallo");
              } catch {
                btn.setButtonText("✗ Fallo");
              } finally {
                btn.setDisabled(false);
                window.setTimeout(() => { btn.setButtonText("Probar"); }, 3000);
              }
            })();
          })
        );
    }

    buildCommonSections(
      containerEl,
      this.app,
      this.plugin.settings,
      () => this.plugin.saveSettings(),
      () => this.render(),
      L
    );
  }

  private addSpobBanner(container: HTMLElement): void {
    const banner = container.createDiv({
      attr: {
        style:
          "background: var(--background-modifier-border); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 0.92rem; line-height: 1.6;",
      },
    });
    const locale = this.plugin.getLocale();
    banner.createEl("p", { text: t("spobBanner", locale) });
    const links = banner.createDiv({ attr: { style: "margin-top: 10px; display: flex; gap: 16px;" } });
    links.createEl("a", {
      text: "☕ Donar vía PayPal",
      href: "https://paypal.me/jesusgarciapsi",
    });
    links.createEl("a", {
      text: "🚀 Servicios SPOB",
      href: "https://spob.fly.dev",
    });
  }
}
