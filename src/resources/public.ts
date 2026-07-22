import type { HttpClient } from "../http.js";
import type { RequestOptions } from "../types.js";

/**
 * Single recipient form of {@link SendEmailParams}.
 *
 * Documented fields are typed; additional fields supported by the API are
 * accepted via the index signature for forward compatibility.
 *
 * @see https://docs.useplunk.com/api-reference/public-api/sendEmail
 */
export interface SendEmailParams {
  /** Recipient address(es). */
  to: string | string[];
  /** Subject line. Required when not using a template. */
  subject?: string;
  /** HTML body. Required when not using a template. */
  body?: string;
  /** Whether to subscribe the recipient(s) to your project. */
  subscribed?: boolean;
  /** Sender name. Defaults to the project's configured sender. */
  name?: string;
  /** Sender address override (must belong to a verified domain). */
  from?: string;
  /** Reply-to address. */
  reply?: string;
  /** Custom headers to attach to the email. */
  headers?: Record<string, string>;
  /** Type of email — `marketing` or `transactional`. */
  type?: "marketing" | "transactional";
  /** Template id when sending via a saved template. */
  template?: string;
  /** Variable substitutions for templates. */
  data?: Record<string, unknown>;
  /** Forward-compatible passthrough for any future fields. */
  [key: string]: unknown;
}

/** Response returned by {@link PublicResource.send}. */
export interface SendEmailResponse {
  success: true;
  emails: { contact: string; email: string }[];
  timestamp: string;
}

/**
 * Parameters for tracking an event.
 *
 * @see https://docs.useplunk.com/api-reference/public-api/trackEvent
 */
export interface TrackEventParams {
  /** Event name (e.g. `signed_up`). */
  event: string;
  /** Email address of the contact. */
  email: string;
  /** Whether the contact is subscribed (creates the contact if missing). */
  subscribed?: boolean;
  /** Arbitrary contact data to merge. */
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Response returned by {@link PublicResource.track}. */
export interface TrackEventResponse {
  contact: string;
  event: string;
  timestamp: string;
}

/**
 * Parameters for verifying an email address.
 *
 * @see https://docs.useplunk.com/api-reference/public-api/verifyEmail
 */
export interface VerifyEmailParams {
  email: string;
}

/** Response returned by {@link PublicResource.verify}. */
export interface VerifyEmailResponse {
  email: string;
  valid: boolean;
  isDisposable: boolean;
  isAlias: boolean;
  isTypo: boolean;
  isPlusAddressed: boolean;
  isPersonalEmail: boolean;
  domainExists: boolean;
  hasWebsite: boolean;
  hasMxRecords: boolean;
  reasons: string[];
  suggestion?: string;
}

/** Public API endpoints under `/v1/*`. */
export class PublicResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  /**
   * Send a transactional email to one or more recipients.
   *
   * @see https://docs.useplunk.com/api-reference/public-api/sendEmail
   */
  send(
    params: SendEmailParams,
    options?: RequestOptions,
  ): Promise<SendEmailResponse> {
    return this.#http.request<SendEmailResponse>({
      method: "POST",
      path: "/v1/send",
      body: params,
      options,
    });
  }

  /**
   * Track a custom event for a contact (creates or updates the contact).
   *
   * Requires the **public** key (`pk_*`) — the Plunk API rejects `/v1/track`
   * calls made with a secret key. Pass `publicKey` to the `Plunk` constructor;
   * otherwise this throws a `PlunkError` with code `MISSING_PUBLIC_KEY`.
   *
   * @see https://docs.useplunk.com/api-reference/public-api/trackEvent
   */
  track(
    params: TrackEventParams,
    options?: RequestOptions,
  ): Promise<TrackEventResponse> {
    return this.#http.request<TrackEventResponse>({
      method: "POST",
      path: "/v1/track",
      body: params,
      auth: "public",
      options,
    });
  }

  /**
   * Verify an email address (validity, disposable, MX records, typos).
   *
   * @see https://docs.useplunk.com/api-reference/public-api/verifyEmail
   */
  verify(
    params: VerifyEmailParams,
    options?: RequestOptions,
  ): Promise<VerifyEmailResponse> {
    return this.#http.request<VerifyEmailResponse>({
      method: "POST",
      path: "/v1/verify",
      body: params,
      options,
    });
  }
}
