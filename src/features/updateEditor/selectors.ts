// src/features/updateEditor/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../features/bundleComposer/store/store';
import type { UpdateArgs } from './types';

// Base slice
export const selectUpdateEditor = (s: RootState) => s.updateEditor;

// Jobs
export const selectJobs = createSelector([selectUpdateEditor], (ue) => ue.jobs);

export const selectCurrentJobIndex = createSelector(
  [selectUpdateEditor],
  (ue) => ue.currentJobIndex,
);

export const selectCurrentJob = createSelector(
  [selectJobs, selectCurrentJobIndex],
  (jobs, idx) => jobs[idx] ?? null,
);

// Drafts space for a specific job (factory selector)
export const makeSelectDraftsForJob = (jobId: string) =>
  createSelector(
    [selectUpdateEditor],
    (ue) => ue.drafts.byJobId[jobId] ?? { plan: {}, bundle: {}, channel: {} },
  );

// tiny helper – any non-empty arrays in the map?
const hasNonEmptyMap = (map?: Record<string, string[]>): boolean =>
  !!map && Object.values(map).some((arr) => arr.length > 0);

// Is a given job dirty? (factory selector)
export const makeSelectIsJobDirty = (jobId: string) =>
  createSelector([selectUpdateEditor], (ue) => {
    const space = ue.drafts.byJobId[jobId];
    const job = ue.jobs.find((j) => j.id === jobId);

    // No drafts and no job? definitely not dirty
    if (!space && !job) return false;

    const hasDraftFields =
      !!space &&
      Object.keys(space.plan).length +
        Object.keys(space.bundle).length +
        Object.keys(space.channel).length >
        0;

    // Relationship diffs live on job.args
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

// Convenience: current job drafts / dirty, derived from current index
export const selectCurrentJobDrafts = createSelector(
  [selectUpdateEditor, selectCurrentJob],
  (ue, job) =>
    job
      ? (ue.drafts.byJobId[job.id] ?? { plan: {}, bundle: {}, channel: {} })
      : { plan: {}, bundle: {}, channel: {} },
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
