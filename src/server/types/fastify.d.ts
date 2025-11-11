import 'fastify';

export type AppState = {
  plans: any[];
  bundles: any[];
  channels: any[];
  planBundles: any[];
  bundleChannels: any[];
  planChannels: any[];
};

declare module 'fastify' {
  interface FastifyInstance {
    mockState: AppState | null;
  }
}
