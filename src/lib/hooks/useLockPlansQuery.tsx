import type { RootState } from '@features/bundleComposer/store/store';
import { useQuery } from '@tanstack/react-query';
import { createDataService } from '@ui/api/dataService';
import { useSelector } from 'react-redux';

const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

type LockPlan = { id: string; name: string; [key: string]: unknown };

export const useLockPlansQuery = (ids: string[], user: string) => {
  const { data: plans = [] } = useQuery<LockPlan[]>({
    queryKey: ['lockplansByIds', [...ids].sort()],
    queryFn: async () => {
      const response = await api.lockPlans(ids, user);
      return Array.isArray(response) ? response : [response];
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: [],
  });

  const planPatches = useSelector((s: RootState) => s.updateEditor.drafts.plan);
  const merged = plans.map((p) => ({ ...p, ...(planPatches[p.id] ?? {}) }));
  const isDirty = (id: string) => Boolean(planPatches[id]);

  return { plans: merged, isDirty };
};
