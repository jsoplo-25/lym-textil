import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { ManagedUser, CreateUserDTO, UpdateUserDTO } from '../types/users.types';

export const usersService = {
  async getUsers(params?: { q?: string; role?: string }): Promise<ManagedUser[]> {
    const res = await axiosInstance.get('/users', { params });
    return res.data.data;
  },

  async getUserById(id: string): Promise<ManagedUser> {
    const res = await axiosInstance.get(`/users/${id}`);
    return res.data.data;
  },

  async createUser(data: CreateUserDTO): Promise<ManagedUser> {
    const res = await axiosInstance.post('/users', data);
    return res.data.data;
  },

  async updateUser(id: string, data: UpdateUserDTO): Promise<ManagedUser> {
    const res = await axiosInstance.put(`/users/${id}`, data);
    return res.data.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  },
};
