import type { UserProfile } from '../../../entities/session/sessionTypes';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken?: string;
}

export interface LoginResponseData {
  user: UserProfile;
  token: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

