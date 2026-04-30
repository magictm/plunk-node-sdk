// Plunk SDK Playground — frontend.
// Manifest-driven UI: each entry maps a button + form to plunk[resource][method](...args).

/**
 * Each op declares:
 *  - id      unique slug for navigation
 *  - title   button/card title
 *  - method  HTTP method label (visual only)
 *  - desc    short description
 *  - resource SDK resource name ("contacts", "_root" for top-level shortcuts)
 *  - fn      SDK method name
 *  - args    array of input descriptors. Each:
 *      { name, label, type: "string"|"json", default, placeholder, required? }
 *  - danger  if true the run button is rendered red (destructive)
 */
const MANIFEST = [
  {
    group: "Public API",
    ops: [
      {
        id: "send",
        title: "Send transactional email",
        method: "POST",
        resource: "_root",
        fn: "send",
        desc: "POST /v1/send",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {
              to: "user@example.com",
              subject: "Hello from Plunk SDK",
              body: "<p>Hi from the playground!</p>",
            },
          },
        ],
      },
      {
        id: "track",
        title: "Track event",
        method: "POST",
        resource: "_root",
        fn: "track",
        desc: "POST /v1/track",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {
              event: "playground_test",
              email: "user@example.com",
              subscribed: true,
              data: { source: "playground" },
            },
          },
        ],
      },
      {
        id: "verify",
        title: "Verify email",
        method: "POST",
        resource: "_root",
        fn: "verify",
        desc: "POST /v1/verify",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { email: "user@gmail.com" },
          },
        ],
      },
    ],
  },
  {
    group: "Contacts",
    ops: [
      {
        id: "contacts-list",
        title: "List contacts",
        method: "GET",
        resource: "contacts",
        fn: "list",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { limit: 20 },
          },
        ],
      },
      {
        id: "contacts-listAll",
        title: "List all contacts (auto-paginate)",
        method: "GET",
        resource: "contacts",
        fn: "listAll",
        desc: "Iterates every page; capped at 200 items in the playground.",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { limit: 50 },
          },
        ],
      },
      {
        id: "contacts-create",
        title: "Create contact",
        method: "POST",
        resource: "contacts",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {
              email: "playground@example.com",
              subscribed: true,
              data: { source: "playground" },
            },
          },
        ],
      },
      {
        id: "contacts-get",
        title: "Get contact",
        method: "GET",
        resource: "contacts",
        fn: "get",
        args: [
          {
            name: "id",
            label: "contact id",
            type: "string",
            placeholder: "cnt_…",
            required: true,
          },
        ],
      },
      {
        id: "contacts-update",
        title: "Update contact",
        method: "PATCH",
        resource: "contacts",
        fn: "update",
        args: [
          { name: "id", label: "contact id", type: "string", required: true },
          {
            name: "patch",
            label: "patch (JSON)",
            type: "json",
            default: { subscribed: false },
          },
        ],
      },
      {
        id: "contacts-delete",
        title: "Delete contact",
        method: "DELETE",
        resource: "contacts",
        fn: "delete",
        danger: true,
        args: [
          { name: "id", label: "contact id", type: "string", required: true },
        ],
      },
    ],
  },
  {
    group: "Templates",
    ops: [
      {
        id: "templates-list",
        title: "List templates",
        method: "GET",
        resource: "templates",
        fn: "list",
        args: [
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 20 } },
        ],
      },
      {
        id: "templates-create",
        title: "Create template",
        method: "POST",
        resource: "templates",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {
              name: "Playground welcome",
              subject: "Welcome",
              body: "<p>Hi {{name}}</p>",
              type: "transactional",
            },
          },
        ],
      },
      {
        id: "templates-get",
        title: "Get template",
        method: "GET",
        resource: "templates",
        fn: "get",
        args: [{ name: "id", label: "template id", type: "string", required: true }],
      },
      {
        id: "templates-update",
        title: "Update template",
        method: "PATCH",
        resource: "templates",
        fn: "update",
        args: [
          { name: "id", label: "template id", type: "string", required: true },
          {
            name: "patch",
            label: "patch (JSON)",
            type: "json",
            default: { subject: "Updated subject" },
          },
        ],
      },
      {
        id: "templates-delete",
        title: "Delete template",
        method: "DELETE",
        resource: "templates",
        fn: "delete",
        danger: true,
        args: [{ name: "id", label: "template id", type: "string", required: true }],
      },
    ],
  },
  {
    group: "Campaigns",
    ops: [
      {
        id: "campaigns-list",
        title: "List campaigns",
        method: "GET",
        resource: "campaigns",
        fn: "list",
        args: [
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 20 } },
        ],
      },
      {
        id: "campaigns-create",
        title: "Create campaign",
        method: "POST",
        resource: "campaigns",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {
              name: "Playground campaign",
              subject: "Hello",
              body: "<p>Hi</p>",
              recipients: ["user@example.com"],
            },
          },
        ],
      },
      {
        id: "campaigns-get",
        title: "Get campaign",
        method: "GET",
        resource: "campaigns",
        fn: "get",
        args: [{ name: "id", label: "campaign id", type: "string", required: true }],
      },
      {
        id: "campaigns-update",
        title: "Update campaign",
        method: "PATCH",
        resource: "campaigns",
        fn: "update",
        args: [
          { name: "id", label: "campaign id", type: "string", required: true },
          {
            name: "patch",
            label: "patch (JSON)",
            type: "json",
            default: { subject: "Updated" },
          },
        ],
      },
      {
        id: "campaigns-send",
        title: "Send / schedule campaign",
        method: "POST",
        resource: "campaigns",
        fn: "send",
        args: [
          { name: "id", label: "campaign id", type: "string", required: true },
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: {},
          },
        ],
      },
      {
        id: "campaigns-cancel",
        title: "Cancel scheduled campaign",
        method: "POST",
        resource: "campaigns",
        fn: "cancel",
        args: [{ name: "id", label: "campaign id", type: "string", required: true }],
      },
      {
        id: "campaigns-test",
        title: "Send test email",
        method: "POST",
        resource: "campaigns",
        fn: "test",
        args: [
          { name: "id", label: "campaign id", type: "string", required: true },
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { email: "qa@example.com" },
          },
        ],
      },
      {
        id: "campaigns-stats",
        title: "Campaign stats",
        method: "GET",
        resource: "campaigns",
        fn: "stats",
        args: [{ name: "id", label: "campaign id", type: "string", required: true }],
      },
    ],
  },
  {
    group: "Segments",
    ops: [
      {
        id: "segments-list",
        title: "List segments",
        method: "GET",
        resource: "segments",
        fn: "list",
        args: [
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 20 } },
        ],
      },
      {
        id: "segments-create",
        title: "Create segment",
        method: "POST",
        resource: "segments",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { name: "Playground VIPs", type: "static" },
          },
        ],
      },
      {
        id: "segments-get",
        title: "Get segment",
        method: "GET",
        resource: "segments",
        fn: "get",
        args: [{ name: "id", label: "segment id", type: "string", required: true }],
      },
      {
        id: "segments-update",
        title: "Update segment",
        method: "PATCH",
        resource: "segments",
        fn: "update",
        args: [
          { name: "id", label: "segment id", type: "string", required: true },
          {
            name: "patch",
            label: "patch (JSON)",
            type: "json",
            default: { name: "VIPs (renamed)" },
          },
        ],
      },
      {
        id: "segments-delete",
        title: "Delete segment",
        method: "DELETE",
        resource: "segments",
        fn: "delete",
        danger: true,
        args: [{ name: "id", label: "segment id", type: "string", required: true }],
      },
      {
        id: "segments-listContacts",
        title: "List segment contacts",
        method: "GET",
        resource: "segments",
        fn: "listContacts",
        args: [
          { name: "id", label: "segment id", type: "string", required: true },
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 50 } },
        ],
      },
      {
        id: "segments-addMembers",
        title: "Add members (static)",
        method: "POST",
        resource: "segments",
        fn: "addMembers",
        args: [
          { name: "id", label: "segment id", type: "string", required: true },
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { emails: ["a@example.com", "b@example.com"] },
          },
        ],
      },
      {
        id: "segments-removeMembers",
        title: "Remove members (static)",
        method: "DELETE",
        resource: "segments",
        fn: "removeMembers",
        danger: true,
        args: [
          { name: "id", label: "segment id", type: "string", required: true },
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { emails: ["a@example.com"] },
          },
        ],
      },
    ],
  },
  {
    group: "Workflows",
    ops: [
      {
        id: "workflows-list",
        title: "List workflows",
        method: "GET",
        resource: "workflows",
        fn: "list",
        args: [
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 20 } },
        ],
      },
      {
        id: "workflows-create",
        title: "Create workflow",
        method: "POST",
        resource: "workflows",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { name: "Playground workflow", trigger: "signed_up", active: false },
          },
        ],
      },
      {
        id: "workflows-get",
        title: "Get workflow",
        method: "GET",
        resource: "workflows",
        fn: "get",
        args: [{ name: "id", label: "workflow id", type: "string", required: true }],
      },
      {
        id: "workflows-update",
        title: "Update workflow",
        method: "PATCH",
        resource: "workflows",
        fn: "update",
        args: [
          { name: "id", label: "workflow id", type: "string", required: true },
          {
            name: "patch",
            label: "patch (JSON)",
            type: "json",
            default: { active: true },
          },
        ],
      },
      {
        id: "workflows-delete",
        title: "Delete workflow",
        method: "DELETE",
        resource: "workflows",
        fn: "delete",
        danger: true,
        args: [{ name: "id", label: "workflow id", type: "string", required: true }],
      },
      {
        id: "workflows-listExecutions",
        title: "List workflow executions",
        method: "GET",
        resource: "workflows",
        fn: "listExecutions",
        args: [
          { name: "id", label: "workflow id", type: "string", required: true },
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 50 } },
        ],
      },
    ],
  },
  {
    group: "Events",
    ops: [
      {
        id: "events-list",
        title: "List events",
        method: "GET",
        resource: "events",
        fn: "list",
        args: [
          { name: "params", label: "params (JSON)", type: "json", default: { limit: 50 } },
        ],
      },
      {
        id: "events-names",
        title: "Unique event names",
        method: "GET",
        resource: "events",
        fn: "names",
        args: [],
      },
    ],
  },
  {
    group: "Domains",
    ops: [
      {
        id: "domains-list",
        title: "List domains",
        method: "GET",
        resource: "domains",
        fn: "list",
        args: [],
      },
      {
        id: "domains-create",
        title: "Add domain",
        method: "POST",
        resource: "domains",
        fn: "create",
        args: [
          {
            name: "params",
            label: "params (JSON)",
            type: "json",
            default: { name: "mail.example.com" },
          },
        ],
      },
      {
        id: "domains-delete",
        title: "Delete domain",
        method: "DELETE",
        resource: "domains",
        fn: "delete",
        danger: true,
        args: [{ name: "id", label: "domain id", type: "string", required: true }],
      },
    ],
  },
];

// ---------------------------------------------------------------------------

const $nav = document.getElementById("nav");
const $ops = document.getElementById("ops");
const $output = document.getElementById("output");
const $status = document.getElementById("status");
const $duration = document.getElementById("duration");

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function renderNav() {
  for (const group of MANIFEST) {
    $nav.append(el("div", { class: "group" }, group.group));
    for (const op of group.ops) {
      $nav.append(
        el(
          "a",
          {
            href: `#${op.id}`,
            onclick: () => {
              document
                .querySelectorAll("#nav a.active")
                .forEach((a) => a.classList.remove("active"));
            },
          },
          op.title,
        ),
      );
    }
  }
}

function renderOps() {
  for (const group of MANIFEST) {
    const groupEl = el("div", { class: "resource-group" }, [
      el("h2", {}, group.group),
    ]);
    for (const op of group.ops) {
      groupEl.append(renderOp(op));
    }
    $ops.append(groupEl);
  }
}

function renderOp(op) {
  const inputs = {};
  const argsEl = el("div", { class: "args" });
  for (const arg of op.args) {
    const id = `${op.id}-${arg.name}`;
    if (arg.type === "json") {
      const ta = el("textarea", {
        id,
        rows: 4,
        spellcheck: "false",
        placeholder: arg.placeholder ?? "",
      });
      ta.value = JSON.stringify(arg.default ?? {}, null, 2);
      inputs[arg.name] = () => parseJson(ta.value);
      argsEl.append(el("label", {}, [arg.label, ta]));
    } else {
      const input = el("input", {
        id,
        type: "text",
        value: arg.default ?? "",
        placeholder: arg.placeholder ?? "",
      });
      inputs[arg.name] = () => input.value.trim();
      argsEl.append(el("label", {}, [arg.label, input]));
    }
  }

  const runBtn = el(
    "button",
    {
      class: op.danger ? "danger" : "",
      onclick: () => runOp(op, inputs, runBtn),
    },
    op.danger ? "Run (destructive)" : "Run",
  );

  return el("div", { id: op.id, class: "op" }, [
    el("header", {}, [
      el("span", { class: "title" }, op.title),
      el("span", { class: `method ${op.method}` }, op.method),
    ]),
    op.desc ? el("p", { class: "desc" }, op.desc) : null,
    argsEl,
    el("div", { class: "actions" }, [runBtn]),
  ]);
}

function parseJson(text) {
  if (!text || !text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
}

async function runOp(op, inputs, btn) {
  setStatus("loading", "running…", "");
  $output.textContent = "";
  btn.disabled = true;
  const t0 = performance.now();
  try {
    const args = op.args.map((a) => {
      const v = inputs[a.name]();
      if (a.required && (v === "" || v === undefined)) {
        throw new Error(`"${a.label}" is required`);
      }
      return v;
    });
    const res = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: op.resource, method: op.fn, args }),
    });
    const body = await res.json();
    const ms = Math.round(performance.now() - t0);
    if (body.ok) {
      setStatus("ok", `200 OK`, `${ms}ms`);
      $output.textContent = JSON.stringify(body.data, null, 2);
    } else {
      setStatus("err", body.error?.code ?? "ERROR", `${ms}ms`);
      $output.textContent = JSON.stringify(body.error, null, 2);
    }
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    setStatus("err", "CLIENT", `${ms}ms`);
    $output.textContent = err.message ?? String(err);
  } finally {
    btn.disabled = false;
  }
}

function setStatus(kind, label, duration) {
  $status.className = `status ${kind}`;
  $status.textContent = label;
  $duration.textContent = duration ?? "";
}

renderNav();
renderOps();
