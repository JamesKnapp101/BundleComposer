import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from 'src/schema';
import { useConfirm } from '../../../../ui/modal/useConfirm';

type MutationVars = {
  planIds: string[];
  user: User | null;
  lockOwner?: string;
  force?: boolean;
  skipUnlock?: boolean;
  metadata?: Record<string, unknown>;
};

type UnlockAndCancelMutation = UseMutationResult<unknown, unknown, MutationVars, unknown>;

type Args = {
  planIds: string[];
  user: User | null;
  unlockPlansAndCancelMasterJob: UnlockAndCancelMutation;
  proceed: () => void;
  reset?: () => void;
  onError?: (err: unknown) => void;
};

export const useDispatchConfirmCancelJob = () => {
  const confirm = useConfirm();

  return async ({
    planIds,
    user,
    unlockPlansAndCancelMasterJob,
    proceed,
    reset,
    onError,
  }: Args) => {
    const ok = await confirm({
      title: 'Warning',
      message:
        'You have unsaved changes and are about to leave the Bundle Composer. Leaving now will cancel the job and unlock the selected plans.',
      confirmText: 'Yes, leave',
      cancelText: 'Cancel',
      disableClose: true,
    });

    if (!ok) {
      reset?.(); // The user cancelled, so reset it for the next time they navigate
      return;
    }
    // Otherwise do the unlock and cancel
    try {
      await unlockPlansAndCancelMasterJob.mutateAsync({
        planIds,
        user,
        force: false,
      });
      proceed();
    } catch (err) {
      onError?.(err);
      reset?.();
    }
  };
};
