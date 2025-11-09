import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDataService } from '../../../ui/api/dataService';
import { notify } from '../../../ui/notify';

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
  const LP = 'lock-plans';
  const MJ = 'create-master-job';

  return useMutation({
    mutationKey: ['lock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const planIds = (vars?.planIds ?? []).filter(Boolean);
      let masterJobId = { id: '', name: '' };
      if (planIds.length === 0) throw new Error('No valid planIds provided.');

      if (!vars.skipLock) {
        try {
          await api.lockPlans(planIds, 'mr.bulldops');
          notify.success(LP, 'Success', 'Plan(s) successfully locked.');
        } catch (err) {
          notify.error(LP, 'Error', 'Failed to lock selected plans.');
        }
      }
      try {
        masterJobId = await api.createMasterJob(['1', '2'], 'mr.bulldops');
        notify.success(MJ, 'Success', 'Created Master Job.');
      } catch (err) {
        notify.error(MJ, 'Error', 'Failed to create master job.');
      }
      return masterJobId;
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
  const UP = 'unlock-plans';
  const XMJ = 'cancel-master-job';

  return useMutation({
    mutationKey: ['unlock-and-create-master-job'],
    mutationFn: async (vars: MutationVars) => {
      const { planIds, lockOwner, metadata, skipUnlock } = vars;
      console.log('Unlock and cancel master job called with vars:', vars);
      if (![...planIds, '1']?.length) {
        throw new Error('No planIds provided.');
      }

      if (!skipUnlock) {
        try {
          await api.unlockPlans(planIds, 'mr.bulldops');
          notify.success(UP, 'Success', 'Plan(s) successfully unlocked.');
        } catch (err) {
          notify.error(UP, 'Error', 'Failed to unlock selected plans.');
        }
      }
      try {
        const job = await api.cancelMasterJob('masterJobId');
        notify.success(XMJ, 'Success', 'Master Job cancelled.');
      } catch (err) {
        notify.error(XMJ, 'Error', 'Failed to cancel master job.');
      }
      return { id: '', name: '' };
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
