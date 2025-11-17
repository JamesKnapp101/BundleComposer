import { useQuery } from '@tanstack/react-query';
import type { Bundle } from '../../schema';

const getBundlesByPlanIds = async (ids: string[]): Promise<Record<string, Bundle[]>> => {
  const qs = new URLSearchParams({ planIds: ids.join(',') });
  const res = await fetch(`/api/channels/planBundles?${qs.toString()}`);
  if (!res.ok) throw new Error('failed');
  return res.json();
};

export const useBundlesByPlanIds = (ids: string[]) => {
  const sortedIds = [...ids].sort();
  return useQuery({
    queryKey: ['bundlesByPlanIds', sortedIds],
    queryFn: () => getBundlesByPlanIds(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
};
