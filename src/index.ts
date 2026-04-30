/**
 * Plunk Node.js SDK — zero-dependency client for https://docs.useplunk.com/api-reference/overview
 *
 * Requires Node.js >= 24.
 */

export { Plunk } from "./client.js";
export { HttpClient, type HttpClientOptions } from "./http.js";
export {
  PlunkError,
  type PlunkErrorPayload,
  type PlunkFieldError,
} from "./errors.js";

export type {
  ApiError,
  ApiSuccess,
  FetchLike,
  ListParams,
  Paginated,
  RequestOptions,
} from "./types.js";

export {
  PublicResource,
  type SendEmailParams,
  type SendEmailResponse,
  type TrackEventParams,
  type TrackEventResponse,
  type VerifyEmailParams,
  type VerifyEmailResponse,
} from "./resources/public.js";

export {
  ContactsResource,
  type Contact,
  type CreateContactParams,
  type UpdateContactParams,
} from "./resources/contacts.js";

export {
  TemplatesResource,
  type Template,
  type CreateTemplateParams,
  type UpdateTemplateParams,
} from "./resources/templates.js";

export {
  CampaignsResource,
  type Campaign,
  type CampaignStats,
  type CreateCampaignParams,
  type SendCampaignParams,
  type TestCampaignParams,
  type UpdateCampaignParams,
} from "./resources/campaigns.js";

export {
  SegmentsResource,
  type Segment,
  type CreateSegmentParams,
  type SegmentMembersParams,
  type UpdateSegmentParams,
} from "./resources/segments.js";

export {
  WorkflowsResource,
  type Workflow,
  type WorkflowExecution,
  type CreateWorkflowParams,
  type UpdateWorkflowParams,
} from "./resources/workflows.js";

export { EventsResource, type PlunkEvent } from "./resources/events.js";

export {
  DomainsResource,
  type Domain,
  type CreateDomainParams,
} from "./resources/domains.js";

import { Plunk } from "./client.js";
export default Plunk;
