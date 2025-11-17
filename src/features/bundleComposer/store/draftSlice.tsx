import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Bundle, Channel, Plan } from 'src/schema';
import type {
  DraftPatch,
  DraftsState,
  EntityType,
  Job,
  UpsertPlanFieldPayload,
} from '../../../features/updateEditor/types';

const initialState: DraftsState = {
  plan: {},
  bundle: {},
  channel: {},
  byJobId: {},
};

type UpsertPayload<T = Job> = { type: EntityType; id: string; patch: DraftPatch<T> };
type ClearPayload = { type: EntityType; id: string };

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    upsertPlanField(state: DraftsState, { payload }: PayloadAction<UpsertPlanFieldPayload>) {
      const { jobId, id, field, value, original } = payload;

      // Ensure job space exists
      const space =
        state.byJobId[jobId] ??
        (state.byJobId[jobId] = {
          plan: {},
          bundle: {},
          channel: {},
        });

      const bucket = space.plan; // 👈 job-scoped plan drafts
      const patch = bucket[id] ?? {};

      const isSame =
        value === original ||
        (typeof value === 'number' &&
          typeof original === 'number' &&
          Number.isNaN(value) &&
          Number.isNaN(original));

      if (isSame) {
        const { [field]: _removed, ...rest } = patch;

        if (Object.keys(rest).length === 0) {
          delete bucket[id]; // no fields left → clear draft for this plan in this job
        } else {
          bucket[id] = rest;
        }
      } else {
        bucket[id] = { ...patch, [field]: value };
      }
    },
    upsertDraft(state: DraftsState, { payload }: PayloadAction<UpsertPayload>) {
      const { type, id, patch } = payload;
      const bucket = state[type] as Record<string, DraftPatch<Plan | Bundle | Channel>>;
      bucket[id] = { ...(bucket[id] ?? {}), ...patch };
    },
    replaceDraft(state: DraftsState, { payload }: PayloadAction<UpsertPayload>) {
      const { type, id, patch } = payload;

      const bucket = state[type] as Record<string, DraftPatch<Plan | Bundle | Channel>>;
      bucket[id] = { ...patch };
    },
    clearDraft(state: DraftsState, { payload }: PayloadAction<ClearPayload>) {
      const { type, id } = payload;
      const bucket = state[type] as Record<string, unknown>;
      delete bucket[id];
    },
    clearAllOfType(state: DraftsState, { payload: type }: PayloadAction<EntityType>) {
      state[type] = {};
    },
    clearAll(state: DraftsState) {
      state.plan = {};
      state.bundle = {};
      state.channel = {};
    },
  },
});

export const { upsertPlanField, upsertDraft, replaceDraft, clearDraft, clearAllOfType, clearAll } =
  draftsSlice.actions;
export default draftsSlice.reducer;
