import { axiosInstance } from '../../../shared/api/axiosInstance';
import type {
  Supplier,
  SupplierStats,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from '../types/suppliers.types';

export const suppliersService = {
  async getSuppliers(params?: {
    q?: string;
    status?: string;
  }): Promise<{ suppliers: Supplier[]; stats: SupplierStats }> {
    const res = await axiosInstance.get('/suppliers', { params });
    return res.data.data;
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const res = await axiosInstance.get(`/suppliers/${id}`);
    return res.data.data;
  },

  async createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    const res = await axiosInstance.post('/suppliers', data);
    return res.data.data;
  },

  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    const res = await axiosInstance.put(`/suppliers/${id}`, data);
    return res.data.data;
  },

  async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/suppliers/${id}`);
    return res.data;
  },
};
