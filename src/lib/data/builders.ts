import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
} from '@schema';

export const indexById = <T extends { id: string }>(arr: T[]) => {
  return new Map(arr.map((x) => [x.id, x]));
};

export const getBundlesForPlan = (
  planId: string,
  planBundleLinks: PlanBundleLink[],
  bundles: Bundle[],
) => {
  const byId = indexById(bundles);
  return planBundleLinks
    .filter((l) => l.planId === planId)
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((l) => byId.get(l.bundleId))
    .filter(Boolean) as Bundle[];
};

export const getDirectChannelsForPlan = (
  planId: string,
  planChannelLinks: PlanChannelLink[],
  channels: Channel[],
) => {
  const byId = indexById(channels);
  return planChannelLinks
    .filter((l) => l.planId === planId)
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((l) => byId.get(l.channelId))
    .filter(Boolean) as Channel[];
};

export const getChannelsForBundle = (
  bundleId: string,
  bundleChannelLinks: BundleChannelLink[],
  channels: Channel[],
) => {
  const byId = indexById(channels);
  return bundleChannelLinks
    .filter((l) => l.bundleId === bundleId)
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((l) => byId.get(l.channelId))
    .filter(Boolean) as Channel[];
};

export type PlanView = {
  plan: Plan;
  bundles: (Bundle & { channels: Channel[] })[];
  directChannels: Channel[];
  allChannels: Channel[];
};

export const buildPlanViewFromScenario = (
  scenario: {
    plans: Plan[];
    bundles: Bundle[];
    channels: Channel[];
    planBundles: PlanBundleLink[];
    bundleChannels: BundleChannelLink[];
    planChannels: PlanChannelLink[];
  },
  planId: string,
): PlanView | undefined => {
  const plan = scenario.plans.find((p) => p.id === planId);
  if (!plan) return undefined;

  const bundles = getBundlesForPlan(planId, scenario.planBundles, scenario.bundles);

  const bundlesWithChannels = bundles.map((b) => ({
    ...b,
    channels: getChannelsForBundle(b.id, scenario.bundleChannels, scenario.channels),
  }));

  const directChannels = getDirectChannelsForPlan(planId, scenario.planChannels, scenario.channels);

  const allChannels = Array.from(
    new Map(
      [...directChannels, ...bundlesWithChannels.flatMap((b) => b.channels)].map((c) => [c.id, c]),
    ).values(),
  );

  return { plan, bundles: bundlesWithChannels, directChannels, allChannels };
};
