import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDataService } from '../../../ui/api/dataService';

const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

export const usePlans = (ids: string[]) => {
  return useQuery({
    queryKey: ['plans', { ids: ids.sort() }],
    queryFn: () => api.getPlansByIds(ids),
    enabled: ids.length > 0,
  });
};

export const useLockPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, user }: { id: string; user: string }) => api.lockPlans([...id], user),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['plans'] });
      const prev = qc.getQueriesData<any[]>({ queryKey: ['plans'] });
      prev.forEach(([key, data]) => {
        if (!data) return;
        const copy = data.map((p: any) =>
          p.id === vars.id
            ? { ...p, lockedBy: vars.user, lockedAt: Date.now(), version: p.version + 1 }
            : p,
        );
        qc.setQueryData(key, copy);
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

export const useUnlockPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, user }: { id: string[]; user: string }) => api.unlockPlans(id, user),
    onSettled: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
};
