import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";

export class WhisperLocalTranscriber implements Transcriber {
  readonly name = "Whisper (local)";

  async transcribe(
    audioBlob: Blob,
    serverUrl: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]> {
    const form = new FormData();
    form.append("file", audioBlob, "audio.wav");

    if (options.language) {
      form.append("language", options.language);
    }

    const url = serverUrl.replace(/\/$/, "") + "/inference";

    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: options.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Whisper local request failed (${res.status}): ${text.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      text: string;
      segments?: Array<{
        t0: number;
        t1: number;
        text: string;
      }>;
    };

    if (data.segments && data.segments.length > 0) {
      return data.segments.map((seg) => ({
        speaker: 1,
        text: seg.text.trim(),
        start: seg.t0 / 100,
        end: seg.t1 / 100,
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
