import { Transcriber } from "../transcriber";
import { Utterance, TranscriptionOptions } from "../types";
import { fetchWithRetry, sleep } from "../fetch-utils";

export class AssemblyAITranscriber implements Transcriber {
  readonly name = "AssemblyAI";

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

    // 1. Upload audio
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: apiKey },
      body: audioBlob,
      signal,
    });

    if (!uploadRes.ok) {
      const body = await uploadRes.text().catch(() => "");
      throw new Error(
        `AssemblyAI upload failed (${uploadRes.status}): ${body.slice(0, 200)}`
      );
    }

    const { upload_url: audioUrl } = (await uploadRes.json()) as {
      upload_url: string;
    };

    // 2. Start transcription
    const body: Record<string, unknown> = {
      audio_url: audioUrl,
      speech_models: [options.model || "universal-2"],
      speaker_labels: true,
      language_code: options.language || "es",
    };

    if (options.speakerNames.length > 0) {
      body.speakers_expected = options.speakerNames.length;
    }

    const startRes = await fetch(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      }
    );

    if (!startRes.ok) {
      const body = await startRes.text().catch(() => "");
      throw new Error(
        `AssemblyAI transcription request failed (${startRes.status}): ${body.slice(0, 200)}`
      );
    }

    const { id } = (await startRes.json()) as { id: string };

    // 3. Poll until done
    return await this.poll(id, apiKey, signal);
  }

  private async poll(
    id: string,
    apiKey: string,
    signal?: AbortSignal
  ): Promise<Utterance[]> {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const res = await fetchWithRetry(
        `https://api.assemblyai.com/v2/transcript/${id}`,
        {
          headers: { authorization: apiKey },
          signal,
        }
      );

      if (!res.ok) {
        throw new Error(`AssemblyAI polling failed (${res.status})`);
      }

      const data = (await res.json()) as AssemblyAIResponse;

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
  start: number; // ms
  end: number;
}

interface AssemblyAIResponse {
  status: string;
  error?: string;
  utterances?: AssemblyAIUtterance[];
}
