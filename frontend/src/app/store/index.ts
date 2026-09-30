import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../entities/session/sessionSlice';
import taskReducer from '../../entities/task/taskSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    task: taskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
