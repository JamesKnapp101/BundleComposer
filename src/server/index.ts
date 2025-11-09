import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import { readFile } from 'fs/promises';
import path from 'node:path';
import type { Plan, PlanBundleLink } from 'src/schema';
import { z } from 'zod';
import type { Scenario } from '../lib/api/scenarioClient';
import { clearState, getState } from './mocks/db';
import { buildScenario } from './mocks/factories';

type PlanId = string;
type JobId = string;

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

function parseIntParam(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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

app.get('/api/mocks/generate', async (req, reply) => {
  const q: any = req.query ?? {};
  const seed = String(q.seed ?? 'demo');
  const counts = {
    plans: parseIntParam(q.plans, 3),
    bundles: parseIntParam(q.bundles, 6),
    channels: parseIntParam(q.channels, 24),
  };
  const scenario = buildScenario(seed, counts);
  return scenario;
});
const N = (s: string) => s;

export async function readJsonAt<T = unknown>(absPath: string): Promise<T> {
  const txt = await readFile(absPath, 'utf8');
  return JSON.parse(txt) as T;
}

app.post('/api/mocks/reset', async (req, reply) => {
  try {
    const { mode = 'base' } = (req.body ?? {}) as { mode?: 'base' | 'alt' };
    const fixturesDir = path.resolve(process.cwd(), 'src/server/mocks/fixtures');

    const files = {
      plans: path.join(fixturesDir, `plans.${mode}.json`),
      planBundles: path.join(fixturesDir, `planBundles.${mode}.json`),
      planChannels: path.join(fixturesDir, `planChannels.${mode}.json`),
      bundles: path.join(fixturesDir, `bundles.${mode}.json`),
      channels: path.join(fixturesDir, `channels.${mode}.json`),
      bundleChannels: path.join(fixturesDir, `bundleChannels.${mode}.json`),
    };

    const plans: Plan[] = await readJsonAt(files.plans);
    const planBundles: PlanBundleLink[] = await readJsonAt(files.planBundles);

    const plansById = Object.fromEntries(plans.map((p: any) => [N(p.id), p]));

    const orphans: string[] = [];
    for (const r of planBundles) {
      if (!plansById[N(r.planId)]) {
        orphans.push(r.planId);
      }
    }
    if (orphans.length) {
      throw new Error(
        `planBundles: missing plan ids: ${[...new Set(orphans)].slice(0, 10).join(', ')}${orphans.length > 10 ? ' …' : ''}`,
      );
    }

    return reply.send({ ok: true, mode });
  } catch (err) {
    return reply.status(400).send({ error: (err as Error).message });
  }
});

app.get('/api/mocks/state', async () => {
  const s = getState();
  if (!s)
    return {
      plans: [],
      bundles: [],
      channels: [],
      planBundles: [],
      bundleChannels: [],
      planChannels: [],
    };
  return s;
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

const JobStart = z.object({ planIds: z.array(z.string()).min(1) });
const LockRequest = z.object({ user: z.string().min(1) });
const PlansQuery = z.object({ ids: z.array(z.string()).min(1) });

app.get('/users/:userId', async (req, reply) => {
  return {
    user: { id: (req.params as any).userId, name: 'Mr. Bulldops', email: 'mr@bulldops.org' },
  };
});

app.post('/plans/query', async (req, reply) => {
  console.log('Received plans query:', (req as any).body);
  const { ids } = PlansQuery.parse((req as any).body ?? {});
  const results = ['']; //ids.map((id) => plans.get(id)).filter(Boolean);
  console.log('Plans query for IDs:', ids, 'Returning:', results);
  return results;
});

app.post('/plans/lock', async (req, reply) => {
  const { user } = LockRequest.parse((req as any).body || {});
  const ids = (req.params as any).ids as string;
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

app.post('/plans/unlock', async (req, reply) => {
  const { user } = LockRequest.parse((req as any).body || {});
  const id = (req.params as any).id as string;
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

app.post('/jobs/master/create', async (req, reply) => {
  console.log('Did I get here at least?');
  return true;
});

app.post('/jobs/master/cancel', async (req, reply) => {
  const jobId = randomUUID();
  const job = {
    status: 'queued' as 'queued' | 'in_progress' | 'done' | 'failed',
    progress: 0,
    subscribers: new Set<NodeJS.WritableStream>(),
    timer: undefined as NodeJS.Timeout | undefined,
  };
  jobs.set(jobId, job);

  job.status = 'in_progress';
  (job as any).startedAt = Date.now();
  job['timer'] = setInterval(() => {
    if (job.progress >= 100) {
      clearInterval(job['timer']!);
      job.status = 'done';
      (job as any).finishedAt = Date.now();
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
  const j = jobs.get((req.params as any).jobId);
  if (!j) return reply.code(404).send({ error: 'Not found' });
  const { status, progress } = j;
  return {
    jobId: (req.params as any).jobId,
    status,
    progress,
    startedAt: (j as any).startedAt,
    finishedAt: (j as any).finishedAt,
  };
});

app.get('/jobs/:jobId/stream', async (req, reply) => {
  const jobId = (req.params as any).jobId as string;
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

function broadcast(jobId: string, data: any) {
  const j = jobs.get(jobId);
  if (!j) return;
  for (const ws of j.subscribers) {
    ws.write(`event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

app.listen({ port: 5175 }).then(() => console.log('Mock API on :5175'));
