import {
  type Bundle,
  type BundleChannelLink,
  type Channel,
  type Dict,
  type Plan,
  type PlanBundleLink,
  type PlanChannelLink,
} from '@schema';

export type Scenario = {
  plans: Plan[];
  bundles: Bundle[];
  channels: Channel[];
  planBundles: PlanBundleLink[];
  bundleChannels: BundleChannelLink[];
  planChannels: PlanChannelLink[];
};

export type GenerateParams = {
  seed?: string;
  plans?: number;
  bundles?: number;
  channels?: number;
};

export const QUERY_KEYS = {
  scenario: ['scenario-state'] as const,
};

// All of this is to manage the mock data

const API_BASE = '/api'; // The Vite proxy will route anything going here to http://localhost:5175

type JsonInit = Omit<RequestInit, 'body'> & { body?: unknown };

async function fetchJson<T>(
  url: string,
  init?: JsonInit,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: controller.signal,
      ...init,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : (undefined as unknown);

    if (!res.ok) {
      const msg =
        (json && typeof json === 'object' && 'error' in (json as object) && (json as Dict).error) ||
        res.statusText ||
        'Request failed';
      throw new Error(`${res.status} ${msg}`);
    }
    return json as T;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs} ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export const isOk = () => {
  return fetchJson<{ ok: true }>(`${API_BASE}/health`, { method: 'GET' });
};

export const fetchState = () => {
  return fetchJson<Scenario>(`${API_BASE}/mocks/state`, { method: 'GET' });
};

export const resetToBase = () => {
  return fetchJson<{ ok: true; mode: 'base' }>(`${API_BASE}/mocks/reset`, {
    method: 'POST',
    body: { mode: 'base' },
  });
};

export const resetToGenerated = async (
  seed: string,
  counts: { plans: number; bundles: number; channels: number },
) => {
  const res = await fetch(`${API_BASE}/mocks/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'generate', seed, ...counts }),
  });
  if (!res.ok) throw new Error('reset generate failed');
  return res.json();
};

export const previewGenerate = (params: GenerateParams = {}) => {
  const q = new URLSearchParams({
    seed: String(params.seed ?? 'demo'),
    plans: String(params.plans ?? 3),
    bundles: String(params.bundles ?? 6),
    channels: String(params.channels ?? 24),
  }).toString();
  return fetchJson<Scenario>(`${API_BASE}/mocks/generate?${q}`, { method: 'GET' });
};

export const clearState = () => {
  return fetchJson<{ ok: true }>(`${API_BASE}/mocks/clear`, { method: 'POST' });
};
