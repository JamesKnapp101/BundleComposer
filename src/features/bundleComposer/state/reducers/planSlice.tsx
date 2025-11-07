import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Plan } from '../../types';
import type { ID } from '../EditState';

const plansAdapter = createEntityAdapter<Plan>();

const plansSlice = createSlice({
  name: 'plans',
  initialState: plansAdapter.getInitialState(),
  reducers: {
    upsertPlans: plansAdapter.upsertMany,
    updatePlan: plansAdapter.updateOne,
    addBundleIdToPlan(state, action: PayloadAction<{ planId: ID; bundleId: ID }>) {
      const plan = state.entities[action.payload.planId];
      if (plan && !plan.linkedBundles.includes(action.payload.bundleId)) {
        plan.linkedBundles.push(action.payload.bundleId);
      }
    },
    removeBundleIdFromPlan(state, action: PayloadAction<{ planId: ID; bundleId: ID }>) {
      const plan = state.entities[action.payload.planId];
      if (plan)
        plan.linkedBundles = plan.linkedBundles.filter((id) => id !== action.payload.bundleId);
    },
  },
});

export const plansSelectors = plansAdapter.getSelectors((s: any) => s.plans);
export const { upsertPlans } = plansSlice.actions;
export default plansSlice.reducer;
