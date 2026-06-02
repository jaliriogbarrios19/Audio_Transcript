import { Utterance } from "./types";
import { DEFAULT_TEMPLATE } from "./settings";
import type { LocaleStrings } from "./locales";

export function formatTranscription(
  utterances: Utterance[],
  speakerNames: string[],
  audioPath: string | undefined,
  outputTemplate: string,
  insertAsCallout: boolean,
  L: (key: keyof LocaleStrings) => string
): string {
  if (utterances.length === 0) {
    return `*(${L("noSpeech")})*`;
  }

  const template = outputTemplate || DEFAULT_TEMPLATE;
  const merged = mergeUtterances(utterances);

  const lines = merged.map((u) => {
    const name = speakerNames[u.speaker - 1] || `Speaker ${u.speaker}`;
    const time = formatTimestamp(u.start, audioPath);
    return template
      .replace(/\{speaker\}/g, name)
      .replace(/\{time\}/g, time)
      .replace(/\{text\}/g, u.text);
  });

  if (insertAsCallout) {
    return (
      "> [!transcription]- Transcription\n" +
      lines.map((l) => `> ${l}`).join("\n>\n")
    );
  }

  return lines.join("\n\n");
}

export function mergeUtterances(utterances: Utterance[]): Utterance[] {
  const merged: Utterance[] = [];
  for (const u of utterances) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === u.speaker) {
      last.text += " " + u.text;
      last.end = u.end;
    } else {
      merged.push({ ...u });
    }
  }
  return merged;
}

export function formatTimestamp(seconds: number, audioPath?: string): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ts = `${m}:${s.toString().padStart(2, "0")}`;
  if (audioPath) {
    const filename = audioPath.split("/").pop() ?? audioPath;
    return `[${ts}](${encodeURI(filename)})`;
  }
  return `\`${ts}\``;
}
