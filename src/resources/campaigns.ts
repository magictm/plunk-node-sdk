import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";

/**
 * A campaign (one-time broadcast) in your Plunk project.
 *
 * @see https://docs.useplunk.com/api-reference/campaigns/createCampaign
 */
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled" | string;
  recipients?: string[];
  segments?: string[];
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateCampaignParams {
  name: string;
  subject: string;
  body: string;
  recipients?: string[];
  segments?: string[];
  from?: string;
  reply?: string;
  [key: string]: unknown;
}

export interface UpdateCampaignParams {
  name?: string;
  subject?: string;
  body?: string;
  recipients?: string[];
  segments?: string[];
  from?: string;
  reply?: string;
  [key: string]: unknown;
}

/** Send-now or schedule a campaign. */
export interface SendCampaignParams {
  /** ISO timestamp to schedule the campaign at; omit to send immediately. */
  scheduledAt?: string;
  [key: string]: unknown;
}

export interface TestCampaignParams {
  /** Recipient(s) of the test email. */
  email: string | string[];
  [key: string]: unknown;
}

export interface CampaignStats {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  [key: string]: unknown;
}

/** CRUD operations on `/campaigns` plus send/cancel/test/stats. */
export class CampaignsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Campaign>> {
    return this.#http.request<Paginated<Campaign>>({
      method: "GET",
      path: "/campaigns",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Campaign, void, void> {
    return this.#http.paginate<Campaign>("/campaigns", params, options);
  }

  create(
    params: CreateCampaignParams,
    options?: RequestOptions,
  ): Promise<Campaign> {
    return this.#http.request<Campaign>({
      method: "POST",
      path: "/campaigns",
      body: params,
      options,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.#http.request<Campaign>({
      method: "GET",
      path: `/campaigns/${encodeURIComponent(id)}`,
      options,
    });
  }

  update(
    id: string,
    patch: UpdateCampaignParams,
    options?: RequestOptions,
  ): Promise<Campaign> {
    return this.#http.request<Campaign>({
      method: "PATCH",
      path: `/campaigns/${encodeURIComponent(id)}`,
      body: patch,
      options,
    });
  }

  /** Send the campaign immediately, or schedule it via `scheduledAt`. */
  send(
    id: string,
    params: SendCampaignParams = {},
    options?: RequestOptions,
  ): Promise<Campaign> {
    return this.#http.request<Campaign>({
      method: "POST",
      path: `/campaigns/${encodeURIComponent(id)}/send`,
      body: params,
      options,
    });
  }

  /** Cancel a scheduled campaign. */
  cancel(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.#http.request<Campaign>({
      method: "POST",
      path: `/campaigns/${encodeURIComponent(id)}/cancel`,
      body: {},
      options,
    });
  }

  /** Send a test email to one or more recipients. */
  test(
    id: string,
    params: TestCampaignParams,
    options?: RequestOptions,
  ): Promise<{ sent: number }> {
    return this.#http.request<{ sent: number }>({
      method: "POST",
      path: `/campaigns/${encodeURIComponent(id)}/test`,
      body: params,
      options,
    });
  }

  /** Fetch analytics for the campaign. */
  stats(id: string, options?: RequestOptions): Promise<CampaignStats> {
    return this.#http.request<CampaignStats>({
      method: "GET",
      path: `/campaigns/${encodeURIComponent(id)}/stats`,
      options,
    });
  }
}
