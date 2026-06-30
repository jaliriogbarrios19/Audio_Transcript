import { App, requestUrl, Setting, TFolder } from "obsidian";
import type { PluginSettings } from "./settings";
import type { TranscriptionProvider } from "./types";
import { t, type LocaleStrings } from "./locales";

export function addApiKeyField(
  container: HTMLElement,
  settings: PluginSettings,
  saveSettings: () => Promise<void>,
  name: string,
  key: keyof PluginSettings
): void {
  new Setting(container).setName(name).addText((text) => {
    text
      .setPlaceholder("Ingresa tu API key")
      .setValue(String(settings[key] ?? ""));
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
      (settings as unknown as Record<string, string>)[key] = value;
      await saveSettings();
    });
  });
}

export function addWhisperLocalUrlField(
  container: HTMLElement,
  settings: PluginSettings,
  saveSettings: () => Promise<void>,
  showLabel = false
): void {
  new Setting(container)
    .setName(showLabel ? "Whisper Local URL" : "URL del servidor")
    .setDesc("URL del servidor whisper.cpp (ej: http://localhost:8080)")
    .addText((text) => {
      text
        .setPlaceholder("http://localhost:8080")
        .setValue(settings.whisperLocalUrl)
        .onChange(async (value) => {
          settings.whisperLocalUrl = value;
          await saveSettings();
        });
    });
}

export function addModelField(
  container: HTMLElement,
  settings: PluginSettings,
  saveSettings: () => Promise<void>,
  providerId?: string
): void {
  if (providerId === "gladia") {
    new Setting(container)
      .setName("Modelo")
      .setDesc(
        "Solaria-3: maxima precision en audio europeo. Solaria-1: maxima cobertura de idiomas."
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("solaria-3", "Solaria-3 (Recomendado)")
          .addOption("solaria-1", "Solaria-1")
          .setValue(settings.gladiaModel)
          .onChange(async (v: string) => {
            settings.gladiaModel = v as "solaria-1" | "solaria-3";
            await saveSettings();
          })
      );
    return;
  }

  new Setting(container)
    .setName("Modelo")
    .setDesc(
      "Universal-3.5 Pro: maxima precision, diarizacion avanzada. Universal-3 Pro: balance precision/velocidad. Universal-2: mas rapido."
    )
    .addDropdown((dropdown) =>
      dropdown
        .addOption("universal-3-5-pro", "Universal-3.5 Pro (Recomendado)")
        .addOption("universal-3-pro", "Universal-3 Pro")
        .addOption("universal-2", "Universal-2")
        .setValue(settings.assemblyaiModel)
        .onChange(async (v: string) => {
          settings.assemblyaiModel = v as "universal-2" | "universal-3-pro" | "universal-3-5-pro";
          await saveSettings();
        })
    );
}

export function getVaultFolders(app: App): string[] {
  return app.vault.getRoot().children
    .filter((f): f is TFolder => f instanceof TFolder && !f.name.startsWith("."))
    .map((f) => f.path)
    .sort();
}

export async function testApiKey(
  endpoint: string,
  provider: TranscriptionProvider,
  key: string
): Promise<boolean> {
  try {
    let headers: Record<string, string> = {};

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

    const res = await requestUrl({ url: endpoint, method: "GET", headers });

    if (res.status === 401 || res.status === 403) return false;
    return res.status < 500;
  } catch {
    return false;
  }
}
