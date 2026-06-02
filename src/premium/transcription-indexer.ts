import type { App, TFile } from "obsidian";
import type { TranscriptionEntry } from "../types";

let cache: TranscriptionEntry[] | null = null;

export function getCachedEntries(): TranscriptionEntry[] | null {
  return cache;
}

export async function scanVault(app: App): Promise<TranscriptionEntry[]> {
  const files = app.vault.getMarkdownFiles();
  const entries: TranscriptionEntry[] = [];

  for (const file of files) {
    try {
      const content = await app.vault.cachedRead(file);
      const entry = parseTranscription(file, content);
      if (entry) entries.push(entry);
    } catch {
      continue;
    }
  }

  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  cache = entries;
  return entries;
}

export function clearCache(): void {
  cache = null;
}

function parseTranscription(
  file: TFile,
  content: string
): TranscriptionEntry | null {
  const lines = content.split("\n");
  let inCallout = false;
  let calloutLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("> [!transcription]")) {
      inCallout = true;
      continue;
    }
    if (inCallout) {
      if (line.startsWith(">")) {
        calloutLines.push(line.replace(/^>\s?/, ""));
      } else if (line === "") {
        continue;
      } else {
        inCallout = false;
      }
    }
  }

  if (calloutLines.length === 0) return null;

  const speakers = new Set<string>();
  let previewText = "";

  for (const line of calloutLines) {
    const match = line.match(/\*\*(.+?)\*\*/);
    if (match) {
      speakers.add(match[1]);
    }
    if (!previewText) {
      const text = line.replace(/\*\*.*?\*\*/, "").replace(/\[.*?\]\(.*?\)/, "").trim();
      if (text) previewText = text.slice(0, 120);
    }
  }

  const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : "";

  return {
    path: file.path,
    noteName: file.basename,
    date: date || file.basename,
    speakerCount: speakers.size || 1,
    preview: previewText || "",
    calloutContent: calloutLines.join("\n"),
  };
}
