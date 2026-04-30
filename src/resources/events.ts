import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";

export interface PlunkEvent {
  id: string;
  name: string;
  contactId?: string;
  email?: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
  [key: string]: unknown;
}

/** Read-only access to recorded events under `/events`. */
export class EventsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<PlunkEvent>> {
    return this.#http.request<Paginated<PlunkEvent>>({
      method: "GET",
      path: "/events",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<PlunkEvent, void, void> {
    return this.#http.paginate<PlunkEvent>("/events", params, options);
  }

  /** List the unique event names tracked in your project. */
  names(options?: RequestOptions): Promise<string[]> {
    return this.#http.request<string[]>({
      method: "GET",
      path: "/events/names",
      options,
    });
  }
}
