import { Modal, Notice, Setting } from "obsidian";

export class RecordingModal extends Modal {
  private chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private seconds = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private resolve: ((blob: Blob | null) => void) | null = null;

  async start(): Promise<Blob | null> {
    return new Promise(async (resolve) => {
      this.resolve = resolve;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch {
        new Notice("No se pudo acceder al micrófono. Verificá los permisos.");
        resolve(null);
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/aac")
        ? "audio/aac"
        : "audio/ogg;codecs=opus";

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.cleanup();
        const blob = new Blob(this.chunks, { type: mimeType });
        this.resolve?.(blob);
        this.close();
      };

      this.mediaRecorder.start(1000);
      super.open();
      this.startTimer();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Grabando..." });

    this.statusEl = contentEl.createDiv({
      cls: "transcripcion-obsidian-status loading",
      text: "● Grabando",
    });

    this.timerEl = contentEl.createEl("p", {
      text: "00:00",
      attr: { style: "font-size: 2em; text-align: center; margin: 16px 0;" },
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Detener grabación")
        .setWarning()
        .onClick(() => this.stopRecording())
    );
  }

  private startTimer() {
    this.seconds = 0;
    this.timerInterval = setInterval(() => {
      this.seconds++;
      if (this.timerEl) {
        const m = Math.floor(this.seconds / 60);
        const s = this.seconds % 60;
        this.timerEl.textContent =
          `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }

  private stopRecording() {
    this.mediaRecorder?.stop();
  }

  private cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }

  onClose() {
    this.cleanup();
    this.contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
}
