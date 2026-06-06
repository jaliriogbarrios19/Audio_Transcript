export function pickMultipleAudioFiles(): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.multiple = true;

    let resolved = false;
    const done = (files: File[] | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(files);
    };

    const cleanup = () => {
      window.removeEventListener("focus", focusHandler);
      window.clearTimeout(safetyTimer);
    };

    const focusHandler = () => {
      window.setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          done(null);
        }
      }, 300);
    };

    input.onchange = () => {
      const list = input.files;
      if (!list || list.length === 0) {
        done(null);
      } else {
        done(Array.from(list));
      }
    };

    const safetyTimer = window.setTimeout(() => {
      if (!input.files || input.files.length === 0) {
        done(null);
      }
    }, 120_000);

    window.addEventListener("focus", focusHandler);
    input.click();
  });
}

export function pickAudioFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    let resolved = false;
    const done = (file: File | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(file);
    };

    const cleanup = () => {
      window.removeEventListener("focus", focusHandler);
      window.clearTimeout(safetyTimer);
    };

    const focusHandler = () => {
      window.setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          done(null);
        }
      }, 300);
    };

    input.onchange = () => {
      done(input.files?.[0] ?? null);
    };

    const safetyTimer = window.setTimeout(() => {
      if (!input.files || input.files.length === 0) {
        done(null);
      }
    }, 120_000);

    window.addEventListener("focus", focusHandler);
    input.click();
  });
}
