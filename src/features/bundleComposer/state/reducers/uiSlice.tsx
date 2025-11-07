import { createSlice } from '@reduxjs/toolkit';

type UIState = {
  selectedPlanIds: string[];
  dirty: Record<string, true>;
  markedForDeletion: { bundles: Record<string, true>; channels: Record<string, true> };
};

const initial: UIState = {
  selectedPlanIds: [],
  dirty: {},
  markedForDeletion: { bundles: {}, channels: {} },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initial,
  reducers: {
    selectionSet(state, { payload }: { payload: string[] }) {
      state.selectedPlanIds = payload;
    },
    markDirty(state, { payload: id }: { payload: string }) {
      state.dirty[id] = true;
    },
    clearDirty(state, { payload: id }: { payload: string }) {
      delete state.dirty[id];
    },
    toggleMarkedForDeletion(
      state,
      { payload }: { payload: { kind: 'bundle' | 'channel'; id: string } },
    ) {
      const bucket =
        payload.kind === 'bundle'
          ? state.markedForDeletion.bundles
          : state.markedForDeletion.channels;
      bucket[payload.id] ? delete bucket[payload.id] : (bucket[payload.id] = true);
    },
    uiReset() {
      return initial;
    },
  },
});

export const { selectionSet, markDirty, clearDirty, toggleMarkedForDeletion, uiReset } =
  uiSlice.actions;
export default uiSlice.reducer;
