import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { Channel } from '../../types';

const channelsAdapter = createEntityAdapter<Channel>();
const channelSlice = createSlice({
  name: 'channels',
  initialState: channelsAdapter.getInitialState(),
  reducers: {
    upsertChannels: channelsAdapter.upsertMany,
    updateChannel: channelsAdapter.updateOne,
    removeChannel: channelsAdapter.removeOne,
  },
});
export const channelsSelectors = channelsAdapter.getSelectors((s: any) => s.bundles);
export const { upsertChannels } = channelSlice.actions;
export default channelSlice.reducer;
