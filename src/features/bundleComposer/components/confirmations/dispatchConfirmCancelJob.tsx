import type { UseMutationResult } from '@tanstack/react-query';
import { useLoaderData } from 'react-router-dom';
import { useConfirm } from '../../../../ui/modal/useConfirm';
import type { MasterJob, MutationVars } from '../../hooks/useManageLockAndMasterJob';

type Args = {
  planIds: string[];
  unlockPlansAndCancelMasterJob: UseMutationResult<MasterJob, Error, MutationVars, unknown>;
  cancelBlockAndNavigate?: (() => void) | null;
};

export const useDispatchConfirmCancelJob = () => {
  const confirm = useConfirm();
  const { plans, sections } = useLoaderData() as { plans: string[]; sections: string[] };
  return async ({ planIds, unlockPlansAndCancelMasterJob, cancelBlockAndNavigate }: Args) => {
    const ok = await confirm({
      title: 'Warning',
      message:
        'You have unsaved changes and are about to leave the Bundle Composer. Leaving now will cancel the job and unlock the selected plans.',
      confirmText: 'Yes, leave',
      cancelText: 'Cancel',
      disableClose: true,
    });

    if (!ok) return;

    unlockPlansAndCancelMasterJob.mutate({
      planIds: plans ?? [],
      force: false,
      onComplete: cancelBlockAndNavigate ?? undefined,
    });
  };
};
