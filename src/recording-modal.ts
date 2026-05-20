import { Modal, Notice, Setting } from "obsidian";
import { t, type LocaleStrings } from "./locales";

export class RecordingModal extends Modal {
  private chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelEl: HTMLElement | null = null;
  private levelInterval: ReturnType<typeof setInterval> | null = null;
  private mimeType = "";
  private seconds = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private resolve: ((blob: Blob | null) => void) | null = null;
  private paused = false;
  private locale: string;

  constructor(app: import("obsidian").App, locale = "es") {
    super(app);
    this.locale = locale;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.locale);
  }

  async start(): Promise<Blob | null> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      new Notice(this.L("micAccessFailed"));
      return null;
    }

    this.mimeType = this.detectMimeType();

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.mimeType,
      });
    } catch (err) {
      this.cleanup();
      new Notice(this.L("recorderUnsupported"));
      console.error("[Audio Transcript] MediaRecorder constructor error:", err);
      return null;
    }

    this.mediaRecorder = mediaRecorder;
    this.chunks = [];

    return new Promise((resolve) => {
      this.resolve = resolve;

      this.mediaRecorder!.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder!.onstop = () => {
        this.stopAudioLevel();
        this.cleanup();
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.resolve?.(blob);
        this.close();
      };

      this.mediaRecorder!.onerror = () => {
        this.stopAudioLevel();
        this.cleanup();
        new Notice(this.L("recordingError"));
        this.resolve?.(null);
        this.close();
      };

      this.mediaRecorder!.start(1000);
      super.open();
      this.startTimer();
      this.startAudioLevel();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.L("recording") + "..." });

    // Audio level bar
    this.levelEl = contentEl.createDiv({
      attr: {
        style:
          "width:100%;height:6px;background:var(--background-modifier-border);border-radius:3px;margin-bottom:12px;overflow:hidden;",
      },
    });
    this.levelEl.createDiv({
      attr: {
        style:
          "width:0%;height:100%;background:var(--interactive-accent);border-radius:3px;transition:width 0.1s;",
      },
    });

    this.statusEl = contentEl.createDiv({
      cls: "audio-transcript-status loading",
      text: "● " + this.L("recording"),
    });

    this.timerEl = contentEl.createEl("p", {
      text: "00:00",
      attr: {
        style: "font-size: 2em; text-align: center; margin: 12px 0;",
      },
    });

    const btnRow = contentEl.createDiv({
      attr: {
        style:
          "display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;",
      },
    });

    this.pauseBtn = btnRow.createEl("button", {
      text: "⏸ " + this.L("pause"),
    });
    this.pauseBtn.onclick = () => this.togglePause();

    btnRow.createEl("button", {
      text: "⏹ " + this.L("stop"),
    }).onclick = () => this.stopRecording();
  }

  private togglePause() {
    if (!this.mediaRecorder) return;

    if (this.paused) {
      this.mediaRecorder.resume();
      this.paused = false;
      if (this.pauseBtn)
        this.pauseBtn.textContent = "⏸ " + this.L("pause");
      if (this.statusEl)
        this.statusEl.textContent = "● " + this.L("recording");
      this.timerInterval ?? this.startTimer();
    } else {
      this.mediaRecorder.pause();
      this.paused = true;
      if (this.pauseBtn)
        this.pauseBtn.textContent = "▶ " + this.L("resume");
      if (this.statusEl)
        this.statusEl.textContent = "⏸ " + this.L("paused");
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
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

  private startAudioLevel() {
    if (!this.stream || !this.levelEl) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const fillEl = this.levelEl.firstElementChild as HTMLElement | null;

      this.levelInterval = setInterval(() => {
        if (!this.analyser || !fillEl) return;
        this.analyser.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        fillEl.style.width = `${pct}%`;
      }, 80);
    } catch {
      // AnalyserNode not supported — silent fail, recording still works
    }
  }

  private stopAudioLevel() {
    if (this.levelInterval) clearInterval(this.levelInterval);
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
  }

  private stopRecording() {
    this.mediaRecorder?.stop();
  }

  private cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.stopAudioLevel();
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
