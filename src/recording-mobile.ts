import { Notice } from "obsidian";
import { t, type LocaleStrings } from "./locales";

export interface MobileRecordingResult {
  blob: Blob | null;
  recorder: MediaRecorder;
  stream: MediaStream;
}

export async function initMobileRecorder(
  locale: string
): Promise<{ recorder: MediaRecorder; chunks: Blob[]; stream: MediaStream } | null> {
  const L = (key: keyof LocaleStrings) => t(key, locale);
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch {
    new Notice(L("micAccessFailed"));
    return null;
  }

  const mimeType = bestMobileMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: mimeType || undefined });
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onerror = () => {
    new Notice(L("transcriptionFailed"));
    stream.getTracks().forEach((tr) => tr.stop());
  };

  recorder.start(1000);
  return { recorder, chunks, stream };
}

export function buildMobileBlob(
  recorder: MediaRecorder,
  chunks: Blob[],
  stream: MediaStream
): Blob {
  const mimeType = recorder.mimeType || "audio/webm";
  stream.getTracks().forEach((tr) => tr.stop());
  return new Blob(chunks, { type: mimeType });
}

export function stopMobileRecorder(
  recorder: MediaRecorder,
  chunks: Blob[],
  stream: MediaStream,
  onStop: (blob: Blob) => void
): void {
  if (recorder.state !== "inactive") {
    recorder.onstop = () => {
      onStop(buildMobileBlob(recorder, chunks, stream));
    };
    recorder.stop();
  } else {
    onStop(buildMobileBlob(recorder, chunks, stream));
  }
}

function bestMobileMimeType(): string | null {
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
