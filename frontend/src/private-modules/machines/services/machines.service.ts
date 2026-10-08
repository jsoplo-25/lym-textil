import { axiosInstance } from '../../../shared/api/axiosInstance';
import type {
  Machine,
  CreateMachineDTO,
  UpdateMachineDTO,
  GetMachinesResponse,
} from '../types/machines.types';

export const machinesService = {
  async getMachines(params?: {
    q?: string;
    status?: string;
    type?: string;
  }): Promise<GetMachinesResponse> {
    const res = await axiosInstance.get('/machines', { params });
    return res.data.data;
  },

  async getMachineById(id: string): Promise<Machine> {
    const res = await axiosInstance.get(`/machines/${id}`);
    return res.data.data;
  },

  async createMachine(data: CreateMachineDTO): Promise<Machine> {
    const res = await axiosInstance.post('/machines', data);
    return res.data.data;
  },

  async updateMachine(id: string, data: UpdateMachineDTO): Promise<Machine> {
    const res = await axiosInstance.put(`/machines/${id}`, data);
    return res.data.data;
  },

  async deleteMachine(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/machines/${id}`);
    return res.data;
  },
};
