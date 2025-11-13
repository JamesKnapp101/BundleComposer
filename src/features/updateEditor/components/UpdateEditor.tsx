import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../features/bundleComposer/store/hooks';
import {
  makeSelectIsJobDirty,
  selectCurrentJob,
  selectCurrentJobIndex,
  selectJobs,
} from '../../../features/updateEditor/selectors';
import {
  UpdateType,
  type DraftsByJob,
  type EditorPhase,
  type UpdateArgs,
  type UpdateJob,
} from '../../../features/updateEditor/types';
import type { Channel as AppChannel, Bundle, Plan } from '../../../schema';
import { CardScroller } from '../../../ui/components/CardScroller';
import { PlanVirtualList } from '../../bundleComposer/virtualTable/PlanVirtualList';
import {
  addJob,
  clearBundleDraft,
  clearChannelDraft,
  clearJobDrafts,
  clearPlanDraft,
  patchBundleField,
  patchChannelField,
  patchPlanField,
  setCurrentJobIndex,
} from '../updateEditorSlice';
import { DiscardUpdateButton } from './DiscardUpdateButton';
import { JobBar } from './JobBar';
import { NewUpdateButton } from './NewUpdateButton';
import { PageNavigator } from './PageNavigator';
import { PagePicker } from './PagePicker';
import { SelectionRow } from './SelectionRow';

interface UpdateEditorProps {
  selectedPlans: Plan[] | { plans: Plan[] };
  initialJobs?: UpdateJob[];
  onChangeActiveJob?: (index: number) => void;
  onJobsChange?: (jobs: UpdateJob[]) => void;
  onBuildPayloads?: (jobs: UpdateJob[], drafts: DraftsByJob) => unknown;
  onSubmitWithValidation?: () => Promise<boolean>;
}

export const UpdateEditor = ({
  selectedPlans,
  initialJobs,
  onChangeActiveJob,
  onJobsChange,
  onBuildPayloads,
  onSubmitWithValidation,
}: UpdateEditorProps) => {
  const plansArray: Plan[] = Array.isArray(selectedPlans) ? selectedPlans : selectedPlans.plans;

  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectJobs);
  const currentJob = useAppSelector(selectCurrentJob);
  const currentIdx = useAppSelector(selectCurrentJobIndex);

  // Memoize a factory selector for the current job’s dirty flag
  const isCurrentJobDirty = useAppSelector(
    useMemo(() => {
      if (!currentJob) return () => false;
      return makeSelectIsJobDirty(currentJob.id);
    }, [currentJob]),
  );

  // Local pre-commit state during select/config
  const [phase, setPhase] = useState<EditorPhase>('select');
  const [job, setJob] = useState<UpdateJob | null>(null);

  // Default validator: allow if none provided
  const validate = useCallback(async () => {
    if (onSubmitWithValidation) return onSubmitWithValidation();
    return true;
  }, [onSubmitWithValidation]);

  useEffect(() => {
    if (!initialJobs?.length) return;
    // Push each job to the slice (id, type, args, planIds are assumed valid)
    for (const j of initialJobs) dispatch(addJob(j));
    // After hydration, we’re in edit phase if there’s at least one job
    if (initialJobs.length > 0) setPhase('edit');
  }, [dispatch, initialJobs]);

  useEffect(() => {
    onJobsChange?.(jobs);
  }, [jobs, onJobsChange]);

  useEffect(() => {
    onChangeActiveJob?.(currentIdx);
  }, [currentIdx, onChangeActiveJob]);

  const onTypePicked = (t: UpdateType) => {
    setJob({
      id: crypto.randomUUID(),
      type: t,
      args: { type: t } as UpdateArgs,
      planIds: plansArray.map((p) => p.id),
      status: 'draft',
      createdAt: Date.now(),
    });
    setPhase('configure');
  };

  const onArgsChange = (partial: Partial<UpdateArgs>) => {
    setJob((prev) => (prev ? { ...prev, args: { ...prev.args, ...partial } as UpdateArgs } : prev));
  };

  const onConfirmConfig = () => {
    if (!job) return;
    // Commit job into the slice; slice will set it as current
    dispatch(addJob(job));
    setPhase('edit');
  };

  const onChangeJob = async () => {
    const ok = await validate();
    if (!ok) return;
    // Return to selection to create another job
    setPhase('select');
    setJob(null);
  };

  const handleNavChange = async (nextIndex: number) => {
    const ok = await validate();
    if (!ok) return;
    dispatch(setCurrentJobIndex(nextIndex));
  };

  const handleDiscardCurrent = async () => {
    if (!currentJob) return;
    const ok = await validate();
    if (!ok) return;
    dispatch(clearJobDrafts({ jobId: currentJob.id }));
  };

  return (
    <div className="flex flex-col gap-3 mr-5 ml-5">
      {/* Selection/config panel */}
      {phase !== 'edit' && (
        <SelectionRow
          job={job}
          phase={phase}
          onTypePicked={onTypePicked}
          onArgsChange={onArgsChange}
          onConfirmConfig={onConfirmConfig}
        />
      )}

      {/* Active job bar + controls */}
      {phase === 'edit' && currentJob && (
        <JobBar job={currentJob} onChange={onChangeJob} isDirty={isCurrentJobDirty} />
      )}

      {/* Editor workspace */}
      {phase === 'edit' && currentJob && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <PageNavigator
              current={currentIdx}
              total={jobs.length}
              onChange={handleNavChange}
              onSubmitWithValidation={validate}
            />
            <PagePicker
              jobs={jobs}
              current={currentIdx}
              onChange={handleNavChange}
              onSubmitWithValidation={validate}
            />
          </div>
          <CardScroller height="77vh">
            {currentJob.type === UpdateType.PlanProperties ||
            currentJob.type === UpdateType.PlanChannels ? (
              <PlanVirtualList
                plans={plansArray}
                currentJob={currentJob}
                onChangePlan={(planId, patch) => {
                  for (const [field, value] of Object.entries(patch)) {
                    dispatch(
                      patchPlanField({
                        jobId: currentJob.id,
                        planId,
                        field: field as keyof Plan,
                        value,
                      }),
                    );
                  }
                }}
                // onChangeBundle={(bundleId, patch) => {
                //   for (const [field, value] of Object.entries(patch)) {
                //     dispatch(
                //       patchBundleField({
                //         jobId: currentJob.id,
                //         bundleId,
                //         field: field as keyof Bundle,
                //         value,
                //       }),
                //     );
                //   }
                // }}
                onChangeChannel={(channelId, patch) => {
                  for (const [field, value] of Object.entries(patch)) {
                    dispatch(
                      patchChannelField({
                        jobId: currentJob.id,
                        channelId,
                        field: field as keyof Omit<AppChannel, 'id'>,
                        value,
                      }),
                    );
                  }
                }}
                onDiscardPlan={(planId) => {
                  dispatch(clearPlanDraft({ jobId: currentJob.id, planId }));
                }}
                // onDiscardBundle={(bundleId) => {
                //   dispatch(clearBundleDraft({ jobId: currentJob.id, bundleId }));
                // }}
                onDiscardChannel={(channelId) => {
                  dispatch(clearChannelDraft({ jobId: currentJob.id, channelId }));
                }}
              />
            ) : (
              <PlanVirtualList
                plans={plansArray}
                currentJob={currentJob}
                // onChangePlan={(planId, patch) => {
                //   for (const [field, value] of Object.entries(patch)) {
                //     dispatch(
                //       patchPlanField({
                //         jobId: currentJob.id,
                //         planId,
                //         field: field as keyof Plan,
                //         value,
                //       }),
                //     );
                //   }
                // }}
                onChangeBundle={(bundleId, patch) => {
                  for (const [field, value] of Object.entries(patch)) {
                    dispatch(
                      patchBundleField({
                        jobId: currentJob.id,
                        bundleId,
                        field: field as keyof Bundle,
                        value,
                      }),
                    );
                  }
                }}
                onChangeChannel={(channelId, patch) => {
                  for (const [field, value] of Object.entries(patch)) {
                    dispatch(
                      patchChannelField({
                        jobId: currentJob.id,
                        channelId,
                        field: field as keyof Omit<AppChannel, 'id'>,
                        value,
                      }),
                    );
                  }
                }}
                // onDiscardPlan={(planId) => {
                //   dispatch(clearPlanDraft({ jobId: currentJob.id, planId }));
                // }}
                onDiscardBundle={(bundleId) => {
                  dispatch(clearBundleDraft({ jobId: currentJob.id, bundleId }));
                }}
                onDiscardChannel={(channelId) => {
                  dispatch(clearChannelDraft({ jobId: currentJob.id, channelId }));
                }}
              />
            )}
          </CardScroller>
          <div className="flex items-center justify-end gap-2">
            <DiscardUpdateButton disabled={!isCurrentJobDirty} onClick={handleDiscardCurrent} />
            <NewUpdateButton
              onClick={() => {
                setPhase('select');
                setJob(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
