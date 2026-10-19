import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { prisma, ProductionBatch, ProductionRoll, BatchYarn } from '../../config/prisma';

export async function generateUniqueTrackingCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    let random = '';
    for (let i = 0; i < 6; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `TRK-${random}`;
    const existing = await prisma.productionBatch.findUnique({
      where: { trackingCode: code },
    });
    if (!existing) {
      return code;
    }
  }
  return `TRK-${Date.now().toString(36).toUpperCase()}`;
}

export function parseBatchDate(dateVal: unknown): Date | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal;
  }
  return null;
}

export interface BatchSummary extends ProductionBatch {
  totalRolls: number;
  totalWeight: number;
  avgWeight: number;
  rolls?: ProductionRoll[];
  yarns?: BatchYarn[];
  supplier?: { id: string; document: string; name: string } | null;
}

export interface ProductionStats {
  totalBatches: number;
  requestedBatches: number;
  completedBatches: number;
  totalRollsProduced: number;
  totalWeightKg: number;
}

export class ProductionController {
  /**
   * Obtener lista de lotes de producción con filtros y estadísticas
   */
  async getBatches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const machineId = typeof req.query.machineId === 'string' ? req.query.machineId.trim() : '';
      const supplierId = typeof req.query.supplierId === 'string' ? req.query.supplierId.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

      const whereClause: Prisma.ProductionBatchWhereInput = {};

      if (status && status !== 'ALL') {
        whereClause.status = status;
      }

      if (machineId && machineId !== 'ALL') {
        whereClause.machineId = machineId;
      }

      if (supplierId && supplierId !== 'ALL') {
        whereClause.supplierId = supplierId;
      }

      if (q) {
        whereClause.OR = [
          { batchNumber: { contains: q, mode: 'insensitive' } },
          { trackingCode: { contains: q, mode: 'insensitive' } },
          { machineCode: { contains: q, mode: 'insensitive' } },
          { machineName: { contains: q, mode: 'insensitive' } },
          { supplierName: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
        ];
      }

      const batches = await prisma.productionBatch.findMany({
        where: whereClause,
        include: {
          machine: {
            select: { id: true, code: true, name: true, type: true },
          },
          supplier: {
            select: { id: true, document: true, name: true },
          },
          yarns: {
            orderBy: [{ createdAt: 'asc' }],
          },
          rolls: {
            select: { id: true, weight: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      // Asegurar que cada lote retornado tenga su trackingCode asignado en BD
      const batchesWithTracking = await Promise.all(
        batches.map(async (batch) => {
          let trackingCode = batch.trackingCode;
          if (!trackingCode) {
            trackingCode = await generateUniqueTrackingCode();
            await prisma.productionBatch.update({
              where: { id: batch.id },
              data: { trackingCode },
            });
          }
          return {
            ...batch,
            trackingCode,
          };
        })
      );

      const formattedBatches: BatchSummary[] = batchesWithTracking.map((batch) => {
        const totalRolls = batch.rolls.length;
        const totalWeight = batch.rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
        const avgWeight = totalRolls > 0 ? parseFloat((totalWeight / totalRolls).toFixed(2)) : 0;

        return {
          id: batch.id,
          batchNumber: batch.batchNumber,
          trackingCode: batch.trackingCode,
          machineId: batch.machineId,
          machineCode: batch.machineCode || batch.machine?.code || null,
          machineName: batch.machineName || batch.machine?.name || null,
          supplierId: batch.supplierId,
          supplierName: batch.supplierName || batch.supplier?.name || null,
          supplier: batch.supplier || null,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          notes: batch.notes,
          createdAt: batch.createdAt,
          updatedAt: batch.updatedAt,
          totalRolls,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          avgWeight,
          yarns: batch.yarns,
        };
      });

      // Estadísticas globales de lotes (2 estados a nivel general de lote)
      const allBatches = await prisma.productionBatch.findMany({
        select: {
          status: true,
          rolls: {
            select: { weight: true },
          },
        },
      });

      const totalBatches = allBatches.length;
      const requestedBatches = allBatches.filter(
        (b) => b.status === 'REQUESTED' || b.status === 'IN_PROGRESS' || b.status === 'IN_PREPARATION'
      ).length;
      const completedBatches = allBatches.filter(
        (b) => b.status === 'COMPLETED' || b.status === 'DELIVERED' || b.status === 'READY_FOR_PICKUP'
      ).length;

      let totalRollsProduced = 0;
      let totalWeightKg = 0;

      for (const b of allBatches) {
        totalRollsProduced += b.rolls.length;
        for (const r of b.rolls) {
          totalWeightKg += r.weight || 0;
        }
      }

      const stats: ProductionStats = {
        totalBatches,
        requestedBatches,
        completedBatches,
        totalRollsProduced,
        totalWeightKg: parseFloat(totalWeightKg.toFixed(2)),
      };

      const response: ApiResponse<{ batches: BatchSummary[]; stats: ProductionStats }> = {
        success: true,
        data: {
          batches: formattedBatches,
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener lotes de producción.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Obtener detalle completo de un lote con su sábana de rollos e hilos
   */
  async getBatchById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const batch = await prisma.productionBatch.findUnique({
        where: { id },
        include: {
          machine: true,
          supplier: true,
          yarns: {
            orderBy: [{ createdAt: 'asc' }],
          },
          rolls: {
            orderBy: [{ createdAt: 'asc' }],
          },
        },
      });

      if (!batch) {
        res.status(404).json({ success: false, error: 'Lote de producción no encontrado.' });
        return;
      }

      let trackingCode = batch.trackingCode;
      if (!trackingCode) {
        trackingCode = await generateUniqueTrackingCode();
        await prisma.productionBatch.update({
          where: { id: batch.id },
          data: { trackingCode },
        });
      }

      const totalRolls = batch.rolls.length;
      const totalWeight = batch.rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
      const avgWeight = totalRolls > 0 ? parseFloat((totalWeight / totalRolls).toFixed(2)) : 0;

      const responseData: BatchSummary = {
        id: batch.id,
        batchNumber: batch.batchNumber,
        trackingCode,
        machineId: batch.machineId,
        machineCode: batch.machineCode || batch.machine?.code || null,
        machineName: batch.machineName || batch.machine?.name || null,
        supplierId: batch.supplierId,
        supplierName: batch.supplierName || batch.supplier?.name || null,
        supplier: batch.supplier || null,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        notes: batch.notes,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        totalRolls,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        avgWeight,
        yarns: batch.yarns,
        rolls: batch.rolls,
      };

      res.status(200).json({ success: true, data: responseData });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener detalle del lote.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Crear un nuevo lote de producción
   */
  async createBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { batchNumber, machineId, supplierId, startDate, endDate, status, notes } = req.body;

      if (!batchNumber || typeof batchNumber !== 'string' || !batchNumber.trim()) {
        res.status(400).json({ success: false, error: 'El número o código de lote es obligatorio.' });
        return;
      }

      let machineCode: string | null = null;
      let machineName: string | null = null;
      let supplierName: string | null = null;

      if (machineId) {
        const machine = await prisma.machine.findUnique({ where: { id: machineId } });
        if (machine) {
          machineCode = machine.code;
          machineName = machine.name;
        }
      }

      if (supplierId) {
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
        if (supplier) {
          supplierName = supplier.name;
        }
      }

      if (status === 'COMPLETED') {
        res.status(400).json({
          success: false,
          error: 'Un lote nuevo no puede crearse en estado Terminado porque aún no tiene rollos registrados ni entregados.',
        });
        return;
      }

      const validStatuses = [
        'REQUESTED',
        'IN_PREPARATION',
        'READY_FOR_PICKUP',
        'DELIVERED',
        'IN_PROGRESS',
        'DISPATCHED',
        'PAUSED',
      ];
      const finalStatus = validStatuses.includes(status) ? status : 'REQUESTED';

      const trackingCode = await generateUniqueTrackingCode();

      const newBatch = await prisma.productionBatch.create({
        data: {
          batchNumber: batchNumber.trim().toUpperCase(),
          trackingCode,
          machineId: machineId || null,
          machineCode,
          machineName,
          supplierId: supplierId || null,
          supplierName,
          startDate: parseBatchDate(startDate) || new Date(),
          endDate: parseBatchDate(endDate),
          status: finalStatus,
          notes: notes && typeof notes === 'string' ? notes.trim() : null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Lote de producción creado exitosamente.',
        data: newBatch,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear lote de producción.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Actualizar cabecera de lote de producción
   */
  async updateBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { batchNumber, machineId, supplierId, startDate, endDate, status, notes } = req.body;

      const existingBatch = await prisma.productionBatch.findUnique({
        where: { id },
      });

      if (!existingBatch) {
        res.status(404).json({ success: false, error: 'Lote no encontrado.' });
        return;
      }

      const dataToUpdate: Prisma.ProductionBatchUpdateInput = {};

      if (batchNumber !== undefined) {
        const trimmed = String(batchNumber).trim().toUpperCase();
        if (!trimmed) {
          res.status(400).json({ success: false, error: 'El número de lote no puede estar vacío.' });
          return;
        }
        dataToUpdate.batchNumber = trimmed;
      }

      if (machineId !== undefined) {
        if (machineId) {
          const machine = await prisma.machine.findUnique({ where: { id: machineId } });
          dataToUpdate.machine = { connect: { id: machineId } };
          dataToUpdate.machineCode = machine?.code || null;
          dataToUpdate.machineName = machine?.name || null;
        } else {
          dataToUpdate.machine = { disconnect: true };
          dataToUpdate.machineCode = null;
          dataToUpdate.machineName = null;
        }
      }

      if (supplierId !== undefined) {
        if (supplierId) {
          const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
          dataToUpdate.supplier = { connect: { id: supplierId } };
          dataToUpdate.supplierName = supplier?.name || null;
        } else {
          dataToUpdate.supplier = { disconnect: true };
          dataToUpdate.supplierName = null;
        }
      }

      if (startDate !== undefined) {
        dataToUpdate.startDate = parseBatchDate(startDate);
      }

      if (endDate !== undefined) {
        dataToUpdate.endDate = parseBatchDate(endDate);
      }

      if (status !== undefined) {
        if (status === 'COMPLETED') {
          const totalRolls = await prisma.productionRoll.count({
            where: { batchId: id },
          });
          if (totalRolls === 0) {
            res.status(400).json({
              success: false,
              error: 'No se puede marcar el lote como Terminado porque aún no tiene rollos registrados.',
            });
            return;
          }
          const pendingRolls = await prisma.productionRoll.count({
            where: {
              batchId: id,
              status: { not: 'DELIVERED' },
            },
          });
          if (pendingRolls > 0) {
            res.status(400).json({
              success: false,
              error: `No se puede marcar el lote como Terminado porque tiene ${pendingRolls} ${
                pendingRolls === 1 ? 'rollo pendiente' : 'rollos pendientes'
              } de entrega (todos los rollos deben estar en estado "Entregado").`,
            });
            return;
          }
        }

        const validStatuses = [
          'REQUESTED',
          'IN_PREPARATION',
          'READY_FOR_PICKUP',
          'DELIVERED',
          'IN_PROGRESS',
          'COMPLETED',
          'DISPATCHED',
          'PAUSED',
        ];
        if (validStatuses.includes(status)) {
          dataToUpdate.status = status;
        }
      }

      if (notes !== undefined) {
        dataToUpdate.notes = notes ? String(notes).trim() : null;
      }

      const updatedBatch = await prisma.productionBatch.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: 'Lote de producción actualizado exitosamente.',
        data: updatedBatch,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar lote.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Eliminar lote de producción y sus rollos
   */
  async deleteBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const existingBatch = await prisma.productionBatch.findUnique({
        where: { id },
      });

      if (!existingBatch) {
        res.status(404).json({ success: false, error: 'Lote no encontrado.' });
        return;
      }

      await prisma.productionBatch.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: `Lote [${existingBatch.batchNumber}] eliminado exitosamente.`,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar lote.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  // ==========================================
  // ROLLOS (DETALLE DE PRODUCCIÓN)
  // ==========================================

  /**
   * Agregar un rollo a un lote
   */
  async addRoll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const batchId = String(req.params.batchId);
      const {
        rollNumber,
        startDate,
        startTime,
        startOperator,
        endDate,
        endTime,
        endOperator,
        weight,
        status,
        observations,
      } = req.body;

      if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
        res.status(400).json({ success: false, error: 'El número de rollo es obligatorio.' });
        return;
      }

      const batch = await prisma.productionBatch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        res.status(404).json({ success: false, error: 'El lote especificado no existe.' });
        return;
      }

      const parsedWeight = weight !== undefined && weight !== null && weight !== '' ? parseFloat(String(weight)) : null;

      const newRoll = await prisma.productionRoll.create({
        data: {
          batchId,
          rollNumber: rollNumber.trim(),
          startDate: startDate ? String(startDate).trim() : null,
          startTime: startTime ? String(startTime).trim() : null,
          startOperator: startOperator ? String(startOperator).trim() : null,
          endDate: endDate ? String(endDate).trim() : null,
          endTime: endTime ? String(endTime).trim() : null,
          endOperator: endOperator ? String(endOperator).trim() : null,
          weight: isNaN(parsedWeight as number) ? null : parsedWeight,
          status: status || 'REGISTERED',
          observations: observations ? String(observations).trim() : null,
        },
      });

      // Si el lote estaba en COMPLETED, al añadir un nuevo rollo (no entregado) revierte a REQUESTED
      if (batch.status === 'COMPLETED') {
        await prisma.productionBatch.update({
          where: { id: batchId },
          data: { status: 'REQUESTED' },
        });
      }

      res.status(201).json({
        success: true,
        message: `Rollo N° ${newRoll.rollNumber} registrado correctamente.`,
        data: newRoll,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar rollo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Actualizar los datos de un rollo
   */
  async updateRoll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rollId = String(req.params.rollId);
      const {
        rollNumber,
        startDate,
        startTime,
        startOperator,
        endDate,
        endTime,
        endOperator,
        weight,
        status,
        observations,
      } = req.body;

      const existingRoll = await prisma.productionRoll.findUnique({
        where: { id: rollId },
      });

      if (!existingRoll) {
        res.status(404).json({ success: false, error: 'Rollo no encontrado.' });
        return;
      }

      const dataToUpdate: Prisma.ProductionRollUpdateInput = {};

      if (rollNumber !== undefined) {
        const trimmed = String(rollNumber).trim();
        if (!trimmed) {
          res.status(400).json({ success: false, error: 'El número de rollo no puede estar vacío.' });
          return;
        }
        dataToUpdate.rollNumber = trimmed;
      }

      if (startDate !== undefined) dataToUpdate.startDate = startDate ? String(startDate).trim() : null;
      if (startTime !== undefined) dataToUpdate.startTime = startTime ? String(startTime).trim() : null;
      if (startOperator !== undefined) dataToUpdate.startOperator = startOperator ? String(startOperator).trim() : null;
      if (endDate !== undefined) dataToUpdate.endDate = endDate ? String(endDate).trim() : null;
      if (endTime !== undefined) dataToUpdate.endTime = endTime ? String(endTime).trim() : null;
      if (endOperator !== undefined) dataToUpdate.endOperator = endOperator ? String(endOperator).trim() : null;

      if (weight !== undefined) {
        if (weight === null || weight === '') {
          dataToUpdate.weight = null;
        } else {
          const parsed = parseFloat(String(weight));
          dataToUpdate.weight = isNaN(parsed) ? null : parsed;
        }
      }

      const userRole = String(req.user?.role || '').toUpperCase();
      let hasApprovePerm =
        userRole === 'ADMINISTRADOR' ||
        userRole === 'ASISTENTE_ADMINISTRATIVO' ||
        (Array.isArray(req.user?.permissions) && req.user?.permissions.includes('production:approve'));

      if (!hasApprovePerm && req.user?.role) {
        try {
          const roleDef = await prisma.roleDefinition.findFirst({
            where: { OR: [{ code: userRole }, { id: req.user.role }] },
          });
          if (roleDef && Array.isArray(roleDef.permissions) && roleDef.permissions.includes('production:approve')) {
            hasApprovePerm = true;
          }
        } catch {}
      }

      // 1. Validaciones para el rol Tejedor (avance progresivo hacia entrega):
      if (!hasApprovePerm) {
        // Un rollo ya entregado finalizó su ciclo y no puede ser alterado por el tejedor
        if (existingRoll.status === 'DELIVERED') {
          res.status(403).json({
            success: false,
            error: 'Este rollo ya fue entregado y no puede ser modificado por el rol tejedor.',
          });
          return;
        }

        // Si el rollo está en "Listo para recojo", el tejedor SÍ puede pasarlo a "Entregado" cuando el proveedor recoge los rollos
        if (existingRoll.status === 'READY_FOR_PICKUP') {
          if (status !== 'READY_FOR_PICKUP' && status !== 'DELIVERED') {
            res.status(403).json({
              success: false,
              error: 'El rollo ya está listo para recojo; el tejedor solo puede marcarlo como "Entregado".',
            });
            return;
          }
        }

        // Un rollo ya enviado a visto bueno (READY_FOR_APPROVAL) no puede retroceder
        if (existingRoll.status === 'READY_FOR_APPROVAL' && status && status !== 'READY_FOR_APPROVAL') {
          res.status(403).json({
            success: false,
            error: 'El rollo ya está en espera de visto bueno y no puede modificarse hasta que administración lo apruebe.',
          });
          return;
        }

        // El tejedor no puede marcar por sí mismo como "Listo para recojo" (requiere visto bueno)
        if (existingRoll.status !== 'READY_FOR_PICKUP' && status === 'READY_FOR_PICKUP') {
          res.status(403).json({
            success: false,
            error: 'El rollo debe ser aprobado por el Asistente o Administrador antes de pasar a "Listo para recojo".',
          });
          return;
        }

        // El tejedor no puede saltarse a "Entregado" si el rollo aún no estaba en "Listo para recojo"
        if (existingRoll.status !== 'READY_FOR_PICKUP' && status === 'DELIVERED') {
          res.status(403).json({
            success: false,
            error: 'El rollo debe estar aprobado y en "Listo para recojo" antes de poder ser entregado.',
          });
          return;
        }

        // Bloqueo de retroceso: de En preparación no puede volver a Registrado
        if (existingRoll.status === 'IN_PREPARATION' && status === 'REGISTERED') {
          res.status(403).json({
            success: false,
            error: 'No se puede retroceder un rollo en preparación a estado registrado.',
          });
          return;
        }
      } else {
        // 2. Validaciones para Asistente Administrativo / Administrador:
        // El estado READY_FOR_PICKUP no se asigna manualmente por dropdown si aún no ha sido aprobado;
        // debe pasar por la acción de aprobación explícita.
        if (status === 'READY_FOR_PICKUP' && existingRoll.status !== 'READY_FOR_PICKUP') {
          res.status(400).json({
            success: false,
            error:
              'Para pasar el rollo a "Listo para recojo", utiliza el botón oficial de "Aprobar" en la sábana o notificaciones.',
          });
          return;
        }
      }

      if (status !== undefined) {
        dataToUpdate.status = status;
      }

      if (observations !== undefined) {
        dataToUpdate.observations = observations ? String(observations).trim() : null;
      }

      const updatedRoll = await prisma.productionRoll.update({
        where: { id: rollId },
        data: dataToUpdate,
      });

      // Verificación y actualización automática del estado del lote:
      if (status !== undefined && status !== existingRoll.status) {
        const batchId = existingRoll.batchId;
        const totalRolls = await prisma.productionRoll.count({
          where: { batchId },
        });
        const pendingRolls = await prisma.productionRoll.count({
          where: {
            batchId,
            status: { not: 'DELIVERED' },
          },
        });

        // Si todos los rollos están entregados (y hay al menos 1 rollo), pasar lote automáticamente a COMPLETED
        if (totalRolls > 0 && pendingRolls === 0) {
          await prisma.productionBatch.update({
            where: { id: batchId },
            data: { status: 'COMPLETED' },
          });
        } else {
          // Si algún rollo no está entregado y el lote estaba en COMPLETED, revertir a REQUESTED
          const currentBatch = await prisma.productionBatch.findUnique({
            where: { id: batchId },
            select: { status: true },
          });
          if (currentBatch?.status === 'COMPLETED') {
            await prisma.productionBatch.update({
              where: { id: batchId },
              data: { status: 'REQUESTED' },
            });
          }
        }
      }

      res.status(200).json({
        success: true,
        message: `Rollo N° ${updatedRoll.rollNumber} actualizado exitosamente.`,
        data: updatedRoll,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar rollo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Aprobar un rollo pendiente (cambia estado a READY_FOR_PICKUP)
   * Solo para Asistente Administrativo o Administrador del sistema
   */
  async approveRoll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rollId = String(req.params.rollId);

      const existingRoll = await prisma.productionRoll.findUnique({
        where: { id: rollId },
        include: {
          batch: {
            include: {
              supplier: {
                select: { id: true, name: true, document: true },
              },
            },
          },
        },
      });

      if (!existingRoll) {
        res.status(404).json({ success: false, error: 'Rollo no encontrado.' });
        return;
      }

      const updatedRoll = await prisma.productionRoll.update({
        where: { id: rollId },
        data: {
          status: 'READY_FOR_PICKUP',
        },
      });

      const supplierName =
        existingRoll.batch?.supplier?.name || existingRoll.batch?.supplierName || 'Proveedor';
      const batchNumber = existingRoll.batch?.batchNumber || 'Lote';

      res.status(200).json({
        success: true,
        message: `El Rollo N° ${existingRoll.rollNumber} del Lote [${batchNumber}] (${supplierName}) fue aprobado con éxito y su estado cambió a "Listo para recojo".`,
        data: updatedRoll,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al aprobar rollo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Obtener rollos pendientes de aprobación (READY_FOR_APPROVAL)
   * Para alimentar las notificaciones en la plataforma
   */
  async getPendingApprovals(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pendingRolls = await prisma.productionRoll.findMany({
        where: {
          status: 'READY_FOR_APPROVAL',
        },
        include: {
          batch: {
            include: {
              supplier: {
                select: { id: true, name: true, document: true },
              },
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      });

      const formatted = pendingRolls.map((roll) => {
        const batchNumber = roll.batch?.batchNumber || 'Sin Lote';
        const supplierName = roll.batch?.supplier?.name || roll.batch?.supplierName || 'Sin Proveedor';
        const machineName = roll.batch?.machineName || null;

        return {
          rollId: roll.id,
          rollNumber: roll.rollNumber,
          weight: roll.weight,
          status: roll.status,
          batchId: roll.batchId,
          batchNumber,
          supplierName,
          machineName,
          createdAt: roll.createdAt,
          updatedAt: roll.updatedAt,
          message: `El Lote ${batchNumber} del proveedor ${supplierName} tiene el Rollo N° ${roll.rollNumber} listo para aprobar.`,
        };
      });

      res.status(200).json({
        success: true,
        data: formatted,
        count: formatted.length,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener notificaciones de aprobación.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Eliminar un rollo
   */
  async deleteRoll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rollId = String(req.params.rollId);

      const existingRoll = await prisma.productionRoll.findUnique({
        where: { id: rollId },
      });

      if (!existingRoll) {
        res.status(404).json({ success: false, error: 'Rollo no encontrado.' });
        return;
      }

      await prisma.productionRoll.delete({
        where: { id: rollId },
      });

      // Recalcular estado automático del lote tras eliminar el rollo
      const remainingTotal = await prisma.productionRoll.count({
        where: { batchId: existingRoll.batchId },
      });
      if (remainingTotal === 0) {
        const batch = await prisma.productionBatch.findUnique({
          where: { id: existingRoll.batchId },
          select: { status: true },
        });
        if (batch?.status === 'COMPLETED') {
          await prisma.productionBatch.update({
            where: { id: existingRoll.batchId },
            data: { status: 'REQUESTED' },
          });
        }
      } else {
        const remainingPending = await prisma.productionRoll.count({
          where: {
            batchId: existingRoll.batchId,
            status: { not: 'DELIVERED' },
          },
        });
        if (remainingPending === 0) {
          await prisma.productionBatch.update({
            where: { id: existingRoll.batchId },
            data: { status: 'COMPLETED' },
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Rollo N° ${existingRoll.rollNumber} eliminado del lote.`,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar rollo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Listar todos los operarios para asignación en rollos
   */
  async getOperators(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
        orderBy: { firstName: 'asc' },
      });

      const isOperatorRole = (r: string) => {
        const upper = (r || '').toUpperCase();
        return upper === 'OPERATOR' || upper === 'OPERARIO' || upper === 'OPERADOR' || upper === 'TEJEDOR';
      };

      let operatorUsers = users.filter((u) => isOperatorRole(u.role));
      if (operatorUsers.length === 0) {
        operatorUsers = users;
      }

      const list = operatorUsers.map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        role: u.role,
      }));

      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener lista de operarios.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Registrar un hilo dentro del lote
   */
  async addYarn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const batchId = String(req.params.id);
      const { yarnName, color, lotCode, rollCount, totalWeight, status, notes } = req.body;

      if (!yarnName || !String(yarnName).trim()) {
        res.status(400).json({ success: false, error: 'El nombre o tipo de hilo es obligatorio (ej. Algodón 30/1).' });
        return;
      }

      const batch = await prisma.productionBatch.findUnique({ where: { id: batchId } });
      if (!batch) {
        res.status(404).json({ success: false, error: 'Lote de producción no encontrado.' });
        return;
      }

      const newYarn = await prisma.batchYarn.create({
        data: {
          batchId,
          yarnName: String(yarnName).trim(),
          color: color ? String(color).trim() : null,
          lotCode: lotCode ? String(lotCode).trim() : null,
          rollCount: rollCount !== undefined && rollCount !== '' ? parseInt(String(rollCount), 10) : 0,
          totalWeight: totalWeight !== undefined && totalWeight !== '' ? parseFloat(String(totalWeight)) : 0,
          status: status || 'IN_PREPARATION',
          notes: notes ? String(notes).trim() : null,
        },
      });

      res.status(201).json({
        success: true,
        message: `Hilo [${newYarn.yarnName}] registrado exitosamente.`,
        data: newYarn,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar hilo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Actualizar estado, avance o datos de un hilo
   */
  async updateYarn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const yarnId = String(req.params.yarnId);
      const { yarnName, color, lotCode, rollCount, totalWeight, status, notes } = req.body;

      const existingYarn = await prisma.batchYarn.findUnique({
        where: { id: yarnId },
      });

      if (!existingYarn) {
        res.status(404).json({ success: false, error: 'Hilo no encontrado.' });
        return;
      }

      const dataToUpdate: Prisma.BatchYarnUpdateInput = {};
      if (yarnName !== undefined) dataToUpdate.yarnName = String(yarnName).trim();
      if (color !== undefined) dataToUpdate.color = color ? String(color).trim() : null;
      if (lotCode !== undefined) dataToUpdate.lotCode = lotCode ? String(lotCode).trim() : null;
      if (rollCount !== undefined) dataToUpdate.rollCount = parseInt(String(rollCount), 10) || 0;
      if (totalWeight !== undefined) dataToUpdate.totalWeight = parseFloat(String(totalWeight)) || 0;
      if (status !== undefined) dataToUpdate.status = status;
      if (notes !== undefined) dataToUpdate.notes = notes ? String(notes).trim() : null;

      const updatedYarn = await prisma.batchYarn.update({
        where: { id: yarnId },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: `Hilo [${updatedYarn.yarnName}] actualizado correctamente.`,
        data: updatedYarn,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar hilo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Eliminar un hilo del lote
   */
  async deleteYarn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const yarnId = String(req.params.yarnId);

      const existingYarn = await prisma.batchYarn.findUnique({
        where: { id: yarnId },
      });

      if (!existingYarn) {
        res.status(404).json({ success: false, error: 'Hilo no encontrado.' });
        return;
      }

      await prisma.batchYarn.delete({
        where: { id: yarnId },
      });

      res.status(200).json({
        success: true,
        message: `Hilo [${existingYarn.yarnName}] eliminado del lote.`,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar hilo.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Consulta pública de seguimiento para el proveedor mediante código único de rastreo o número de lote
   */
  async trackBatch(req: Request, res: Response): Promise<void> {
    try {
      const rawCode = String(req.params.code || '').trim();
      if (!rawCode) {
        res.status(400).json({ success: false, error: 'Ingresa un código de seguimiento válido.' });
        return;
      }

      // Buscar por trackingCode o batchNumber o id
      const batch = await prisma.productionBatch.findFirst({
        where: {
          OR: [
            { trackingCode: { equals: rawCode, mode: 'insensitive' } },
            { batchNumber: { equals: rawCode, mode: 'insensitive' } },
            { id: rawCode },
          ],
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              document: true,
            },
          },
          rolls: {
            orderBy: [{ rollNumber: 'asc' }],
            select: {
              id: true,
              rollNumber: true,
              weight: true,
              status: true,
              startDate: true,
              startTime: true,
              endDate: true,
              endTime: true,
              observations: true,
              createdAt: true,
            },
          },
        },
      });

      if (!batch) {
        res.status(404).json({
          success: false,
          error: `No encontramos ningún lote asociado al código "${rawCode}". Verifica el código e intenta nuevamente.`,
        });
        return;
      }

      let trackingCode = batch.trackingCode;
      if (!trackingCode) {
        trackingCode = await generateUniqueTrackingCode();
        await prisma.productionBatch.update({
          where: { id: batch.id },
          data: { trackingCode },
        });
      }

      const totalRolls = batch.rolls.length;
      const totalWeight = batch.rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
      const registeredCount = batch.rolls.filter((r) => !r.status || r.status === 'REGISTERED').length;
      const inPrepCount = batch.rolls.filter((r) => r.status === 'IN_PREPARATION').length;
      const readyForApprovalCount = batch.rolls.filter((r) => r.status === 'READY_FOR_APPROVAL').length;
      const readyPickupCount = batch.rolls.filter((r) => r.status === 'READY_FOR_PICKUP').length;
      const deliveredCount = batch.rolls.filter((r) => r.status === 'DELIVERED').length;

      // Progreso hacia recojo/entrega
      const progressPercent =
        totalRolls > 0 ? Math.round(((readyPickupCount + deliveredCount) / totalRolls) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          id: batch.id,
          trackingCode,
          batchNumber: batch.batchNumber,
          supplierName: batch.supplier?.name || batch.supplierName || 'Proveedor',
          status: batch.status,
          startDate: batch.startDate,
          endDate: batch.endDate,
          notes: batch.notes,
          totalRolls,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          counts: {
            registered: registeredCount,
            inPreparation: inPrepCount,
            readyForApproval: readyForApprovalCount,
            readyForPickup: readyPickupCount,
            delivered: deliveredCount,
          },
          progressPercent,
          hasRollsReadyForPickup: readyPickupCount > 0,
          rolls: batch.rolls,
          updatedAt: batch.updatedAt,
        },
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al consultar seguimiento.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }
}
