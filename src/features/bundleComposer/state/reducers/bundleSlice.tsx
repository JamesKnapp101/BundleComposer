import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Bundle } from '../../types';
import type { ID } from '../EditState';

const bundlesAdapter = createEntityAdapter<Bundle>();

const bundleSlice = createSlice({
  name: 'bundles',
  initialState: bundlesAdapter.getInitialState(),
  reducers: {
    upsertBundles: bundlesAdapter.upsertMany,
    updateBundle: bundlesAdapter.updateOne,
    addChannelIdToBundle(state, action: PayloadAction<{ bundleId: ID; channelId: ID }>) {
      const b = state.entities[action.payload.bundleId];
      if (b && !b.linkedChannels.includes(action.payload.channelId)) {
        b.linkedChannels.push(action.payload.channelId);
      }
    },
    removeChannelIdFromBundle(state, action: PayloadAction<{ bundleId: ID; channelId: ID }>) {
      const b = state.entities[action.payload.bundleId];
      if (b) b.linkedChannels = b.linkedChannels.filter((id) => id !== action.payload.channelId);
    },
  },
});
export const bundlesSelectors = bundlesAdapter.getSelectors((s: any) => s.bundles);
export const { upsertBundles } = bundleSlice.actions;
export default bundleSlice.reducer;
