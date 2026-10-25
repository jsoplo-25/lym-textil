export type MachineStatus = 'OPERATIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export type MachineType =
  | 'Costura'
  | 'Corte'
  | 'Tejido'
  | 'Estampado'
  | 'Bordado'
  | 'Planchado'
  | 'Acabado'
  | 'Tintorería'
  | 'Otro';

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  status: MachineStatus;
  designTypes?: string[] | string | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MachineStats {
  total: number;
  operative: number;
  maintenance: number;
  outOfService: number;
}

export interface CreateMachineDTO {
  code: string;
  name?: string;
  type?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status?: MachineStatus;
  designTypes?: string[] | string;
  location?: string;
  notes?: string;
}

export interface UpdateMachineDTO {
  code?: string;
  name?: string;
  type?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status?: MachineStatus;
  designTypes?: string[] | string;
  location?: string;
  notes?: string;
}

export interface GetMachinesResponse {
  machines: Machine[];
  stats: MachineStats;
}
