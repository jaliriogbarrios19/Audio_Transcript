import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { requestUrlWithRetry, requestUrlWithSignal, sleep } from "../fetch-utils";

export class AssemblyAITranscriber implements Transcriber {
  readonly name = "AssemblyAI";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? "https://api.assemblyai.com";
  }

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const signal = options.signal;
    const headers = {
      authorization: apiKey,
      "content-type": "application/json",
    };

    const buffer = await audioBlob.arrayBuffer();
    const contentType = audioBlob.type || "application/octet-stream";
    const uploadRes = await requestUrlWithSignal(`${this.baseUrl}/v2/upload`, {
      method: "POST",
      headers: { authorization: apiKey, "content-type": contentType },
      body: buffer,
      signal,
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
      const body = uploadRes.text.slice(0, 200);
      throw new Error(
        `AssemblyAI upload failed (${uploadRes.status}): ${body}`
      );
    }

    const { upload_url: audioUrl } = uploadRes.json as {
      upload_url: string;
    };

    const body: Record<string, unknown> = {
      audio_url: audioUrl,
      speech_models: options.model
        ? [options.model]
        : ["universal-3-5-pro", "universal-3-pro", "universal-2"],
      speaker_labels: true,
      language_code: options.language || "es",
    };

    if (options.speakerNames.length > 0) {
      body.speakers_expected = options.speakerNames.length;
    }

    const startRes = await requestUrlWithSignal(
      `${this.baseUrl}/v2/transcript`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      }
    );

    if (startRes.status < 200 || startRes.status >= 300) {
      const err = startRes.text.slice(0, 200);
      throw new Error(
        `AssemblyAI transcription request failed (${startRes.status}): ${err}`
      );
    }

    const { id } = startRes.json as { id: string };

    return await this.poll(id, apiKey, signal, options.onProgress);
  }

  private async poll(
    id: string,
    apiKey: string,
    signal?: AbortSignal,
    onProgress?: (pct: number) => void
  ): Promise<Utterance[]> {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const res = await requestUrlWithRetry(
        `${this.baseUrl}/v2/transcript/${id}`,
        {
          headers: { authorization: apiKey },
          signal,
        }
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`AssemblyAI polling failed (${res.status})`);
      }

      const data = res.json as AssemblyAIResponse;

      onProgress?.(Math.round(((i + 1) / maxAttempts) * 100));

      if (data.status === "completed") {
        return (data.utterances ?? []).map((u) => ({
          speaker: this.speakerLabelToNumber(u.speaker),
          text: u.text.trim(),
          start: u.start / 1000,
          end: u.end / 1000,
        }));
      }

      if (data.status === "error") {
        throw new Error(
          `AssemblyAI transcription error: ${data.error ?? "unknown"}`
        );
      }

      await sleep(1000, signal);
    }

    throw new Error("AssemblyAI transcription timed out");
  }

  private speakerLabelToNumber(label: string): number {
    return label.toUpperCase().charCodeAt(0) - 64;
  }
}

interface AssemblyAIUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface AssemblyAIResponse {
  status: string;
  error?: string;
  utterances?: AssemblyAIUtterance[];
}
