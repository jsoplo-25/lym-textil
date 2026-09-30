import { Request } from 'express';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface AuthResult {
  user: UserPayload;
  token: string;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
