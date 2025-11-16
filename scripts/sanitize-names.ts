// scripts/sanitize-names.ts
//
// Go through one or more JSON fixture files that contain arrays of
// { id, name, ... } objects (e.g. plans, bundles, channels) and
// rewrite any duplicate `name` values to be unique, using friendly
// suffixes (Plus, Max, Prime, etc.) instead of numeric counters.
//
// Usage:
//   pnpm tsx scripts/sanitize-names.ts src/server/mocks/fixtures/plans.base.json
//   pnpm tsx scripts/sanitize-names.ts src/server/mocks/fixtures/bundles.base.json
//   pnpm tsx scripts/sanitize-names.ts src/server/mocks/fixtures/channels.base.json
//
//   # multiple at once:
//   pnpm tsx scripts/sanitize-names.ts \
//     src/server/mocks/fixtures/plans.base.json \
//     src/server/mocks/fixtures/bundles.base.json \
//     src/server/mocks/fixtures/channels.base.json
//
//   # dry run (no write):
//   pnpm tsx scripts/sanitize-names.ts --dry-run src/server/mocks/fixtures/plans.base.json

import fssync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ItemWithName = {
  id?: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const NAME_SUFFIXES = [
  "Plus",
  "Max",
  "Prime",
  "Select",
  "Signature",
  "Elite",
  "Ultra",
  "Premier",
] as const;

// Resolve relative paths in a way that works both from repo root and from scripts dir
function resolveInputPath(input: string) {
  if (path.isAbsolute(input)) return path.normalize(input);

  const fromCwd = path.resolve(process.cwd(), input);
  if (fssync.existsSync(fromCwd)) return fromCwd;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fromScript = path.resolve(__dirname, "..", input);
  if (fssync.existsSync(fromScript)) return fromScript;

  throw new Error(`File not found. Tried:\n  - ${fromCwd}\n  - ${fromScript}`);
}

async function atomicWrite(file: string, content: string) {
  const dir = path.dirname(file);
  const base = path.basename(file);
  const tmp = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, file);
}

function buildUniqueName(base: string, used: Set<string>): string {
  const normalizedBase = base.trim().replace(/\s+/g, " ");
  let candidate = normalizedBase;

  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }

  // Try suffixes like "Foo Plus", "Foo Max", etc.
  for (const suffix of NAME_SUFFIXES) {
    candidate = `${normalizedBase} ${suffix}`.trim();
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  // If we somehow still collide (very unlikely given how you generate things),
  // fall back to adding multiple suffixes.
  for (const s1 of NAME_SUFFIXES) {
    for (const s2 of NAME_SUFFIXES) {
      candidate = `${normalizedBase} ${s1} ${s2}`.trim();
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
  }

  // Absolute last resort: tack on a generic "Variant" label (still no numbers)
  let i = 1;
  // to avoid an infinite loop, cap at some reasonable attempts
  while (i < 50) {
    candidate = `${normalizedBase} Variant ${i}`.trim();
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    i++;
  }

  // Give up and return the original; at this point collisions are pathological.
  return normalizedBase;
}

async function sanitizeFile(filePath: string, dryRun: boolean) {
  const resolved = resolveInputPath(filePath);
  const json = await fs.readFile(resolved, "utf-8");

  let arr: unknown;
  try {
    arr = JSON.parse(json);
  } catch (e) {
    throw new Error(
      `Failed to parse JSON in ${resolved}: ${(e as Error).message}`
    );
  }

  if (!Array.isArray(arr)) {
    console.warn(
      `⚠ ${resolved} does not contain a top-level array. Skipping.`
    );
    return;
  }

  const items = arr as ItemWithName[];

  const used = new Set<string>();
  let changed = 0;
  const out: ItemWithName[] = items.map((item) => {
    if (!item || typeof item.name !== "string") return item;

    const originalName = item.name;
    const uniqueName = buildUniqueName(originalName, used);

    if (uniqueName !== originalName) {
      changed++;
      return { ...item, name: uniqueName };
    }
    return item;
  });

  console.log(
    `→ ${path.basename(resolved)}: ${items.length} items, ${changed} renamed duplicate name${
      changed === 1 ? "" : "s"
    }`
  );

  if (dryRun) {
    console.log("   (dry run: no write performed)");
    return;
  }

  const content = JSON.stringify(out, null, 2) + "\n";
  await atomicWrite(resolved, content);
  const stat = await fs.stat(resolved);
  console.log(`   ✔ Wrote file · mtime ${stat.mtime.toISOString()}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: pnpm tsx scripts/sanitize-names.ts [--dry-run] <file1.json> [file2.json ...]"
    );
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  const files = args.filter((a) => a !== "--dry-run");

  if (files.length === 0) {
    console.error("No files provided.");
    process.exit(1);
  }

  for (const file of files) {
    try {
      await sanitizeFile(file, dryRun);
    } catch (e) {
      console.error(`✖ Error processing ${file}:`, (e as Error).message);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
