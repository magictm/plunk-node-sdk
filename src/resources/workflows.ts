import type { HttpClient } from "../http.js";
import type { ListParams, Paginated, RequestOptions } from "../types.js";

/** A workflow (event-driven automation). */
export interface Workflow {
  id: string;
  name: string;
  trigger?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateWorkflowParams {
  name: string;
  trigger?: string;
  active?: boolean;
  [key: string]: unknown;
}

export interface UpdateWorkflowParams {
  name?: string;
  trigger?: string;
  active?: boolean;
  [key: string]: unknown;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  [key: string]: unknown;
}

/** CRUD on `/workflows` plus execution history. */
export class WorkflowsResource {
  readonly #http: HttpClient;
  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<Workflow>> {
    return this.#http.request<Paginated<Workflow>>({
      method: "GET",
      path: "/workflows",
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAll(
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<Workflow, void, void> {
    return this.#http.paginate<Workflow>("/workflows", params, options);
  }

  create(
    params: CreateWorkflowParams,
    options?: RequestOptions,
  ): Promise<Workflow> {
    return this.#http.request<Workflow>({
      method: "POST",
      path: "/workflows",
      body: params,
      options,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Workflow> {
    return this.#http.request<Workflow>({
      method: "GET",
      path: `/workflows/${encodeURIComponent(id)}`,
      options,
    });
  }

  update(
    id: string,
    patch: UpdateWorkflowParams,
    options?: RequestOptions,
  ): Promise<Workflow> {
    return this.#http.request<Workflow>({
      method: "PATCH",
      path: `/workflows/${encodeURIComponent(id)}`,
      body: patch,
      options,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ id: string }> {
    return this.#http.request<{ id: string }>({
      method: "DELETE",
      path: `/workflows/${encodeURIComponent(id)}`,
      options,
    });
  }

  listExecutions(
    id: string,
    params: ListParams = {},
    options?: RequestOptions,
  ): Promise<Paginated<WorkflowExecution>> {
    return this.#http.request<Paginated<WorkflowExecution>>({
      method: "GET",
      path: `/workflows/${encodeURIComponent(id)}/executions`,
      query: { limit: params.limit, cursor: params.cursor },
      options,
    });
  }

  listAllExecutions(
    id: string,
    params: ListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<WorkflowExecution, void, void> {
    return this.#http.paginate<WorkflowExecution>(
      `/workflows/${encodeURIComponent(id)}/executions`,
      params,
      options,
    );
  }
}
