import { App, Modal } from "obsidian";

export class ChoiceModal extends Modal {
  private resolve: ((choice: "record" | "file" | null) => void) | null = null;

  open(): Promise<"record" | "file" | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "¿Qué querés hacer?" });

    const btnContainer = contentEl.createDiv({
      attr: { style: "display: flex; gap: 12px; margin-top: 16px;" },
    });

    const recordBtn = btnContainer.createEl("button", {
      text: "🎙️ Grabar audio",
      cls: "mod-cta",
    });
    recordBtn.style.flex = "1";
    recordBtn.onclick = () => {
      this.resolve?.("record");
      this.close();
    };

    const fileBtn = btnContainer.createEl("button", {
      text: "📁 Elegir archivo",
    });
    fileBtn.style.flex = "1";
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
