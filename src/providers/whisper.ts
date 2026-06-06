import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { requestUrlWithSignal } from "../fetch-utils";

export class WhisperTranscriber implements Transcriber {
  readonly name = "OpenAI Whisper";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const form = new FormData();
    form.append("file", audioBlob, "audio.webm");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");

    if (options.language) {
      form.append("language", options.language);
    }

    const res = await requestUrlWithSignal(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: options.signal,
      }
    );

    if (res.status < 200 || res.status >= 300) {
      const err = res.json as {
        error?: { message?: string };
      } | null;
      throw new Error(
        `OpenAI Whisper request failed (${res.status}): ${err?.error?.message ?? "unknown"}`
      );
    }

    const data = res.json as {
      text: string;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
      }>;
    };

    if (data.segments && data.segments.length > 0) {
      return data.segments.map((seg) => ({
        speaker: 1,
        text: seg.text.trim(),
        start: seg.start,
        end: seg.end,
      }));
    }

    return [
      {
        speaker: 1,
        text: data.text?.trim() ?? "",
        start: 0,
        end: 0,
      },
    ];
  }
}
