import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDataService } from '../../../ui/api/dataService';

type LockPlansInput = { planIds: string[]; lockOwner?: string };
type CreateMasterJobInput = { planIds: string[]; metadata?: Record<string, unknown> };

export type MasterJob = {
  id: string;
  name: string;
};

export type MutationVars = {
  planIds: string[];
  lockOwner?: string;
  force?: boolean;
  metadata?: Record<string, unknown>;
  skipLock?: boolean;
  skipUnlock?: boolean;
  onComplete?: (() => void) | undefined;
};

type UseLockAndCreateMasterJobOpts = {
  invalidateKeys?: Array<readonly unknown[]>;
  onSuccess?: (job: MasterJob, vars: MutationVars) => void;
  onError?: (err: unknown, vars: MutationVars) => void;
};

type UseUnlockAndCancelMasterJobOpts = {
  invalidateKeys?: Array<readonly unknown[]>;
  onSuccess?: (job: MasterJob, vars: MutationVars) => void;
  onError?: (err: unknown, vars: MutationVars) => void;
};

const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

export function useLockAndCreateMasterJob(opts: UseLockAndCreateMasterJobOpts = {}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['lock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const planIds = (vars?.planIds ?? []).filter(Boolean);
      if (planIds.length === 0) throw new Error('No valid planIds provided.');

      if (!vars.skipLock) {
        await api.lockPlans(planIds, 'mr.bulldops');
      }
      return api.createMasterJob(planIds, 'mr.bulldops');
    },
    onSuccess: (job, vars) => {
      for (const key of opts.invalidateKeys ?? [['plans'], ['jobs']]) {
        qc.invalidateQueries({ queryKey: key }).catch(() => {});
      }
      opts.onSuccess?.(job, vars);
    },
    onError: opts.onError,
  });
}

export function useUnlockPlansAndCancelMasterJob(opts: UseUnlockAndCancelMasterJobOpts = {}) {
  const qc = useQueryClient();
  const { invalidateKeys = [['plans'], ['jobs']], onSuccess, onError } = opts;

  return useMutation({
    mutationKey: ['unlock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const { planIds, lockOwner, metadata, skipUnlock } = vars;
      console.log('Unlock and cancel master job called with vars:', vars);
      if (!planIds?.length) {
        throw new Error('No planIds provided.');
      }

      if (!skipUnlock) {
        await api.unlockPlans(planIds, lockOwner || 'mr.bulldops');
      }

      const job = await api.cancelMasterJob('masterJobId');
      return job;
    },
    onSuccess: (job, vars) => {
      for (const key of invalidateKeys) {
        qc.invalidateQueries({ queryKey: key }).catch(() => {});
      }
      onSuccess?.(job, vars);
    },
    onError: (err, vars) => {
      onError?.(err, vars);
    },
  });
}
