// scripts/generate-scenario.ts
//
// Usage examples:
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=8 --bundles=12 --channels=60
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=24 --bundles=30 --channels=160 --outDir=src/server/mocks/fixtures
//   pnpm tsx scripts/generate-scenario.ts --seed=demo --plans=16 --bundles=18 --channels=120 --single=src/server/mocks/fixtures/scenario.base.json

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// --- enums / types aligned with your Zod schemas ---

type Tier =
  | "Nickel"
  | "Copper"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Palladium"
  | "Rhodium";

type PlanStatus = "Active" | "Inactive" | "Pending";

type PriceModel = "Flat" | "PerBundle" | "PerChannel" | "Hybrid";

type MaxResolution = "SD" | "HD" | "FullHD" | "UHD4K";

type BundleType =
  | "Sports Lover"
  | "Movie Lover"
  | "Just For Kids"
  | "News and Politics"
  | "International"
  | "Premium Content"
  | "Custom";

type PrimaryGenre =
  | "Sports"
  | "News"
  | "Comedy"
  | "Animation"
  | "Lifestyle"
  | "Documentary"
  | "Action"
  | "Horror"
  | "Musicals"
  | "Mixed";

type ChannelCategory =
  | "Sports"
  | "News"
  | "Movies"
  | "Kids"
  | "Lifestyle"
  | "Educational"
  | "Comedy"
  | "Horror"
  | "Animation"
  | "Family"
  | "Music"
  | "General";

type Language = "en" | "es" | "fr" | "de" | "it" | "ja" | "ko" | "zh";

type Region = "US" | "UK" | "AU" | "CA" | "HK" | "IN" | "AQ";

type ParentalRating = "G" | "PG" | "PG-13" | "R" | "NC-17" | "Unrated";

export type Plan = {
  id: string;
  name: string;
  description: string;
  status: PlanStatus;
  versionId: string;
  planTier: Tier;
  pricingModel: PriceModel;
  monthlyPrice: number;
  currency: string;
  maxProfiles: number;
  maxConcurrentStreams: number;
  maxResolution: MaxResolution;
  includesAds: boolean;
  includesCloudDvr: boolean;
  allowsOfflineDownloads: boolean;
  supportsMultipleHouseholds: boolean;
  trialDays: number;
};

export type Bundle = {
  id: string;
  name: string;
  description: string;
  bundleType: BundleType;
  isAddOn: boolean;
  isExclusive: boolean;
  addOnPrice: number;
  currency: string;
  primaryGenre: PrimaryGenre;
  iconKey?: string;
  sortOrder: number;
  promoLabel?: string;
  promoExpiresAt?: string;
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  shortCode?: string;
  category: ChannelCategory;
  language: Language;
  region: Region;
  isLocal: boolean;
  isHd: boolean;
  isUhd: boolean;
  supportsDvr: boolean;
  hasOnDemandLibrary: boolean;
  aLaCartePrice: number;
  currency: string;
  parentalRating: ParentalRating;
  tags: string[];
};

export type PlanBundleLink = {
  planId: string;
  bundleId: string;
  sortIndex?: number;
};
export type BundleChannelLink = {
  bundleId: string;
  channelId: string;
  sortIndex?: number;
};
export type PlanChannelLink = {
  planId: string;
  channelId: string;
  sortIndex?: number;
};

export type Scenario = {
  plans: Plan[];
  bundles: Bundle[];
  channels: Channel[];
  planBundles: PlanBundleLink[];
  bundleChannels: BundleChannelLink[];
  planChannels: PlanChannelLink[];
};

// ---------- args ----------

function arg(name: string, def?: string) {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  if (!a) return def;
  const [, v] = a.split("=");
  return v ?? def;
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

function pick<T>(arr: readonly T[], r = rnd): T {
  return arr[Math.floor(r() * arr.length)]!;
}

function uuidV4Like(r = rnd) {
  const b = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(r() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

function shuffleInPlace<T>(arr: T[], r = rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

function sampleK<T>(arr: T[], k: number, r = rnd): T[] {
  if (k >= arr.length) return [...arr];
  const idxs = [...arr.keys()];
  shuffleInPlace(idxs, r);
  return idxs.slice(0, k).map((i) => arr[i]!);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

// ---------- catalogs / weights ----------

const TIERS: Tier[] = [
  "Nickel",
  "Copper",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Palladium",
  "Rhodium",
];

const PRICE_MODELS: PriceModel[] = [
  "Flat",
  "PerBundle",
  "PerChannel",
  "Hybrid",
];

const PLAN_STATUS_VALUES: PlanStatus[] = ["Active", "Inactive", "Pending"];

// very separated so low tiers can't cross high tiers
const PLAN_TIER_BASE_BANDS: Record<Tier, [number, number]> = {
  Nickel: [10, 15],
  Copper: [16, 22],
  Bronze: [23, 30],
  Silver: [35, 50],
  Gold: [55, 75],
  Platinum: [80, 105],
  Palladium: [110, 140],
  Rhodium: [150, 200],
};

const BUNDLE_TYPES: BundleType[] = [
  "Sports Lover",
  "Movie Lover",
  "Just For Kids",
  "News and Politics",
  "International",
  "Premium Content",
  "Custom",
];

const PRIMARY_GENRES: PrimaryGenre[] = [
  "Sports",
  "News",
  "Comedy",
  "Animation",
  "Lifestyle",
  "Documentary",
  "Action",
  "Horror",
  "Musicals",
  "Mixed",
];

const CHANNEL_CATEGORIES: ChannelCategory[] = [
  "Sports",
  "News",
  "Movies",
  "Kids",
  "Lifestyle",
  "Educational",
  "Comedy",
  "Horror",
  "Animation",
  "Family",
  "Music",
  "General",
];

const LANGS: Language[] = ["en", "es", "fr", "de", "it", "ja", "ko", "zh"];
const REGIONS: Region[] = ["US", "UK", "AU", "CA", "HK", "IN", "AQ"];
const RATINGS: ParentalRating[] = ["G", "PG", "PG-13", "R", "NC-17", "Unrated"];

const KID_SAFE_RATINGS: ParentalRating[] = ["G", "PG", "PG-13"];

// Some real-world-ish channels grouped by category
type ChannelTemplate = {
  name: string;
  shortCode?: string;
  category: ChannelCategory;
  tags?: string[];
  kidSafe?: boolean;
};

const CHANNEL_TEMPLATES: ChannelTemplate[] = [
  // Sports
  {
    name: "ESPN",
    shortCode: "ESPN",
    category: "Sports",
    tags: ["sports", "live"],
  },
  {
    name: "FOX Sports Network",
    shortCode: "FSN",
    category: "Sports",
    tags: ["sports"],
  },
  {
    name: "NBC Sports",
    shortCode: "NBCSN",
    category: "Sports",
    tags: ["sports"],
  },
  // News
  { name: "CNN", shortCode: "CNN", category: "News", tags: ["news"] },
  {
    name: "BBC World News",
    shortCode: "BBCWN",
    category: "News",
    tags: ["news", "international"],
  },
  {
    name: "MSNBC",
    shortCode: "MSNBC",
    category: "News",
    tags: ["news", "politics"],
  },
  // Movies
  {
    name: "HBO",
    shortCode: "HBO",
    category: "Movies",
    tags: ["premium", "movies"],
  },
  { name: "Showtime", shortCode: "SHO", category: "Movies", tags: ["movies"] },
  { name: "Cinemax", shortCode: "MAX", category: "Movies", tags: ["movies"] },
  // Kids / Family / Animation
  {
    name: "Cartoon Network",
    shortCode: "CN",
    category: "Kids",
    tags: ["kids", "animation"],
    kidSafe: true,
  },
  {
    name: "Disney Channel",
    shortCode: "DIS",
    category: "Kids",
    tags: ["kids", "family"],
    kidSafe: true,
  },
  {
    name: "Nickelodeon",
    shortCode: "NICK",
    category: "Kids",
    tags: ["kids"],
    kidSafe: true,
  },
  {
    name: "PBS Kids",
    shortCode: "PBSK",
    category: "Kids",
    tags: ["kids", "educational"],
    kidSafe: true,
  },
  {
    name: "Family Time Network",
    shortCode: "FTN",
    category: "Family",
    tags: ["family"],
    kidSafe: true,
  },
  {
    name: "Toon World",
    shortCode: "TOON",
    category: "Animation",
    tags: ["animation"],
    kidSafe: true,
  },
  // Lifestyle
  {
    name: "Food Network",
    shortCode: "FOOD",
    category: "Lifestyle",
    tags: ["food"],
  },
  {
    name: "HGTV Home & Design",
    shortCode: "HGTV",
    category: "Lifestyle",
    tags: ["home"],
  },
  {
    name: "Travel Explorer",
    shortCode: "TRVL",
    category: "Lifestyle",
    tags: ["travel"],
  },
  // Educational / Documentary
  {
    name: "Discovery Channel",
    shortCode: "DISC",
    category: "Educational",
    tags: ["documentary"],
  },
  {
    name: "National Geographic",
    shortCode: "NATGEO",
    category: "Educational",
    tags: ["documentary"],
  },
  {
    name: "History Channel",
    shortCode: "HIST",
    category: "Educational",
    tags: ["history"],
  },
  // Comedy
  {
    name: "Comedy Central",
    shortCode: "COM",
    category: "Comedy",
    tags: ["comedy"],
  },
  { name: "Laugh TV", shortCode: "LAFF", category: "Comedy", tags: ["comedy"] },
  // Horror / darker movies (we'll keep these out of kids bundles)
  {
    name: "Midnight Horror Network",
    shortCode: "MHR",
    category: "Horror",
    tags: ["horror"],
  },
  {
    name: "Fright Channel",
    shortCode: "FRGT",
    category: "Horror",
    tags: ["horror"],
  },
  // Music / General
  { name: "MTV Music", shortCode: "MTV", category: "Music", tags: ["music"] },
  {
    name: "Classic Hits TV",
    shortCode: "CLHT",
    category: "Music",
    tags: ["music", "retro"],
  },
  { name: "ABC", shortCode: "ABC", category: "General", tags: ["network"] },
  { name: "CBS", shortCode: "CBS", category: "General", tags: ["network"] },
  { name: "NBC", shortCode: "NBC", category: "General", tags: ["network"] },
  { name: "FOX", shortCode: "FOX", category: "General", tags: ["network"] },
  {
    name: "CW Network",
    shortCode: "CW",
    category: "General",
    tags: ["network"],
  },
];

// ---------- plan helpers ----------

function pickPlanStatus(r = rnd): PlanStatus {
  const x = r();
  if (x < 0.75) return "Active";
  if (x < 0.9) return "Pending";
  return "Inactive";
}

function pickPriceModel(r = rnd): PriceModel {
  // slightly bias Hybrid & Flat
  const roll = r();
  if (roll < 0.4) return "Hybrid";
  if (roll < 0.7) return "Flat";
  if (roll < 0.85) return "PerBundle";
  return "PerChannel";
}

type PlanFeatureInput = {
  tier: Tier;
  r?: () => number;
};

function buildPlanFeatures({ tier, r = rnd }: PlanFeatureInput) {
  const tierIndex = TIERS.indexOf(tier);

  // profiles & streams scale with tier
  const baseProfiles = clamp(1 + tierIndex, 1, 8);
  const maxProfiles = clamp(baseProfiles + Math.floor(r() * 3), 1, 10);
  const maxConcurrentStreams = clamp(1 + Math.floor(maxProfiles / 2), 1, 8);

  // resolution by tier
  let maxResolution: MaxResolution = "HD";
  if (tierIndex <= 1) maxResolution = "HD";
  else if (tierIndex <= 3) maxResolution = "FullHD";
  else maxResolution = "UHD4K";

  // includesAds rules:
  // - tiers above Bronze (Silver+) should not include ads by default
  // - Bronze & below can include ads
  let includesAds = true;
  if (tier === "Silver" || tier === "Gold") {
    includesAds = r() < 0.25; // mostly ad-free
  } else if (
    tier === "Platinum" ||
    tier === "Palladium" ||
    tier === "Rhodium"
  ) {
    includesAds = false;
  } else {
    // Nickel / Copper / Bronze – mostly ad-supported
    includesAds = r() < 0.8;
  }

  // includesCloudDvr:
  // - below Bronze: never
  // - above Gold (Platinum+): always
  // - Bronze / Silver / Gold: increasing probability
  let includesCloudDvr = false;
  if (tier === "Nickel" || tier === "Copper") {
    includesCloudDvr = false;
  } else if (tier === "Bronze") {
    includesCloudDvr = r() < 0.25;
  } else if (tier === "Silver") {
    includesCloudDvr = r() < 0.6;
  } else if (tier === "Gold") {
    includesCloudDvr = r() < 0.85;
  } else {
    includesCloudDvr = true;
  }

  // allowsOfflineDownloads:
  // - below Bronze: never
  // - above Gold: always
  let allowsOfflineDownloads = false;
  if (tier === "Nickel" || tier === "Copper") {
    allowsOfflineDownloads = false;
  } else if (tier === "Bronze") {
    allowsOfflineDownloads = r() < 0.2;
  } else if (tier === "Silver") {
    allowsOfflineDownloads = r() < 0.5;
  } else if (tier === "Gold") {
    allowsOfflineDownloads = r() < 0.8;
  } else {
    allowsOfflineDownloads = true;
  }

  // supportsMultipleHouseholds:
  // - below Bronze: never
  let supportsMultipleHouseholds = false;
  if (tier === "Nickel" || tier === "Copper") {
    supportsMultipleHouseholds = false;
  } else if (tier === "Bronze") {
    supportsMultipleHouseholds = r() < 0.2;
  } else if (tier === "Silver") {
    supportsMultipleHouseholds = r() < 0.4;
  } else if (tier === "Gold") {
    supportsMultipleHouseholds = r() < 0.7;
  } else {
    supportsMultipleHouseholds = true;
  }

  // trial days 7–30
  const trialDays = 7 + Math.floor(r() * 24);

  return {
    maxProfiles,
    maxConcurrentStreams,
    maxResolution,
    includesAds,
    includesCloudDvr,
    allowsOfflineDownloads,
    supportsMultipleHouseholds,
    trialDays,
  };
}

function buildPlanBasePrice(
  tier: Tier,
  pricingModel: PriceModel,
  features: ReturnType<typeof buildPlanFeatures>,
  r = rnd
): number {
  const [lo, hi] = PLAN_TIER_BASE_BANDS[tier];
  let price = lo + r() * (hi - lo);

  // Pricing model tweaks
  switch (pricingModel) {
    case "Flat":
      // slightly cheaper for entry plans
      price *= 0.95;
      break;
    case "PerBundle":
      price *= 1.05;
      break;
    case "PerChannel":
      price *= 1.08;
      break;
    case "Hybrid":
      price *= 1.12;
      break;
  }

  // feature-based tweaks
  const extraProfiles = Math.max(0, features.maxProfiles - 1);
  price += extraProfiles * 3;

  if (!features.includesAds) price *= 1.15;
  if (features.includesCloudDvr) price += 5;
  if (features.allowsOfflineDownloads) price += 3;
  if (features.supportsMultipleHouseholds) price += 8;

  // Normalize / round
  price = clamp(price, lo, hi + 30); // allow some upward wiggle by tier
  price = roundTo(price, 1);
  return price;
}

function buildPlanName(
  tier: Tier,
  pricingModel: PriceModel,
  f: ReturnType<typeof buildPlanFeatures>,
  r = rnd
): string {
  const tierFlavor: Record<Tier, string[]> = {
    Nickel: [
      "Basic Bargain Plan",
      "Starter Stream Plan",
      "Entry Essentials Plan",
    ],
    Copper: ["Value Stream Plan", "Everyday Saver Plan"],
    Bronze: ["Family Basics Plan", "Core Bundle Plan"],
    Silver: ["Enhanced Stream Plan", "Plus HD Plan"],
    Gold: ["Gold Premier Plan", "Gold Home Plan", "Gold Family Plan"],
    Platinum: ["Platinum Elite Plan", "Top Tier Unlimited Plan"],
    Palladium: ["Palladium VIP Plan", "Premium Infinity Plan"],
    Rhodium: ["Rhodium Ultra Plan", "Ultimate VIP Plan"],
  };

  const modelPhrase: Record<PriceModel, string> = {
    Flat: "Flat Rate",
    PerBundle: "Per-Bundle",
    PerChannel: "Per-Channel",
    Hybrid: "Hybrid",
  };

  const adsPhrase = f.includesAds ? "with Ads" : "No Ads";
  const dvrPhrase = f.includesCloudDvr ? "Full Cloud DVR" : "No Cloud DVR";
  const hhPhrase = f.supportsMultipleHouseholds
    ? "Multihome Extension"
    : "Single Household";

  const base = pick(tierFlavor[tier], r);
  const profilesPart =
    f.maxProfiles === 1
      ? "Single Profile"
      : `${f.maxProfiles} Profile${f.maxProfiles > 1 ? "s" : ""}`;

  return `${base} - ${modelPhrase[pricingModel]} ${profilesPart} ${adsPhrase} - ${dvrPhrase}, ${hhPhrase}`;
}

function buildPlanDescription(
  tier: Tier,
  pricingModel: PriceModel,
  monthlyPrice: number,
  f: ReturnType<typeof buildPlanFeatures>,
  r = rnd
): string {
  const lines: string[] = [];

  lines.push(
    `A ${tier.toLowerCase()}-tier streaming plan designed for households that need ${f.maxProfiles} profile${f.maxProfiles > 1 ? "s" : ""} and ${f.maxConcurrentStreams} concurrent stream${f.maxConcurrentStreams > 1 ? "s" : ""}.`
  );

  const modelPhrase =
    pricingModel === "Flat"
      ? "a simple flat monthly rate"
      : pricingModel === "Hybrid"
        ? "a flexible hybrid pricing model"
        : pricingModel === "PerBundle"
          ? "per-bundle pricing for add-on content"
          : "per-channel pricing for ultimate control";

  lines.push(
    `Uses ${modelPhrase} at about $${monthlyPrice.toFixed(
      2
    )} per month, billed in ${f.currency ?? "USD"}.`
  );

  if (f.includesAds) {
    lines.push(
      "Includes some ad-supported content to keep the base price low."
    );
  } else {
    lines.push(
      "Provides an ad-free viewing experience across included content."
    );
  }

  if (f.includesCloudDvr) {
    lines.push("Includes cloud DVR for recording live events and shows.");
  }

  if (f.allowsOfflineDownloads) {
    lines.push("Supports offline downloads on supported devices.");
  }

  if (f.supportsMultipleHouseholds) {
    lines.push("Can be shared across multiple households, subject to terms.");
  }

  return lines.join(" ");
}

// ---------- bundle helpers ----------

function buildBundle(
  id: string,
  index: number,
  usedNames: Set<string>,
  r = rnd
): Bundle {
  const bundleType = pick(BUNDLE_TYPES, r);

  let primaryGenre: PrimaryGenre;
  switch (bundleType) {
    case "Sports Lover":
      primaryGenre = "Sports";
      break;
    case "Movie Lover":
      primaryGenre = pick(["Action", "Horror", "Musicals", "Mixed"], r);
      break;
    case "Just For Kids":
      primaryGenre = pick(["Animation", "Comedy", "Mixed"], r);
      break;
    case "News and Politics":
      primaryGenre = "News";
      break;
    case "International":
      primaryGenre = pick(["Mixed", "Documentary", "News"], r);
      break;
    case "Premium Content":
      primaryGenre = pick(["Action", "Horror", "Documentary", "Mixed"], r);
      break;
    case "Custom":
    default:
      primaryGenre = pick(PRIMARY_GENRES, r);
      break;
  }

  const isAddOn = bundleType === "Custom" ? r() < 0.7 : true;
  const isExclusive =
    bundleType === "Premium Content" ||
    (r() < 0.2 && bundleType !== "Just For Kids");

  // --- name with uniqueness enforcement ---
  const uniquenessSuffixes = ["Plus", "Max", "Prime", "Select", "Signature"];
  let nameBase = buildBundleName(
    bundleType,
    primaryGenre,
    isAddOn,
    isExclusive,
    r
  );
  let name = nameBase;

  let attempts = 0;
  while (usedNames.has(name) && attempts < uniquenessSuffixes.length) {
    name = `${nameBase} ${uniquenessSuffixes[attempts]}`;
    attempts++;
  }
  // If we still somehow collide after suffixes, just accept the duplicate; extremely unlikely.
  usedNames.add(name);

  const description = buildBundleDescription(
    name,
    bundleType,
    primaryGenre,
    isAddOn,
    isExclusive,
    r
  );

  let addOnPrice = 0;
  if (isAddOn) {
    let baseLo = 4;
    let baseHi = 15;
    if (bundleType === "Sports Lover" || bundleType === "Premium Content") {
      baseLo = 8;
      baseHi = 25;
    } else if (bundleType === "Just For Kids") {
      baseLo = 3;
      baseHi = 10;
    }
    addOnPrice = roundTo(baseLo + r() * (baseHi - baseLo), 1);
  } else {
    addOnPrice = 0;
  }

  const currency = "USD";
  const iconKey = `${bundleType.replace(/\s+/g, "-").toLowerCase()}-${primaryGenre.toLowerCase()}`;

  const maybePromo =
    isAddOn && r() < 0.3
      ? {
          promoLabel: pick(
            ["Limited time", "New!", "Popular", "Intro offer", "Seasonal deal"],
            r
          ),
          promoExpiresAt: new Date(
            Date.now() + (7 + Math.floor(r() * 30)) * 24 * 60 * 60 * 1000
          ).toISOString(),
        }
      : {};

  return {
    id,
    name,
    description,
    bundleType,
    isAddOn,
    isExclusive,
    addOnPrice,
    currency,
    primaryGenre,
    iconKey,
    sortOrder: index,
    ...maybePromo,
  };
}

function genBundles(n: number, r = rnd): Bundle[] {
  const arr: Bundle[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < n; i++) {
    const id = `b${i + 1}`;
    arr.push(buildBundle(id, i, usedNames, r));
  }

  return arr;
}

function buildBundleName(
  bundleType: BundleType,
  primaryGenre: PrimaryGenre,
  isAddOn: boolean,
  isExclusive: boolean,
  r = rnd
): string {
  const addOnPhrase = isAddOn ? "Add-On" : "Included Bundle";
  const exclusiveTokens = ["Exclusive", "Signature", "Elite"];
  const genericBoosters = [
    "Plus",
    "Max",
    "Premium",
    "Ultimate",
    "Unlimited",
    "Select",
  ];

  const exclusivePhrase = isExclusive ? pick(exclusiveTokens, r) : "";
  const boosterPhrase = r() < 0.6 ? pick(genericBoosters, r) : "";

  const genrePhrase = (() => {
    switch (primaryGenre) {
      case "Sports":
        return "Sports";
      case "News":
        return "News & Analysis";
      case "Comedy":
        return "Comedy";
      case "Animation":
        return "Cartoon";
      case "Lifestyle":
        return "Lifestyle";
      case "Documentary":
        return "Documentary";
      case "Action":
        return "Action & Adventure";
      case "Horror":
        return "Horror";
      case "Musicals":
        return "Music & Musicals";
      case "Mixed":
      default:
        return "Mixed Entertainment";
    }
  })();

  // Slightly themed prefixes so “Just For Kids” doesn’t look identical every time
  const basePrefix = (() => {
    switch (bundleType) {
      case "Just For Kids": {
        const kidsPrefixes = [
          "Just For Kids",
          "Kids Zone",
          "Junior Playtime",
          "Family Kids Club",
        ];
        return pick(kidsPrefixes, r);
      }
      case "Movie Lover": {
        const moviePrefixes = ["Movie Lover", "Cinephile", "Film Fanatic"];
        return pick(moviePrefixes, r);
      }
      case "Sports Lover": {
        const sportsPrefixes = ["Sports Lover", "Game Day", "Fan Zone"];
        return pick(sportsPrefixes, r);
      }
      case "News and Politics": {
        const newsPrefixes = [
          "News & Politics",
          "World News",
          "Current Affairs",
        ];
        return pick(newsPrefixes, r);
      }
      case "International": {
        const intlPrefixes = ["International", "World View", "Global Streams"];
        return pick(intlPrefixes, r);
      }
      case "Premium Content": {
        const premiumPrefixes = ["Premium", "Prestige", "Prime Access"];
        return pick(premiumPrefixes, r);
      }
      case "Custom":
      default: {
        const customPrefixes = ["Custom", "Personalized", "Curated"];
        return pick(customPrefixes, r);
      }
    }
  })();

  const parts = [
    basePrefix,
    genrePhrase,
    boosterPhrase,
    exclusivePhrase,
    addOnPhrase,
  ];

  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function buildBundleDescription(
  name: string,
  bundleType: BundleType,
  primaryGenre: PrimaryGenre,
  isAddOn: boolean,
  isExclusive: boolean,
  r = rnd
): string {
  const lines: string[] = [];

  lines.push(
    `${name} adds a curated set of ${primaryGenre.toLowerCase()} channels to your base plan.`
  );

  switch (bundleType) {
    case "Just For Kids":
      lines.push(
        "Built for families seeking safe, age-appropriate programming with a strong focus on kids."
      );
      break;
    case "Movie Lover":
      lines.push(
        "Ideal for movie buffs who want premium channels, new releases, and deep back catalogs."
      );
      break;
    case "Sports Lover":
      lines.push(
        "Focused on live games, highlights, and sports analysis across major leagues and events."
      );
      break;
    case "News and Politics":
      lines.push(
        "Brings together major news networks and political commentary from different perspectives."
      );
      break;
    case "International":
      lines.push(
        "Offers international news and entertainment from multiple regions and languages."
      );
      break;
    case "Premium Content":
      lines.push(
        "Combines high-end premium networks and specialty content not available in base tiers."
      );
      break;
    case "Custom":
    default:
      lines.push("A flexible mix of channels tuned for general entertainment.");
      break;
  }

  if (isExclusive) {
    lines.push(
      "Available only on select upper-tier plans as an exclusive add-on."
    );
  }

  if (!isAddOn) {
    lines.push("Included at no additional charge as part of selected plans.");
  }

  return lines.join(" ");
}

// ---------- channel helpers ----------

function buildChannels(n: number, r = rnd): Channel[] {
  const channels: Channel[] = [];
  const usedNames = new Set<string>();
  let idCounter = 0;

  const baseTemplates = [...CHANNEL_TEMPLATES];

  while (channels.length < n) {
    const t = pick(baseTemplates, r);
    idCounter += 1;

    const region = pick(REGIONS, r);
    const isLocal = t.category === "General" && region === "US" && r() < 0.3;

    const kidSafeTemplate =
      t.category === "Kids" ||
      t.category === "Family" ||
      t.category === "Animation" ||
      t.category === "Educational" ||
      t.kidSafe;

    const parentalRating: ParentalRating = kidSafeTemplate
      ? pick(KID_SAFE_RATINGS, r)
      : pick(RATINGS, r);

    const isHd = true;
    const isUhd =
      r() < 0.15 && (t.category === "Movies" || t.category === "Sports");
    const supportsDvr =
      t.category === "Sports" || t.category === "News" || r() < 0.4;
    const hasOnDemandLibrary =
      t.category === "Movies" ||
      t.category === "Educational" ||
      t.category === "Kids" ||
      r() < 0.5;

    let priceBase = 0;
    if (t.category === "Sports" || t.category === "Movies") {
      priceBase = 8 + r() * 12;
    } else if (
      t.category === "Kids" ||
      t.category === "Educational" ||
      t.category === "Family"
    ) {
      priceBase = 4 + r() * 6;
    } else {
      priceBase = r() < 0.4 ? 0 : 3 + r() * 5;
    }

    const aLaCartePrice = isLocal ? 0 : roundTo(priceBase, 1);

    const name = buildChannelName(t, region as Region, isLocal, usedNames, r);
    const description = buildChannelDescription(t, parentalRating, isLocal, r);

    const channel: Channel = {
      id: `c${idCounter}`,
      name,
      description,
      shortCode: t.shortCode,
      category: t.category,
      language: pick(LANGS, r),
      region,
      isLocal,
      isHd,
      isUhd,
      supportsDvr,
      hasOnDemandLibrary,
      aLaCartePrice,
      currency: "USD",
      parentalRating,
      tags: t.tags ?? [],
    };

    channels.push(channel);
  }

  return channels;
}

function buildChannelName(
  t: ChannelTemplate,
  region: Region,
  isLocal: boolean,
  usedNames: Set<string>,
  r = rnd
): string {
  const brandTokens = ["HD", "Prime", "Plus", "World", "Extra", "Edge", "Live"];
  const regionTokens: Partial<Record<Region, string[]>> = {
    US: ["Nation", "America", "States"],
    UK: ["Britain", "UK", "Nation"],
    AU: ["Australia", "Down Under"],
    CA: ["Canada", "North"],
    HK: ["Asia", "Hong Kong"],
    IN: ["India", "Asia"],
    AQ: ["Polar"],
  };

  let base: string;

  if (isLocal) {
    // Local variants: keep it obviously “channel X, local”
    const localPrefixes = ["Local", "Regional", "Metro", "City"];
    const prefix = pick(localPrefixes, r);
    const area = pick(regionTokens[region] ?? ["Area", "Region", "Market"], r);
    // e.g. "ABC Local Metro", "CBS Regional States"
    base = `${t.name} ${prefix} ${area}`;
  } else {
    // Non-local: template name + maybe brand + maybe region flavor
    const maybeBrand = r() < 0.6 ? pick(brandTokens, r) : "";
    const regionWords = regionTokens[region] ?? [];
    const maybeRegionWord =
      regionWords.length && r() < 0.35 ? pick(regionWords, r) : "";

    const parts = [t.name, maybeBrand, maybeRegionWord];
    base = parts.filter(Boolean).join(" ");
  }

  let name = base.replace(/\s+/g, " ").trim();

  // Enforce uniqueness without numeric suffixes
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const uniquenessTokens = [
    "Select",
    "Signature",
    "Ultra",
    "Network",
    "Channel",
    "Premier",
  ];
  for (const tok of uniquenessTokens) {
    const candidate = `${name} ${tok}`.replace(/\s+/g, " ").trim();
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }

  // Worst case, accept the duplicate (should be extremely rare)
  return name;
}

function buildChannelDescription(
  t: ChannelTemplate,
  rating: ParentalRating,
  isLocal: boolean,
  r = rnd
): string {
  const pieces: string[] = [];

  if (isLocal) {
    pieces.push(
      "Local broadcast affiliate offering regional news and general entertainment."
    );
  } else {
    switch (t.category) {
      case "Sports":
        pieces.push(
          "Live and replay coverage of major sports leagues, events, and highlight shows."
        );
        break;
      case "News":
        pieces.push(
          "24-hour news coverage with breaking stories, interviews, and in-depth analysis."
        );
        break;
      case "Movies":
        pieces.push(
          "A mix of blockbuster films, classics, and on-demand movie libraries."
        );
        break;
      case "Kids":
        pieces.push(
          "Animated series, family-friendly shows, and educational programming for children."
        );
        break;
      case "Educational":
        pieces.push(
          "Documentaries, factual series, and learning-focused programming."
        );
        break;
      case "Comedy":
        pieces.push(
          "Stand-up specials, sitcoms, and comedy series from around the world."
        );
        break;
      case "Horror":
        pieces.push(
          "Horror films, thrillers, and late-night fear-fest programming."
        );
        break;
      case "Animation":
        pieces.push("Animated series and films for a wide range of ages.");
        break;
      case "Family":
        pieces.push(
          "Family movies, series, and specials suitable for a broad audience."
        );
        break;
      case "Lifestyle":
        pieces.push(
          "Food, travel, home improvement, and reality lifestyle series."
        );
        break;
      case "Music":
        pieces.push("Music videos, concerts, and artist-focused series.");
        break;
      case "General":
      default:
        pieces.push(
          "General entertainment, dramas, comedies, and variety programming."
        );
        break;
    }
  }

  pieces.push(`Typical parental rating: ${rating}.`);
  return pieces.join(" ");
}

// ---------- plan / bundle generators ----------

function genPlans(n: number, r = rnd): Plan[] {
  const arr: Plan[] = [];

  for (let i = 0; i < n; i++) {
    const tier = pick(TIERS, r);
    const status = pickPlanStatus(r);
    const pricingModel = pickPriceModel(r);
    const features = buildPlanFeatures({ tier, r });
    const monthlyPrice = buildPlanBasePrice(tier, pricingModel, features, r);
    const name = buildPlanName(tier, pricingModel, features, r);
    const description = buildPlanDescription(tier, pricingModel, monthlyPrice, {
      ...features,
      currency: "USD",
    });

    const plan: Plan = {
      id: `p${i + 1}`,
      name,
      description,
      status,
      versionId: `v${1 + Math.floor(r() * 6)}`,
      planTier: tier,
      pricingModel,
      monthlyPrice,
      currency: "USD",
      maxProfiles: features.maxProfiles,
      maxConcurrentStreams: features.maxConcurrentStreams,
      maxResolution: features.maxResolution,
      includesAds: features.includesAds,
      includesCloudDvr: features.includesCloudDvr,
      allowsOfflineDownloads: features.allowsOfflineDownloads,
      supportsMultipleHouseholds: features.supportsMultipleHouseholds,
      trialDays: features.trialDays,
    };

    arr.push(plan);
  }

  return arr;
}

// ---------- link generation with constraints ----------

function genLinks(
  plans: Plan[],
  bundles: Bundle[],
  channels: Channel[],
  r = rnd,
  opts = {
    bundlesPerPlan: [1, 3] as [number, number],
    directChPerPlan: [0, 3] as [number, number],
    chPerBundle: [3, 6] as [number, number],
  }
): {
  planBundles: PlanBundleLink[];
  planChannels: PlanChannelLink[];
  bundleChannels: BundleChannelLink[];
} {
  const randIn = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));

  const planBundles: PlanBundleLink[] = [];
  const bundleChannels: BundleChannelLink[] = [];
  const planChannels: PlanChannelLink[] = [];

  const nonLocalChannels = channels.filter((c) => !c.isLocal);
  const kidFriendlyChannels = channels.filter(
    (c) =>
      (c.category === "Kids" ||
        c.category === "Family" ||
        c.category === "Animation" ||
        c.category === "Educational") &&
      KID_SAFE_RATINGS.includes(c.parentalRating)
  );
  const nonHorrorNonAdult = channels.filter(
    (c) => c.category !== "Horror" && !["R", "NC-17"].includes(c.parentalRating)
  );

  // bundles per plan (no constraints other than count)
  for (const p of plans) {
    const count = Math.min(randIn(...opts.bundlesPerPlan), bundles.length);
    const chosen = sampleK([...bundles], count, r);
    chosen.forEach((b, sortIndex) =>
      planBundles.push({ planId: p.id, bundleId: b.id, sortIndex })
    );

    // direct channels per plan: can include local channels
    const chCount = Math.min(randIn(...opts.directChPerPlan), channels.length);
    const chosenChannels = sampleK([...channels], chCount, r);
    chosenChannels.forEach((c, sortIndex) =>
      planChannels.push({ planId: p.id, channelId: c.id, sortIndex })
    );
  }

  // channels per bundle with constraints:
  // - no local channels in bundles
  // - no Horror / adult-ish in "Just For Kids"
  for (const b of bundles) {
    const available = (() => {
      if (b.bundleType === "Just For Kids") {
        // kids bundles: restrict to kid-friendly channels
        return kidFriendlyChannels.length
          ? kidFriendlyChannels
          : nonHorrorNonAdult;
      }
      // other bundles: use non-local; if we accidentally get kids bundle, it's still fine
      return nonLocalChannels.length ? nonLocalChannels : channels;
    })();

    const count = Math.min(randIn(...opts.chPerBundle), available.length);
    const chosen = sampleK([...available], count, r);
    chosen.forEach((c, sortIndex) =>
      bundleChannels.push({ bundleId: b.id, channelId: c.id, sortIndex })
    );
  }

  // de-dupe and re-densify sort order
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

  const dedupPlanBundles = dedupeByKey(
    planBundles,
    (r) => `${r.planId}|${r.bundleId}`
  );
  const dedupPlanChannels = dedupeByKey(
    planChannels,
    (r) => `${r.planId}|${r.channelId}`
  );
  const dedupBundleChannels = dedupeByKey(
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

  redensify(dedupPlanBundles, (r) => (r as any).planId);
  redensify(dedupPlanChannels, (r) => (r as any).planId);
  redensify(dedupBundleChannels, (r) => (r as any).bundleId);

  return {
    planBundles: dedupPlanBundles,
    planChannels: dedupPlanChannels,
    bundleChannels: dedupBundleChannels,
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

  // extra: ensure local channels never appear in bundles
  const idToChannel = new Map(s.channels.map((ch) => [ch.id, ch]));
  for (const l of s.bundleChannels) {
    const ch = idToChannel.get(l.channelId);
    if (ch?.isLocal) {
      throw new Error(
        `bundleChannels: local channel linked to bundle: ${l.channelId}`
      );
    }
  }
}

// ---------- main ----------

async function main() {
  const plans = genPlans(PLANS, rnd);
  const bundles = genBundles(BUNDLES, rnd);
  const channels = buildChannels(CHANNELS, rnd);
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
    return;
  }

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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
