import { configureStore } from '@reduxjs/toolkit';
import updateEditorReducer from '../../updateEditor/updateEditorSlice';
import { storeApi } from './api';
import drafts from './draftSlice';

export const store = configureStore({
  reducer: { drafts, [storeApi.reducerPath]: storeApi.reducer, updateEditor: updateEditorReducer },
  middleware: (gDM) => gDM().concat(storeApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
