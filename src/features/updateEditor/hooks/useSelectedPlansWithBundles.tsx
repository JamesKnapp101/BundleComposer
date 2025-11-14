import { useQuery } from '@tanstack/react-query';
import { useSelectedPlansQuery } from '../../../lib/hooks';
import type { Channel } from '../../../schema';

const getBundlesByPlanIds = async (ids: string[]): Promise<Record<string, Channel[]>> => {
  const qs = new URLSearchParams({ planIds: ids.join(',') });
  const res = await fetch(`/api/channels/planBundles?${qs.toString()}`);
  if (!res.ok) throw new Error('failed');
  return res.json();
};

export const useSelectedPlansWithBundles = (ids: string[]) => {
  const { plans, isDirty } = useSelectedPlansQuery(ids);
  const { data: bundlesByPlanId = {}, isLoading } = useQuery({
    queryKey: ['bundlesByPlanIds', [...ids].sort()],
    queryFn: () => getBundlesByPlanIds(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  return { plans, bundlesByPlanId, isLoading, isDirty };
};
