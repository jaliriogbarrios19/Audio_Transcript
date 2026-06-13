import { Modal, Notice, Setting } from "obsidian";
import { t, type LocaleStrings } from "./locales";
import { encodeWAV } from "./wav-encoder";
import type { RecordingSampleRate, RecordingMode } from "./types";
import { concatenateChunks, resampleTo } from "./recording-utils";
import {
  initMobileRecorder,
  stopMobileRecorder,
} from "./recording-mobile";

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

  // ── Mobile state ──────────────────────────────────────────
  private mobileRecorder: MediaRecorder | null = null;
  private mobileChunks: Blob[] = [];
  private mobileStream: MediaStream | null = null;

  constructor(
    app: import("obsidian").App,
    locale = "es",
    sampleRate: RecordingSampleRate = 16000,
    mode: RecordingMode = "desktop"
  ) {
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

    const blobUrl = URL.createObjectURL(
      new Blob([WORKLET_CODE], { type: "application/javascript" })
    );
    await this.audioContext.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "recorder-processor"
    );
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

  private async startMobile(): Promise<Blob | null> {
    const result = await initMobileRecorder(this.locale);
    if (!result) return null;

    this.mobileRecorder = result.recorder;
    this.mobileChunks = result.chunks;
    this.mobileStream = result.stream;

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
    new Setting(contentEl).setName(this.L("recording") + "...").setHeading();

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
      attr: { style: "font-size: 2em; text-align: center; margin: 12px 0;" },
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

    btnRow
      .createEl("button", { text: "⏹ " + this.L("stop") })
      .onclick = () => this.stopRecording();
  }

  private togglePause() {
    if (!this.workletNode) return;

    if (this.paused) {
      this.workletNode.port.postMessage({ paused: false });
      this.paused = false;
      if (this.pauseBtn) this.pauseBtn.textContent = "⏸ " + this.L("pause");
      if (this.statusEl)
        this.statusEl.textContent = "● " + this.L("recording");
      if (!this.timerInterval) this.startTimer();
    } else {
      this.workletNode.port.postMessage({ paused: true });
      this.paused = true;
      if (this.pauseBtn) this.pauseBtn.textContent = "▶ " + this.L("resume");
      if (this.statusEl) this.statusEl.textContent = "⏸ " + this.L("paused");
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

  private stopMobileRecording() {
    this.stopAudioLevel();
    stopMobileRecorder(
      this.mobileRecorder!,
      this.mobileChunks,
      this.mobileStream!,
      (blob) => {
        this.cleanup();
        this.resolve?.(blob);
        this.close();
      }
    );
  }

  private cleanup() {
    if (this.timerInterval) window.clearInterval(this.timerInterval);
    this.stopAudioLevel();
    this.stream?.getTracks().forEach((tr) => tr.stop());
    this.mobileStream?.getTracks().forEach((tr) => tr.stop());
    this.stream = null;
    this.mobileStream = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.workletNode = null;
    this.pcmChunks = [];
    this.mobileRecorder = null;
    this.mobileChunks = [];
  }

  onClose() {
    if (this.mobileRecorder && this.mobileRecorder.state !== "inactive") {
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
}
