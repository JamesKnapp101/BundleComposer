// sanitize-plans.ts

import crypto from "node:crypto";
import fssync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { planNamePrefixString } from "../src/server/mocks/ids";

type Plan = {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending";
  versionId: string;
  planTier:
    | "Nickel"
    | "Copper"
    | "Bronze"
    | "Silver"
    | "Gold"
    | "Platinum"
    | "Palladium"
    | "Rhodium";
  pricingModel: "flat" | "per-bundle" | "per-channel" | "hybrid";
  basePrice: number;
};

function seeded(id: string) {
  const buf = crypto.createHash("sha256").update(id).digest();
  let i = 0;
  return () => buf[i++ % buf.length] / 255;
}

const PRICE_BANDS: Record<Plan["planTier"], [number, number]> = {
  Nickel: [11, 24],
  Copper: [25, 35],
  Bronze: [36, 40],
  Silver: [41, 55],
  Gold: [56, 75],
  Platinum: [76, 99],
  Palladium: [100, 200],
  Rhodium: [201, 500],
};

const NAME_VARIANTS: Record<Plan["planTier"], string[]> = {
  Nickel: [
    "Nickel Minus",
    "Nickel Basic",
    "Nickel Lite",
    "Nickel Plus",
    "Nickel Plus Plus",
    "Nickel Xtra Lite",
  ],
  Copper: [
    "Copper Plus",
    "Copper Choice",
    "Copper Essential",
    "Copper Xtra",
    "Copper Value",
    "Copper Prime",
  ],
  Bronze: [
    "Bronze Plus",
    "Bronze Choice",
    "Bronze Basic",
    "Bronze Standard",
    "Bronze Essential",
    "Bronze Xtra",
    "Bronze Prime",
  ],
  Silver: [
    "Silver Plus",
    "Silver Premium",
    "Silver Basic",
    "Silver Xtra",
    "Silver Prime",
    "Silver Plus Plus",
    "Silver Prime Plus",
  ],
  Gold: [
    "Gold Max",
    "Gold Elite",
    "Gold Plus",
    "Gold Xtra",
    "Gold Prime",
    "Gold Supreme",
    "Gold Ultimate",
  ],
  Platinum: [
    "Platinum Elite",
    "Platinum Max",
    "Platinum Plus",
    "Platinum Xtra",
    "Platinum Prime",
    "Platinum Ultra",
  ],
  Palladium: [
    "Palladium Prime",
    "Palladium Ultra",
    "Palladium Supreme",
    "Palladium Ultimate",
    "Palladium Supreme Ultimate Ultra",
  ],
  Rhodium: [
    "Rhodium Ultra",
    "Rhodium Supreme",
    "Rhodium Ultimate",
    "Rhodium Supreme Ultimate Ultra",
    "Rhodium Infinity",
    "Rhodium Infinity Plus",
    "Rhodium Infinity Plus Plus",
    "Rhodium Infinity Plus Infinity",
  ],
};

const MODELS: Plan["pricingModel"][] = [
  "flat",
  "per-bundle",
  "per-channel",
  "hybrid",
];
const pick = <T>(arr: T[], rnd: () => number) =>
  arr[Math.floor(rnd() * arr.length)];
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function sanitize(p: Plan): Plan {
  const rnd = seeded(p.id);
  const [lo, hi] = PRICE_BANDS[p.planTier] ?? [10, 20];
  const basePrice = Math.round(lo + rnd() * (hi - lo));
  const name =
    planNamePrefixString() +
    " " +
    pick(NAME_VARIANTS[p.planTier] ?? [p.name || `${p.planTier} Plan`], rnd);
  const status: "active" | "inactive" | "pending" =
    p.status === "inactive"
      ? "inactive"
      : rnd() < 0.75
        ? "active"
        : pick(["inactive", "pending"], rnd);
  const pricingModel = MODELS.includes(p.pricingModel)
    ? p.pricingModel
    : pick(MODELS, rnd);
  const versionId = `v${1 + Math.floor(rnd() * 6)}`;
  return {
    ...p,
    name,
    status,
    versionId,
    pricingModel,
    basePrice: clamp(basePrice, lo, hi),
  };
}

async function atomicWrite(file: string, content: string) {
  const dir = path.dirname(file);
  const base = path.basename(file);
  const tmp = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, file);
}

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

function planKey(p: Plan) {
  return `${p.id}|${p.name}|${p.status}|${p.versionId}|${p.planTier}|${p.pricingModel}|${p.basePrice}`;
}

async function main() {
  const arg = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const sampleArg = process.argv.find((a) => a.startsWith("--sample"));
  const sample = sampleArg ? Number(sampleArg.split("=")[1] || 5) : 0;

  if (!arg) {
    console.error(
      "Usage: pnpm tsx scripts/sanitize-plans.ts <path> [--dry-run] [--force] [--sample=5]"
    );
    process.exit(1);
  }

  const filePath = resolveInputPath(arg);
  console.log(`→ Reading:  ${filePath}`);

  const raw = await fs.readFile(filePath, "utf-8");
  const arr: Plan[] = JSON.parse(raw);
  console.log(`→ Plans in file: ${arr.length}`);

  const beforeKeys = arr.map(planKey);
  const out = arr.map(sanitize);
  const afterKeys = out.map(planKey);

  // Diff summary
  let changed = 0;
  for (let i = 0; i < arr.length; i++)
    if (beforeKeys[i] !== afterKeys[i]) changed++;

  console.log(`→ Changed rows: ${changed}/${arr.length}`);
  if (sample > 0) {
    console.log("→ Sample (first N rows with before → after):");
    for (let i = 0; i < Math.min(sample, arr.length); i++) {
      const a = arr[i],
        b = out[i];
      if (beforeKeys[i] === afterKeys[i]) continue;
      console.log(`  #${i + 1} ${a.id}`);
      console.log(`    name:         "${a.name}" -> "${b.name}"`);
      console.log(`    status:       ${a.status} -> ${b.status}`);
      console.log(`    versionId:    ${a.versionId} -> ${b.versionId}`);
      console.log(`    pricingModel: ${a.pricingModel} -> ${b.pricingModel}`);
      console.log(`    basePrice:    ${a.basePrice} -> ${b.basePrice}`);
    }
  }

  if (dryRun) {
    console.log("✔ Dry run only — no write performed.");
    return;
  }

  if (changed === 0 && !force) {
    console.log(
      "✔ No changes detected. Use --force to rewrite file formatting anyway."
    );
    return;
  }

  const json = JSON.stringify(out, null, 2) + "\n";
  await atomicWrite(filePath, json);
  const stat = await fs.stat(filePath);
  console.log(`✔ Wrote ${out.length} plans to ${filePath}`);
  console.log(`  mtime: ${stat.mtime.toISOString()}`);
}

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
