import type { UserProfile } from '../../../entities/session/sessionTypes';

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserProfile['role'];
  avatarUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserProfile['role'];
  avatarUrl?: string;
}

export interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserProfile['role'];
  avatarUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
