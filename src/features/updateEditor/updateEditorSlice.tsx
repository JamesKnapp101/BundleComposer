import { createSlice, type PayloadAction, type WritableDraft } from '@reduxjs/toolkit';
import type { Bundle, Channel, Plan } from '../../schema';
import type {
  EditorState,
  PlanBundlesArgs,
  PlanChannelsArgs,
  RelationshipDiffs,
  UpdateArgs,
  UpdateJob,
} from './types';
export const EDITOR_SLICE_KEY = 'editor' as const;

type PlanKey = keyof Plan;
type BundleKey = keyof Bundle;
type ChannelKey = keyof Channel;

const initialState: EditorState = {
  jobs: [],
  currentJobIndex: 0,
  drafts: {
    byJobId: {},
    plan: {},
    bundle: {},
    channel: {},
  },
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
    patchPlanField(
      state,
      action: PayloadAction<{
        jobId: string;
        planId: string;
        field: PlanKey;
        value: Plan[PlanKey];
        original: Plan[PlanKey];
      }>,
    ) {
      const { jobId, planId, field, value, original } = action.payload;
      const space = spaceForJob(state, jobId);
      const bucket = space.plan;
      const patch = bucket[planId] ?? {};
      const isSame =
        value === original ||
        (typeof value === 'number' &&
          typeof original === 'number' &&
          Number.isNaN(value) &&
          Number.isNaN(original));
      if (isSame) {
        const rest = { ...patch };
        delete rest[field];
        if (Object.keys(rest).length === 0) {
          delete bucket[planId];
        } else {
          bucket[planId] = rest;
        }
      } else {
        bucket[planId] = { ...patch, [field]: value };
      }
    },
    patchBundleField(
      state,
      action: PayloadAction<{
        jobId: string;
        linkKey: string;
        field: BundleKey;
        value: Bundle[BundleKey];
        original: Bundle[BundleKey];
      }>,
    ) {
      const { jobId, linkKey, field, value, original } = action.payload;
      const space = spaceForJob(state, jobId);
      const bucket = space.bundle;
      const patch = bucket[linkKey] ?? {};
      const isSame =
        value === original ||
        (typeof value === 'number' &&
          typeof original === 'number' &&
          Number.isNaN(value) &&
          Number.isNaN(original));
      if (isSame) {
        const rest = { ...patch };
        delete rest[field];
        if (Object.keys(rest).length === 0) {
          delete bucket[linkKey];
        } else {
          bucket[linkKey] = rest;
        }
      } else {
        bucket[linkKey] = { ...patch, [field]: value };
      }
    },
    patchChannelField(
      state,
      action: PayloadAction<{
        jobId: string;
        linkKey: string;
        field: ChannelKey;
        value: Channel[ChannelKey];
        original: Channel[ChannelKey];
      }>,
    ) {
      const { jobId, linkKey, field, value, original } = action.payload;
      const space = spaceForJob(state, jobId);
      const bucket = space.channel;
      const patch = bucket[linkKey] ?? {};
      const isSame =
        value === original ||
        (typeof value === 'number' &&
          typeof original === 'number' &&
          Number.isNaN(value) &&
          Number.isNaN(original));
      if (isSame) {
        const rest = { ...patch };
        delete rest[field];
        if (Object.keys(rest).length === 0) {
          delete bucket[linkKey];
        } else {
          bucket[linkKey] = rest;
        }
      } else {
        bucket[linkKey] = { ...patch, [field]: value };
      }
    },
    addBundleToPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; bundleId: string }>,
    ) {
      const { jobId, planId, bundleId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;
      const args = (job.args ??= {} as UpdateArgs);
      const addMap: Record<string, string[]> =
        (args.bundlesToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.bundlesToRemoveByPlanId as Record<string, string[]>) ?? {};
      const removedForPlan = removeMap[planId] ?? [];
      const isCurrentlyRemoved = removedForPlan.includes(bundleId);
      if (isCurrentlyRemoved) {
        const nextRemoved = removedForPlan.filter((id) => id !== bundleId);
        if (nextRemoved.length) {
          removeMap[planId] = nextRemoved;
        } else {
          delete removeMap[planId];
        }
      } else {
        const addedForPlan = addMap[planId] ?? [];
        if (!addedForPlan.includes(bundleId)) {
          addMap[planId] = [...addedForPlan, bundleId];
        }
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
      const args = (job.args ??= {} as UpdateArgs);
      const addMap: Record<string, string[]> =
        (args.bundlesToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.bundlesToRemoveByPlanId as Record<string, string[]>) ?? {};
      const addedForPlan = addMap[planId] ?? [];
      const wasPendingAdd = addedForPlan.includes(bundleId);
      if (wasPendingAdd) {
        const nextAdded = addedForPlan.filter((id) => id !== bundleId);
        if (nextAdded.length) {
          addMap[planId] = nextAdded;
        } else {
          delete addMap[planId];
        }
      } else {
        const removedForPlan = (removeMap[planId] ??= []);
        if (!removedForPlan.includes(bundleId)) {
          removedForPlan.push(bundleId);
        }
      }
      args.bundlesToAddByPlanId = addMap;
      args.bundlesToRemoveByPlanId = removeMap;
    },
    addChannelToPlan(
      state,
      action: PayloadAction<{ jobId: string; planId: string; channelId: string }>,
    ) {
      const { jobId, planId, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;
      const args = (job.args ??= {} as WritableDraft<PlanChannelsArgs>);
      const addMap: Record<string, string[]> =
        (args.channelsToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByPlanId as Record<string, string[]>) ?? {};
      const removedForPlan = removeMap[planId] ?? [];
      const isCurrentlyRemoved = removedForPlan.includes(channelId);
      if (isCurrentlyRemoved) {
        const nextRemoved = removedForPlan.filter((id) => id !== channelId);
        if (nextRemoved.length) {
          removeMap[planId] = nextRemoved;
        } else {
          delete removeMap[planId];
        }
      } else {
        const addedForPlan = addMap[planId] ?? [];
        if (!addedForPlan.includes(channelId)) {
          addMap[planId] = [...addedForPlan, channelId];
        }
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
      const args = (job.args ??= {} as UpdateArgs);
      const addMap: Record<string, string[]> =
        (args.channelsToAddByPlanId as Record<string, string[]>) ?? {};
      const removeMap: Record<string, string[]> =
        (args.channelsToRemoveByPlanId as Record<string, string[]>) ?? {};
      const addedForPlan = addMap[planId] ?? [];
      const wasPendingAdd = addedForPlan.includes(channelId);
      if (wasPendingAdd) {
        const nextAdded = addedForPlan.filter((id) => id !== channelId);
        if (nextAdded.length) {
          addMap[planId] = nextAdded;
        } else {
          delete addMap[planId];
        }
      } else {
        const removedForPlan = (removeMap[planId] ??= []);
        if (!removedForPlan.includes(channelId)) {
          removedForPlan.push(channelId);
        }
      }
      args.channelsToAddByPlanId = addMap;
      args.channelsToRemoveByPlanId = removeMap;
    },
    addChannelToBundle(
      state,
      action: PayloadAction<{ jobId: string; bundleLinkKey: string; channelId: string }>,
    ) {
      const { jobId, bundleLinkKey, channelId } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return;
      const args = (job.args ??= {} as WritableDraft<PlanBundlesArgs>);
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
      const args = (job.args ??= {} as WritableDraft<PlanBundlesArgs>);
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
    clearPlanDraft(state, action: PayloadAction<{ jobId: string; planId: string }>) {
      const { jobId, planId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.plan[planId];
      state.drafts.byJobId[jobId] = { plan: {}, bundle: {}, channel: {} };
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
      state.drafts.byJobId[jobId] = { plan: {}, bundle: {}, channel: {} };
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
