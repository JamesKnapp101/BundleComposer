import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import { readFile } from 'fs/promises';
import path from 'node:path';
import { type Scenario } from '../lib/api/scenarioClient';
import type {
  Bundle,
  BundleChannelLink,
  Channel,
  Dict,
  Plan,
  PlanBundleLink,
  PlanChannelLink,
} from '../schema';
import { clearState } from './mocks/db';
import { buildScenario } from './mocks/factories';
import { registerMockResetRoute } from './mocks/reset';

type JobId = string;
type GenerateQuery = {
  seed?: string;
  plans?: string;
  bundles?: string;
  channels?: string;
};
type ReqParams = {
  id?: string;
  userId?: string;
  body?: Dict;
  ids?: string;
  jobId?: string;
};
type Job = {
  startedAt: number;
  finishedAt: number;
  status: 'queued' | 'in_progress' | 'done' | 'failed';
  progress: number;
  subscribers: Set<NodeJS.WritableStream>;
  timer: NodeJS.Timeout | undefined;
};

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  },
});

await app.register(cors, { origin: true });
registerMockResetRoute(app);

const parseIntParam = (value: unknown, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

app.get('/api/mocks/fixtures', async () => {
  const [plans, bundles, channels, planBundles, bundleChannels, planChannels] = await Promise.all([
    readFile(new URL('./mocks/fixtures/plans.base.json', import.meta.url), 'utf-8'),
    readFile(new URL('./mocks/fixtures/bundles.base.json', import.meta.url), 'utf-8'),
    readFile(new URL('./mocks/fixtures/channels.base.json', import.meta.url), 'utf-8'),
    readFile(new URL('./mocks/fixtures/planBundles.base.json', import.meta.url), 'utf-8'),
    readFile(new URL('./mocks/fixtures/bundleChannels.base.json', import.meta.url), 'utf-8'),
    readFile(new URL('./mocks/fixtures/planChannels.base.json', import.meta.url), 'utf-8'),
  ]);
  const scenario: Scenario = {
    plans: JSON.parse(plans),
    bundles: JSON.parse(bundles),
    channels: JSON.parse(channels),
    planBundles: JSON.parse(planBundles),
    bundleChannels: JSON.parse(bundleChannels),
    planChannels: JSON.parse(planChannels),
  };
  return scenario;
});

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/mocks/generate', async (req) => {
  const q: GenerateQuery = req.query ?? {};
  const seed = String(q.seed ?? 'demo');
  const counts = {
    plans: parseIntParam(q.plans, 3),
    bundles: parseIntParam(q.bundles, 6),
    channels: parseIntParam(q.channels, 24),
  };
  const scenario = buildScenario(seed, counts);
  return scenario;
});

export const readJsonAt = async <T = unknown>(absPath: string): Promise<T> => {
  const txt = await readFile(absPath, 'utf8');
  return JSON.parse(txt) as T;
};

const loadFixtures = async (mode: 'base' | 'alt' = 'base') => {
  const fixturesDir = path.resolve(process.cwd(), 'src/server/mocks/fixtures');
  const files = {
    plans: path.join(fixturesDir, `plans.${mode}.json`),
    bundles: path.join(fixturesDir, `bundles.${mode}.json`),
    channels: path.join(fixturesDir, `channels.${mode}.json`),
    planBundles: path.join(fixturesDir, `planBundles.${mode}.json`),
    planChannels: path.join(fixturesDir, `planChannels.${mode}.json`),
    bundleChannels: path.join(fixturesDir, `bundleChannels.${mode}.json`),
  };
  const [plans, bundles, channels, planBundles, planChannels, bundleChannels] = await Promise.all([
    readJsonAt(files.plans),
    readJsonAt(files.bundles),
    readJsonAt(files.channels),
    readJsonAt(files.planBundles).catch(() => []),
    readJsonAt(files.planChannels).catch(() => []),
    readJsonAt(files.bundleChannels).catch(() => []),
  ]);

  return {
    plans: plans as Plan[],
    bundles: bundles as Bundle[],
    channels: channels as Channel[],
    planBundles: planBundles as PlanBundleLink[],
    bundleChannels: bundleChannels as BundleChannelLink[],
    planChannels: planChannels as PlanChannelLink[],
  };
};

app.get('/api/mocks/state', async (req, reply) => {
  if (!app.mockState) {
    req.log.info('state empty; lazy-loading fixtures (base)');
    const s = await loadFixtures('base');
    app.mockState = s;
  }
  return reply.send(app.mockState);
});

app.post('/api/mocks/clear', async () => {
  clearState();
  return { ok: true };
});

const jobs = new Map<
  JobId,
  {
    status: 'queued' | 'in_progress' | 'done' | 'failed';
    progress: number;
    startedAt?: number;
    finishedAt?: number;
    timer?: NodeJS.Timeout;
    subscribers: Set<NodeJS.WritableStream>;
  }
>();

//const JobStart = z.object({ planIds: z.array(z.string()).min(1) });
//const LockRequest = z.object({ user: z.string().min(1) });
//const PlansQuery = z.object({ ids: z.array(z.string()).min(1) });

app.get('/users/:userId', async (req) => {
  return {
    user: { id: (req.params as ReqParams).userId, name: 'Mr. Bulldops', email: 'mr@bulldops.org' },
  };
});

app.post('/plans/query', async () => {
  // const { ids } = PlansQuery.parse((req as ReqParams).body ?? {});
  const results = ['']; //ids.map((id) => plans.get(id)).filter(Boolean);
  return results;
});

app.post('/plans/lock', async () => {
  // const { user } = LockRequest.parse((req as ReqParams).body || {});
  // const ids = (req.params as ReqParams).ids as string;
  // const p = plans.get(id);
  return true;
  // if (!p) return reply.code(404).send({ error: 'Not found' });
  // if (p.lockedBy && p.lockedBy !== user)
  //   return reply.code(409).send({ error: 'Already locked', lockedBy: p.lockedBy });
  // p.lockedBy = user;
  // p.lockedAt = Date.now();
  // p.version += 1;
  // return p;
});

app.post('/plans/unlock', async () => {
  // const { user } = LockRequest.parse((req as ReqParams).body || {});
  //const id = (req.params as ReqParams).id as string;
  // const p = plans.get(id);
  return true;
  // if (!p) return reply.code(404).send({ error: 'Not found' });
  // if (p.lockedBy && p.lockedBy !== user)
  //   return reply.code(403).send({ error: 'Locked by another user' });
  // p.lockedBy = null;
  // p.lockedAt = null;
  // p.version += 1;
  // return p;
});

app.get<{
  Querystring: { planIds?: string };
}>('/api/channels/planChannels', async (req, reply) => {
  const { planIds } = req.query ?? {};
  if (!planIds) return reply.code(400).send({ error: 'Missing planIds' });

  const ids = Array.from(
    new Set(
      planIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
  if (!ids.length) return reply.code(400).send({ error: 'No valid planIds' });

  const scenario = await loadFixtures('base');
  const channelById = new Map(scenario.channels.map((c: Channel) => [c.id, c]));

  const planToDirect: Map<string, { channelId: string; sortIndex: number }[]> = new Map();
  for (const row of scenario.planChannels ?? []) {
    if (!planToDirect.has(row.planId)) planToDirect.set(row.planId, []);
    planToDirect.get(row.planId)!.push({ channelId: row.channelId, sortIndex: row.sortIndex ?? 0 });
  }

  const planToBundles: Map<string, { bundleId: string; sortIndex: number }[]> = new Map();
  for (const pb of scenario.planBundles ?? []) {
    if (!planToBundles.has(pb.planId)) planToBundles.set(pb.planId, []);
    planToBundles.get(pb.planId)!.push({ bundleId: pb.bundleId, sortIndex: pb.sortIndex ?? 0 });
  }

  const bundleToChannels: Map<string, { channelId: string; sortIndex: number }[]> = new Map();
  for (const bc of scenario.bundleChannels ?? []) {
    if (!bundleToChannels.has(bc.bundleId)) bundleToChannels.set(bc.bundleId, []);
    bundleToChannels
      .get(bc.bundleId)!
      .push({ channelId: bc.channelId, sortIndex: bc.sortIndex ?? 0 });
  }

  const out: Record<string, Channel[]> = {};
  for (const pid of ids) {
    const direct = (planToDirect.get(pid) ?? [])
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((x) => channelById.get(x.channelId))
      .filter(Boolean) as Channel[];

    const viaBundles: Channel[] = [];
    if (!direct.length) {
      const bundleRefs = (planToBundles.get(pid) ?? [])
        .slice()
        .sort((a, b) => a.sortIndex - b.sortIndex);
      const seen = new Set<string>();
      for (const { bundleId } of bundleRefs) {
        const chRefs = (bundleToChannels.get(bundleId) ?? [])
          .slice()
          .sort((a, b) => a.sortIndex - b.sortIndex);
        for (const { channelId } of chRefs) {
          if (seen.has(channelId)) continue;
          const ch = channelById.get(channelId);
          if (ch) {
            viaBundles.push(ch);
            seen.add(channelId);
          }
        }
      }
    }
    out[pid] = direct.length ? direct : viaBundles;
  }

  req.log.info(
    { requestCount: ids.length, first: ids[0], foundForFirst: out[ids[0]]?.length ?? 0 },
    'planChannels lookup',
  );
  return reply.send(out);
});

app.get<{
  Querystring: { planIds?: string };
}>('/api/channels/planBundles', async (req, reply) => {
  const { planIds } = req.query ?? {};
  if (!planIds) return reply.code(400).send({ error: 'Missing planIds' });

  const ids = Array.from(
    new Set(
      planIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
  if (!ids.length) return reply.code(400).send({ error: 'No valid planIds' });

  const scenario = await loadFixtures('base');
  const bundleById = new Map(scenario.bundles.map((bundle: Bundle) => [bundle.id, bundle]));

  const planToDirect: Map<string, { bundleId: string; sortIndex: number }[]> = new Map();
  for (const row of scenario.planBundles ?? []) {
    if (!planToDirect.has(row.planId)) planToDirect.set(row.planId, []);
    planToDirect.get(row.planId)!.push({ bundleId: row.bundleId, sortIndex: row.sortIndex ?? 0 });
  }

  const planToBundles: Map<string, { bundleId: string; sortIndex: number }[]> = new Map();
  for (const pb of scenario.planBundles ?? []) {
    if (!planToBundles.has(pb.planId)) planToBundles.set(pb.planId, []);
    planToBundles.get(pb.planId)!.push({ bundleId: pb.bundleId, sortIndex: pb.sortIndex ?? 0 });
  }
  const out: Record<string, Bundle[]> = {};

  for (const pid of ids) {
    out[pid] = (planToDirect.get(pid) ?? [])
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((x) => bundleById.get(x.bundleId))
      .filter(Boolean) as Bundle[];
  }
  req.log.info(
    { requestCount: ids.length, first: ids[0], foundForFirst: out[ids[0]]?.length ?? 0 },
    'planBundles lookup',
  );
  return reply.send(out);
});

app.post('/jobs/master/create', async () => {
  // There is no spoon
  return true;
});

app.post('/jobs/master/cancel', async () => {
  const jobId = randomUUID();
  const job = {
    status: 'queued' as 'queued' | 'in_progress' | 'done' | 'failed',
    progress: 0,
    subscribers: new Set<NodeJS.WritableStream>(),
    timer: undefined as NodeJS.Timeout | undefined,
  };
  jobs.set(jobId, job);

  job.status = 'in_progress';
  (job as Job).startedAt = Date.now();
  job['timer'] = setInterval(() => {
    if (job.progress >= 100) {
      clearInterval(job['timer']!);
      job.status = 'done';
      (job as Job).finishedAt = Date.now();
      broadcast(jobId, { type: 'done', progress: 100 });
      return;
    }
    const step = Math.floor(10 + Math.random() * 20);
    job.progress = Math.min(100, job.progress + step);
    broadcast(jobId, { type: 'progress', progress: job.progress });
  }, 700);

  return { jobId };
});

app.get('/jobs/:jobId', async (req, reply) => {
  const j = jobs.get((req.params as ReqParams).jobId ?? '');
  if (!j) return reply.code(404).send({ error: 'Not found' });
  const { status, progress } = j;
  return {
    jobId: (req.params as ReqParams).jobId,
    status,
    progress,
    startedAt: (j as Job).startedAt,
    finishedAt: (j as Job).finishedAt,
  };
});

app.get('/jobs/:jobId/stream', async (req, reply) => {
  const jobId = (req.params as ReqParams).jobId as string;
  const j = jobs.get(jobId);
  if (!j) return reply.code(404).send({ error: 'Not found' });

  reply
    .header('Content-Type', 'text/event-stream')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
    .raw.write(`retry: 1000\n\n`);

  const client = reply.raw;
  j.subscribers.add(client);

  client.write(
    `event: progress\ndata: ${JSON.stringify({ progress: j.progress, status: j.status })}\n\n`,
  );

  req.raw.on('close', () => {
    j.subscribers.delete(client);
  });
  return reply;
});

const broadcast = (jobId: string, data: Dict) => {
  const j = jobs.get(jobId);
  if (!j) return;
  for (const ws of j.subscribers) {
    ws.write(`event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`);
  }
};

app.listen({ port: 5175 }).then(() => console.log('Mock API on :5175'));
