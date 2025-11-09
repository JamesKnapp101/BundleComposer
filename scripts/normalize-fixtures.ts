// scripts/normalize-fixtures.ts
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const F = (name: string) => path.resolve("src/server/mocks/fixtures", name);
const normalize = (s: string) => s.replace(/-(p|c|b)$/, "");

async function fixFile<T = any>(file: string, mut: (json: T) => T) {
  const p = F(file);
  const raw = JSON.parse(await readFile(p, "utf8"));
  const out = mut(raw);
  await writeFile(p, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("✔ normalized", file);
}

const fixIds = <T extends { id: string }>(rows: T[]) =>
  rows.map((r) => ({ ...r, id: normalize(r.id) }));

const fixFK = <T extends Record<string, any>>(rows: T[], keys: string[]) =>
  rows.map((r) => {
    const copy = { ...r };
    for (const k of keys)
      if (typeof copy[k] === "string") copy[k] = normalize(copy[k]);
    return copy;
  });

async function main() {
  await fixFile("plans.base.json", (j: any) => fixIds(j));
  await fixFile("bundles.base.json", (j: any) => fixIds(j));
  await fixFile("channels.base.json", (j: any) => fixIds(j));

  await fixFile("planBundles.base.json", (j: any) =>
    fixFK(j, ["planId", "bundleId"])
  );
  await fixFile("planChannels.base.json", (j: any) =>
    fixFK(j, ["planId", "channelId"])
  );
  await fixFile("bundleChannels.base.json", (j: any) =>
    fixFK(j, ["bundleId", "channelId"])
  );

  // repeat for .alt.json etc. if you have variants
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
