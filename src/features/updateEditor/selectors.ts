import { createSelector } from '@reduxjs/toolkit';
import type { Plan } from 'src/schema';
import type { RootState } from '../../features/bundleComposer/store/store';
import type { UpdateArgs } from './types';

export const selectUpdateEditor = (s: RootState) => s.updateEditor;

export const selectJobs = createSelector([selectUpdateEditor], (ue) => ue.jobs);

export const selectCurrentJobIndex = createSelector(
  [selectUpdateEditor],
  (ue) => ue.currentJobIndex,
);

export const selectCurrentJob = createSelector(
  [selectJobs, selectCurrentJobIndex],
  (jobs, idx) => jobs[idx] ?? null,
);

export const makeSelectDraftsForJob = (jobId: string) =>
  createSelector(
    [selectUpdateEditor],
    (ue) => ue.drafts.byJobId[jobId] ?? { plan: {}, bundle: {}, channel: {} },
  );

const hasNonEmptyMap = (map?: Record<string, string[]>): boolean =>
  !!map && Object.values(map).some((arr) => arr.length > 0);

export const makeSelectIsJobDirty = (jobId: string) =>
  createSelector([selectUpdateEditor], (ue) => {
    const space = ue.drafts.byJobId[jobId];
    const job = ue.jobs.find((j) => j.id === jobId);
    if (!space && !job) return false;

    const hasDraftFields =
      !!space &&
      Object.keys(space.plan).length +
        Object.keys(space.bundle).length +
        Object.keys(space.channel).length >
        0;
    const args = job?.args as UpdateArgs & {
      bundlesToAddByPlanId?: Record<string, string[]>;
      bundlesToRemoveByPlanId?: Record<string, string[]>;
      channelsToAddByPlanId?: Record<string, string[]>;
      channelsToRemoveByPlanId?: Record<string, string[]>;
      channelsToAddByBundleKey?: Record<string, string[]>;
      channelsToRemoveByBundleKey?: Record<string, string[]>;
    };

    const hasRelationshipDiffs =
      !!args &&
      (hasNonEmptyMap(args.bundlesToAddByPlanId) ||
        hasNonEmptyMap(args.bundlesToRemoveByPlanId) ||
        hasNonEmptyMap(args.channelsToAddByPlanId) ||
        hasNonEmptyMap(args.channelsToRemoveByPlanId) ||
        hasNonEmptyMap(args.channelsToAddByBundleKey) ||
        hasNonEmptyMap(args.channelsToRemoveByBundleKey));

    return hasDraftFields || hasRelationshipDiffs;
  });

export const selectCurrentJobDrafts = createSelector(
  [selectUpdateEditor, selectCurrentJob],
  (ue, job) =>
    job
      ? (ue.drafts.byJobId[job.id] ?? { plan: {}, bundle: {}, channel: {} })
      : { plan: {}, bundle: {}, channel: {} },
);

export const selectAllDrafts = createSelector(
  [selectUpdateEditor, selectCurrentJob],
  (ue) => ue.drafts,
);

export const selectIsCurrentJobDirty = createSelector(
  [selectCurrentJobDrafts],
  (d) =>
    Object.keys(d.plan).length + Object.keys(d.bundle).length + Object.keys(d.channel).length > 0,
);
export const selectJobSpace = (state: RootState, jobId: string) =>
  state.updateEditor.drafts.byJobId[jobId] ?? { plan: {}, bundle: {}, channel: {} };

export const selectPlanDirty = (state: RootState, jobId: string, planId: string) =>
  Boolean(selectJobSpace(state, jobId).plan[planId]);

export const selectChannelDirty = (state: RootState, jobId: string, channelId: string) =>
  Boolean(selectJobSpace(state, jobId).channel[channelId]);

const selectDrafts = (state: RootState) => state.drafts;

export const selectPlanDraft = (state: RootState, planId: string) =>
  selectDrafts(state).plan[planId] ?? {};

export const selectIsPlanFieldDirty = <K extends keyof Plan>(
  state: RootState,
  planId: string,
  field: K,
): boolean => {
  const patch = selectAllDrafts(state).plan[planId];
  return !!patch && Object.prototype.hasOwnProperty.call(patch, field);
};
