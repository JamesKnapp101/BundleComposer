import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import { z } from 'zod';

type PlanId = string;
type JobId = string;

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });

// In-memory mock data for now
const plans = new Map<PlanId, any>([
  [
    'p1',
    {
      planId: 'p1',
      name: 'Gold – Northeast',
      planTier: 'Gold',
      planStatus: 'Active',
      applyToCap: false,
      lockedBy: null,
      lockedAt: null,
      version: 1,
    },
  ],
  [
    'p2',
    {
      planId: 'p2',
      name: 'Silver – Midwest',
      planTier: 'Silver',
      planStatus: 'Active',
      applyToCap: true,
      lockedBy: null,
      lockedAt: null,
      version: 1,
    },
  ],
]);

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
  const results = ids.map((id) => plans.get(id)).filter(Boolean);
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
  const p = plans.get(id);
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
  const { planIds } = JobStart.parse((req as any).body || {});
  const jobId = randomUUID();
  const job = {
    status: 'queued' as 'queued' | 'in_progress' | 'done' | 'failed',
    progress: 0,
    planIds,
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
    const step = Math.floor(10 + Math.random() * 20); // variable steps
    job.progress = Math.min(100, job.progress + step);
    broadcast(jobId, { type: 'progress', progress: job.progress });
  }, 700);

  return { jobId };
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
