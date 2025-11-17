import 'fastify';
import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
} from '../schema';

export type AppState = {
  plans: Plan[];
  bundles: Bundle[];
  channels: Channel[];
  planBundles: PlanBundleLink[];
  bundleChannels: BundleChannelLink[];
  planChannels: PlanChannelLink[];
};

declare module 'fastify' {
  interface FastifyInstance {
    mockState: AppState | null;
  }
}
