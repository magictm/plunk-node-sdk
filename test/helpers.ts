import type { FetchLike } from "../src/types.js";

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface FakeResponseSpec {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Throw a network error instead of returning a response. */
  error?: Error;
  /** Delay (ms) before resolving — useful for timeout tests. */
  delayMs?: number;
}

export interface FakeFetch {
  fetch: FetchLike;
  requests: RecordedRequest[];
  /** Number of times the fake was invoked. */
  calls(): number;
}

/**
 * Minimal `fetch` test double. Returns each provided response in order; the
 * last response is reused if the SDK retries past the array length.
 */
export function createFakeFetch(responses: FakeResponseSpec[]): FakeFetch {
  const requests: RecordedRequest[] = [];
  let i = 0;
  const fetchImpl: FetchLike = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const raw = init.headers as Record<string, string>;
      for (const [k, v] of Object.entries(raw)) headers[k] = String(v);
    }
    let body: unknown;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    requests.push({ url, method, headers, body });

    if (init?.signal?.aborted) {
      const reason =
        init.signal.reason ??
        Object.assign(new Error("aborted"), { name: "AbortError" });
      throw reason;
    }

    const spec = responses[Math.min(i, responses.length - 1)] ?? {
      status: 200,
      body: {},
    };
    i++;

    if (spec.delayMs) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, spec.delayMs);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          const reason =
            init.signal!.reason ??
            Object.assign(new Error("aborted"), { name: "AbortError" });
          reject(reason);
        });
      });
    }
    if (spec.error) throw spec.error;

    const status = spec.status ?? 200;
    const responseBody =
      spec.body === undefined ? "" : JSON.stringify(spec.body);
    const respHeaders = new Headers(spec.headers ?? {});
    if (!respHeaders.has("content-type") && responseBody) {
      respHeaders.set("content-type", "application/json");
    }
    return new Response(responseBody, {
      status,
      headers: respHeaders,
    });
  };
  return {
    fetch: fetchImpl,
    requests,
    calls: () => requests.length,
  };
}

/** Wrap a value as a successful Plunk envelope. */
export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}
