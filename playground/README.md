# Plunk SDK Playground

A tiny local web app to exercise every endpoint of `plunk-node-sdk` against the
real Plunk API.

## Setup

```bash
cd playground
cp .env.example .env
# edit .env and set PLUNK_SECRET_KEY=sk_...
pnpm install
pnpm start
```

Then open http://localhost:4000.

## How it works

- Express server (`server.js`) instantiates a `Plunk` client server-side using
  your secret key from `.env`. **The key never leaves the server.**
- The browser UI calls `/api/<resource>/<method>` endpoints with JSON bodies.
- Each route delegates to the corresponding SDK method and returns the result
  (or a structured error including the `PlunkError` code/statusCode/requestId).
- The page is plain static HTML/CSS/JS — no build step.

## Notes

- The playground depends on the local SDK via `file:..` — any rebuild of the
  SDK (`pnpm build` in the repo root) is picked up the next time you restart
  the server.
- Destructive actions (delete contact, delete template, delete domain, etc.)
  are real — they hit the live API.
