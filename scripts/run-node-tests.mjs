import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TEST_ROOT = path.resolve("dist-test", "test");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".test.js")) {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(TEST_ROOT)) {
  console.error(`[tests] Missing compiled tests directory: ${TEST_ROOT}`);
  process.exit(1);
}

const testFiles = walk(TEST_ROOT).sort();

if (testFiles.length === 0) {
  console.error(`[tests] No compiled test files found under: ${TEST_ROOT}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
