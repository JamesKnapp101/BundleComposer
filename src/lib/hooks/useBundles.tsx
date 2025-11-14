import { useQuery } from '@tanstack/react-query';
import { fetchState } from '../api/scenarioClient';

export const useBundles = () => {
  return useQuery({
    queryKey: ['scenario-state'],
    queryFn: fetchState,
    select: (s) => s?.bundles ?? [],
  });
};
