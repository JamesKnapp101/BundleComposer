import { useQuery } from '@tanstack/react-query';
import { fetchState } from '../api/scenarioClient';
import { buildPlanViewFromScenario } from '../data/builders';

export const usePlanChannels = (planId: string) => {
  return useQuery({
    queryKey: ['scenario-state'],
    queryFn: fetchState,
    select: (scenario) => {
      const planView = buildPlanViewFromScenario(scenario, planId);
      return planView
        ? { direct: planView.directChannels, all: planView.allChannels }
        : { direct: [], all: [] };
    },
    enabled: !!planId,
  });
};
