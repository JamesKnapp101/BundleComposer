import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EditorState, Plan, UpdateArgs, UpdateJob } from 'src/schema';

const initialState: EditorState = {
  jobs: [],
  currentJobIndex: 0,
  drafts: { byJobId: {} },
};

const updateEditorReducer = createSlice({
  name: 'editorReducer',
  initialState,
  reducers: {
    addJob(state, action: PayloadAction<UpdateJob>) {
      state.jobs.push(action.payload);
      const id = action.payload.id;
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
      action: PayloadAction<{ jobId: string; planId: string; field: keyof Plan; value: any }>,
    ) {
      const { jobId, planId, field, value } = action.payload;
      const space = (state.drafts.byJobId[jobId] ??= { plan: {}, bundle: {}, channel: {} });
      space.plan[planId] = { ...(space.plan[planId] ?? {}), [field]: value };
    },
    clearJobDrafts(state, action: PayloadAction<{ jobId: string }>) {
      state.drafts.byJobId[action.payload.jobId] = { plan: {}, bundle: {}, channel: {} };
    },
  },
});
export const { addJob, removeJob, setCurrentJobIndex, setJobArgs, patchPlanField, clearJobDrafts } =
  updateEditorReducer.actions;

export default updateEditorReducer.reducer;
