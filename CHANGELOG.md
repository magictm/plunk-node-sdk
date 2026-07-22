# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING:** renamed the `apiKey` client option to `secretKey` and added a
  `publicKey` option. At least one of the two is required. Migrate
  `new Plunk({ apiKey: "sk_…" })` → `new Plunk({ secretKey: "sk_…" })`. The
  bare-string form `new Plunk("sk_…")` is unchanged (treated as the secret key).
- `plunk.track()` (`POST /v1/track`) now authenticates with the public key
  (`pk_*`) instead of the single shared key, matching Plunk's two-key model.

### Added

- `publicKey` client option for client-side event tracking.
- Synthetic error codes `MISSING_SECRET_KEY` / `MISSING_PUBLIC_KEY`, thrown
  client-side before any request when a call needs a key that wasn't configured.

### Fixed

- `plunk.track()` no longer sends a secret key to `/v1/track`, which the API
  rejects with `401 INVALID_API_KEY`. It now fails fast with a clear
  `MISSING_PUBLIC_KEY` error when no public key is configured.

## [0.1.0] - 2026-04-30

### Added

- Initial release.
- Zero-dependency ESM SDK for the Plunk API (Node.js ≥ 18).
- `Plunk` client with resource groups: `public`, `contacts`, `templates`,
  `campaigns`, `segments`, `workflows`, `events`, `domains`.
- `PlunkError` with typed `code`, `statusCode`, `requestId`, `errors`, `suggestion`.
- Auto-retry (exponential backoff + `Retry-After`) on `429` / `5xx` / network errors.
- `AbortSignal` + per-call timeout support.
- Cursor-based auto-pagination via `listAll()` async iterators.
- Configurable `fetch` injection for testing and proxies.

[Unreleased]: https://github.com/useplunk/plunk-node-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/useplunk/plunk-node-sdk/releases/tag/v0.1.0
