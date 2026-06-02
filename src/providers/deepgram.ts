import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";

export class DeepgramTranscriber implements Transcriber {
  readonly name = "Deepgram";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const params = new URLSearchParams({
      diarize: "true",
      diarize_version: "2024-01-26",
      smart_format: "true",
      utterances: "true",
    });

    if (options.language) {
      params.set("language", options.language);
    }

    const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioBlob.type || "audio/wav",
      },
      body: audioBlob,
      signal: options.signal,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        err_msg?: string;
      } | null;
      throw new Error(
        `Deepgram request failed (${res.status}): ${err?.err_msg ?? "unknown"}`
      );
    }

    const data = (await res.json()) as DeepgramResponse;
    const raw = data.results?.utterances;

    if (!raw || raw.length === 0) {
      throw new Error(
        "Deepgram returned no diarized utterances. The audio may have only one speaker or diarization is not available."
      );
    }

    return raw.map((u) => ({
      speaker: (u.speaker ?? 0) + 1, // Deepgram uses 0-based speakers
      text: u.transcript?.trim() ?? "",
      start: u.start ?? 0,
      end: u.end ?? 0,
    }));
  }
}

interface DeepgramUtterance {
  speaker?: number;
  transcript?: string;
  start?: number;
  end?: number;
}

interface DeepgramResponse {
  results?: {
    utterances?: DeepgramUtterance[];
  };
}
