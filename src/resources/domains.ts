import type { HttpClient } from "../http.js";
import type { RequestOptions } from "../types.js";

/** A sender domain registered with your Plunk project. */
export interface Domain {
  id: string;
  name: string;
  verified: boolean;
  records?: { type: string; name: string; value: string }[];
  createdAt: string;
  [key: string]: unknown;
}

export interface CreateDomainParams {
  name: string;
  [key: string]: unknown;
}

/** Manage verified sender domains under `/domains`. */
export class DomainsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(options?: RequestOptions): Promise<Domain[]> {
    return this.#http.request<Domain[]>({
      method: "GET",
      path: "/domains",
      options,
    });
  }

  create(
    params: CreateDomainParams,
    options?: RequestOptions,
  ): Promise<Domain> {
    return this.#http.request<Domain>({
      method: "POST",
      path: "/domains",
      body: params,
      options,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ id: string }> {
    return this.#http.request<{ id: string }>({
      method: "DELETE",
      path: `/domains/${encodeURIComponent(id)}`,
      options,
    });
  }
}
