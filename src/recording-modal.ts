import { Modal, Notice } from "obsidian";
import { t, type LocaleStrings } from "./locales";
import { encodeWAV } from "./wav-encoder";
import type { RecordingSampleRate } from "./types";

export class RecordingModal extends Modal {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private levelEl: HTMLElement | null = null;
  private levelInterval: ReturnType<typeof setInterval> | null = null;
  private seconds = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private resolve: ((blob: Blob | null) => void) | null = null;
  private paused = false;
  private locale: string;
  private sampleRate: RecordingSampleRate;

  constructor(app: import("obsidian").App, locale = "es", sampleRate: RecordingSampleRate = 8000) {
    super(app);
    this.locale = locale;
    this.sampleRate = sampleRate;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.locale);
  }

  async start(): Promise<Blob | null> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: this.sampleRate },
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      new Notice(this.L("micAccessFailed"));
      return null;
    }

    try {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    } catch {
      this.cleanup();
      new Notice(this.L("recorderUnsupported"));
      return null;
    }

    const source = this.audioContext.createMediaStreamSource(this.stream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.pcmChunks = [];

    this.processor.onaudioprocess = (e) => {
      if (this.paused || !this.processor) return;
      const input = e.inputBuffer.getChannelData(0);
      this.pcmChunks.push(new Float32Array(input));
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
      this.startTimer();
      this.startAudioLevel();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.L("recording") + "..." });

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
    if (!this.processor) return;

    if (this.paused) {
      this.processor.onaudioprocess = (e) => {
        if (this.paused || !this.processor) return;
        const input = e.inputBuffer.getChannelData(0);
        this.pcmChunks.push(new Float32Array(input));
      };
      this.paused = false;
      if (this.pauseBtn)
        this.pauseBtn.textContent = "⏸ " + this.L("pause");
      if (this.statusEl)
        this.statusEl.textContent = "● " + this.L("recording");
      this.timerInterval ?? this.startTimer();
    } else {
      this.processor.onaudioprocess = null;
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
    if (!this.analyser || !this.levelEl) return;

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
  }

  private stopAudioLevel() {
    if (this.levelInterval) clearInterval(this.levelInterval);
  }

  private stopRecording() {
    this.stopAudioLevel();
    this.processor?.disconnect();
    this.processor = null;

    const blob = this.pcmChunks.length > 0
      ? encodeWAV(this.pcmChunks, this.sampleRate)
      : new Blob([], { type: "audio/wav" });

    this.cleanup();
    this.resolve?.(blob);
    this.close();
  }

  private cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.stopAudioLevel();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.processor = null;
    this.pcmChunks = [];
  }

  onClose() {
    if (this.processor) {
      this.stopRecording();
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
