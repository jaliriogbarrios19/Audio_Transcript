import { App, Modal, Setting } from "obsidian";
import { SpeakerMapping } from "./types";
import { t, type LocaleStrings } from "./locales";

export class SpeakerModal extends Modal {
  resolve: ((value: SpeakerMapping | null) => void) | null = null;
  private nameFields: HTMLInputElement[] = [];
  private namesContainer: HTMLDivElement | null = null;
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

  prompt(): Promise<SpeakerMapping | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }

  onOpen() {
    const { contentEl } = this;
    new Setting(contentEl).setName(this.L("speakerConfig")).setHeading();

    new Setting(contentEl)
      .setName(this.L("speakerCount"))
      .addText((text) => {
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

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText(this.L("startTranscription"))
        .setCta()
        .onClick(() => this.submit())
    );

    this.renderNameFields(2);
  }

  private renderNameFields(count: number) {
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
        placeholder: `Speaker ${i + 1}`,
      });
      this.nameFields.push(input);
    }
  }

  private submit() {
    const names = this.nameFields.map(
      (f, i) => f.value.trim() || `Speaker ${i + 1}`
    );
    this.resolve?.({ count: names.length, names });
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
}
