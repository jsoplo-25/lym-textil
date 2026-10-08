export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  document: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  yarnTypes?: string | null;
  status: SupplierStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    productionBatches: number;
  };
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateSupplierDTO {
  document: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  yarnTypes?: string;
  status?: SupplierStatus;
  notes?: string;
}

export interface UpdateSupplierDTO {
  document?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  yarnTypes?: string;
  status?: SupplierStatus;
  notes?: string;
}
