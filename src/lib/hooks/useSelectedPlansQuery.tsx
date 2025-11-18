import type { RootState } from '@features/bundleComposer/store/store';
import type { Plan } from '@schema';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { fetchState, QUERY_KEYS } from '../api/scenarioClient';

type PlansNormalized = { byId: Record<string, Plan>; allIds: string[] };

export const useSelectedPlansQuery = (ids: string[]) => {
  const sortedIds = useMemo(() => [...ids].sort(), [ids]);
  const idSet = useMemo(() => new Set(sortedIds), [sortedIds]);
  const { data = { byId: {}, allIds: [] } as PlansNormalized } = useQuery({
    queryKey: QUERY_KEYS.scenario,
    queryFn: fetchState,
    enabled: sortedIds.length > 0,
    staleTime: 0,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
    select: (scenario): PlansNormalized => {
      const byId: Record<string, Plan> = {};
      const allIds: string[] = [];
      for (const plan of scenario.plans) {
        if (idSet.has(plan.id)) {
          byId[plan.id] = plan;
          allIds.push(plan.id);
        }
      }
      allIds.sort((a, b) => sortedIds.indexOf(a) - sortedIds.indexOf(b));
      return { byId, allIds };
    },
  });
  const planPatches = useSelector((s: RootState) => s.updateEditor.drafts.plan);

  const plans = useMemo(
    () => data.allIds.map((id) => ({ ...data.byId[id], ...(planPatches[id] ?? {}) })),
    [data.byId, data.allIds, planPatches],
  );

  const isDirty = useCallback((id: string) => Boolean(planPatches[id]), [planPatches]);

  return { plans, byId: data.byId, allIds: data.allIds, isDirty };
};
