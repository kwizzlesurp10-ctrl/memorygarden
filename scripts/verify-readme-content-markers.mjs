import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = join(__dirname, "..", "README.md");

const EXPECTED_IDS = [
  "introduction",
  "memory-garden-concept",
  "core-features",
  "how-it-works",
  "usage",
  "configuration",
  "roadmap",
  "faq",
];

const openRe = /\[content-to-enhance id="([^"]+)"\]/g;
const closeRe = /\[\/content-to-enhance\]/g;

const text = readFileSync(readmePath, "utf8");
const foundIds = [];
for (const m of text.matchAll(openRe)) {
  foundIds.push(m[1]);
}
const closes = text.match(closeRe) ?? [];

let failed = false;
if (foundIds.length !== EXPECTED_IDS.length) {
  console.error(
    `Expected ${EXPECTED_IDS.length} [content-to-enhance] open tags, found ${foundIds.length}.`,
  );
  failed = true;
}
if (closes.length !== EXPECTED_IDS.length) {
  console.error(
    `Expected ${EXPECTED_IDS.length} [/content-to-enhance] close tags, found ${closes.length}.`,
  );
  failed = true;
}

for (let i = 0; i < EXPECTED_IDS.length; i++) {
  const want = EXPECTED_IDS[i];
  const got = foundIds[i];
  if (got !== want) {
    console.error(`Position ${i + 1}: expected id "${want}", got "${got ?? "(missing)"}".`);
    failed = true;
  }
}

const seen = new Set();
for (const id of foundIds) {
  if (seen.has(id)) {
    console.error(`Duplicate id "${id}".`);
    failed = true;
  }
  seen.add(id);
}

if (failed) {
  process.exit(1);
}
console.log("README.md content-to-enhance markers match the configured sequence.");
