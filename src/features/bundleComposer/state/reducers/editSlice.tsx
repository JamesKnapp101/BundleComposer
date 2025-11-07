import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EditOp, ID } from '../EditState';

const editSlice = createSlice({
  name: 'edits',
  initialState: { byId: {} } as {
    byId: Record<
      ID,
      { entity: 'plan' | 'bundle' | 'channel'; op: EditOp; changes?: Record<string, unknown> }
    >;
  },
  reducers: {
    stageAdd: (
      s,
      a: PayloadAction<{
        id: ID;
        entity: 'plan' | 'bundle' | 'channel';
        initial?: Record<string, unknown>;
      }>,
    ) => {
      s.byId[a.payload.id] = {
        entity: a.payload.entity,
        op: 'add',
        changes: a.payload.initial ?? {},
      };
    },
    stageUpdate: (
      s,
      a: PayloadAction<{
        id: ID;
        entity: 'plan' | 'bundle' | 'channel';
        changes: Record<string, unknown>;
      }>,
    ) => {
      const prev = s.byId[a.payload.id];
      s.byId[a.payload.id] = {
        entity: a.payload.entity,
        op: prev?.op === 'add' ? 'add' : 'update',
        changes: { ...(prev?.changes ?? {}), ...a.payload.changes },
      };
    },
    stageRemove: (s, a: PayloadAction<{ id: ID; entity: 'plan' | 'bundle' | 'channel' }>) => {
      s.byId[a.payload.id] = { entity: a.payload.entity, op: 'remove' };
    },
    clearEdits: (s) => {
      s.byId = {};
    },
  },
});
export const { stageAdd, stageUpdate, stageRemove, clearEdits } = editSlice.actions;
export default editSlice.reducer;
