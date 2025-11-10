// scripts/repair-plan-ids.ts
// Run with: pnpm tsx scripts/repair-plan-ids.ts base
// You can pass multiple modes: pnpm tsx scripts/repair-plan-ids.ts base alt

import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.resolve(process.cwd(), "src/server/mocks/fixtures");

type Plan = { id: string; [k: string]: any };
type PlanBundle = { planId: string; [k: string]: any };
type PlanChannel = { planId: string; [k: string]: any };

async function loadJson<T>(file: string): Promise<T> {
  const p = path.join(FIXTURES_DIR, file);
  return JSON.parse(await readFile(p, "utf8")) as T;
}
async function saveJson(file: string, data: unknown) {
  const p = path.join(FIXTURES_DIR, file);
  await writeFile(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("✔ wrote", path.relative(process.cwd(), p));
}

function randomUuid() {
  // Node 18+: crypto.randomUUID
  return typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

async function repairMode(mode: string) {
  const plansFile = `plans.${mode}.json`;
  const planBundlesFile = `planBundles.${mode}.json`;
  const planChannelsFile = `planChannels.${mode}.json`;

  const plans = (await loadJson<Plan[]>(plansFile)).slice(); // copy
  const planBundles = await loadJson<PlanBundle[]>(planBundlesFile).catch(
    () => [] as PlanBundle[]
  );
  const planChannels = await loadJson<PlanChannel[]>(planChannelsFile).catch(
    () => [] as PlanChannel[]
  );

  // 1) Detect duplicates
  const seen = new Map<string, number>(); // id -> first index
  const dupIndices: number[] = [];
  plans.forEach((p, i) => {
    if (!seen.has(p.id)) seen.set(p.id, i);
    else dupIndices.push(i);
  });

  if (!dupIndices.length) {
    console.log(`[${mode}] No duplicate plan ids. Nothing to change.`);
  } else {
    console.log(
      `[${mode}] Found ${dupIndices.length} duplicate plan rows. Re-keying…`
    );
  }

  // 2) Re-key duplicates with new UUIDs
  const remapped: Array<{ oldId: string; newId: string; index: number }> = [];
  for (const i of dupIndices) {
    const oldId = plans[i].id;
    const newId = randomUuid();
    plans[i] = { ...plans[i], id: newId };
    remapped.push({ oldId, newId, index: i });
  }

  // 3) Validate FKs still point to existing plans (they will, since we preserved the first occurrence)
  const planIds = new Set(plans.map((p) => p.id));

  const orphanBundles = planBundles
    .filter((r) => !planIds.has(r.planId))
    .map((r) => r.planId);
  const orphanChannels = planChannels
    .filter((r) => !planIds.has(r.planId))
    .map((r) => r.planId);

  if (orphanBundles.length || orphanChannels.length) {
    console.warn(
      `[${mode}] WARNING: Found FKs pointing to non-existent plan ids.\n` +
        ` planBundles orphans (unique): ${[...new Set(orphanBundles)].slice(0, 10).join(", ") || "none"}\n` +
        ` planChannels orphans (unique): ${[...new Set(orphanChannels)].slice(0, 10).join(", ") || "none"}`
    );
    // We intentionally DO NOT try to guess remapping. Keep as-is so you can fix source data if needed.
  }

  // 4) Save back
  await saveJson(plansFile, plans);
  // No need to change planBundles/planChannels, but we can rewrite to normalize formatting:
  if (planBundles.length) await saveJson(planBundlesFile, planBundles);
  if (planChannels.length) await saveJson(planChannelsFile, planChannels);

  // 5) Report what changed
  if (remapped.length) {
    console.log(
      `[${mode}] Re-keyed ${remapped.length} duplicate plan rows. Examples:\n` +
        remapped
          .slice(0, 5)
          .map((r) => `  - [${r.index}] ${r.oldId} -> ${r.newId}`)
          .join("\n")
    );
  }
}

async function main() {
  const modes = process.argv.slice(2);
  if (!modes.length) {
    console.log(
      "Usage: pnpm tsx scripts/repair-plan-ids.ts <mode> [moreModes]"
    );
    console.log("Example: pnpm tsx scripts/repair-plan-ids.ts base alt");
    process.exit(1);
  }
  for (const mode of modes) {
    await repairMode(mode);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
