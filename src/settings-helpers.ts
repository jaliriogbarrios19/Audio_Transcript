import { App, Setting, TFolder } from "obsidian";
import type { PluginSettings } from "./settings";
import type { TranscriptionProvider } from "./types";

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
  saveSettings: () => Promise<void>
): void {
  new Setting(container)
    .setName("Modelo")
    .setDesc(
      "Universal-3 Pro: maxima precision, diarizacion avanzada. Universal-2: mas rapido."
    )
    .addDropdown((dropdown) =>
      dropdown
        .addOption("universal-3-pro", "Universal-3 Pro")
        .addOption("universal-2", "Universal-2")
        .setValue(settings.assemblyaiModel)
        .onChange(async (v: string) => {
          settings.assemblyaiModel = v as "universal-2" | "universal-3-pro";
          await saveSettings();
        })
    );
}

export function getVaultFolders(app: App): string[] {
  return app.vault
    .getAllLoadedFiles()
    .filter(
      (f): f is TFolder =>
        f instanceof TFolder && !f.isRoot() && !f.name.startsWith(".")
    )
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

    return res.status < 500 && res.status !== 404;
  } catch {
    return false;
  }
}
