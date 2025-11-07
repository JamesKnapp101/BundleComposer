import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../features/bundleComposer/store/store';
import { createDataService } from '../api/dataService';

const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

export function useSelectedPlansQuery(ids: string[]) {
  const { data: plans = [] } = useQuery({
    queryKey: ['plansByIds', [...ids].sort()],
    queryFn: () => api.getPlansByIds(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  const planPatches = useSelector((s: RootState) => s.drafts.plan);

  const merged = plans.map((p) => ({ ...p, ...(planPatches[p.id] ?? {}) }));
  const isDirty = (id: string) => Boolean(planPatches[id]);

  return { plans: merged, isDirty };
}
