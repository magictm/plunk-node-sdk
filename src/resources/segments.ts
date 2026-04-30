import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";
import type { Contact } from "./contacts.js";

/**
 * A segment (dynamic or static contact group).
 *
 * @see https://docs.useplunk.com/api-reference/segments/createSegment
 */
export interface Segment {
  id: string;
  name: string;
  type: "dynamic" | "static" | string;
  /** Dynamic segments only — JSON filter rules. */
  filters?: Record<string, unknown> | null;
  count?: number;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateSegmentParams {
  name: string;
  type: "dynamic" | "static";
  filters?: Record<string, unknown>;
  /** For static segments: initial member emails. */
  emails?: string[];
  [key: string]: unknown;
}

export interface UpdateSegmentParams {
  name?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SegmentMembersParams {
  /** Email addresses to add or remove. */
  emails: string[];
  [key: string]: unknown;
}

/** CRUD on `/segments` plus member management. */
export class SegmentsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Segment>> {
    return this.#http.request<Paginated<Segment>>({
      method: "GET",
      path: "/segments",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Segment, void, void> {
    return this.#http.paginate<Segment>("/segments", params, options);
  }

  create(
    params: CreateSegmentParams,
    options?: RequestOptions,
  ): Promise<Segment> {
    return this.#http.request<Segment>({
      method: "POST",
      path: "/segments",
      body: params,
      options,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Segment> {
    return this.#http.request<Segment>({
      method: "GET",
      path: `/segments/${encodeURIComponent(id)}`,
      options,
    });
  }

  update(
    id: string,
    patch: UpdateSegmentParams,
    options?: RequestOptions,
  ): Promise<Segment> {
    return this.#http.request<Segment>({
      method: "PATCH",
      path: `/segments/${encodeURIComponent(id)}`,
      body: patch,
      options,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ id: string }> {
    return this.#http.request<{ id: string }>({
      method: "DELETE",
      path: `/segments/${encodeURIComponent(id)}`,
      options,
    });
  }

  /** List a single page of contacts in this segment. */
  listContacts(
    id: string,
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Contact>> {
    return this.#http.request<Paginated<Contact>>({
      method: "GET",
      path: `/segments/${encodeURIComponent(id)}/contacts`,
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  /** Async iterator over every contact in this segment. */
  listAllContacts(
    id: string,
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Contact, void, void> {
    return this.#http.paginate<Contact>(
      `/segments/${encodeURIComponent(id)}/contacts`,
      params,
      options,
    );
  }

  /** Add contacts (by email) to a static segment. */
  addMembers(
    id: string,
    params: SegmentMembersParams,
    options?: RequestOptions,
  ): Promise<{ added: number }> {
    return this.#http.request<{ added: number }>({
      method: "POST",
      path: `/segments/${encodeURIComponent(id)}/members`,
      body: params,
      options,
    });
  }

  /** Remove contacts (by email) from a static segment. */
  removeMembers(
    id: string,
    params: SegmentMembersParams,
    options?: RequestOptions,
  ): Promise<{ removed: number }> {
    return this.#http.request<{ removed: number }>({
      method: "DELETE",
      path: `/segments/${encodeURIComponent(id)}/members`,
      body: params,
      options,
    });
  }
}
