export type BatchStatus =
  | 'REQUESTED' // Solicitud registrada
  | 'COMPLETED' // Terminado
  | 'IN_PROGRESS'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'DISPATCHED'
  | 'PAUSED';

export type YarnStatus =
  | 'IN_PREPARATION' // En preparación
  | 'READY_FOR_PICKUP' // Listo para recojo
  | 'DELIVERED'; // Entregado

export interface BatchYarn {
  id: string;
  batchId: string;
  yarnName: string;
  color?: string | null;
  lotCode?: string | null;
  rollCount?: number | null;
  totalWeight?: number | null;
  status: YarnStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateYarnDTO {
  yarnName: string;
  color?: string;
  lotCode?: string;
  rollCount?: number;
  totalWeight?: number;
  status?: YarnStatus;
  notes?: string;
}

export interface UpdateYarnDTO {
  yarnName?: string;
  color?: string;
  lotCode?: string;
  rollCount?: number;
  totalWeight?: number;
  status?: YarnStatus;
  notes?: string;
}

export type RollStatus =
  | 'REGISTERED' // Registrado (por default al crear)
  | 'IN_PREPARATION' // En preparación
  | 'READY_FOR_APPROVAL' // Listo para aprobar (esperando visto bueno del Asistente o Administrador)
  | 'READY_FOR_PICKUP' // Listo para recojo
  | 'DELIVERED'; // Entregado

export interface PendingApprovalRoll {
  rollId: string;
  rollNumber: string;
  weight?: number | null;
  status: RollStatus;
  batchId: string;
  batchNumber: string;
  supplierName: string;
  machineName?: string | null;
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface ProductionRoll {
  id: string;
  batchId: string;
  yarnId?: string | null;
  yarnName?: string | null;
  rollNumber: string;
  startDate?: string | null;
  startTime?: string | null;
  startOperator?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  endOperator?: string | null;
  weight?: number | null;
  status?: RollStatus;
  observations?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  trackingCode?: string | null;
  machineId?: string | null;
  machineCode?: string | null;
  machineName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplier?: {
    id: string;
    document: string;
    name: string;
  } | null;
  startDate?: string | null;
  endDate?: string | null;
  status: BatchStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  totalRolls?: number;
  totalWeight?: number;
  avgWeight?: number;
  yarns?: BatchYarn[];
  rolls?: ProductionRoll[];
}

export interface BatchTrackingData {
  id: string;
  trackingCode: string;
  batchNumber: string;
  supplierName: string;
  status: BatchStatus;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  totalRolls: number;
  totalWeight: number;
  counts: {
    registered: number;
    inPreparation: number;
    readyForApproval?: number;
    readyForPickup: number;
    delivered: number;
  };
  progressPercent: number;
  hasRollsReadyForPickup: boolean;
  rolls: Array<{
    id: string;
    rollNumber: string;
    weight?: number | null;
    status: RollStatus;
    startDate?: string | null;
    startTime?: string | null;
    endDate?: string | null;
    endTime?: string | null;
    observations?: string | null;
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface ProductionStats {
  totalBatches: number;
  requestedBatches: number;
  completedBatches: number;
  activeBatches?: number;
  totalRollsProduced: number;
  totalWeightKg: number;
}

export interface CreateBatchDTO {
  batchNumber: string;
  machineId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  status?: BatchStatus;
  notes?: string;
}

export interface UpdateBatchDTO {
  batchNumber?: string;
  machineId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  status?: BatchStatus;
  notes?: string;
}

export interface CreateRollDTO {
  rollNumber: string;
  yarnId?: string;
  startDate?: string;
  startTime?: string;
  startOperator?: string;
  endDate?: string;
  endTime?: string;
  endOperator?: string;
  weight?: number | string;
  status?: RollStatus;
  observations?: string;
}

export interface UpdateRollDTO {
  rollNumber?: string;
  yarnId?: string;
  startDate?: string;
  startTime?: string;
  startOperator?: string;
  endDate?: string;
  endTime?: string;
  endOperator?: string;
  weight?: number | string;
  status?: RollStatus;
  observations?: string;
}
