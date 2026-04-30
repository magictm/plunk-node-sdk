import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";

/**
 * An email template in your Plunk project.
 *
 * @see https://docs.useplunk.com/api-reference/templates/createTemplate
 */
export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  type?: "marketing" | "transactional";
  from?: string | null;
  reply?: string | null;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateTemplateParams {
  name: string;
  subject: string;
  body: string;
  type?: "marketing" | "transactional";
  from?: string;
  reply?: string;
  [key: string]: unknown;
}

export interface UpdateTemplateParams {
  name?: string;
  subject?: string;
  body?: string;
  type?: "marketing" | "transactional";
  from?: string;
  reply?: string;
  [key: string]: unknown;
}

/** CRUD operations on `/templates`. */
export class TemplatesResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Template>> {
    return this.#http.request<Paginated<Template>>({
      method: "GET",
      path: "/templates",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Template, void, void> {
    return this.#http.paginate<Template>("/templates", params, options);
  }

  create(
    params: CreateTemplateParams,
    options?: RequestOptions,
  ): Promise<Template> {
    return this.#http.request<Template>({
      method: "POST",
      path: "/templates",
      body: params,
      options,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Template> {
    return this.#http.request<Template>({
      method: "GET",
      path: `/templates/${encodeURIComponent(id)}`,
      options,
    });
  }

  update(
    id: string,
    patch: UpdateTemplateParams,
    options?: RequestOptions,
  ): Promise<Template> {
    return this.#http.request<Template>({
      method: "PATCH",
      path: `/templates/${encodeURIComponent(id)}`,
      body: patch,
      options,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ id: string }> {
    return this.#http.request<{ id: string }>({
      method: "DELETE",
      path: `/templates/${encodeURIComponent(id)}`,
      options,
    });
  }
}
