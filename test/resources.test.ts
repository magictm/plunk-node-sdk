import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Plunk } from "../src/index.js";
import { createFakeFetch, ok } from "./helpers.js";

function client(responses: Parameters<typeof createFakeFetch>[0]) {
  const fake = createFakeFetch(responses);
  const plunk = new Plunk({
    apiKey: "sk_test",
    fetch: fake.fetch,
    maxRetries: 0,
  });
  return { fake, plunk };
}

describe("Resource → HTTP mapping", () => {
  it("public.send → POST /v1/send", async () => {
    const { fake, plunk } = client([
      {
        status: 200,
        body: ok({ success: true, emails: [], timestamp: "t" }),
      },
    ]);
    await plunk.send({ to: "a@b.com", subject: "Hi", body: "<p>x</p>" });
    const req = fake.requests[0]!;
    assert.equal(req.method, "POST");
    assert.ok(req.url.endsWith("/v1/send"));
    assert.deepEqual(req.body, {
      to: "a@b.com",
      subject: "Hi",
      body: "<p>x</p>",
    });
  });

  it("public.track → POST /v1/track", async () => {
    const { fake, plunk } = client([
      { status: 200, body: ok({ contact: "c", event: "e", timestamp: "t" }) },
    ]);
    await plunk.track({ event: "signed_up", email: "a@b.com" });
    assert.ok(fake.requests[0]!.url.endsWith("/v1/track"));
  });

  it("public.verify → POST /v1/verify", async () => {
    const { fake, plunk } = client([
      {
        status: 200,
        body: ok({
          email: "a@b.com",
          valid: true,
          isDisposable: false,
          isAlias: false,
          isTypo: false,
          isPlusAddressed: false,
          isPersonalEmail: true,
          domainExists: true,
          hasWebsite: true,
          hasMxRecords: true,
          reasons: [],
        }),
      },
    ]);
    const res = await plunk.verify({ email: "a@b.com" });
    assert.equal(res.valid, true);
    assert.ok(fake.requests[0]!.url.endsWith("/v1/verify"));
  });

  it("contacts CRUD hits expected paths", async () => {
    const { fake, plunk } = client([
      {
        status: 200,
        body: ok({ items: [], nextCursor: null, hasMore: false }),
      },
      { status: 200, body: ok({ id: "c1", email: "a@b.com" }) },
      { status: 200, body: ok({ id: "c1", email: "a@b.com" }) },
      {
        status: 200,
        body: ok({ id: "c1", email: "a@b.com", subscribed: false }),
      },
      { status: 200, body: ok({ id: "c1" }) },
    ]);
    await plunk.contacts.list({ limit: 5 });
    await plunk.contacts.create({ email: "a@b.com" });
    await plunk.contacts.get("c1");
    await plunk.contacts.update("c1", { subscribed: false });
    await plunk.contacts.delete("c1");
    const methods = fake.requests.map(
      (r) => `${r.method} ${new URL(r.url).pathname}`,
    );
    assert.deepEqual(methods, [
      "GET /contacts",
      "POST /contacts",
      "GET /contacts/c1",
      "PATCH /contacts/c1",
      "DELETE /contacts/c1",
    ]);
  });

  it("campaigns send/cancel/test/stats", async () => {
    const { fake, plunk } = client([
      { status: 200, body: ok({ id: "c", status: "scheduled" }) },
      { status: 200, body: ok({ id: "c", status: "cancelled" }) },
      { status: 200, body: ok({ sent: 1 }) },
      { status: 200, body: ok({ campaignId: "c", sent: 0 }) },
    ]);
    await plunk.campaigns.send("c", { scheduledAt: "2030-01-01T00:00:00Z" });
    await plunk.campaigns.cancel("c");
    await plunk.campaigns.test("c", { email: "x@y.com" });
    await plunk.campaigns.stats("c");
    const paths = fake.requests.map(
      (r) => `${r.method} ${new URL(r.url).pathname}`,
    );
    assert.deepEqual(paths, [
      "POST /campaigns/c/send",
      "POST /campaigns/c/cancel",
      "POST /campaigns/c/test",
      "GET /campaigns/c/stats",
    ]);
  });

  it("segments members add/remove", async () => {
    const { fake, plunk } = client([
      { status: 200, body: ok({ added: 2 }) },
      { status: 200, body: ok({ removed: 1 }) },
    ]);
    await plunk.segments.addMembers("s1", { emails: ["a@b.com", "c@d.com"] });
    await plunk.segments.removeMembers("s1", { emails: ["a@b.com"] });
    assert.equal(fake.requests[0]!.method, "POST");
    assert.ok(fake.requests[0]!.url.endsWith("/segments/s1/members"));
    assert.equal(fake.requests[1]!.method, "DELETE");
    assert.deepEqual(fake.requests[1]!.body, { emails: ["a@b.com"] });
  });

  it("workflows + executions", async () => {
    const { fake, plunk } = client([
      {
        status: 200,
        body: ok({ id: "w1", name: "n", active: true, createdAt: "t" }),
      },
      {
        status: 200,
        body: ok({ items: [], nextCursor: null, hasMore: false }),
      },
    ]);
    await plunk.workflows.get("w1");
    await plunk.workflows.listExecutions("w1", { limit: 10 });
    assert.ok(fake.requests[0]!.url.endsWith("/workflows/w1"));
    assert.ok(fake.requests[1]!.url.includes("/workflows/w1/executions"));
  });

  it("events list & names", async () => {
    const { fake, plunk } = client([
      {
        status: 200,
        body: ok({ items: [], nextCursor: null, hasMore: false }),
      },
      { status: 200, body: ok(["signed_up", "logged_in"]) },
    ]);
    await plunk.events.list();
    const names = await plunk.events.names();
    assert.deepEqual(names, ["signed_up", "logged_in"]);
    assert.ok(fake.requests[1]!.url.endsWith("/events/names"));
  });

  it("domains list/create/delete", async () => {
    const { fake, plunk } = client([
      { status: 200, body: ok([]) },
      {
        status: 200,
        body: ok({ id: "d1", name: "x.com", verified: false, createdAt: "t" }),
      },
      { status: 200, body: ok({ id: "d1" }) },
    ]);
    await plunk.domains.list();
    await plunk.domains.create({ name: "x.com" });
    await plunk.domains.delete("d1");
    const m = fake.requests.map((r) => r.method);
    assert.deepEqual(m, ["GET", "POST", "DELETE"]);
  });

  it("listAll iterates pages", async () => {
    const { plunk } = client([
      {
        status: 200,
        body: ok({
          items: [
            { id: "a", email: "a@b.com", subscribed: true, createdAt: "t" },
          ],
          nextCursor: "n",
          hasMore: true,
        }),
      },
      {
        status: 200,
        body: ok({
          items: [
            { id: "b", email: "b@b.com", subscribed: true, createdAt: "t" },
          ],
          nextCursor: null,
          hasMore: false,
        }),
      },
    ]);
    const ids: string[] = [];
    for await (const c of plunk.contacts.listAll()) ids.push(c.id);
    assert.deepEqual(ids, ["a", "b"]);
  });
});

describe("Plunk client construction", () => {
  it("accepts a plain api key string", () => {
    const p = new Plunk("sk_test");
    assert.ok(p.contacts && p.public && p.http);
  });
  it("supports baseUrl override", async () => {
    const fake = createFakeFetch([{ status: 200, body: ok({ ok: true }) }]);
    const p = new Plunk({
      apiKey: "sk_test",
      fetch: fake.fetch,
      baseUrl: "https://example.test/api/",
      maxRetries: 0,
    });
    await p.events.names();
    assert.ok(fake.requests[0]!.url.startsWith("https://example.test/api/"));
  });
});
