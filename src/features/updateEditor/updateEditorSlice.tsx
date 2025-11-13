import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Channel as AppChannel, Bundle, Plan } from '../../schema'; // <-- FIX
import type { EditorState, UpdateArgs, UpdateJob } from './types';
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

// small helper
function spaceForJob(state: EditorState, jobId: string) {
  return (state.drafts.byJobId[jobId] ??= { plan: {}, bundle: {}, channel: {} });
}

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
        bundleId: string;
        field: BundleKey;
        value: Bundle[BundleKey];
      }>,
    ) {
      const { jobId, bundleId, field, value } = action.payload;
      const space = spaceForJob(state, jobId);
      space.bundle[bundleId] = { ...(space.bundle[bundleId] ?? {}), [field]: value };
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

    // Optional convenience clears
    clearPlanDraft(state, action: PayloadAction<{ jobId: string; planId: string }>) {
      const { jobId, planId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.plan[planId];
    },
    clearBundleDraft(state, action: PayloadAction<{ jobId: string; bundleId: string }>) {
      const { jobId, bundleId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.bundle[bundleId];
    },
    clearChannelDraft(state, action: PayloadAction<{ jobId: string; channelId: string }>) {
      const { jobId, channelId } = action.payload;
      const space = spaceForJob(state, jobId);
      delete space.channel[channelId];
    },
    clearJobDrafts(state, action: PayloadAction<{ jobId: string }>) {
      state.drafts.byJobId[action.payload.jobId] = { plan: {}, bundle: {}, channel: {} };
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
  clearPlanDraft,
  clearBundleDraft,
  clearChannelDraft,
  clearJobDrafts,
} = updateEditorReducer.actions;

export default updateEditorReducer.reducer;
