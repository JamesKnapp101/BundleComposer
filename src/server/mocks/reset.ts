import type { FastifyInstance } from 'fastify';
import path from 'node:path';

import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
} from '@schema';
import { readJsonAt } from '..';

export const registerMockResetRoute = (app: FastifyInstance) => {
  const N = (s: string) => s;
  app.post('/api/mocks/reset', async (req, reply) => {
    try {
      const { mode = 'base' } = (req.body ?? {}) as { mode?: 'base' | 'alt' };
      const fixturesDir = path.resolve(process.cwd(), 'src/server/mocks/fixtures');
      const files = {
        plans: path.join(fixturesDir, `plans.${mode}.json`),
        bundles: path.join(fixturesDir, `bundles.${mode}.json`),
        channels: path.join(fixturesDir, `channels.${mode}.json`),
        planBundles: path.join(fixturesDir, `planBundles.${mode}.json`),
        planChannels: path.join(fixturesDir, `planChannels.${mode}.json`),
        bundleChannels: path.join(fixturesDir, `bundleChannels.${mode}.json`),
      };
      const [
        plansRaw,
        bundlesRaw,
        channelsRaw,
        planBundlesRaw,
        planChannelsRaw,
        bundleChannelsRaw,
      ] = await Promise.all([
        readJsonAt<Plan[]>(files.plans),
        readJsonAt<Bundle[]>(files.bundles),
        readJsonAt<Channel[]>(files.channels),
        readJsonAt<PlanBundleLink[]>(files.planBundles).catch(() => []),
        readJsonAt<PlanChannelLink[]>(files.planChannels).catch(() => []),
        readJsonAt<BundleChannelLink[]>(files.bundleChannels).catch(() => []),
      ]);
      const plans = plansRaw.map((p: { id: string }) => ({ ...p, id: N(p.id) }));
      const bundles = bundlesRaw.map((b: { id: string }) => ({ ...b, id: N(b.id) }));
      const channels = channelsRaw.map((c: { id: string }) => ({ ...c, id: N(c.id) }));
      const planBundles = planBundlesRaw.map((r: { planId: string; bundleId: string }) => ({
        ...r,
        planId: N(r.planId),
        bundleId: N(r.bundleId),
      }));
      const planChannels = planChannelsRaw.map((r: { planId: string; channelId: string }) => ({
        ...r,
        planId: N(r.planId),
        channelId: N(r.channelId),
      }));
      const bundleChannels = bundleChannelsRaw.map(
        (r: { bundleId: string; channelId: string }) => ({
          ...r,
          bundleId: N(r.bundleId),
          channelId: N(r.channelId),
        }),
      );

      const plansById = Object.fromEntries(plans.map((p: { id: string }) => [p.id, p]));
      const bundlesById = Object.fromEntries(bundles.map((b: { id: string }) => [b.id, b]));
      const channelsById = Object.fromEntries(channels.map((c: { id: string }) => [c.id, c]));
      const errors: string[] = [];
      const missing = (label: string, id: string) => errors.push(`${label}: ${id}`);

      for (const r of planBundles) {
        if (!plansById[r.planId]) missing('planBundles.planId', r.planId);
        if (!bundlesById[r.bundleId]) missing('planBundles.bundleId', r.bundleId);
      }
      for (const r of planChannels) {
        if (!plansById[r.planId]) missing('planChannels.planId', r.planId);
        if (!channelsById[r.channelId]) missing('planChannels.channelId', r.channelId);
      }
      for (const r of bundleChannels) {
        if (!bundlesById[r.bundleId]) missing('bundleChannels.bundleId', r.bundleId);
        if (!channelsById[r.channelId]) missing('bundleChannels.channelId', r.channelId);
      }

      if (errors.length) {
        const uniq = Array.from(new Set(errors));
        const head = uniq.slice(0, 10).join(', ');
        throw new Error(`Fixture integrity error(s): ${head}${uniq.length > 10 ? ' …' : ''}`);
      }
      app.mockState = { plans, bundles, channels, planBundles, bundleChannels, planChannels };
      req.log.info(
        {
          counts: {
            plans: plans.length,
            bundles: bundles.length,
            channels: channels.length,
            planBundles: planBundles.length,
            planChannels: planChannels.length,
            bundleChannels: bundleChannels.length,
          },
        },
        'mock state set',
      );
      return reply.send({ ok: true, mode });
    } catch (err) {
      req.log.error(err, 'reset failed');
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
};
