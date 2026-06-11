import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { requestUrlWithSignal } from "../fetch-utils";

export class DeepgramTranscriber implements Transcriber {
  readonly name = "Deepgram";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const params = new URLSearchParams({
      diarize_model: "latest",
      smart_format: "true",
      utterances: "true",
    });

    if (options.language) {
      params.set("language", options.language);
    }

    const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;

    const buffer = await audioBlob.arrayBuffer();

    const res = await requestUrlWithSignal(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioBlob.type || "audio/wav",
      },
      body: buffer,
      signal: options.signal,
    });

    if (res.status < 200 || res.status >= 300) {
      const err = res.json as {
        err_msg?: string;
      } | null;
      throw new Error(
        `Deepgram request failed (${res.status}): ${err?.err_msg ?? "unknown"}`
      );
    }

    const data = res.json as DeepgramResponse;
    const raw = data.results?.utterances;

    if (!raw || raw.length === 0) {
      throw new Error(
        "Deepgram returned no diarized utterances. The audio may have only one speaker or diarization is not available."
      );
    }

    return raw.map((u) => ({
      speaker: (u.speaker ?? 0) + 1,
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
