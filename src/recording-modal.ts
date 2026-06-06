import { Modal, Notice } from "obsidian";
import { t, type LocaleStrings } from "./locales";
import { encodeWAV } from "./wav-encoder";
import type { RecordingSampleRate, RecordingMode } from "./types";

const WORKLET_CODE = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.paused = false;
    this.port.onmessage = (e) => {
      if (e.data.paused !== undefined) this.paused = e.data.paused;
    };
  }
  process(inputs) {
    if (!this.paused) {
      const input = inputs[0];
      if (input && input.length > 0 && input[0]) {
        this.port.postMessage(input[0]);
      }
    }
    return true;
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

export class RecordingModal extends Modal {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private levelEl: HTMLElement | null = null;
  private levelInterval: number | null = null;
  private seconds = 0;
  private timerInterval: number | null = null;
  private timerEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private resolve: ((blob: Blob | null) => void) | null = null;
  private paused = false;
  private locale: string;
  private sampleRate: RecordingSampleRate;
  private mode: RecordingMode;

  // ── Mobile (MediaRecorder) state ──────────────────────────
  private mediaRecorder: MediaRecorder | null = null;
  private mobileChunks: Blob[] = [];

  constructor(app: import("obsidian").App, locale = "es", sampleRate: RecordingSampleRate = 16000, mode: RecordingMode = "desktop") {
    super(app);
    this.locale = locale;
    this.sampleRate = sampleRate;
    this.mode = mode;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.locale);
  }

  async start(): Promise<Blob | null> {
    if (this.mode === "mobile") {
      return this.startMobile();
    }
    return this.startDesktop();
  }

  private async startDesktop(): Promise<Blob | null> {
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

    this.pcmChunks = [];

    const blobUrl = URL.createObjectURL(new Blob([WORKLET_CODE], { type: "application/javascript" }));
    await this.audioContext.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    this.workletNode = new AudioWorkletNode(this.audioContext, "recorder-processor");
    this.workletNode.port.onmessage = (e) => {
      if (this.paused || !this.workletNode) return;
      this.pcmChunks.push(new Float32Array(e.data as Float32Array));
    };

    source.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);

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
    if (!this.workletNode) return;

    if (this.paused) {
      this.workletNode.port.postMessage({ paused: false });
      this.paused = false;
      if (this.pauseBtn)
        this.pauseBtn.textContent = "⏸ " + this.L("pause");
      if (this.statusEl)
        this.statusEl.textContent = "● " + this.L("recording");
      if (!this.timerInterval) this.startTimer();
    } else {
      this.workletNode.port.postMessage({ paused: true });
      this.paused = true;
      if (this.pauseBtn)
        this.pauseBtn.textContent = "▶ " + this.L("resume");
      if (this.statusEl)
        this.statusEl.textContent = "⏸ " + this.L("paused");
      if (this.timerInterval) {
        window.clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }

  private startTimer() {
    this.seconds = 0;
    this.timerInterval = window.setInterval(() => {
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

    this.levelInterval = window.setInterval(() => {
      if (!this.analyser || !fillEl) return;
      this.analyser.getByteFrequencyData(dataArray);
      const avg =
        dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      const pct = Math.min(100, Math.round((avg / 128) * 100));
      fillEl.setCssProps({ width: `${pct}%` });
    }, 80);
  }

  private stopAudioLevel() {
    if (this.levelInterval) window.clearInterval(this.levelInterval);
  }

  private stopRecording() {
    if (this.mode === "mobile") {
      this.stopMobileRecording();
      return;
    }
    this.stopDesktopRecording();
  }

  private stopDesktopRecording() {
    this.stopAudioLevel();
    this.workletNode?.disconnect();
    this.workletNode = null;

    let blob: Blob;
    if (this.pcmChunks.length > 0) {
      const nativeRate = this.audioContext?.sampleRate ?? this.sampleRate;
      const concatenated = concatenateChunks(this.pcmChunks);
      const resampled = resampleTo(concatenated, nativeRate, this.sampleRate);
      blob = encodeWAV([resampled], this.sampleRate);
    } else {
      blob = new Blob([], { type: "audio/wav" });
    }

    this.cleanup();
    this.resolve?.(blob);
    this.close();
  }

  private cleanup() {
    if (this.timerInterval) window.clearInterval(this.timerInterval);
    this.stopAudioLevel();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.workletNode = null;
    this.pcmChunks = [];
    this.mediaRecorder = null;
    this.mobileChunks = [];
  }

  onClose() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.stopMobileRecording();
      return;
    }
    if (this.workletNode) {
      this.stopDesktopRecording();
      return;
    }

    this.cleanup();
    this.contentEl.empty();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  // ── Mobile: MediaRecorder (iOS/Android) ───────────────────

  private async startMobile(): Promise<Blob | null> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
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

    const mimeType = this.bestMobileMimeType();
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType || undefined,
      });
    } catch {
      // Fallback: no MIME type constraint
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mobileChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.mobileChunks.push(e.data);
    };

    this.mediaRecorder.onerror = () => {
      new Notice(this.L("transcriptionFailed"));
      this.cleanup();
      this.resolve?.(null);
      this.resolve = null;
      this.close();
    };

    // Collect data every second for responsive stop
    this.mediaRecorder.start(1000);

    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
      this.startTimer();
      this.startAudioLevel();
    });
  }

  private stopMobileRecording() {
    this.stopAudioLevel();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const blob = new Blob(this.mobileChunks, { type: mimeType });
        this.cleanup();
        this.resolve?.(blob);
        this.close();
      };
      this.mediaRecorder.stop();
    } else {
      const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
      const blob = new Blob(this.mobileChunks, { type: mimeType });
      this.cleanup();
      this.resolve?.(blob);
      this.close();
    }
  }

  private bestMobileMimeType(): string | null {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return null;
  }
}

function concatenateChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function resampleTo(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return samples;

  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const floor = Math.floor(srcIndex);
    const ceil = Math.min(floor + 1, samples.length - 1);
    const t = srcIndex - floor;
    result[i] = samples[floor] * (1 - t) + samples[ceil] * t;
  }

  return result;
}
