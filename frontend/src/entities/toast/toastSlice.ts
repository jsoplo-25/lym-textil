import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AlertVariant } from '../../shared/ui/Alert';

export interface ToastItem {
  id: string;
  variant: AlertVariant;
  message: string;
}

interface ToastState {
  items: ToastItem[];
}

const initialState: ToastState = {
  items: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.items.push(action.payload);
      },
      prepare(payload: { variant: AlertVariant; message: string }) {
        return {
          payload: {
            id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            ...payload,
          },
        };
      },
    },
    removeToast(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
