import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { requestUrlWithSignal } from "../fetch-utils";

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

    const res = await requestUrlWithSignal(url, {
      method: "POST",
      body: form,
      signal: options.signal,
    });

    if (res.status < 200 || res.status >= 300) {
      const text = res.text.slice(0, 200);
      throw new Error(
        `Whisper local request failed (${res.status}): ${text}`
      );
    }

    const data = res.json as {
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
