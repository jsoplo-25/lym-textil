export interface RoleBreakdown {
  code: string;
  name: string;
  count: number;
  isSystem: boolean;
}

export interface DashboardMetrics {
  role: string;
  roleDisplayName: string;
  stats: {
    totalBatches: number;
    activeBatches: number;
    completedBatches: number;
    totalRolls: number;
    totalWeightKg: number;
    rollsByStatus: {
      registered: number;
      inPreparation: number;
      readyForApproval: number;
      readyForPickup: number;
      delivered: number;
    };
    machines: {
      total: number;
      operational: number;
      maintenance: number;
      inactive: number;
    };
    totalSuppliers: number;
  };
  pendingApprovals: Array<{
    rollId: string;
    rollNumber: string;
    weight: number | null;
    status: string;
    createdAt: string;
    batchId: string;
    batchNumber: string;
    supplierName: string;
    machineName: string | null;
  }>;
  readyForPickupRolls: Array<{
    rollId: string;
    rollNumber: string;
    weight: number | null;
    status: string;
    updatedAt: string;
    batchId: string;
    batchNumber: string;
    supplierName: string;
    machineName: string | null;
  }>;
  activeBatches: Array<{
    id: string;
    batchNumber: string;
    trackingCode: string;
    supplierName: string | null;
    machineName: string | null;
    machineCode: string | null;
    totalRolls: number;
    deliveredRolls: number;
    progressPercent: number;
    startDate: string | null;
    status: string;
  }>;
  recentRolls: Array<{
    id: string;
    rollNumber: string;
    batchId: string;
    batchNumber: string;
    supplierName: string | null;
    machineName: string | null;
    weight: number | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  system?: {
    totalUsers: number;
    totalRoles: number;
    systemRoles: number;
    customRoles: number;
    roleBreakdown: RoleBreakdown[];
    recentUsers: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  };
}
