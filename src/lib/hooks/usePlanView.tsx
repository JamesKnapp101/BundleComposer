import { useQuery } from '@tanstack/react-query';
import { fetchState } from '../api/scenarioClient';
import { buildPlanViewFromScenario } from '../data/builders';

export const usePlanView = (planId: string) => {
  return useQuery({
    queryKey: ['scenario-state'],
    queryFn: fetchState,
    select: (scenario) => buildPlanViewFromScenario(scenario, planId),
    enabled: !!planId,
  });
};
