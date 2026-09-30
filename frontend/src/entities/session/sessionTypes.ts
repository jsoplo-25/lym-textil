export interface UserRole {
  id: string;
  name: 'ADMIN' | 'MANAGER' | 'USER';
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'SUPERVISOR' | 'OPERATOR' | 'QUALITY_INSPECTOR';
  avatarUrl?: string;
}

export interface SessionState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
