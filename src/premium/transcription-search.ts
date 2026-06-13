import { App, FuzzySuggestModal } from "obsidian";
import type { TranscriptionEntry } from "../types";

export class TranscriptionSearchModal extends FuzzySuggestModal<TranscriptionEntry> {
  private entries: TranscriptionEntry[];

  constructor(app: App, entries: TranscriptionEntry[]) {
    super(app);
    this.entries = entries;
    this.setPlaceholder("Buscar transcripción...");
    this.emptyStateText = "No se encontraron transcripciones.";
  }

  getItems(): TranscriptionEntry[] {
    return this.entries.slice(0, 10);
  }

  getItemText(item: TranscriptionEntry): string {
    return `${item.noteName} — ${item.date || "?"}`;
  }

  onChooseItem(item: TranscriptionEntry): void {
    void this.app.workspace.openLinkText(item.path, "", false);
  }
}
