import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Plunk, PlunkError } from "plunk-node-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- minimal .env loader (no dotenv dep) -----------------------------------
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const apiKey = process.env.PLUNK_SECRET_KEY;
if (!apiKey || apiKey === "sk_replace_me") {
  console.error(
    "[playground] Missing PLUNK_SECRET_KEY. Copy .env.example to .env and set your key.",
  );
  process.exit(1);
}

const plunk = new Plunk({
  apiKey,
  baseUrl: process.env.PLUNK_BASE_URL,
  userAgent: "plunk-sdk-playground",
});

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * Generic dispatcher: POST /api/call { resource, method, args:[...] }
 *
 * Calls plunk[resource][method](...args) and returns the result, with
 * structured error info on PlunkError. Async iterators (listAll*) are
 * collected up to MAX_ITEMS for safety.
 */
const MAX_ITEMS = 200;

app.post("/api/call", async (req, res) => {
  const { resource, method, args = [] } = req.body ?? {};
  try {
    if (resource === "_root") {
      // Top-level shortcuts: send/track/verify
      if (typeof plunk[method] !== "function") {
        return res
          .status(400)
          .json({
            ok: false,
            error: { code: "UNKNOWN_METHOD", message: method },
          });
      }
      const data = await plunk[method](...args);
      return res.json({ ok: true, data });
    }

    const target = plunk[resource];
    if (!target || typeof target[method] !== "function") {
      return res.status(400).json({
        ok: false,
        error: {
          code: "UNKNOWN_METHOD",
          message: `${resource}.${method} not found`,
        },
      });
    }

    const result = await target[method](...args);

    // Collect async iterator (listAll, listAllContacts, listAllExecutions, …)
    if (
      result &&
      typeof result === "object" &&
      typeof result[Symbol.asyncIterator] === "function"
    ) {
      const items = [];
      for await (const item of result) {
        items.push(item);
        if (items.length >= MAX_ITEMS) break;
      }
      return res.json({
        ok: true,
        data: { items, truncated: items.length >= MAX_ITEMS },
      });
    }

    res.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof PlunkError) {
      return res.status(err.statusCode || 500).json({
        ok: false,
        error: {
          code: err.code,
          statusCode: err.statusCode,
          requestId: err.requestId,
          message: err.message,
          errors: err.errors,
          suggestion: err.suggestion,
        },
      });
    }
    res.status(500).json({
      ok: false,
      error: {
        code: "INTERNAL",
        message: err && err.message ? err.message : String(err),
      },
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, baseUrl: process.env.PLUNK_BASE_URL ?? "default" });
});

const PORT = Number(process.env.PORT) || 4000;
// Bind to dual-stack "::" so both IPv4 (127.0.0.1) and IPv6 (::1) work.
// On Windows "localhost" often resolves to ::1 first, which would otherwise
// time out if the server only listened on 0.0.0.0.
const HOST = process.env.HOST || "::";
app.listen(PORT, HOST, () => {
  console.log(`▸ Plunk SDK playground running at http://localhost:${PORT}`);
  console.log(`  (also reachable at http://127.0.0.1:${PORT})`);
});
