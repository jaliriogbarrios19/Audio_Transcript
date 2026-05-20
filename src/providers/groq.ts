import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";

export class GroqTranscriber implements Transcriber {
  readonly name = "Groq (Whisper)";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const form = new FormData();
    form.append("file", audioBlob, "audio.webm");
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");

    if (options.language) {
      form.append("language", options.language);
    }

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: options.signal,
      }
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new Error(
        `Groq request failed (${res.status}): ${err?.error?.message ?? "unknown"}`
      );
    }

    const data = (await res.json()) as {
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
