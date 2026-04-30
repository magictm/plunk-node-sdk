/**
 * Common shared types for the Plunk SDK.
 *
 * @see https://docs.useplunk.com/api-reference/overview
 */

/** Successful response wrapper returned by every Plunk endpoint. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp?: string;
}

/** Error response wrapper returned by every Plunk endpoint. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId?: string;
    errors?: { field: string; message: string; code: string }[];
    suggestion?: string;
  };
  timestamp?: string;
}

/** Common pagination parameters accepted by every list endpoint. */
export interface ListParams {
  /** Number of items per page (default 20, max 100). */
  limit?: number;
  /** Pagination cursor returned by the previous page. */
  cursor?: string;
}

/** Cursor-paginated page returned by every list endpoint. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/** Per-call request options accepted by every SDK method. */
export interface RequestOptions {
  /** AbortSignal to cancel the request. */
  signal?: AbortSignal;
  /** Per-request timeout in milliseconds (overrides the client default). */
  timeoutMs?: number;
  /**
   * Idempotency key — sent as the `Idempotency-Key` header. Useful for safely
   * retrying mutating requests.
   */
  idempotencyKey?: string;
  /** Additional headers to merge into the request. */
  headers?: Record<string, string>;
}

/**
 * Minimal `fetch` shape the SDK requires. `globalThis.fetch` from Node 24+
 * (and any spec-compliant polyfill) satisfies this signature.
 */
export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;
