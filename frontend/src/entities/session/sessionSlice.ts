import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, UserProfile } from './sessionTypes';
import {
  getStoredToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredToken,
  setStoredRefreshToken,
  setStoredUser,
  setLastActivity,
  clearStoredSession,
  isSessionValidOnReload,
} from '../../shared/lib/utils';

// Verify session validity on initial load or browser refresh (F5)
const isValidSession = isSessionValidOnReload();
const initialToken = isValidSession ? getStoredToken() : null;
const initialRefreshToken = isValidSession ? getStoredRefreshToken() : null;
const initialUser = isValidSession ? getStoredUser() : null;

// Clean up stale session if expired
if (!isValidSession) {
  clearStoredSession();
}

const initialState: SessionState = {
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!(initialToken && initialUser),
  isLoading: false,
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
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.isAuthenticated = true;
      state.error = null;

      // Persist in localStorage
      setStoredToken(token);
      if (refreshToken) {
        setStoredRefreshToken(refreshToken);
      }
      setStoredUser(user);
      setLastActivity(Date.now());
    },
    updateTokens: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
      }>
    ) => {
      state.token = action.payload.token;
      setStoredToken(action.payload.token);

      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        setStoredRefreshToken(action.payload.refreshToken);
      }
      setLastActivity(Date.now());
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      clearStoredSession();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateTokens, logout, setError, setLoading } = sessionSlice.actions;
export default sessionSlice.reducer;
