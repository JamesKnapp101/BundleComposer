import { useCallback, useEffect, useMemo, useState } from 'react';

// updateEditor slice + selectors
import {
  makeSelectIsJobDirty,
  selectCurrentJob,
  selectCurrentJobIndex,
  selectJobs,
} from '../../../features/updateEditor/selectors';
import {
  addJob,
  clearJobDrafts,
  patchPlanField,
  setCurrentJobIndex,
} from '../../../features/updateEditor/updateEditorSlice';

// shared types
import type {
  EditorPhase,
  UpdateArgs,
  UpdateJob,
  UpdateType,
} from '../../../features/updateEditor/types';

// child components (assumed to exist)
import type { Plan } from 'src/schema';
import { PlanVirtualList } from '../../../features/bundleComposer/components/PlanVirtualList';
import { useAppDispatch, useAppSelector } from '../../../features/bundleComposer/store/hooks';
import { CardScroller } from '../../../ui/components/CardScroller';
import { DiscardUpdateButton } from './DiscardUpdateButton';
import { JobBar } from './JobBar';
import { NewUpdateButton } from './NewUpdateButton';
import { PageNavigator } from './PageNavigator';
import { PagePicker } from './PagePicker';
import { SelectionRow } from './SelectionRow';

/* ---------- Props ---------- */

type DraftsByJob = {
  [jobId: string]: {
    plan: Record<string, Partial<Plan>>;
    bundle: Record<string, any>;
    channel: Record<string, any>;
  };
};

type UpdateEditorProps = {
  // Accept either a raw array or the hook’s { plans } shape
  selectedPlans: Plan[] | { plans: Plan[] };

  // URL/state sync hooks (optional)
  initialJobs?: UpdateJob[];
  onChangeActiveJob?: (index: number) => void;
  onJobsChange?: (jobs: UpdateJob[]) => void;
  onBuildPayloads?: (jobs: UpdateJob[], drafts: DraftsByJob) => unknown;

  // Validation hook before page/job transitions (optional)
  onSubmitWithValidation?: () => Promise<boolean>;
};

/* ---------- Component ---------- */

export function UpdateEditor({
  selectedPlans,
  initialJobs,
  onChangeActiveJob,
  onJobsChange,
  onBuildPayloads, // available for your Submit flow if needed
  onSubmitWithValidation,
}: UpdateEditorProps) {
  // Normalize selectedPlans prop
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

  /* ---------- Hydrate from initialJobs ---------- */
  useEffect(() => {
    if (!initialJobs?.length) return;
    // Push each job to the slice (id, type, args, planIds are assumed valid)
    for (const j of initialJobs) dispatch(addJob(j));
    // After hydration, we’re in edit phase if there’s at least one job
    if (initialJobs.length > 0) setPhase('edit');
  }, [dispatch, initialJobs]);

  /* ---------- Notify shell for URL syncing ---------- */
  useEffect(() => {
    onJobsChange?.(jobs);
  }, [jobs, onJobsChange]);

  useEffect(() => {
    onChangeActiveJob?.(currentIdx);
  }, [currentIdx, onChangeActiveJob]);

  /* ---------- Selection/config flow ---------- */

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

  /* ---------- Navigation between committed jobs ---------- */

  const handleNavChange = async (nextIndex: number) => {
    const ok = await validate();
    if (!ok) return;
    dispatch(setCurrentJobIndex(nextIndex));
  };

  /* ---------- Page actions ---------- */

  const handleDiscardCurrent = async () => {
    if (!currentJob) return;
    const ok = await validate();
    if (!ok) return;
    dispatch(clearJobDrafts({ jobId: currentJob.id }));
  };

  /* ---------- Render ---------- */

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
            <PlanVirtualList
              plans={plansArray}
              currentJob={currentJob}
              onChangePlan={(planId, patch) => {
                // explode the patch into per-field actions if needed
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
              onDiscardPlan={(planId) => {
                // dispatch(clearPlanDraft({ jobId: currentJob.id, planId }));
              }}
            />
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
}
