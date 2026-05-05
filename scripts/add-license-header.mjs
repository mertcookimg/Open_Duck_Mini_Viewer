// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0
//
// Idempotently prepends a 2-line license header to all project-authored
// source files. Run via:  node scripts/add-license-header.mjs
//
// Files that already contain "SPDX-License-Identifier" are skipped, so it
// is safe to re-run after adding new files.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const COPYRIGHT = "Copyright 2026 Masato Kobayashi";
const SPDX = "SPDX-License-Identifier: Apache-2.0";

const STYLES = {
  ".ts": "doubleslash",
  ".tsx": "doubleslash",
  ".js": "doubleslash",
  ".mjs": "doubleslash",
  ".cjs": "doubleslash",
  ".css": "block",
  ".html": "html",
  ".yml": "hash",
  ".yaml": "hash",
  ".sh": "hash-shebang",
  ".ps1": "hash",
};

const ROOT_FILES = ["index.html", "vite.config.ts", "tailwind.config.js", "postcss.config.js"];

const WALK_DIRS = ["src", ".github/workflows", "scripts"];

function buildHeader(kind) {
  switch (kind) {
    case "doubleslash":
      return `// ${COPYRIGHT}\n// ${SPDX}\n\n`;
    case "hash":
    case "hash-shebang":
      return `# ${COPYRIGHT}\n# ${SPDX}\n\n`;
    case "block":
      return `/*\n * ${COPYRIGHT}\n * ${SPDX}\n */\n\n`;
    case "html":
      return `<!--\n  ${COPYRIGHT}\n  ${SPDX}\n-->\n`;
    default:
      throw new Error(`unknown style: ${kind}`);
  }
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

async function processFile(path) {
  const ext = extname(path);
  const kind = STYLES[ext];
  if (!kind) return { path, status: "unsupported" };

  let content = await readFile(path, "utf8");
  if (content.includes("SPDX-License-Identifier")) {
    return { path, status: "already" };
  }

  const header = buildHeader(kind);

  let prefix = "";
  if (kind === "hash-shebang" && content.startsWith("#!")) {
    const eol = content.indexOf("\n");
    prefix = content.slice(0, eol + 1);
    content = content.slice(eol + 1);
  } else if (kind === "html" && content.match(/^<!doctype/i)) {
    const eol = content.indexOf("\n");
    prefix = content.slice(0, eol + 1);
    content = content.slice(eol + 1);
  }

  await writeFile(path, prefix + header + content);
  return { path, status: "written" };
}

async function main() {
  const files = [...ROOT_FILES];
  for (const d of WALK_DIRS) {
    for await (const f of walk(d)) files.push(f);
  }

  let written = 0;
  let already = 0;
  let unsupported = 0;
  for (const f of files) {
    const result = await processFile(f);
    if (result.status === "written") {
      console.log(`+ ${result.path}`);
      written++;
    } else if (result.status === "already") {
      already++;
    } else {
      unsupported++;
    }
  }
  console.log(
    `\nWritten: ${written}, already had header: ${already}, unsupported ext: ${unsupported}`,
  );
}

main();
