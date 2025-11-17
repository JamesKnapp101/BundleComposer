import { useQuery } from '@tanstack/react-query';
import type { Channel } from '../../schema';

const getChannelsByPlanIds = async (ids: string[]): Promise<Record<string, Channel[]>> => {
  const qs = new URLSearchParams({ planIds: ids.join(',') });
  const res = await fetch(`/api/channels/planChannels?${qs.toString()}`);
  if (!res.ok) throw new Error('failed');
  return res.json();
};

export const useChannelsByPlanIds = (ids: string[]) => {
  const sortedIds = [...ids].sort();
  return useQuery({
    queryKey: ['channelsByPlanIds', sortedIds],
    queryFn: () => getChannelsByPlanIds(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
};
