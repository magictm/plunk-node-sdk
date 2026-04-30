# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
