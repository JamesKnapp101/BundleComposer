import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Channel as AppChannel, Bundle, Plan } from '../../schema'; // <-- FIX
import type { EditorState, RelationshipDiffs, UpdateArgs, UpdateJob } from './types';
export const EDITOR_SLICE_KEY = 'editor' as const;

type PlanKey = keyof Plan;
type BundleKey = keyof Bundle;
type ChannelEditable = Omit<AppChannel, 'id'>; // don't patch id
type ChannelKey = keyof ChannelEditable;

const initialState: EditorState = {
  jobs: [],
  currentJobIndex: 0,
  drafts: { byJobId: {} },
};

const spaceForJob = (state: EditorState, jobId: string) => {
  return (state.drafts.byJobId[jobId] ??= { plan: {}, bundle: {}, channel: {} });
};

const updateEditorReducer = createSlice({
  name: EDITOR_SLICE_KEY,
  initialState,
  reducers: {
    addJob(state, action: PayloadAction<UpdateJob>) {
      const id = action.payload.id;
      state.jobs.push(action.payload);
      state.drafts.byJobId[id] ??= { plan: {}, bundle: {}, channel: {} };
      state.currentJobIndex = state.jobs.length - 1;
    },
    removeJob(state, action: PayloadAction<{ jobId: string }>) {
      const idx = state.jobs.findIndex((j) => j.id === action.payload.jobId);
      if (idx >= 0) {
        state.jobs.splice(idx, 1);
        delete state.drafts.byJobId[action.payload.jobId];
        state.currentJobIndex = Math.max(0, Math.min(state.currentJobIndex, state.jobs.length - 1));
      }
    },
    setCurrentJobIndex(state, action: PayloadAction<number>) {
      state.currentJobIndex = action.payload;
    },
    setJobArgs(state, action: PayloadAction<{ jobId: string; args: UpdateArgs }>) {
      const j = state.jobs.find((j) => j.id === action.payload.jobId);
      if (j) j.args = action.payload.args;
    },

    // --- Plan patches (unchanged shape) ---
    patchPlanField(
      state,
      action: PayloadAction<{
        jobId: string;
        planId: string;
        field: PlanKey;
        value: Plan[PlanKey];
      }>,
    ) {
      const { jobId, planId, field, value } = action.payload;
      const space = spaceForJob(state, jobId);
      space.plan[planId] = { ...(space.plan[planId] ?? {}), [field]: value };
    },

    patchBundleField(
      state,
      action: PayloadAction<{
        jobId: string;
        linkKey: string;
        field: BundleKey;
        value: Bundle[BundleKey];
      }>,
    ) {
      const { jobId, linkKey, field, value } = action.payload;
      const space = spaceForJob(state, jobId);
      space.bundle[linkKey] = { ...(space.bundle[linkKey] ?? {}), [field]: value };
    },

    // --- Channel patches (correct type & key) ---
    patchChannelField(
      state,
      action: PayloadAction<{
        jobId: string;
        channelId: string;
        field: ChannelKey;
        value: ChannelEditable[ChannelKey];
      }>,
    ) {
      const { jobId, channelId, field, value } = action.payload;
      const space = spaceForJob(state, jobId);
      space.channel[channelId] = { ...(space.channel[channelId] ?? {}), [field]: value };
    },

    // --- Relationship diffs: plan <-> bundle ---
    addBundleToPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; bundleId: string }>,
    ) {
      const { jobId, planId, bundleId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.bundlesToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.bundlesToRemoveByPlanId as Record<string, string[]>) ?? {};

      const added = (addMap[planId] ??= []);
      if (!added.includes(bundleId)) added.push(bundleId);

      const removed = removeMap[planId];
      if (removed) {
        removeMap[planId] = removed.filter((id) => id !== bundleId);
        if (!removeMap[planId].length) delete removeMap[planId];
      }

      args.bundlesToAddByPlanId = addMap;
      args.bundlesToRemoveByPlanId = removeMap;
    },

    removeBundleFromPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; bundleId: string }>,
    ) {
      const { jobId, planId, bundleId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.bundlesToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.bundlesToRemoveByPlanId as Record<string, string[]>) ?? {};

      const added = addMap[planId];
      if (added) {
        addMap[planId] = added.filter((id) => id !== bundleId);
        if (!addMap[planId].length) delete addMap[planId];
      }

      const removed = (removeMap[planId] ??= []);
      if (!removed.includes(bundleId)) removed.push(bundleId);

      args.bundlesToAddByPlanId = addMap;
      args.bundlesToRemoveByPlanId = removeMap;
    },

    // --- Relationship diffs: plan <-> channel ---
    addChannelToPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; channelId: string }>,
    ) {
      const { jobId, planId, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.channelsToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByPlanId as Record<string, string[]>) ?? {};

      const added = (addMap[planId] ??= []);
      if (!added.includes(channelId)) added.push(channelId);

      const removed = removeMap[planId];
      if (removed) {
        removeMap[planId] = removed.filter((id) => id !== channelId);
        if (!removeMap[planId].length) delete removeMap[planId];
      }

      args.channelsToAddByPlanId = addMap;
      args.channelsToRemoveByPlanId = removeMap;
    },

    removeChannelFromPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; channelId: string }>,
    ) {
      const { jobId, planId, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.channelsToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByPlanId as Record<string, string[]>) ?? {};

      const added = addMap[planId];
      if (added) {
        addMap[planId] = added.filter((id) => id !== channelId);
        if (!addMap[planId].length) delete addMap[planId];
      }

      const removed = (removeMap[planId] ??= []);
      if (!removed.includes(channelId)) removed.push(channelId);

      args.channelsToAddByPlanId = addMap;
      args.channelsToRemoveByPlanId = removeMap;
    },

    // --- Relationship diffs: bundle-link <-> channel ---
    addChannelToBundle(
      state,
      action: PayloadAction<{ jobId: string; bundleLinkKey: string; channelId: string }>,
    ) {
      const { jobId, bundleLinkKey, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.channelsToAddByBundleKey as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByBundleKey as Record<string, string[]>) ?? {};

      const added = (addMap[bundleLinkKey] ??= []);
      if (!added.includes(channelId)) added.push(channelId);

      const removed = removeMap[bundleLinkKey];
      if (removed) {
        removeMap[bundleLinkKey] = removed.filter((id) => id !== channelId);
        if (!removeMap[bundleLinkKey].length) delete removeMap[bundleLinkKey];
      }

      args.channelsToAddByBundleKey = addMap;
      args.channelsToRemoveByBundleKey = removeMap;
    },

    removeChannelFromBundle(
      state,
      action: PayloadAction<{ jobId: string; bundleLinkKey: string; channelId: string }>,
    ) {
      const { jobId, bundleLinkKey, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = (job.args ??= {} as any);

      const addMap: Record<string, string[]> =
        (args.channelsToAddByBundleKey as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByBundleKey as Record<string, string[]>) ?? {};

      const added = addMap[bundleLinkKey];
      if (added) {
        addMap[bundleLinkKey] = added.filter((id) => id !== channelId);
        if (!addMap[bundleLinkKey].length) delete addMap[bundleLinkKey];
      }

      const removed = (removeMap[bundleLinkKey] ??= []);
      if (!removed.includes(channelId)) removed.push(channelId);

      args.channelsToAddByBundleKey = addMap;
      args.channelsToRemoveByBundleKey = removeMap;
    },

    // Optional convenience clears
    clearPlanDraft(state, action: PayloadAction<{ jobId: string; planId: string }>) {
      const { jobId, planId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.plan[planId];

      // also reset relationship diffs for this plan
      // 1) Clear all field-level drafts for this job
      state.drafts.byJobId[jobId] = { plan: {}, bundle: {}, channel: {} };

      // 2) Clear relationship diffs for this job (add/remove maps)
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = job.args as UpdateArgs & RelationshipDiffs;

      delete args.bundlesToAddByPlanId;
      delete args.bundlesToRemoveByPlanId;

      delete args.channelsToAddByPlanId;
      delete args.channelsToRemoveByPlanId;

      delete args.channelsToAddByBundleKey;
      delete args.channelsToRemoveByBundleKey;
    },

    clearBundleDraft(state, action: PayloadAction<{ jobId: string; linkKey: string }>) {
      const { jobId, linkKey } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.bundle[linkKey];
    },
    clearChannelDraft(state, action: PayloadAction<{ jobId: string; channelId: string }>) {
      const { jobId, channelId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.channel[channelId];
    },
    clearJobDrafts(state, action: PayloadAction<{ jobId: string }>) {
      const { jobId } = action.payload;

      // 1) Clear all field-level drafts for this job
      state.drafts.byJobId[jobId] = { plan: {}, bundle: {}, channel: {} };

      // 2) Clear relationship diffs for this job (add/remove maps)
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;

      const args = job.args as UpdateArgs & RelationshipDiffs;

      delete args.bundlesToAddByPlanId;
      delete args.bundlesToRemoveByPlanId;

      delete args.channelsToAddByPlanId;
      delete args.channelsToRemoveByPlanId;

      delete args.channelsToAddByBundleKey;
      delete args.channelsToRemoveByBundleKey;
    },
  },
});

export const {
  addJob,
  removeJob,
  setCurrentJobIndex,
  setJobArgs,
  patchPlanField,
  patchBundleField,
  patchChannelField,
  addBundleToPlan,
  removeBundleFromPlan,
  addChannelToPlan,
  removeChannelFromPlan,
  addChannelToBundle,
  removeChannelFromBundle,
  clearPlanDraft,
  clearBundleDraft,
  clearChannelDraft,
  clearJobDrafts,
} = updateEditorReducer.actions;

export default updateEditorReducer.reducer;
