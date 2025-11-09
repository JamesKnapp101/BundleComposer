import { useQuery } from '@tanstack/react-query';
import { fetchState } from '../api/scenarioClient';
import { buildPlanViewFromScenario } from '../data/builders';

export const usePlanBundles = (planId: string) => {
  return useQuery({
    queryKey: ['scenario-state'],
    queryFn: fetchState,
    select: (s) => buildPlanViewFromScenario(s, planId)?.bundles ?? [],
    enabled: !!planId,
  });
};
