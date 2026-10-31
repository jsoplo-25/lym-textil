import { axiosInstance } from '../../../shared/api/axiosInstance';
import type {
  ProductionBatch,
  ProductionStats,
  CreateBatchDTO,
  UpdateBatchDTO,
  CreateRollDTO,
  UpdateRollDTO,
  ProductionRoll,
  BatchYarn,
  CreateYarnDTO,
  UpdateYarnDTO,
  BatchTrackingData,
  PendingApprovalRoll,
} from '../types/production.types';

export const productionService = {
  // Consulta pública de seguimiento para proveedores
  async trackBatch(code: string): Promise<BatchTrackingData> {
    const res = await axiosInstance.get(`/production/track/${encodeURIComponent(code)}`);
    return res.data.data;
  },
  async getBatches(params?: {
    q?: string;
    machineId?: string;
    supplierId?: string;
    status?: string;
  }): Promise<{ batches: ProductionBatch[]; stats: ProductionStats }> {
    const res = await axiosInstance.get('/production', { params });
    return res.data.data;
  },

  async getBatchById(id: string): Promise<ProductionBatch> {
    const res = await axiosInstance.get(`/production/${id}`);
    return res.data.data;
  },

  async createBatch(data: CreateBatchDTO): Promise<ProductionBatch> {
    const res = await axiosInstance.post('/production', data);
    return res.data.data;
  },

  async updateBatch(id: string, data: UpdateBatchDTO): Promise<ProductionBatch> {
    const res = await axiosInstance.put(`/production/${id}`, data);
    return res.data.data;
  },

  async deleteBatch(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/production/${id}`);
    return res.data;
  },

  // Operaciones de Hilos (Yarns dentro de un lote)
  async addYarn(batchId: string, data: CreateYarnDTO): Promise<BatchYarn> {
    const res = await axiosInstance.post(`/production/${batchId}/yarns`, data);
    return res.data.data;
  },

  async updateYarn(yarnId: string, data: UpdateYarnDTO): Promise<BatchYarn> {
    const res = await axiosInstance.put(`/production/yarns/${yarnId}`, data);
    return res.data.data;
  },

  async deleteYarn(yarnId: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/production/yarns/${yarnId}`);
    return res.data;
  },

  // Operaciones de Rollos (Detalle de Lote)
  async addRoll(batchId: string, data: CreateRollDTO): Promise<ProductionRoll> {
    const res = await axiosInstance.post(`/production/${batchId}/rolls`, data);
    return res.data.data;
  },

  async updateRoll(rollId: string, data: UpdateRollDTO): Promise<ProductionRoll> {
    const res = await axiosInstance.put(`/production/rolls/${rollId}`, data);
    return res.data.data;
  },

  async deleteRoll(rollId: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(`/production/rolls/${rollId}`);
    return res.data;
  },

  async getOperators(): Promise<Array<{ id: string; name: string; role?: string }>> {
    const res = await axiosInstance.get('/production/operators/list');
    return res.data.data;
  },

  // Notificaciones y aprobación de rollos
  async getPendingApprovals(): Promise<PendingApprovalRoll[]> {
    const res = await axiosInstance.get('/production/pending-approvals');
    return res.data.data;
  },

  async approveRoll(rollId: string): Promise<{ success: boolean; message: string; data: ProductionRoll }> {
    const res = await axiosInstance.post(`/production/rolls/${rollId}/approve`);
    return res.data;
  },

  // WhatsApp Notificaciones por Hitos
  async triggerWhatsAppThresholdCheck(batchId: string): Promise<any> {
    const res = await axiosInstance.post(`/production/${batchId}/notify-whatsapp-threshold`);
    return res.data.data;
  },

  async getWhatsAppLogs(batchId: string): Promise<any[]> {
    const res = await axiosInstance.get(`/production/${batchId}/whatsapp-logs`);
    return res.data.data;
  },

  async testWhatsAppMessage(toPhone: string, message?: string, useTemplate?: boolean): Promise<any> {
    const res = await axiosInstance.post('/production/whatsapp/test', { toPhone, message, useTemplate });
    return res.data;
  },
};
