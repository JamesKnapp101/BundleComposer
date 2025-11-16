import { customAlphabet } from 'nanoid';
import seedrandom from 'seedrandom';
import type { Scenario } from '../../lib/api/scenarioClient';
import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
  Tier,
} from '../../schema';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

export const buildScenario = (
  seed = 'demo',
  counts = { plans: 3, bundles: 6, channels: 24 },
): Scenario => {
  const rng = seedrandom(seed);
  const pick = <T>(arr: readonly T[], rnd = Math.random): T => arr[Math.floor(rnd() * arr.length)]!;
  let id = 0;
  const nextId = (p: string) => `${p}${++id}`;

  const tiers: Tier[] = [
    'Nickel',
    'Copper',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Palladium',
    'Rhodium',
  ];
  const categories = [
    'Sports',
    'News',
    'Movies',
    'Kids',
    'Lifestyle',
    'Educational',
    'Comedy',
    'Horror',
    'Animation',
    'Family',
    'Music',
    'General',
  ] as const;

  const plans: Plan[] = Array.from({ length: counts.plans }, (_, i) => ({
    id: nextId('p'),
    name: `Plan ${i + 1}`,
    description: 'placeholder description',
    status: 'Active',
    versionId: nanoid(),
    planTier: pick(tiers),
    pricingModel: 'Hybrid',
    monthlyPrice: 0,
    currency: 'USD',
    maxProfiles: 0,
    maxConcurrentStreams: 0,
    maxResolution: 'HD',
    includesAds: false,
    includesCloudDvr: false,
    allowsOfflineDownloads: false,
    supportsMultipleHouseholds: false,
    trialDays: 0,
  }));

  const bundles: Bundle[] = Array.from({ length: counts.bundles }, (_, i) => ({
    id: nextId('b'),
    name: `Bundle ${i + 1}`,
    description: '',
    bundleType: 'Custom',
    isAddOn: false,
    isExclusive: false,
    addOnPrice: 0,
    currency: 'USD',
    primaryGenre: 'Mixed',
    iconKey: '',
    sortOrder: 0,
    promoLabel: '',
    promoExpiresAt: '',
  }));

  const channels: Channel[] = Array.from({ length: counts.channels }, (_, i) => ({
    id: nextId('c'),
    name: `Channel ${i + 1}`,
    description: '',
    shortCode: 'HBO',
    category: pick(categories),
    language: 'en',
    region: 'US',
    isLocal: false,
    isHd: false,
    isUhd: false,
    supportsDvr: false,
    hasOnDemandLibrary: false,
    aLaCartePrice: 0,
    currency: 'USD',
    parentalRating: 'Unrated',
    tags: [],
  }));

  const planBundles: PlanBundleLink[] = [];
  const bundleChannels: BundleChannelLink[] = [];
  const planChannels: PlanChannelLink[] = [];

  plans.forEach((p) => {
    const chosen = new Set<number>();
    while (chosen.size < 3 && chosen.size < bundles.length) {
      chosen.add(Math.floor(rng() * bundles.length));
    }
    [...chosen].forEach((idx, sortIndex) => {
      planBundles.push({ planId: p.id, bundleId: bundles[idx].id, sortIndex });
    });

    const directCount = 1 + Math.floor(rng() * 5);
    const chIdxs = new Set<number>();
    while (chIdxs.size < directCount && chIdxs.size < channels.length) {
      chIdxs.add(Math.floor(rng() * channels.length));
    }
    [...chIdxs].forEach((ci, sortIndex) => {
      planChannels.push({ planId: p.id, channelId: channels[ci].id, sortIndex });
    });
  });

  bundles.forEach((b) => {
    const count = 3 + Math.floor(rng() * 4);
    const chosen = new Set<number>();
    while (chosen.size < count && chosen.size < channels.length) {
      chosen.add(Math.floor(rng() * channels.length));
    }
    [...chosen].forEach((ci, sortIndex) => {
      bundleChannels.push({ bundleId: b.id, channelId: channels[ci].id, sortIndex });
    });
  });

  return { plans, bundles, channels, planBundles, bundleChannels, planChannels };
};
