import { App, PluginSettingTab, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../main";
import { TranscriptionProvider, PROVIDERS } from "./types";

export interface PluginSettings {
  provider: TranscriptionProvider;
  gladiaApiKey: string;
  deepgramApiKey: string;
  assemblyaiApiKey: string;
  assemblyaiModel: "universal-2" | "universal-3-pro";
  defaultLanguage: string;
  insertAsCallout: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: "gladia",
  gladiaApiKey: "",
  deepgramApiKey: "",
  assemblyaiApiKey: "",
  assemblyaiModel: "universal-3-pro",
  defaultLanguage: "es",
  insertAsCallout: true,
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

    containerEl.createEl("h2", { text: "Audio Transcript" });

    new Setting(containerEl)
      .setName("Provider")
      .setDesc("Speech-to-text provider to use")
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

    // --- Provider-specific API key fields ---
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
      new Setting(containerEl)
        .setName("Modelo")
        .setDesc("Universal-3 Pro: máxima precisión, speaker diarization avanzada. Universal-2: más rápido y económico.")
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

    // Show all keys in an advanced section
    containerEl.createEl("h3", { text: "All API Keys" });
    containerEl.createEl("p", {
      text: "Keys are stored locally in your vault's plugin data.",
      cls: "setting-item-description",
    });

    this.addApiKeyField(containerEl, "Gladia", "gladiaApiKey");
    this.addApiKeyField(containerEl, "Deepgram", "deepgramApiKey");
    this.addApiKeyField(containerEl, "AssemblyAI", "assemblyaiApiKey");

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
      .setName("Idioma")
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

    new Setting(containerEl)
      .setName("Wrap in callout")
      .setDesc("Insert transcription inside a >[!transcription] callout block")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.insertAsCallout)
          .onChange(async (value) => {
            this.plugin.settings.insertAsCallout = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private addApiKeyField(
    container: HTMLElement,
    name: string,
    key: "gladiaApiKey" | "deepgramApiKey" | "assemblyaiApiKey"
  ): void {
    new Setting(container).setName(name).addText((text) => {
      text
        .setPlaceholder("Enter your API key")
        .setValue(this.plugin.settings[key]);
      text.inputEl.type = "password";

      const toggleBtn = text.inputEl.parentElement?.createEl("button", {
        text: "Show",
        cls: "audio-transcript-toggle-key",
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
}
