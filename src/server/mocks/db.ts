import type { Scenario } from '../../lib/api/scenarioClient';

let STATE: Scenario | null = null;

export const setState = (scenario: Scenario) => {
  STATE = scenario;
};
export const getState = (): Scenario | null => {
  return STATE;
};
export const clearState = () => {
  STATE = null;
};

export const assertIntegrity = (scenario: Scenario) => {
  const ids = {
    plan: new Set(scenario.plans.map((plan) => plan.id)),
    bundle: new Set(scenario.bundles.map((bundle) => bundle.id)),
    channel: new Set(scenario.channels.map((channel) => channel.id)),
  };

  for (const planBundleLink of scenario.planBundles) {
    if (!ids.plan.has(planBundleLink.planId))
      throw new Error(`planBundles: missing plan ${planBundleLink.planId}`);
    if (!ids.bundle.has(planBundleLink.bundleId))
      throw new Error(`planBundles: missing bundle ${planBundleLink.bundleId}`);
  }
  for (const bundleChannelLink of scenario.bundleChannels) {
    if (!ids.bundle.has(bundleChannelLink.bundleId))
      throw new Error(`bundleChannels: missing bundle ${bundleChannelLink.bundleId}`);
    if (!ids.channel.has(bundleChannelLink.channelId))
      throw new Error(`bundleChannels: missing channel ${bundleChannelLink.channelId}`);
  }
  for (const planChannelLink of scenario.planChannels) {
    if (!ids.plan.has(planChannelLink.planId))
      throw new Error(`planChannels: missing plan ${planChannelLink.planId}`);
    if (!ids.channel.has(planChannelLink.channelId))
      throw new Error(`planChannels: missing channel ${planChannelLink.channelId}`);
  }
};
