import { Modal, Notice, Setting } from "obsidian";

export class RecordingModal extends Modal {
  private chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private mimeType = "";
  private seconds = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private resolve: ((blob: Blob | null) => void) | null = null;

  async start(): Promise<Blob | null> {
    // Step 1 – getUserMedia MUST run in the user-gesture call chain.
    // Avoid the "async Promise executor" anti-pattern; it breaks the gesture
    // token on iOS Safari and some desktop browsers.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      new Notice("No se pudo acceder al micrófono. Verifica los permisos.");
      return null;
    }

    // Step 2 – pick the best MIME type the browser actually supports
    this.mimeType = this.detectMimeType();

    // Step 3 – wrap the MediaRecorder constructor so a bad mimeType doesn't
    //          hang the promise silently
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.mimeType,
      });
    } catch (err) {
      this.cleanup();
      new Notice(
        `No se pudo iniciar la grabación. El formato ${this.mimeType} no es compatible con este navegador.`
      );
      console.error("[Audio Transcript] MediaRecorder constructor error:", err);
      return null;
    }

    this.mediaRecorder = mediaRecorder;
    this.chunks = [];

    // Step 4 – wrap the rest in a Promise so the caller can await the result
    return new Promise((resolve) => {
      this.resolve = resolve;

      this.mediaRecorder!.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder!.onstop = () => {
        this.cleanup();
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.resolve?.(blob);
        this.close();
      };

      // Handle runtime errors so the promise never hangs
      this.mediaRecorder!.onerror = () => {
        this.cleanup();
        new Notice("Error durante la grabación.");
        this.resolve?.(null);
        this.close();
      };

      this.mediaRecorder!.start(1000);
      super.open();
      this.startTimer();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Grabando..." });

    this.statusEl = contentEl.createDiv({
      cls: "audio-transcript-status loading",
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

  private detectMimeType(): string {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
      return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    if (MediaRecorder.isTypeSupported("audio/aac")) return "audio/aac";
    return "audio/ogg;codecs=opus";
  }

  onClose() {
    // If the user dismisses the modal while recording, stop the recorder.
    // The onstop handler will complete the flow (cleanup + resolve).
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      return;
    }

    this.cleanup();
    this.contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
}
