import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";

/**
 * A contact in your Plunk project.
 *
 * @see https://docs.useplunk.com/api-reference/contacts/createContact
 */
export interface Contact {
  id: string;
  email: string;
  subscribed: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateContactParams {
  email: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UpdateContactParams {
  email?: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** CRUD operations on `/contacts`. */
export class ContactsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  /** List a single page of contacts. */
  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Contact>> {
    return this.#http.request<Paginated<Contact>>({
      method: "GET",
      path: "/contacts",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  /** Async iterator yielding every contact across every page. */
  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Contact, void, void> {
    return this.#http.paginate<Contact>("/contacts", params, options);
  }

  create(
    params: CreateContactParams,
    options?: RequestOptions,
  ): Promise<Contact> {
    return this.#http.request<Contact>({
      method: "POST",
      path: "/contacts",
      body: params,
      options,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Contact> {
    return this.#http.request<Contact>({
      method: "GET",
      path: `/contacts/${encodeURIComponent(id)}`,
      options,
    });
  }

  update(
    id: string,
    patch: UpdateContactParams,
    options?: RequestOptions,
  ): Promise<Contact> {
    return this.#http.request<Contact>({
      method: "PATCH",
      path: `/contacts/${encodeURIComponent(id)}`,
      body: patch,
      options,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ id: string }> {
    return this.#http.request<{ id: string }>({
      method: "DELETE",
      path: `/contacts/${encodeURIComponent(id)}`,
      options,
    });
  }
}
