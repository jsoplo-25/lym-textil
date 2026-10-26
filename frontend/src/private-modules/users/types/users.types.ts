import type { UserProfile } from '../../../entities/session/sessionTypes';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type PeruDocumentType = 'DNI' | 'CE' | 'PASAPORTE' | 'RUC';

export interface ManagedUser {
  id: string;
  workerId?: string;
  documentType?: PeruDocumentType | string;
  documentNumber?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserProfile['role'];
  roleName?: string;
  avatarUrl?: string;
  status: UserStatus;
  phone?: string;
  jobTitle?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserProfile['role'];
  documentType?: PeruDocumentType | string;
  documentNumber?: string;
  workerId?: string;
  phone?: string;
  jobTitle?: string;
  status?: UserStatus;
  avatarUrl?: string;
}

export interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserProfile['role'];
  documentType?: PeruDocumentType | string;
  documentNumber?: string;
  workerId?: string;
  phone?: string;
  jobTitle?: string;
  status?: UserStatus;
  avatarUrl?: string;
}

