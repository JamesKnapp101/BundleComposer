import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from 'src/schema';
import { createDataService } from '../../../ui/api/dataService';
import { notify } from '../../../ui/notify';

export type MasterJob = {
  id: string;
  name: string;
};

export type MutationVars = {
  planIds: string[];
  user: User | null;
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

export const useLockAndCreateMasterJob = (opts: UseLockAndCreateMasterJobOpts = {}) => {
  const queryClient = useQueryClient();
  const LOCK_PLANS = 'lock-plans';
  const MASTER_JOB = 'create-master-job';

  return useMutation({
    mutationKey: ['lock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const planIds = (vars?.planIds ?? []).filter(Boolean);
      let masterJobId = { id: '', name: '' };
      if (planIds.length === 0) throw new Error('No valid planIds provided.');

      if (!vars.skipLock) {
        try {
          await api.lockPlans(planIds, 'testUser');
          notify.success(LOCK_PLANS, 'Success', 'Plan(s) successfully locked.');
        } catch (err) {
          notify.error(LOCK_PLANS, 'Error', (err as Error).message ?? 'Failed to lock plans');
        }
      }
      try {
        masterJobId = await api.createMasterJob(planIds, 'testUser');
        notify.success(MASTER_JOB, 'Success', 'Created Master Job.');
      } catch (err) {
        notify.error(MASTER_JOB, 'Error', (err as Error).message ?? 'Failed to Create Master Job');
      }
      return masterJobId;
    },
    onSuccess: (job, vars) => {
      for (const key of opts.invalidateKeys ?? [['plans'], ['jobs']]) {
        queryClient.invalidateQueries({ queryKey: key }).catch(() => {});
      }
      opts.onSuccess?.(job, vars);
    },
    onError: opts.onError,
  });
};

export const useUnlockPlansAndCancelMasterJob = (opts: UseUnlockAndCancelMasterJobOpts = {}) => {
  const queryClient = useQueryClient();
  const { invalidateKeys = [['plans'], ['jobs']], onSuccess, onError } = opts;
  const UNLOCK_PLANS = 'unlock-plans';
  const X_MASTER_JOB = 'cancel-master-job';

  return useMutation({
    mutationKey: ['unlock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const { planIds, user, skipUnlock } = vars;
      if (![...planIds, '1']?.length) {
        throw new Error('No planIds provided.');
      }

      if (!skipUnlock) {
        try {
          await api.unlockPlans(planIds, user?.name ?? '');
          notify.success(UNLOCK_PLANS, 'Success', 'Plan(s) successfully unlocked.');
        } catch (err) {
          notify.error(UNLOCK_PLANS, 'Error', (err as Error).message ?? 'Failed to unlock plan(s)');
        }
      }
      try {
        await api.cancelMasterJob('masterJobId');
        notify.success(X_MASTER_JOB, 'Success', 'Master Job cancelled.');
      } catch (err) {
        notify.error(
          X_MASTER_JOB,
          'Error',
          (err as Error).message ?? 'Failed to cancel master job',
        );
      }
      return { id: '', name: '' };
    },
    onSuccess: (job, vars) => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key }).catch(() => {});
      }
      onSuccess?.(job, vars);
    },
    onError: (err, vars) => {
      onError?.(err, vars);
    },
  });
};
