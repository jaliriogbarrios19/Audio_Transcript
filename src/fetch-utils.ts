export async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
