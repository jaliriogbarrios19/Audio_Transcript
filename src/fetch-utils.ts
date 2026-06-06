import { requestUrl } from "obsidian";

export interface RequestUrlResult {
  status: number;
  json: unknown;
  text: string;
}

export async function requestUrlWithSignal(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | FormData | ArrayBuffer;
    signal?: AbortSignal;
  }
): Promise<RequestUrlResult> {
  const { signal, ...rest } = options;
  if (!signal) return requestUrl({ url, ...rest });
  return Promise.race([
    requestUrl({ url, ...rest }),
    new Promise<never>((_, reject) => {
      if (signal.aborted) reject(new DOMException("Aborted", "AbortError"));
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true }
      );
    }),
  ]);
}

export async function requestUrlWithRetry(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
  retries = 3
): Promise<RequestUrlResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (options.signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    try {
      const res = await requestUrlWithSignal(url, options);
      if (
        (res.status >= 200 && res.status < 300) ||
        (res.status < 500 && res.status !== 429)
      )
        return res;
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
  throw new Error("requestUrlWithRetry: unreachable");
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}
