import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, UserProfile } from './sessionTypes';
import {
  setLastActivity,
  clearStoredSession,
} from '../../shared/lib/utils';

const initialState: SessionState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        token?: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token || null;
      state.refreshToken = refreshToken || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      state.error = null;

      setLastActivity(Date.now());
    },
    setInitialized: (
      state,
      action: PayloadAction<{
        isAuthenticated: boolean;
        user?: UserProfile | null;
        token?: string | null;
      }>
    ) => {
      state.isInitialized = true;
      state.isLoading = false;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user || null;
      state.token = action.payload.token || null;
      if (action.payload.isAuthenticated) {
        setLastActivity(Date.now());
      }
    },
    updateTokens: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
      }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      setLastActivity(Date.now());
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      state.error = null;
      clearStoredSession();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  setInitialized,
  updateTokens,
  updateUserProfile,
  logout,
  setError,
  setLoading,
} = sessionSlice.actions;

export default sessionSlice.reducer;
