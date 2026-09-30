import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../entities/session/sessionSlice';
import toastReducer from '../../entities/toast/toastSlice';
export const store = configureStore({
  reducer: {
    session: sessionReducer,
    toast: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
