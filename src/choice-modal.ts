import { App, Modal, Setting } from "obsidian";
import { t, type LocaleStrings } from "./locales";

export class ChoiceModal extends Modal {
  private resolve: ((choice: "record" | "file" | null) => void) | null = null;
  private locale: string;

  constructor(app: App, locale = "es") {
    super(app);
    this.locale = locale;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.locale);
  }

  open(): void {
    super.open();
  }

  prompt(): Promise<"record" | "file" | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }

  onOpen() {
    const { contentEl } = this;
    new Setting(contentEl).setName(this.L("chooseAction")).setHeading();

    const btnContainer = contentEl.createDiv({
      attr: { style: "display: flex; gap: 12px; margin-top: 16px;" },
    });

    const recordBtn = btnContainer.createEl("button", {
      text: "🎙️ " + this.L("recordAudio"),
      cls: "mod-cta",
    });
    recordBtn.setCssProps({ flex: "1" });
    recordBtn.onclick = () => {
      this.resolve?.("record");
      this.close();
    };

    const fileBtn = btnContainer.createEl("button", {
      text: "📁 " + this.L("chooseFile"),
    });
    fileBtn.setCssProps({ flex: "1" });
    fileBtn.onclick = () => {
      this.resolve?.("file");
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
}
