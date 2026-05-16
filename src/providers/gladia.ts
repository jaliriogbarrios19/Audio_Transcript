import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { fetchWithRetry, sleep } from "../fetch-utils";

interface GladiaError {
  statusCode: number;
  message: string;
}

export class GladiaTranscriber implements Transcriber {
  readonly name = "Gladia";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const baseUrl = "https://api.gladia.io/v2";
    const signal = options.signal;

    const audioUrl = await this.upload(audioBlob, apiKey, baseUrl, signal);

    const resultUrl = await this.requestTranscription(
      audioUrl,
      apiKey,
      baseUrl,
      options
    );

    return await this.pollResult(resultUrl, apiKey, signal);
  }

  private async upload(
    blob: Blob,
    apiKey: string,
    baseUrl: string,
    signal?: AbortSignal
  ): Promise<string> {
    const form = new FormData();
    form.append("audio", blob);

    const res = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      headers: { "x-gladia-key": apiKey },
      body: form,
      signal,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as GladiaError | null;
      throw new Error(
        `Gladia upload failed (${res.status}): ${err?.message ?? "unknown"}`
      );
    }

    const data = (await res.json()) as { audio_url: string };
    return data.audio_url;
  }

  private async requestTranscription(
    audioUrl: string,
    apiKey: string,
    baseUrl: string,
    options: TranscriptionOptions
  ): Promise<string> {
    const body: Record<string, unknown> = {
      audio_url: audioUrl,
      diarization: true,
      language: options.language || "es",
    };

    if (options.speakerNames.length > 0) {
      body.diarization_config = {
        number_of_speakers: options.speakerNames.length,
      };
    }

    const res = await fetch(`${baseUrl}/transcription`, {
      method: "POST",
      headers: {
        "x-gladia-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as GladiaError | null;
      throw new Error(
        `Gladia transcription request failed (${res.status}): ${err?.message ?? "unknown"}`
      );
    }

    const data = (await res.json()) as { id: string; result_url: string };
    return data.result_url;
  }

  private async pollResult(
    resultUrl: string,
    apiKey: string,
    signal?: AbortSignal
  ): Promise<Utterance[]> {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const res = await fetchWithRetry(resultUrl, {
        headers: { "x-gladia-key": apiKey },
        signal,
      });

      if (!res.ok) {
        throw new Error(`Gladia polling failed (${res.status})`);
      }

      const data = (await res.json()) as {
        status: string;
        result?: {
          transcription?: {
            utterances?: Array<{
              speaker: number;
              text: string;
              start: number;
              end: number;
            }>;
          };
        };
      };

      if (data.status === "done") {
        const utterances = data.result?.transcription?.utterances ?? [];
        return utterances.map((u) => ({
          speaker: u.speaker,
          text: u.text.trim(),
          start: u.start,
          end: u.end,
        }));
      }

      if (data.status === "error") {
        throw new Error("Gladia transcription failed");
      }

      await sleep(1000, signal);
    }

    throw new Error("Gladia transcription timed out");
  }
}
