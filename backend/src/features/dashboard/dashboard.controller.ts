import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { prisma } from '../../config/prisma';

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
    roleBreakdown: Array<{
      code: string;
      name: string;
      count: number;
      isSystem: boolean;
    }>;
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

export class DashboardController {
  /**
   * Obtiene métricas y widgets del Dashboard personalizados según el rol del usuario
   */
  async getMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = (req.user?.role || 'OPERATOR').toUpperCase().trim();

      // 1. Estadísticas de lotes
      const batches = await prisma.productionBatch.findMany({
        select: {
          id: true,
          batchNumber: true,
          trackingCode: true,
          status: true,
          supplierName: true,
          machineName: true,
          machineCode: true,
          startDate: true,
          createdAt: true,
          updatedAt: true,
          rolls: {
            select: {
              id: true,
              weight: true,
              status: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
      });

      const totalBatches = batches.length;
      const activeBatchesList = batches.filter(
        (b) => b.status === 'REQUESTED' || b.status === 'IN_PROGRESS' || b.status === 'IN_PREPARATION'
      );
      const activeBatchesCount = activeBatchesList.length;
      const completedBatchesCount = batches.filter(
        (b) => b.status === 'COMPLETED' || b.status === 'DELIVERED'
      ).length;

      // 2. Conteo de rollos y pesos
      let totalRolls = 0;
      let totalWeightKg = 0;
      const rollsByStatus = {
        registered: 0,
        inPreparation: 0,
        readyForApproval: 0,
        readyForPickup: 0,
        delivered: 0,
      };

      for (const b of batches) {
        for (const r of b.rolls) {
          totalRolls++;
          if (r.weight) totalWeightKg += r.weight;

          const st = r.status || 'REGISTERED';
          if (st === 'REGISTERED') rollsByStatus.registered++;
          else if (st === 'IN_PREPARATION') rollsByStatus.inPreparation++;
          else if (st === 'READY_FOR_APPROVAL') rollsByStatus.readyForApproval++;
          else if (st === 'READY_FOR_PICKUP') rollsByStatus.readyForPickup++;
          else if (st === 'DELIVERED') rollsByStatus.delivered++;
        }
      }

      // 3. Estadísticas de máquinas
      const [totalMachines, opMachines, maintMachines, inactMachines] = await Promise.all([
        prisma.machine.count(),
        prisma.machine.count({ where: { status: 'OPERATIVE' } }),
        prisma.machine.count({ where: { status: 'MAINTENANCE' } }),
        prisma.machine.count({ where: { status: 'OUT_OF_SERVICE' } }),
      ]);

      // 4. Estadísticas de proveedores
      const totalSuppliers = await prisma.supplier.count();

      // 5. Rollos en espera de aprobación (READY_FOR_APPROVAL)
      const pendingApprovalRollsRaw = await prisma.productionRoll.findMany({
        where: { status: 'READY_FOR_APPROVAL' },
        include: {
          batch: {
            select: {
              batchNumber: true,
              supplierName: true,
              machineName: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      });

      const pendingApprovals = pendingApprovalRollsRaw.map((r) => ({
        rollId: r.id,
        rollNumber: r.rollNumber,
        weight: r.weight,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        batchId: r.batchId,
        batchNumber: r.batch?.batchNumber || 'N/A',
        supplierName: r.batch?.supplierName || 'General',
        machineName: r.batch?.machineName || null,
      }));

      // 6. Rollos listos para recojo (READY_FOR_PICKUP)
      const readyForPickupRollsRaw = await prisma.productionRoll.findMany({
        where: { status: 'READY_FOR_PICKUP' },
        include: {
          batch: {
            select: {
              batchNumber: true,
              supplierName: true,
              machineName: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 10,
      });

      const readyForPickupRolls = readyForPickupRollsRaw.map((r) => ({
        rollId: r.id,
        rollNumber: r.rollNumber,
        weight: r.weight,
        status: r.status,
        updatedAt: r.updatedAt.toISOString(),
        batchId: r.batchId,
        batchNumber: r.batch?.batchNumber || 'N/A',
        supplierName: r.batch?.supplierName || 'General',
        machineName: r.batch?.machineName || null,
      }));

      // 7. Lotes Activos (Top 6 con cálculo de avance)
      const formattedActiveBatches = activeBatchesList.slice(0, 6).map((b) => {
        const bRolls = b.rolls.length;
        const deliveredCount = b.rolls.filter((r) => r.status === 'DELIVERED').length;
        const progressPercent = bRolls > 0 ? Math.round((deliveredCount / bRolls) * 100) : 0;

        return {
          id: b.id,
          batchNumber: b.batchNumber,
          trackingCode: b.trackingCode || '',
          supplierName: b.supplierName,
          machineName: b.machineName,
          machineCode: b.machineCode,
          totalRolls: bRolls,
          deliveredRolls: deliveredCount,
          progressPercent,
          startDate: b.startDate ? b.startDate.toISOString() : null,
          status: b.status,
        };
      });

      // 8. Rollos recientes (Top 8 más recientes para la actividad en vivo)
      const recentRollsRaw = await prisma.productionRoll.findMany({
        include: {
          batch: {
            select: {
              batchNumber: true,
              supplierName: true,
              machineName: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 8,
      });

      const recentRolls = recentRollsRaw.map((r) => ({
        id: r.id,
        rollNumber: r.rollNumber,
        batchId: r.batchId,
        batchNumber: r.batch?.batchNumber || 'N/A',
        supplierName: r.batch?.supplierName || 'General',
        machineName: r.batch?.machineName || null,
        weight: r.weight,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      // 9. Métricas de Sistema y Usuarios (para Administrador o usuarios con permiso de usuarios)
      let systemData: DashboardMetrics['system'] | undefined;
      const isAdmin = userRole === 'ADMINISTRADOR';

      if (isAdmin) {
        const [users, roles] = await Promise.all([
          prisma.user.findMany({
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              createdAt: true,
            },
            orderBy: [{ createdAt: 'desc' }],
          }),
          prisma.roleDefinition.findMany(),
        ]);

        const roleBreakdown = roles
          .map((role) => ({
            code: role.code,
            name: role.name,
            count: users.filter((u) => u.role === role.code).length,
            isSystem: role.isSystem,
          }))
          .sort((a, b) => b.count - a.count);

        systemData = {
          totalUsers: users.length,
          totalRoles: roles.length,
          systemRoles: roles.filter((r) => r.isSystem).length,
          customRoles: roles.filter((r) => !r.isSystem).length,
          roleBreakdown,
          recentUsers: users.slice(0, 5).map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
          })),
        };
      }

      const response: ApiResponse<DashboardMetrics> = {
        success: true,
        data: {
          role: userRole,
          roleDisplayName: req.user?.roleName || userRole,
          stats: {
            totalBatches,
            activeBatches: activeBatchesCount,
            completedBatches: completedBatchesCount,
            totalRolls,
            totalWeightKg: parseFloat(totalWeightKg.toFixed(2)),
            rollsByStatus,
            machines: {
              total: totalMachines,
              operational: opMachines,
              maintenance: maintMachines,
              inactive: inactMachines,
            },
            totalSuppliers,
          },
          pendingApprovals,
          readyForPickupRolls,
          activeBatches: formattedActiveBatches,
          recentRolls,
          system: systemData,
        },
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener métricas del dashboard.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }
}
