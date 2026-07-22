import { HttpClient, type HttpClientOptions } from "./http.js";
import { CampaignsResource } from "./resources/campaigns.js";
import { ContactsResource } from "./resources/contacts.js";
import { DomainsResource } from "./resources/domains.js";
import { EventsResource } from "./resources/events.js";
import {
  PublicResource,
  type SendEmailParams,
  type SendEmailResponse,
  type TrackEventParams,
  type TrackEventResponse,
  type VerifyEmailParams,
  type VerifyEmailResponse,
} from "./resources/public.js";
import { SegmentsResource } from "./resources/segments.js";
import { TemplatesResource } from "./resources/templates.js";
import { WorkflowsResource } from "./resources/workflows.js";
import type { RequestOptions } from "./types.js";

/**
 * Main entrypoint for the Plunk SDK.
 *
 * ```ts
 * import { Plunk } from "plunk-node-sdk";
 *
 * const plunk = new Plunk(process.env.PLUNK_SECRET_KEY!);
 * await plunk.send({ to: "user@example.com", subject: "Hi", body: "<p>Hello</p>" });
 * ```
 *
 * A bare string is treated as the secret key (`sk_*`). To also track events
 * (`/v1/track`, which requires a public `pk_*` key), pass both:
 *
 * ```ts
 * const plunk = new Plunk({
 *   secretKey: process.env.PLUNK_SECRET_KEY!,
 *   publicKey: process.env.PLUNK_PUBLIC_KEY!,
 * });
 * ```
 */
export class Plunk {
  /** Public API endpoints — `/v1/send`, `/v1/track`, `/v1/verify`. */
  readonly public: PublicResource;
  readonly contacts: ContactsResource;
  readonly templates: TemplatesResource;
  readonly campaigns: CampaignsResource;
  readonly segments: SegmentsResource;
  readonly workflows: WorkflowsResource;
  readonly events: EventsResource;
  readonly domains: DomainsResource;
  /** Underlying HTTP client. Use for advanced/custom requests. */
  readonly http: HttpClient;

  constructor(secretKeyOrOptions: string | HttpClientOptions) {
    const options: HttpClientOptions =
      typeof secretKeyOrOptions === "string"
        ? { secretKey: secretKeyOrOptions }
        : secretKeyOrOptions;
    this.http = new HttpClient(options);
    this.public = new PublicResource(this.http);
    this.contacts = new ContactsResource(this.http);
    this.templates = new TemplatesResource(this.http);
    this.campaigns = new CampaignsResource(this.http);
    this.segments = new SegmentsResource(this.http);
    this.workflows = new WorkflowsResource(this.http);
    this.events = new EventsResource(this.http);
    this.domains = new DomainsResource(this.http);
  }

  /** Shortcut for {@link PublicResource.send}. */
  send(
    params: SendEmailParams,
    options?: RequestOptions,
  ): Promise<SendEmailResponse> {
    return this.public.send(params, options);
  }

  /** Shortcut for {@link PublicResource.track}. */
  track(
    params: TrackEventParams,
    options?: RequestOptions,
  ): Promise<TrackEventResponse> {
    return this.public.track(params, options);
  }

  /** Shortcut for {@link PublicResource.verify}. */
  verify(
    params: VerifyEmailParams,
    options?: RequestOptions,
  ): Promise<VerifyEmailResponse> {
    return this.public.verify(params, options);
  }
}
