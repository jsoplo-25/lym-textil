import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { UserProfile } from '../../../entities/session/sessionTypes';

export interface UpdateProfileDTO {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const res = await axiosInstance.get('/auth/me');
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
    const res = await axiosInstance.put('/auth/profile', data);
    return res.data.data;
  },

  async changePassword(data: ChangePasswordDTO): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.put('/auth/change-password', data);
    return res.data;
  },
};
