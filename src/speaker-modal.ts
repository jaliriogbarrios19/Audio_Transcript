import { App, Modal, Setting } from "obsidian";
import { SpeakerMapping } from "./types";

export class SpeakerModal extends Modal {
  resolve: ((value: SpeakerMapping | null) => void) | null = null;
  private nameFields: HTMLInputElement[] = [];
  private namesContainer: HTMLDivElement | null = null;

  open(): Promise<SpeakerMapping | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Speaker Configuration" });

    new Setting(contentEl)
      .setName("Number of speakers")
      .addText((text) => {
        text.setPlaceholder("2");
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.max = "10";
        text.setValue("2");
        text.onChange((value) => this.renderNameFields(Number(value) || 2));
      });

    this.namesContainer = contentEl.createDiv(
      "transcripcion-obsidian-speaker-names"
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Start Transcription")
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
        "transcripcion-obsidian-speaker-row"
      );
      row.createEl("label", { text: `Speaker ${i + 1}` });
      const input = row.createEl("input", {
        type: "text",
        placeholder: `Name for speaker ${i + 1}`,
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
