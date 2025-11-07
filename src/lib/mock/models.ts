import { BundleCategory, Tier } from '../../features/bundleComposer/types';

export type UUID = string; // keep it simple; validate with zod if you like

export type Channel = {
  channelId: UUID;
  name: string; // real names are fine for demo; using invented below
  childLock: boolean;
  hdtv: boolean;
  description: string;
  payPerView: boolean;
  channelTier: Tier;
};

export type Bundle = {
  bundleId: UUID;
  name: string; // e.g., "Animation Nation", "Sports Lover"
  description: string;
  category: BundleCategory;
  bundleTier: Tier;
  bundledChannels: Channel[];
  isActive: boolean;
  monthlyCost: number; // USD
};

export type Plan = {
  id: UUID;
  name: string;
  planTier: Tier;
  signupDate: string; // ISO; safer for transport
  renewDate: string; // ISO
  state: string; // "MA", "CA", ...
  region: string; // "Northeast", ...
  localChannels: Channel[];
  eighteenPlusPermit: boolean;
  hdPackage: boolean;
  planBundles: Bundle[];
  childControl: boolean;
  monthlyCost: number; // derived in mocks
};

// ------------------ MOCKS (no dependencies)

const STATES = ['MA', 'CA', 'NY', 'TX', 'FL', 'WA', 'CO', 'AZ', 'IL', 'NC'] as const;
const REGIONS = ['J451', 'R01D', 'E116', 'T923', 'W422', 'O009', 'D612', 'H301'] as const;

const TIER_LIST: Tier[] = Object.values(Tier);
const CAT_LIST: BundleCategory[] = Object.values(BundleCategory);

const CHANNEL_NAMES = [
  'Aurora TV',
  'Beacon News',
  'Cascade Sports',
  'Drift Animation',
  'Echo Movies',
  'Flare Comedy',
  'Granite Food',
  'Harbor Family',
  'Ion Kids',
  'Jolt Esports',
  'Kite Outdoors',
  'Lumen Science',
  'Food Network',
  'Galaxy Sci-Fi',
  'Food Network After Dark',
  'Exercises in Ribaldry',
  'Swank Cinema',
  'Mosaic Arts',
  'Nimbus Travel',
  'Orbit Documentary',
  'Pulse Music',
  'Quartz Classics',
  'Rift Horror',
  'Summit HD',
  'Tango Drama',
  'Umbra Indie',
  'Vivid Nature',
  'Wave Local',
  'Xeno Tech',
  'Yield Retro',
  'Zen HD',
];

const LOCAL_CHANNEL_NAMES = [
  'Local News 1',
  'Local News 2',
  'Local Sports',
  'Local Weather',
  'Local Events',
  `Wayne's World`,
];

// ------------------ MOCK DATA GENERATION

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)];
}
function pickMany<T>(arr: T[], count: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && a.length; i++) {
    out.push(a.splice(rnd(0, a.length - 1), 1)[0]);
  }
  return out;
}
function uuid(): UUID {
  // lightweight v4-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const v = (Math.random() * 16) | 0;
    const n = c === 'x' ? v : (v & 0x3) | 0x8;
    return n.toString(16);
  });
}
function isoDaysFrom(start: Date, days: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Channel cost hint by tier (purely for mock pricing)
const TIER_CHANNEL_COST: Record<Tier, number> = {
  [Tier.Nickel]: 0.5,
  [Tier.Copper]: 0.75,
  [Tier.Bronze]: 1,
  [Tier.Silver]: 1.5,
  [Tier.Gold]: 2,
  [Tier.Platinum]: 3,
  [Tier.Palladium]: 4,
  [Tier.Rhodium]: 5,
};

function makeChannel(name?: string, local?: boolean): Channel {
  const tier = pick(TIER_LIST);
  const hd = Math.random() > 0.35;
  const ppv = Math.random() > 0.85;
  return {
    channelId: uuid(),
    name: name ?? pick(local ? LOCAL_CHANNEL_NAMES : CHANNEL_NAMES),
    childLock: Math.random() > 0.8,
    hdtv: hd,
    description: `${hd ? 'HD ' : ''}${tier} tier channel.`,
    payPerView: ppv,
    channelTier: tier,
  };
}

function bundleNameFor(cat: BundleCategory): string {
  const map: Record<BundleCategory, string[]> = {
    [BundleCategory.Family]: ['Family Essentials', 'Together Time', 'Home & Heart'],
    [BundleCategory.Sports]: ['Sports Lover', 'All-Star Sports', 'GameDay Max'],
    [BundleCategory.Animation]: ['Animation Nation', 'ToonTown', 'Animated Classics'],
    [BundleCategory.FoodDrink]: ['Food & Drink', 'Kitchen Pro', 'Taste Tour'],
    [BundleCategory.Movies]: ['Movie Night', 'CinePlus', 'Silver Screen'],
    [BundleCategory.Educational]: ['Learn+', 'Discovery Pack', 'Knowledge Hub'],
    [BundleCategory.Comedy]: ['Laugh Track', 'Stand-Up Central', 'Sitcom Vault'],
    [BundleCategory.Horror]: ['Fright Night', 'After Dark', 'Chills & Thrills'],
    [BundleCategory.NewsPolitics]: ['News & Politics', 'WorldWatch', 'Capitol Report'],
  };
  return pick(map[cat]);
}

function estimateBundleCost(channels: Channel[], tier: Tier): number {
  const base = {
    // base per tier
    [Tier.Nickel]: 2,
    [Tier.Copper]: 3,
    [Tier.Bronze]: 4,
    [Tier.Silver]: 6,
    [Tier.Gold]: 8,
    [Tier.Platinum]: 12,
    [Tier.Palladium]: 16,
    [Tier.Rhodium]: 20,
  }[tier];
  const perChannel = channels.reduce((sum, c) => sum + TIER_CHANNEL_COST[c.channelTier], 0);
  return Math.round((base + perChannel) * 100) / 100;
}

function makeBundle(): Bundle {
  const category = pick(CAT_LIST);
  const tier = pick(TIER_LIST);
  const chCount = rnd(4, 12);
  const channels = pickMany(CHANNEL_NAMES, chCount).map((n) => makeChannel(n));
  return {
    bundleId: uuid(),
    name: bundleNameFor(category),
    description: `${category} bundle at ${tier} tier with ${chCount} channels.`,
    category,
    bundleTier: tier,
    bundledChannels: channels,
    isActive: Math.random() > 0.07,
    monthlyCost: estimateBundleCost(channels, tier),
  };
}

function planNameFor(tier: Tier, idx: number) {
  const suffix = ['Basic', 'Standard', 'Plus', 'Max', 'Ultra'][rnd(0, 4)];
  return `Plan ${tier} ${suffix} #${idx}`;
}

function estimatePlanCost(bundles: Bundle[], hd: boolean, localCount: number): number {
  const bundlesTotal = bundles.reduce((s, b) => s + b.monthlyCost, 0);
  const hdFee = hd ? 5 : 0;
  const localsFee = Math.max(0, localCount - 3) * 0.5; // first 3 local channels included
  return Math.round((bundlesTotal + hdFee + localsFee) * 100) / 100;
}

export function makeMockPlans(count = 100): Plan[] {
  const now = new Date();
  const plans: Plan[] = [];
  for (let i = 1; i <= count; i++) {
    const tier = pick(TIER_LIST);
    const state = pick([...STATES]);
    const region = pick([...REGIONS]);
    const localChannels = Array.from({ length: rnd(2, 6) }, () => makeChannel());
    const bundles = Array.from({ length: rnd(1, 5) }, () => makeBundle());
    const hdEligible: Tier[] = [Tier.Gold, Tier.Platinum, Tier.Palladium, Tier.Rhodium];
    const hd = hdEligible.includes(tier) ? Math.random() > 0.1 : Math.random() > 0.9;

    const signup = isoDaysFrom(now, -rnd(30, 400));
    const renew = isoDaysFrom(new Date(signup), rnd(15, 365));

    const plan: Plan = {
      id: uuid(),
      name: planNameFor(tier, i),
      planTier: tier,
      signupDate: signup,
      renewDate: renew,
      state,
      region,
      localChannels,
      eighteenPlusPermit: Math.random() > 0.7,
      hdPackage: hd,
      planBundles: bundles,
      childControl: Math.random() > 0.5,
      monthlyCost: estimatePlanCost(bundles, hd, localChannels.length),
    };
    plans.push(plan);
  }
  return plans;
}

export const MOCK_PLANS_300: Plan[] = makeMockPlans(300);
