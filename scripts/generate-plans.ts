// generate-plans.ts

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type Tier =
  | "Nickel"
  | "Copper"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Palladium"
  | "Rhodium";

type Plan = {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending";
  versionId: string;
  planTier: Tier;
  pricingModel: "flat" | "per-bundle" | "per-channel" | "hybrid";
  basePrice: number;
};

const TIER_ORDER: Tier[] = [
  "Nickel",
  "Copper",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Palladium",
  "Rhodium",
];

const TIER_NAME: Record<Tier, string> = {
  Nickel: "Nickel Stream",
  Copper: "Copper Stream",
  Bronze: "Bronze Stream",
  Silver: "Silver Stream",
  Gold: "Gold Stream",
  Platinum: "Platinum Stream",
  Palladium: "Palladium Stream",
  Rhodium: "Rhodium Stream",
};

const TIER_WEIGHTS: Record<Tier, number> = {
  Nickel: 0.12,
  Copper: 0.13,
  Bronze: 0.16,
  Silver: 0.18,
  Gold: 0.18,
  Platinum: 0.13,
  Palladium: 0.07,
  Rhodium: 0.03, // rare but not “only one”
};

// build cumulative weights for fast picking
const TIERS = TIER_ORDER; // ["Nickel", ... "Rhodium"]
const CUM: number[] = [];
{
  let acc = 0;
  for (const t of TIERS) {
    acc += TIER_WEIGHTS[t];
    CUM.push(acc);
  }
  // normalize in case weights don't sum to 1
  for (let i = 0; i < CUM.length; i++) CUM[i] /= acc;
}

function weightedTierPick(rnd: () => number): Tier {
  const r = rnd();
  const idx = CUM.findIndex((c) => r < c);
  return TIERS[idx < 0 ? TIERS.length - 1 : idx]!;
}

// deterministic Fisher–Yates using your rnd()
function shuffleInPlace<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildTierAssignments(count: number, rnd: () => number): Tier[] {
  const out: Tier[] = [];

  // Guarantee at least one of each if we have room
  if (count >= TIERS.length) {
    out.push(...TIERS);
    for (let i = TIERS.length; i < count; i++) {
      out.push(weightedTierPick(rnd));
    }
    // shuffle so guaranteed ones aren’t all at the front
    shuffleInPlace(out, rnd);
  } else {
    // not enough slots for all tiers — just weighted pick for all
    for (let i = 0; i < count; i++) out.push(weightedTierPick(rnd));
  }
  return out;
}

function parseArg(name: string, fallback?: string) {
  const a = process.argv.find((x) => x.startsWith(`--${name}`));
  if (!a) return fallback;
  const [, val] = a.split("=");
  return (val ?? "").trim() || fallback;
}
const COUNT = Number(parseArg("count", "24"));
const SEED = parseArg("seed", "demo")!;
const OUT = parseArg("out", "src/server/mocks/fixtures/plans.base.json")!;

function rng(seed: string) {
  const buf = crypto.createHash("sha256").update(seed).digest();
  let i = 0;
  return () => buf[i++ % buf.length] / 255;
}
const rnd = rng(SEED);

function pick<T>(arr: T[]) {
  return arr[Math.floor(rnd() * arr.length)];
}
function uuidV4Like() {
  // deterministic-ish id from rnd()
  const b = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(rnd() * 256);
  // v4 mask
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function tierForIndex(i: number, total: number): Tier {
  // Spread across tiers with a bias toward mid-tiers for realism
  // You can swap this for a weighted sampler if you prefer.
  const idx = Math.floor(
    (i / Math.max(total - 1, 1)) * (TIER_ORDER.length - 1)
  );
  return TIER_ORDER[idx]!;
}

function genPlans(n: number): Plan[] {
  const arr: Plan[] = [];
  const tiers = buildTierAssignments(n, rnd);

  for (let i = 0; i < n; i++) {
    const tier = tiers[i];
    const id = `${uuidV4Like()}-p`;
    const name = TIER_NAME[tier];
    const status: Plan["status"] =
      rnd() < 0.8 ? "active" : rnd() < 0.5 ? "inactive" : "pending";
    const versionId = `v${1 + Math.floor(rnd() * 3)}`;
    const pricingModel: Plan["pricingModel"] = pick([
      "flat",
      "per-bundle",
      "per-channel",
      "hybrid",
    ]);

    arr.push({
      id,
      name,
      status,
      versionId,
      planTier: tier,
      pricingModel,
      basePrice: 0, // sanitizer fills this in by tier band
    });
  }
  return arr;
}

async function main() {
  const outPath = path.resolve(process.cwd(), OUT);
  const plans = genPlans(COUNT);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(plans, null, 2) + "\n", "utf-8");
  console.log(`✔ Generated ${plans.length} plans → ${outPath}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
