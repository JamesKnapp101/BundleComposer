import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchState } from '../api/scenarioClient';

export const useScenario = () => {
  return useQuery({
    queryKey: ['scenario-state'],
    queryFn: fetchState,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
};
