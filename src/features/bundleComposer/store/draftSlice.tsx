import type { DraftPatch, DraftsState, EntityType } from '@features/updateEditor/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: DraftsState = {
  plan: {},
  bundle: {},
  channel: {},
  byJobId: {},
};

type UpsertPayload<T = any> = { type: EntityType; id: string; patch: DraftPatch<T> };
type ClearPayload = { type: EntityType; id: string };

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    upsertDraft<T>(
      state: { [x: string]: { [x: string]: any } },
      { payload }: PayloadAction<UpsertPayload<T>>,
    ) {
      const { type, id, patch } = payload;
      state[type][id] = { ...(state[type][id] ?? {}), ...patch };
    },
    replaceDraft<T>(
      state: { [x: string]: { [x: string]: Partial<T> } },
      { payload }: PayloadAction<UpsertPayload<T>>,
    ) {
      const { type, id, patch } = payload;
      state[type][id] = { ...patch };
    },
    clearDraft(state, { payload }: PayloadAction<ClearPayload>) {
      delete state[payload.type][payload.id];
    },
    clearAllOfType(state, { payload: type }: PayloadAction<EntityType>) {
      state[type] = {};
    },
    clearAll(state) {
      state.plan = {};
      state.bundle = {};
      state.channel = {};
    },
  },
});

export const { upsertDraft, replaceDraft, clearDraft, clearAllOfType, clearAll } =
  draftsSlice.actions;
export default draftsSlice.reducer;
