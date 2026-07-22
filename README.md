# plunk-node-sdk

Zero-dependency Node.js SDK for the [Plunk API](https://docs.useplunk.com/api-reference/overview).

- **Zero runtime dependencies** — uses only Node built-ins (`fetch`, `AbortSignal`, `URL`).
- **Full API coverage** — public API (`/v1/send`, `/v1/track`, `/v1/verify`) plus contacts, templates, campaigns, segments, workflows, events, and domains.
- **TypeScript-first** — fully typed inputs and responses; ships `.d.ts` and ESM `.js`.
- **Auto-retry, auto-paginate, abort/timeout** — sensible defaults, all configurable.

> Requires **Node.js 18 or newer** (built-in `fetch` + `AbortSignal.timeout`). ESM only.
>
> Tested on Node 18, 20, 22, and 24.

## Install

```bash
pnpm add plunk-node-sdk
# or
npm install plunk-node-sdk
```

## Quick start

```ts
import { Plunk } from "plunk-node-sdk";

const plunk = new Plunk(process.env.PLUNK_SECRET_KEY!);

await plunk.send({
  to: "user@example.com",
  subject: "Welcome",
  body: "<p>Hello from Plunk!</p>",
});
```

## Authentication

Plunk uses a **two-key model**:

- **Secret key** (`sk_*`) — every endpoint except track: `send`, `verify`, contacts, campaigns, templates, segments, workflows, domains.
- **Public key** (`pk_*`) — **only** `plunk.track(...)` (`POST /v1/track`). Calling `track` with a secret key is rejected by the API.

Pass a bare string (treated as the secret key) or an options object:

```ts
new Plunk("sk_your_secret_key");

new Plunk({
  secretKey: "sk_your_secret_key",
  publicKey: "pk_your_public_key", // required to call plunk.track(...)
  baseUrl: "https://next-api.useplunk.com", // override (e.g. self-hosted)
  timeoutMs: 30_000,
  maxRetries: 2,
  userAgent: "my-app/1.0",
  fetch: globalThis.fetch, // inject a custom fetch
});
```

At least one of `secretKey` / `publicKey` is required. Calling a method whose key
isn't configured throws a `PlunkError` (`MISSING_SECRET_KEY` or
`MISSING_PUBLIC_KEY`) **before** any network request — so `plunk.track(...)`
without a `publicKey` fails fast with a clear message instead of a `401`.

> **Breaking change (v0.3.0):** the options field `apiKey` was renamed to
> `secretKey`, and `publicKey` was added. Migrate `{ apiKey: "sk_…" }` →
> `{ secretKey: "sk_…" }`. The bare-string form `new Plunk("sk_…")` is unchanged.

## Public API

```ts
// Send a transactional email
await plunk.send({
  to: "user@example.com",
  subject: "Hi",
  body: "<p>Hello</p>",
});

// Track an event
await plunk.track({ event: "signed_up", email: "user@example.com" });

// Verify an email
const result = await plunk.verify({ email: "user@example.com" });
console.log(result.valid, result.isDisposable);
```

## Contacts

```ts
const page = await plunk.contacts.list({ limit: 50 });
const contact = await plunk.contacts.create({
  email: "jane@example.com",
  subscribed: true,
  data: { plan: "pro" },
});
await plunk.contacts.update(contact.id, { subscribed: false });
await plunk.contacts.delete(contact.id);

// Iterate every contact across every page
for await (const c of plunk.contacts.listAll()) {
  console.log(c.email);
}
```

## Templates

```ts
const tpl = await plunk.templates.create({
  name: "Welcome",
  subject: "Welcome to Acme",
  body: "<p>Hi {{name}}</p>",
  type: "transactional",
});
await plunk.templates.update(tpl.id, { subject: "Welcome aboard" });
```

## Campaigns

```ts
const c = await plunk.campaigns.create({
  name: "Spring promo",
  subject: "20% off",
  body: "<p>...</p>",
  segments: ["seg_xyz"],
});
await plunk.campaigns.test(c.id, { email: "qa@example.com" });
await plunk.campaigns.send(c.id); // or schedule with { scheduledAt: "..." }
const stats = await plunk.campaigns.stats(c.id);
```

## Segments

```ts
const seg = await plunk.segments.create({ name: "VIPs", type: "static" });
await plunk.segments.addMembers(seg.id, {
  emails: ["a@example.com", "b@example.com"],
});
for await (const member of plunk.segments.listAllContacts(seg.id)) {
  console.log(member.email);
}
```

## Workflows

```ts
for await (const wf of plunk.workflows.listAll()) {
  console.log(wf.name);
}
const execs = await plunk.workflows.listExecutions("wf_id", { limit: 50 });
```

## Events

```ts
const names = await plunk.events.names();
for await (const evt of plunk.events.listAll()) {
  console.log(evt.name, evt.email);
}
```

## Domains

```ts
const domains = await plunk.domains.list();
const added = await plunk.domains.create({ name: "mail.acme.com" });
await plunk.domains.delete(added.id);
```

## Error handling

Every non-success response throws a typed `PlunkError`:

```ts
import { PlunkError } from "plunk-node-sdk";

try {
  await plunk.contacts.create({ email: "not-an-email" });
} catch (err) {
  if (err instanceof PlunkError) {
    console.error(err.code); // "VALIDATION_ERROR"
    console.error(err.statusCode); // 422
    console.error(err.requestId);
    console.error(err.errors); // field-level details
    console.error(err.suggestion);
  } else {
    throw err;
  }
}
```

Synthetic codes used for client-side failures: `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`, `MISSING_SECRET_KEY`, `MISSING_PUBLIC_KEY`.

## Timeouts & cancellation

```ts
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 5_000);

await plunk.contacts.list({ limit: 100 }, { signal: ctrl.signal });

// Per-call timeout (overrides client default)
await plunk.events.names({ timeoutMs: 2_000 });
```

## Retries

Transient failures (`429`, `5xx`, network errors, timeouts) are retried up to
`maxRetries` times (default `2`) with exponential backoff + jitter. The
`Retry-After` header is honored when present.

```ts
new Plunk({ secretKey: "sk_…", maxRetries: 0 }); // disable
```

## Idempotency

```ts
await plunk.contacts.create(
  { email: "user@example.com" },
  { idempotencyKey: crypto.randomUUID() },
);
```

## Custom fetch

Inject your own `fetch` (e.g. for proxies, tracing, mocking in tests):

```ts
import { Plunk } from "plunk-node-sdk";

const plunk = new Plunk({
  secretKey: "sk_…",
  fetch: async (url, init) => {
    console.log("→", init?.method ?? "GET", url);
    return fetch(url, init);
  },
});
```

## TypeScript

Every method is fully typed. Resource interfaces (e.g. `Contact`, `Campaign`,
`SendEmailParams`) are exported from the package root.

```ts
import type {
  Contact,
  Plunk,
  PlunkError,
  SendEmailParams,
} from "plunk-node-sdk";
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

## License

MIT
