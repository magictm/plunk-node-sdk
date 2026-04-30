import { PlunkError } from "./errors.js";
import type {
  ApiError,
  ApiSuccess,
  FetchLike,
  ListParams,
  Paginated,
  RequestOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://next-api.useplunk.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_USER_AGENT = "plunk-node-sdk/0.1.0";

/** Configuration accepted by {@link HttpClient} (and the public `Plunk` class). */
export interface HttpClientOptions {
  /** Plunk API key (`sk_*` for most endpoints, `pk_*` for `/v1/track`). */
  apiKey: string;
  /** Override the API base URL (e.g. for self-hosted Plunk). */
  baseUrl?: string;
  /** Inject a custom fetch implementation (defaults to `globalThis.fetch`). */
  fetch?: FetchLike;
  /** Default request timeout in milliseconds. */
  timeoutMs?: number;
  /** Maximum number of automatic retries on transient failures. Set to `0` to disable. */
  maxRetries?: number;
  /** User-Agent header to send with every request. */
  userAgent?: string;
}

interface InternalRequestInit {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  options?: RequestOptions;
}

/** Internal HTTP client. Consumers should use the high-level `Plunk` class. */
export class HttpClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: FetchLike;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;
  readonly #userAgent: string;

  constructor(options: HttpClientOptions) {
    if (!options.apiKey || typeof options.apiKey !== "string") {
      throw new TypeError("Plunk: `apiKey` is required.");
    }
    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new TypeError(
        "Plunk: no `fetch` implementation found. Use Node.js >= 24 or pass `fetch` explicitly.",
      );
    }
    this.#fetch = fetchImpl;
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.#userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  /**
   * Perform an authenticated request and return the unwrapped `data` payload.
   * Throws {@link PlunkError} on any non-success response.
   */
  async request<T>(init: InternalRequestInit): Promise<T> {
    const url = this.#buildUrl(init.path, init.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.#apiKey}`,
      Accept: "application/json",
      "User-Agent": this.#userAgent,
    };
    let body: string | undefined;
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.body);
    }
    const opt = init.options;
    if (opt?.idempotencyKey) {
      headers["Idempotency-Key"] = opt.idempotencyKey;
    }
    if (opt?.headers) {
      for (const [k, v] of Object.entries(opt.headers)) headers[k] = v;
    }

    const timeoutMs = opt?.timeoutMs ?? this.#timeoutMs;
    const maxAttempts = this.#maxRetries + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const signal = combineSignals(opt?.signal, timeoutMs);
      try {
        const response = await this.#fetch(url, {
          method: init.method,
          headers,
          body,
          signal,
        });
        if (response.ok) {
          return await parseSuccess<T>(response);
        }
        const error = await parseError(response);
        if (attempt < maxAttempts - 1 && error.isRetryable) {
          const wait = retryDelayMs(response, attempt);
          await sleep(wait, opt?.signal);
          lastError = error;
          continue;
        }
        throw error;
      } catch (err) {
        if (err instanceof PlunkError) throw err;
        if (isAbortError(err) && opt?.signal?.aborted) {
          // User-initiated cancel — never retry.
          throw err;
        }
        if (isAbortError(err)) {
          // Timeout fired.
          if (attempt < maxAttempts - 1) {
            lastError = err;
            await sleep(backoffMs(attempt), opt?.signal);
            continue;
          }
          throw new PlunkError({
            code: "TIMEOUT",
            message: `Request to ${init.path} timed out after ${timeoutMs}ms`,
            statusCode: 0,
          });
        }
        // Network error — retry if budget remains.
        if (attempt < maxAttempts - 1) {
          lastError = err;
          await sleep(backoffMs(attempt), opt?.signal);
          continue;
        }
        throw new PlunkError({
          code: "NETWORK_ERROR",
          message:
            err instanceof Error
              ? err.message
              : `Network request to ${init.path} failed`,
          statusCode: 0,
        });
      }
    }
    // Unreachable, but TypeScript needs a terminator.
    throw lastError ?? new Error("Plunk: request failed");
  }

  /**
   * Iterate every item across every page of a list endpoint.
   *
   * ```ts
   * for await (const contact of http.paginate("/contacts")) { ... }
   * ```
   */
  async *paginate<T>(
    path: string,
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<T, void, void> {
    let cursor = params.cursor;
    const limit = params.limit;
    while (true) {
      const page = await this.request<Paginated<T>>({
        method: "GET",
        path,
        query: { limit, cursor },
        options,
      });
      for (const item of page.items) yield item;
      if (!page.hasMore || !page.nextCursor) return;
      cursor = page.nextCursor;
    }
  }

  #buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>,
  ): string {
    const url = new URL(
      path.startsWith("/") ? path.slice(1) : path,
      `${this.#baseUrl}/`,
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

async function parseSuccess<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new PlunkError({
      code: "INVALID_RESPONSE",
      message: "Failed to parse JSON response from Plunk API",
      statusCode: response.status,
    });
  }
  if (
    json &&
    typeof json === "object" &&
    "success" in json &&
    (json as { success: unknown }).success === true
  ) {
    return (json as ApiSuccess<T>).data;
  }
  // Some endpoints may return raw payloads — surface them directly.
  return json as T;
}

async function parseError(response: Response): Promise<PlunkError> {
  let raw: unknown;
  let parsed: ApiError | undefined;
  try {
    const text = await response.text();
    if (text) {
      raw = JSON.parse(text);
      if (
        raw &&
        typeof raw === "object" &&
        "error" in raw &&
        (raw as ApiError).error
      ) {
        parsed = raw as ApiError;
      }
    }
  } catch {
    // Ignore — fall through to generic error.
  }
  if (parsed?.error) {
    return new PlunkError(
      {
        code: parsed.error.code,
        message: parsed.error.message,
        statusCode: parsed.error.statusCode ?? response.status,
        requestId: parsed.error.requestId,
        errors: parsed.error.errors,
        suggestion: parsed.error.suggestion,
      },
      raw,
    );
  }
  return new PlunkError(
    {
      code: `HTTP_${response.status}`,
      message: response.statusText || `HTTP ${response.status}`,
      statusCode: response.status,
    },
    raw,
  );
}

function combineSignals(
  userSignal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!userSignal) return timeoutSignal;
  // `AbortSignal.any` is only available in Node 20.3+. Inline a small
  // equivalent so we work on Node 18+ as well.
  if (typeof (AbortSignal as { any?: unknown }).any === "function") {
    return (
      AbortSignal as unknown as {
        any: (signals: AbortSignal[]) => AbortSignal;
      }
    ).any([userSignal, timeoutSignal]);
  }
  const controller = new AbortController();
  const onAbort = (source: AbortSignal) => () => {
    if (controller.signal.aborted) return;
    controller.abort(source.reason);
  };
  if (userSignal.aborted) controller.abort(userSignal.reason);
  else if (timeoutSignal.aborted) controller.abort(timeoutSignal.reason);
  else {
    userSignal.addEventListener("abort", onAbort(userSignal), { once: true });
    timeoutSignal.addEventListener("abort", onAbort(timeoutSignal), {
      once: true,
    });
  }
  return controller.signal;
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || err.name === "TimeoutError")
  );
}

function backoffMs(attempt: number): number {
  const base = 250 * 2 ** attempt;
  const jitter = Math.random() * 100;
  return Math.min(base + jitter, 8_000);
}

function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 30_000);
    }
    const date = Date.parse(header);
    if (!Number.isNaN(date)) {
      return Math.max(0, Math.min(date - Date.now(), 30_000));
    }
  }
  return backoffMs(attempt);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      reject(signal!.reason ?? new Error("Aborted"));
    };
    if (signal) {
      if (signal.aborted) {
        clearTimeout(id);
        reject(signal.reason ?? new Error("Aborted"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
