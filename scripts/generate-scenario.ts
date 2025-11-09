// Usage examples:
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=8 --bundles=12 --channels=60
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=24 --bundles=30 --channels=160 --outDir=src/server/mocks/fixtures
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=16 --bundles=18 --channels=120 --single=src/server/mocks/fixtures/scenario.base.json
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
  basePrice: number; // leave 0 if you plan to sanitize later
};

type Bundle = {
  id: string;
  name: string;
  description: string;
  basePrice: number; // leave 0 if you plan to sanitize later
  isActive: boolean;
  tier?: Tier; // optional; can help with price bands if you sanitize bundles
  tags: string[];
};

type Channel = {
  id: string;
  name: string;
  description: string;
  price: number; // leave 0 if you plan to sanitize later
  category?: string;
  tier?: Tier;
  isLocal: boolean;
  tags: string[];
};

type PlanBundleLink = { planId: string; bundleId: string; sortIndex?: number };
type BundleChannelLink = {
  bundleId: string;
  channelId: string;
  sortIndex?: number;
};
type PlanChannelLink = {
  planId: string;
  channelId: string;
  sortIndex?: number;
};

type Scenario = {
  plans: Plan[];
  bundles: Bundle[];
  channels: Channel[];
  planBundles: PlanBundleLink[];
  bundleChannels: BundleChannelLink[];
  planChannels: PlanChannelLink[];
};

// ---------- args ----------
function arg(name: string, def?: string) {
  const a = process.argv.find((s) => s.startsWith(`--${name}`));
  return a ? (a.split("=")[1] ?? "") : def;
}
const SEED = arg("seed", "demo")!;
const PLANS = Number(arg("plans", "8"));
const BUNDLES = Number(arg("bundles", "12"));
const CHANNELS = Number(arg("channels", "60"));
const OUT_DIR = arg("outDir", "src/server/mocks/fixtures")!;
const SINGLE = arg("single"); // if set, writes single scenario JSON instead of six files

// ---------- rng / utils ----------
function rng(seed: string) {
  const buf = crypto.createHash("sha256").update(seed).digest();
  let i = 0;
  return () => buf[i++ % buf.length] / 255;
}
const rnd = rng(SEED);

function pick<T>(arr: T[], r = rnd) {
  return arr[Math.floor(r() * arr.length)];
}

function uuidV4Like(r = rnd) {
  const b = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(r() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function shuffleInPlace<T>(arr: T[], r = rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function sampleK<T>(arr: T[], k: number, r = rnd): T[] {
  if (k >= arr.length) return [...arr];
  const idx = [...arr.keys()];
  shuffleInPlace(idx, r);
  return idx.slice(0, k).map((i) => arr[i]!);
}

// ---------- domain weights / catalogs ----------
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
  Rhodium: 0.03,
};
const TIERS = TIER_ORDER;
const CUM: number[] = (() => {
  let acc = 0;
  const out: number[] = [];
  for (const t of TIERS) {
    acc += TIER_WEIGHTS[t];
    out.push(acc);
  }
  return out.map((x) => x / acc);
})();
function weightedTierPick(r = rnd): Tier {
  const x = r();
  const idx = CUM.findIndex((c) => x < c);
  return TIERS[idx < 0 ? TIERS.length - 1 : idx]!;
}

// Bundle names
const BUNDLE_THEMES = [
  "Sports Max",
  "Family Time",
  "Movie Night",
  "Docs & News",
  "Kids Club",
  "Comedy Plus",
  "Horror Vault",
  "Edu Pack",
  "Lifestyle Mix",
  "Animation Zone",
  "World News",
  "Indie Gems",
];

// Channel categories (price bands handled by your sanitizer if you add one)
const CHANNEL_CATEGORIES = [
  "Sports",
  "News & Politics",
  "Movies",
  "Kids",
  "Lifestyle",
  "Educational",
  "Comedy",
  "Horror",
  "Animation",
  "Family",
  "Food & Drink",
];

// ---------- generators ----------
function buildTierAssignments(count: number, r = rnd): Tier[] {
  const out: Tier[] = [];
  if (count >= TIERS.length) {
    out.push(...TIERS);
    for (let i = TIERS.length; i < count; i++) out.push(weightedTierPick(r));
    shuffleInPlace(out, r);
  } else {
    for (let i = 0; i < count; i++) out.push(weightedTierPick(r));
  }
  return out;
}

function genPlans(n: number, r = rnd): Plan[] {
  const tiers = buildTierAssignments(n, r);
  const arr: Plan[] = [];
  for (let i = 0; i < n; i++) {
    const tier = tiers[i]!;
    arr.push({
      id: `${uuidV4Like(r)}-p`,
      name: TIER_NAME[tier],
      status: r() < 0.85 ? "active" : r() < 0.5 ? "inactive" : "pending",
      versionId: `v${1 + Math.floor(r() * 3)}`,
      planTier: tier,
      pricingModel: pick(["flat", "per-bundle", "per-channel", "hybrid"], r),
      basePrice: 0, // sanitizer fills by tier
    });
  }
  return arr;
}

function genBundles(n: number, r = rnd): Bundle[] {
  const tiers = buildTierAssignments(n, r); // optional: give bundles tiers too
  const arr: Bundle[] = [];
  for (let i = 0; i < n; i++) {
    const tier = tiers[i]!;
    const name =
      BUNDLE_THEMES[i % BUNDLE_THEMES.length] +
      (i >= BUNDLE_THEMES.length
        ? ` ${Math.floor(i / BUNDLE_THEMES.length) + 1}`
        : "");
    arr.push({
      id: `${uuidV4Like(r)}-b`,
      name,
      description: "",
      basePrice: 0, // sanitizer fills by bundle tier
      isActive: r() < 0.92,
      tier,
      tags: [],
    });
  }
  return arr;
}

function genChannels(n: number, r = rnd): Channel[] {
  const arr: Channel[] = [];
  for (let i = 0; i < n; i++) {
    const tier = weightedTierPick(r); // optional tier on channel
    const cat = pick(CHANNEL_CATEGORIES, r);
    arr.push({
      id: `${uuidV4Like(r)}-c`,
      name: `${cat} ${i + 1}`,
      description: "",
      price: 0, // sanitizer fills by category/tier if you add one
      category: cat,
      tier,
      isLocal: r() < 0.1,
      tags: [],
    });
  }
  return arr;
}

function genLinks(
  plans: Plan[],
  bundles: Bundle[],
  channels: Channel[],
  r = rnd,
  opts = {
    bundlesPerPlan: [1, 3] as [number, number], // inclusive min/max
    directChPerPlan: [0, 3] as [number, number], // inclusive min/max
    chPerBundle: [3, 6] as [number, number], // inclusive min/max
  }
): {
  planBundles: PlanBundleLink[];
  planChannels: PlanChannelLink[];
  bundleChannels: BundleChannelLink[];
} {
  const randIn = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));

  const planBundles: PlanBundleLink[] = [];
  const planChannels: PlanChannelLink[] = [];
  const bundleChannels: BundleChannelLink[] = [];

  // bundles per plan (unique per plan)
  for (const p of plans) {
    const count = Math.min(randIn(...opts.bundlesPerPlan), bundles.length);
    const chosen = sampleK(bundles, count, r);
    chosen.forEach((b, i) =>
      planBundles.push({ planId: p.id, bundleId: b.id, sortIndex: i })
    );
  }

  // direct channels per plan (unique per plan)
  for (const p of plans) {
    const count = Math.min(randIn(...opts.directChPerPlan), channels.length);
    const chosen = sampleK(channels, count, r);
    chosen.forEach((c, i) =>
      planChannels.push({ planId: p.id, channelId: c.id, sortIndex: i })
    );
  }

  // channels per bundle (unique per bundle)
  for (const b of bundles) {
    const count = Math.min(randIn(...opts.chPerBundle), channels.length);
    const chosen = sampleK(channels, count, r);
    chosen.forEach((c, i) =>
      bundleChannels.push({ bundleId: b.id, channelId: c.id, sortIndex: i })
    );
  }

  // de-dupe safety (in case sampleK or ranges change later)
  function dedupeByKey<T>(rows: T[], keyFn: (row: T) => string): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const row of rows) {
      const key = keyFn(row);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(row);
      }
    }
    return out;
  }
  const planBundlesDeduped = dedupeByKey(
    planBundles,
    (r) => `${r.planId}|${r.bundleId}`
  );
  const planChannelsDeduped = dedupeByKey(
    planChannels,
    (r) => `${r.planId}|${r.channelId}`
  );
  const bundleChannelsDeduped = dedupeByKey(
    bundleChannels,
    (r) => `${r.bundleId}|${r.channelId}`
  );

  function redensify<T extends { sortIndex?: number }>(
    rows: T[],
    groupKey: (row: T) => string
  ) {
    const groups = new Map<string, T[]>();
    for (const r of rows) {
      const k = groupKey(r);
      const g = groups.get(k);
      if (g) g.push(r);
      else groups.set(k, [r]);
    }
    for (const g of groups.values()) {
      g.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
      g.forEach((r, i) => (r.sortIndex = i));
    }
  }

  redensify(planBundlesDeduped, (r) => (r as any).planId);
  redensify(planChannelsDeduped, (r) => (r as any).planId);
  redensify(bundleChannelsDeduped, (r) => (r as any).bundleId);

  return {
    planBundles: planBundlesDeduped, // PlanBundleLink[]
    planChannels: planChannelsDeduped, // PlanChannelLink[]
    bundleChannels: bundleChannelsDeduped, // BundleChannelLink[]
  };
}

// ---------- integrity checks ----------
function assertIntegrity(s: Scenario) {
  const p = new Set(s.plans.map((x) => x.id));
  const b = new Set(s.bundles.map((x) => x.id));
  const c = new Set(s.channels.map((x) => x.id));
  for (const l of s.planBundles) {
    if (!p.has(l.planId))
      throw new Error(`planBundles: missing plan ${l.planId}`);
    if (!b.has(l.bundleId))
      throw new Error(`planBundles: missing bundle ${l.bundleId}`);
  }
  for (const l of s.planChannels) {
    if (!p.has(l.planId))
      throw new Error(`planChannels: missing plan ${l.planId}`);
    if (!c.has(l.channelId))
      throw new Error(`planChannels: missing channel ${l.channelId}`);
  }
  for (const l of s.bundleChannels) {
    if (!b.has(l.bundleId))
      throw new Error(`bundleChannels: missing bundle ${l.bundleId}`);
    if (!c.has(l.channelId))
      throw new Error(`bundleChannels: missing channel ${l.channelId}`);
  }
}

// ---------- main ----------
async function main() {
  const plans = genPlans(PLANS, rnd);
  const bundles = genBundles(BUNDLES, rnd);
  const channels = genChannels(CHANNELS, rnd);
  const links = genLinks(plans, bundles, channels, rnd);

  const scenario: Scenario = { plans, bundles, channels, ...links };
  assertIntegrity(scenario);

  if (SINGLE) {
    const singlePath = path.resolve(process.cwd(), SINGLE);
    await fs.mkdir(path.dirname(singlePath), { recursive: true });
    await fs.writeFile(
      singlePath,
      JSON.stringify(scenario, null, 2) + "\n",
      "utf-8"
    );
    console.log(`✔ Wrote scenario → ${singlePath}`);
  } else {
    const outDir = path.resolve(process.cwd(), OUT_DIR);
    await fs.mkdir(outDir, { recursive: true });
    await Promise.all([
      fs.writeFile(
        path.join(outDir, "plans.base.json"),
        JSON.stringify(plans, null, 2) + "\n",
        "utf-8"
      ),
      fs.writeFile(
        path.join(outDir, "bundles.base.json"),
        JSON.stringify(bundles, null, 2) + "\n",
        "utf-8"
      ),
      fs.writeFile(
        path.join(outDir, "channels.base.json"),
        JSON.stringify(channels, null, 2) + "\n",
        "utf-8"
      ),
      fs.writeFile(
        path.join(outDir, "planBundles.base.json"),
        JSON.stringify(links.planBundles, null, 2) + "\n",
        "utf-8"
      ),
      fs.writeFile(
        path.join(outDir, "bundleChannels.base.json"),
        JSON.stringify(links.bundleChannels, null, 2) + "\n",
        "utf-8"
      ),
      fs.writeFile(
        path.join(outDir, "planChannels.base.json"),
        JSON.stringify(links.planChannels, null, 2) + "\n",
        "utf-8"
      ),
    ]);
    console.log(`✔ Wrote fixtures → ${outDir}`);
    console.log(
      `  plans=${plans.length}, bundles=${bundles.length}, channels=${channels.length}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
