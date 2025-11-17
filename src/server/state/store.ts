import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
} from 'src/schema';

export type AppState = {
  plans: Plan[];
  bundles: Bundle[];
  channels: Channel[];
  planBundles: PlanBundleLink[];
  bundleChannels: BundleChannelLink[];
  planChannels: PlanChannelLink[];
};

let state: AppState | null = null;

export const getState = (): AppState | null => {
  return state;
};

export const setState = (next: AppState): void => {
  state = next;
};

export const clearState = (): void => {
  state = null;
};
