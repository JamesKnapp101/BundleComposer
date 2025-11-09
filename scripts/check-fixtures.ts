// scripts/check-fixtures.ts
import { readFile } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("src/server/mocks/fixtures");
const F = (n: string) => path.join(dir, n);
const N = (s: string) => s; // now a no-op since suffixes removed

async function load(name: string) {
  return JSON.parse(await readFile(F(name), "utf8"));
}

async function main(mode = "base") {
  const plans = await load(`plans.${mode}.json`);
  const planBundles = await load(`planBundles.${mode}.json`);
  const plansSet = new Set(plans.map((p: any) => N(p.id)));

  const orphans = planBundles
    .filter((r: any) => !plansSet.has(N(r.planId)))
    .map((r: any) => r.planId);

  console.log("plans:", plans.length, "planBundles:", planBundles.length);
  if (orphans.length) {
    console.error(
      "Missing plan ids (unique):",
      [...new Set(orphans)].slice(0, 20)
    );
    process.exit(1);
  } else {
    console.log("OK: no orphaned planBundles");
  }
}

main(process.argv[2]).catch((e) => {
  console.error(e);
  process.exit(1);
});
