import updateEditorReducer from '@features/updateEditor/updateEditorSlice';
import { configureStore } from '@reduxjs/toolkit';
import { storeApi } from './api';

export const store = configureStore({
  reducer: {
    updateEditor: updateEditorReducer,
    [storeApi.reducerPath]: storeApi.reducer,
  },
  middleware: (gDM) => gDM().concat(storeApi.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
