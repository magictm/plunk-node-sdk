/**
 * Field-level validation error returned by the Plunk API.
 */
export interface PlunkFieldError {
  field: string;
  message: string;
  code: string;
}

/**
 * Shape of the error payload returned by the Plunk API.
 *
 * @see https://docs.useplunk.com/api-reference/errors
 */
export interface PlunkErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  requestId?: string;
  errors?: PlunkFieldError[];
  suggestion?: string;
}

/**
 * Thrown by the SDK whenever the Plunk API returns a non-success response,
 * or when the SDK fails to reach the API.
 *
 * The fields mirror the JSON returned by the API and are documented at
 * https://docs.useplunk.com/api-reference/errors. When the failure is purely
 * client-side (e.g. network error, timeout) the `code` field is set to a
 * synthetic value such as `NETWORK_ERROR` or `TIMEOUT`.
 */
export class PlunkError extends Error {
  /** Machine-readable error code. */
  readonly code: string;
  /** HTTP status code. `0` when the request never reached the server. */
  readonly statusCode: number;
  /** Request id returned by the API when available. */
  readonly requestId?: string;
  /** Field-level validation errors when applicable. */
  readonly errors?: PlunkFieldError[];
  /** Optional human-friendly suggestion. */
  readonly suggestion?: string;
  /** Raw JSON body of the response (when one was returned). */
  readonly raw?: unknown;

  constructor(payload: PlunkErrorPayload, raw?: unknown) {
    super(`[${payload.code}] ${payload.message}`);
    this.name = "PlunkError";
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.requestId = payload.requestId;
    this.errors = payload.errors;
    this.suggestion = payload.suggestion;
    this.raw = raw;
  }

  /** True when the failure is potentially transient and worth retrying. */
  get isRetryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500;
  }
}
