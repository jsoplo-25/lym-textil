import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { RoleDefinition, CreateRoleDTO, UpdateRoleDTO } from '../types/roles.types';

export const rolesService = {
  async getRoles(): Promise<RoleDefinition[]> {
    const res = await axiosInstance.get('/roles');
    return res.data.data;
  },

  async getRoleById(id: string): Promise<RoleDefinition> {
    const res = await axiosInstance.get(`/roles/${id}`);
    return res.data.data;
  },

  async createRole(data: CreateRoleDTO): Promise<RoleDefinition> {
    const res = await axiosInstance.post('/roles', data);
    return res.data.data;
  },

  async updateRole(id: string, data: UpdateRoleDTO): Promise<RoleDefinition> {
    const res = await axiosInstance.put(`/roles/${id}`, data);
    return res.data.data;
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/roles/${id}`);
    return res.data;
  },
};
