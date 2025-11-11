// src/features/updateEditor/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../features/bundleComposer/store/store';

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

// Is a given job dirty? (factory selector)
export const makeSelectIsJobDirty = (jobId: string) =>
  createSelector([selectUpdateEditor], (ue) => {
    const space = ue.drafts.byJobId[jobId];
    if (!space) return false;
    return (
      Object.keys(space.plan).length +
        Object.keys(space.bundle).length +
        Object.keys(space.channel).length >
      0
    );
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
