// scripts/repair-plan-fks.ts
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("src/server/mocks/fixtures");
const F = (n: string) => path.join(dir, n);

async function load<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(F(name), "utf8"));
}
async function save(name: string, json: any) {
  await writeFile(F(name), JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log("✔ wrote", name);
}

function pickDeterministic<T>(arr: T[], key: string): T {
  // simple stable hash pick so reruns are consistent
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

async function repair(mode = "base") {
  const plans: Array<{ id: string }> = await load(`plans.${mode}.json`);
  const planBundles: Array<{ planId: string; [k: string]: any }> = await load(
    `planBundles.${mode}.json`
  );
  const planChannels: Array<{ planId: string; [k: string]: any }> = await load(
    `planChannels.${mode}.json`
  );

  const planIds = plans.map((p) => p.id);
  const planSet = new Set(planIds);

  const remapFk = <T extends { planId: string }>(rows: T[], label: string) => {
    const out: T[] = [];
    let kept = 0,
      remapped = 0,
      dropped = 0;
    for (const r of rows) {
      if (planSet.has(r.planId)) {
        kept++;
        out.push(r);
      } else if (planIds.length) {
        remapped++;
        out.push({ ...r, planId: pickDeterministic(planIds, r.planId) });
      } else {
        dropped++; // no plans at all
      }
    }
    console.log(
      `${label}: kept=${kept} remapped=${remapped} dropped=${dropped}`
    );
    return out;
  };

  const fixedPlanBundles = remapFk(planBundles, "planBundles");
  const fixedPlanChannels = remapFk(planChannels, "planChannels");

  await save(`planBundles.${mode}.json`, fixedPlanBundles);
  await save(`planChannels.${mode}.json`, fixedPlanChannels);
}

repair(process.argv[2] ?? "base").catch((e) => {
  console.error(e);
  process.exit(1);
});
