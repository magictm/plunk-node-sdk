import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HttpClient } from "../src/http.js";
import { PlunkError } from "../src/errors.js";
import { createFakeFetch, ok } from "./helpers.js";

describe("HttpClient", () => {
  it("sends Authorization, User-Agent and JSON body", async () => {
    const fake = createFakeFetch([{ status: 200, body: ok({ id: "x" }) }]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    const data = await http.request<{ id: string }>({
      method: "POST",
      path: "/contacts",
      body: { email: "a@b.com" },
    });
    assert.deepEqual(data, { id: "x" });
    const req = fake.requests[0]!;
    assert.equal(req.method, "POST");
    assert.equal(req.url, "https://next-api.useplunk.com/contacts");
    assert.equal(req.headers["Authorization"], "Bearer sk_test");
    assert.equal(req.headers["Content-Type"], "application/json");
    assert.match(req.headers["User-Agent"]!, /plunk-node-sdk/);
    assert.deepEqual(req.body, { email: "a@b.com" });
  });

  it("encodes query params and skips undefined", async () => {
    const fake = createFakeFetch([
      {
        status: 200,
        body: ok({ items: [], hasMore: false, nextCursor: null }),
      },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    await http.request({
      method: "GET",
      path: "/contacts",
      query: { limit: 50, cursor: undefined, q: "a b" },
    });
    const url = new URL(fake.requests[0]!.url);
    assert.equal(url.searchParams.get("limit"), "50");
    assert.equal(url.searchParams.has("cursor"), false);
    assert.equal(url.searchParams.get("q"), "a b");
  });

  it("throws PlunkError on API error response", async () => {
    const fake = createFakeFetch([
      {
        status: 422,
        body: {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Bad email",
            statusCode: 422,
            requestId: "req_1",
            errors: [{ field: "email", message: "Invalid", code: "x" }],
          },
        },
      },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    await assert.rejects(
      () => http.request({ method: "POST", path: "/contacts", body: {} }),
      (err) => {
        assert.ok(err instanceof PlunkError);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert.equal(err.statusCode, 422);
        assert.equal(err.requestId, "req_1");
        assert.equal(err.errors?.[0]?.field, "email");
        return true;
      },
    );
  });

  it("retries on 429 with Retry-After then succeeds", async () => {
    const fake = createFakeFetch([
      {
        status: 429,
        headers: { "retry-after": "0" },
        body: {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many",
            statusCode: 429,
          },
        },
      },
      { status: 200, body: ok({ ok: true }) },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 2,
    });
    const data = await http.request<{ ok: boolean }>({
      method: "GET",
      path: "/contacts",
    });
    assert.deepEqual(data, { ok: true });
    assert.equal(fake.calls(), 2);
  });

  it("retries on 500 then surfaces final error", async () => {
    const fake = createFakeFetch([
      {
        status: 500,
        body: {
          success: false,
          error: { code: "INTERNAL", message: "boom", statusCode: 500 },
        },
      },
      {
        status: 500,
        body: {
          success: false,
          error: { code: "INTERNAL", message: "boom", statusCode: 500 },
        },
      },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 1,
    });
    await assert.rejects(
      () => http.request({ method: "GET", path: "/contacts" }),
      (err) => err instanceof PlunkError && err.code === "INTERNAL",
    );
    assert.equal(fake.calls(), 2);
  });

  it("does not retry on 4xx (non-429)", async () => {
    const fake = createFakeFetch([
      {
        status: 404,
        body: {
          success: false,
          error: { code: "NOT_FOUND", message: "no", statusCode: 404 },
        },
      },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 3,
    });
    await assert.rejects(() =>
      http.request({ method: "GET", path: "/contacts/x" }),
    );
    assert.equal(fake.calls(), 1);
  });

  it("aborts when user signal is already aborted", async () => {
    const fake = createFakeFetch([{ status: 200, body: ok({}) }]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    const ctrl = new AbortController();
    ctrl.abort();
    await assert.rejects(() =>
      http.request({
        method: "GET",
        path: "/contacts",
        options: { signal: ctrl.signal },
      }),
    );
  });

  it("times out a slow request", async () => {
    const fake = createFakeFetch([{ status: 200, body: ok({}), delayMs: 200 }]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    await assert.rejects(
      () =>
        http.request({
          method: "GET",
          path: "/contacts",
          options: { timeoutMs: 20 },
        }),
      (err) => err instanceof PlunkError && err.code === "TIMEOUT",
    );
  });

  it("paginates across pages", async () => {
    const fake = createFakeFetch([
      {
        status: 200,
        body: ok({
          items: [{ id: "1" }, { id: "2" }],
          nextCursor: "abc",
          hasMore: true,
        }),
      },
      {
        status: 200,
        body: ok({
          items: [{ id: "3" }],
          nextCursor: null,
          hasMore: false,
        }),
      },
    ]);
    const http = new HttpClient({
      secretKey: "sk_test",
      fetch: fake.fetch,
      maxRetries: 0,
    });
    const ids: string[] = [];
    for await (const item of http.paginate<{ id: string }>("/contacts", {
      limit: 2,
    })) {
      ids.push(item.id);
    }
    assert.deepEqual(ids, ["1", "2", "3"]);
    assert.equal(fake.calls(), 2);
    const second = new URL(fake.requests[1]!.url);
    assert.equal(second.searchParams.get("cursor"), "abc");
  });

  it("rejects when no key is provided", () => {
    assert.throws(() => new HttpClient({}), TypeError);
    assert.throws(() => new HttpClient({ secretKey: "" }), TypeError);
  });
});
