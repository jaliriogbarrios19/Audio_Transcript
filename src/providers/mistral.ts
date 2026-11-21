import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { requestUrlWithSignal } from "../fetch-utils";

export class MistralTranscriber implements Transcriber {
  readonly name = "Mistral Voxtral";

  async transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const form = new FormData();
    form.append("file", audioBlob, "audio");
    form.append("model", options.model || "voxtral-mini-latest");
    if (options.language) {
      form.append("language", options.language);
    }

    const res = await requestUrlWithSignal(
      "https://api.mistral.ai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: options.signal,
      }
    );

    if (res.status < 200 || res.status >= 300) {
      const err = res.json as { message?: string } | null;
      throw new Error(
        `Mistralrequest failed (${res.status}): ${err?.message ?? "unknown"}`
      );
    }

    const data = res.json as {
      text?: string;
      segments?: Array<{
        speaker?: number | string;
        start?: number;
        end?: number;
        text?: string;
      }>;
    };

    if (!data.segments || data.segments.length === 0) {
      throw new Error(
        "Mistral returned no segments; audio may be empty or shorter than 160ms."
      );
    }

    const speakerIndex = new Map<string, number>();
    return data.segments.map((u) => {
      const raw = u.speaker === undefined || u.speaker === null ? "?" : String(u.speaker);
      if (!speakerIndex.has(raw)) {
        speakerIndex.set(raw, speakerIndex.size + 1);
      }
      return {
        speaker: speakerIndex.get(raw) ?? 1,
        text: (u.text ?? "").trim(),
        start: u.start ?? 0,
        end: u.end ?? 0,
      };
    });
  }
}
