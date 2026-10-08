import { Request } from 'express';

export type UserRole = string;

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  roleName?: string;
  permissions?: string[];
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  sessionId?: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
