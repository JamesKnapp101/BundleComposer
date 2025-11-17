export type DataServiceOptions = {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status?: number;
  info?: unknown;
  constructor(message: string, status?: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export const createDataService = (opts: DataServiceOptions) => {
  const {
    baseUrl,
    defaultHeaders = { 'Content-Type': 'application/json' },
    timeoutMs = 12_000,
  } = opts;

  async function request<T>(
    path: string,
    init: RequestInit & { query?: Record<string, string | number | boolean> } = {},
  ): Promise<T> {
    const { query, ...rest } = init;

    const url = new URL(path.replace(/^\//, ''), baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
    }

    const headers = new Headers({ ...defaultHeaders, ...(rest.headers || {}) });
    const ctl = new AbortController();
    const id = setTimeout(() => ctl.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...rest, headers, signal: ctl.signal });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const body = isJson ? await res.json().catch(() => undefined) : await res.text();

      if (!res.ok) {
        throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status, body);
      }
      return body as T;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError((err as Error)?.message ?? 'Unknown request error');
    } finally {
      clearTimeout(id);
    }
  }

  async function getUser(id: string) {
    return request<{
      id: string;
      name: string;
      email: string;
    }>(`/users/${id}`, {
      method: 'GET',
    });
  }

  async function getPlansByIds(ids: string[]) {
    return request<Request[]>('/plans/query', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async function lockPlans(ids: string[], user: string) {
    return request<{ id: string; name: string }>(`/plans/lock`, {
      method: 'POST',
      body: JSON.stringify({ ids, user }),
    });
  }

  async function unlockPlans(ids: string[], user: string) {
    return request<{ id: string; name: string }>(`/plans/unlock`, {
      method: 'POST',
      body: JSON.stringify({ ids, user }),
    });
  }

  async function createMasterJob(ids: string[], user: string) {
    return request<{ id: string; name: string }>(`/jobs/master/create`, {
      method: 'POST',
      body: JSON.stringify({ ids, user }),
    });
  }

  async function cancelMasterJob(masterJobId: string) {
    return request<{ id: string; name: string }>(`/jobs/master/cancel`, {
      method: 'POST',
      body: JSON.stringify({ masterJobId }),
    });
  }

  async function search(q: string, page = 1) {
    return request<{ results: unknown[]; total: number }>(`/search`, {
      method: 'GET',
      query: { q, page },
    });
  }

  return {
    request,
    getUser,
    getPlansByIds,
    search,
    lockPlans,
    unlockPlans,
    createMasterJob,
    cancelMasterJob,
  };
};
