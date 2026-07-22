# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`plunk-node-sdk` — a zero-runtime-dependency, ESM-only, TypeScript-first client for the [Plunk API](https://docs.useplunk.com/api-reference/overview). Published to npm. `playground/` is a separate local Express app (not shipped) that exercises the built SDK against the live API.

## Hard constraints (do not break these)

- **Zero runtime dependencies.** Only Node built-ins (`fetch`, `AbortSignal`, `URL`, `crypto`). Never add a `dependencies` entry to `package.json`. `devDependencies` is limited to `typescript` and `@types/node`.
- **Node 18+ compatibility.** CI runs the matrix on 18/20/22/24. Anything newer must be feature-detected and polyfilled inline — see `combineSignals` in [src/http.ts](src/http.ts) for the `AbortSignal.any` fallback pattern. Don't assume APIs above the Node 18 baseline.
- **ESM only with explicit `.js` import specifiers.** `moduleResolution` is `NodeNext`, so relative imports in `.ts` source must end in `.js` (e.g. `import { HttpClient } from "./http.js"`), even though the file on disk is `.ts`. Omitting `.js` breaks the build.

## Commands

```bash
pnpm build          # tsc → dist/ (the published artifact)
pnpm typecheck      # tsc --noEmit on src
pnpm lint           # typecheck of src AND test (no ESLint; "lint" == type-checking)
pnpm test           # build + build:tests + run compiled tests
pnpm test:only      # run compiled tests WITHOUT rebuilding (fast iteration after a build)
pnpm clean          # remove dist/ and dist-test/
```

pnpm is required (`packageManager` pins pnpm@9). Node >= 18.

## Tests

There is **no test-runner dependency**. Tests use Node's built-in `node --test`. The flow is compile-then-run:

1. Test `.ts` files in `test/` compile to `dist-test/` via `tsconfig.test.json`.
2. [scripts/run-node-tests.mjs](scripts/run-node-tests.mjs) walks `dist-test/test/` for `*.test.js` and runs them.

Because tests run against **compiled JS**, you must build before running. To run or iterate on a single test:

```bash
pnpm build:tests                                   # compile tests to dist-test/
node --test dist-test/test/http.test.js            # one file
node --test --test-name-pattern="retries" dist-test/test/http.test.js   # one test by name
```

Editing a `.ts` test and re-running the `dist-test/*.js` without recompiling runs stale code — recompile first.

Tests never hit the network: they inject a fake `fetch` via `createFakeFetch` in [test/helpers.ts](test/helpers.ts) (returns queued responses in order; reuses the last one on retry) and construct the client with `maxRetries: 0` unless testing retries.

## Architecture

Three layers, all under `src/`:

- **`Plunk`** ([src/client.ts](src/client.ts)) — the public entrypoint. Accepts a `string` secret key or an `HttpClientOptions` object (`{ secretKey?, publicKey? }`, at least one required), constructs one `HttpClient`, and hangs a resource instance off each property (`plunk.contacts`, `plunk.campaigns`, …). `send`/`track`/`verify` are convenience shortcuts to `plunk.public`.
- **`HttpClient`** ([src/http.ts](src/http.ts)) — the only code that touches `fetch`. All request semantics live here: auth header, URL building, retry/backoff, timeout + abort composition, and **response-envelope unwrapping**. Holds both `secretKey` and `publicKey`; each `request()` picks one via `init.auth` (`"secret"` default, `"public"` for `/v1/track`) and throws `MISSING_SECRET_KEY`/`MISSING_PUBLIC_KEY` if that key wasn't configured. `request<T>()` returns the inner `data` of the API's `{ success, data }` envelope (or the raw body if no envelope) — resources never see the wrapper. `paginate<T>()` is an async generator that walks `nextCursor`/`hasMore`.
- **Resources** ([src/resources/](src/resources/)) — one class per API area (contacts, templates, campaigns, segments, workflows, events, domains, public). They are thin: each method just describes an HTTP call (`method`, `path`, `query`, `body`) and delegates to `this.#http.request(...)`. No business logic, no fetch, no error handling here.

Supporting modules: [src/types.ts](src/types.ts) (shared `ApiSuccess`/`ApiError` envelopes, `ListParams`, `Paginated`, `RequestOptions`, `FetchLike`) and [src/errors.ts](src/errors.ts) (`PlunkError`).

### Error model

Every non-success response and every client-side failure throws `PlunkError` (never a raw `fetch` rejection). `parseError` in `http.ts` maps the API's `{ error: {...} }` shape onto it; client-side failures use synthetic codes `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`, `MISSING_SECRET_KEY`, `MISSING_PUBLIC_KEY`, or `HTTP_<status>`. `isRetryable` (429 or ≥500) drives the retry loop. User-initiated aborts (`opt.signal` fired) are never retried; timeout aborts are.

### Pagination convention

List resources expose a pair: `list(...)` returns a single `Paginated<T>` page, `listAll(...)` returns `http.paginate<T>(...)` — an async generator over every page. Keep both when adding a list endpoint.

## Adding an endpoint

1. Add/extend the resource class in `src/resources/<area>.ts` following the existing thin-method pattern (see [src/resources/contacts.ts](src/resources/contacts.ts) for CRUD, [src/resources/campaigns.ts](src/resources/campaigns.ts) for extra actions like `send`/`cancel`/`stats`). `encodeURIComponent` all path params.
2. Export every new public type and class from [src/index.ts](src/index.ts) — the package's entire surface is re-exported there, and interfaces are `export type`.
3. If it's a new resource, wire it into the `Plunk` constructor in `src/client.ts`.
4. Give params/response interfaces an index signature (`[key: string]: unknown`) where the API may add fields, for forward compatibility (existing resources do this).
5. Add a resource→HTTP mapping test in [test/resources.test.ts](test/resources.test.ts).

## Releasing

`pnpm release:patch|minor|major` runs the tests, bumps the version with `npm version`, and pushes tags. The `publish` job in [.github/workflows/ci.yml](.github/workflows/ci.yml) publishes to npm (with provenance) on any pushed `v*` tag. Only `dist/` and the docs listed in `package.json#files` are published.
