import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { prisma, Machine } from '../../config/prisma';

export interface MachineStats {
  total: number;
  operative: number;
  maintenance: number;
  outOfService: number;
}

function normalizeDesignTypes(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim()) {
    return val
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export class MachinesController {
  /**
   * Obtener lista de máquinas con filtros de búsqueda y estadísticas
   */
  async getMachines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
      const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';

      const whereClause: Prisma.MachineWhereInput = {};

      if (status && status !== 'ALL') {
        whereClause.status = status;
      }

      if (type && type !== 'ALL') {
        whereClause.type = type;
      }

      if (q) {
        whereClause.OR = [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { designTypes: { has: q } },
        ];
      }

      // 1. Obtener máquinas filtradas
      const machines = await prisma.machine.findMany({
        where: whereClause,
        orderBy: [{ code: 'asc' }, { createdAt: 'desc' }],
      });

      // 2. Calcular estadísticas globales de máquinas de la empresa
      const allMachines = await prisma.machine.findMany({
        select: { status: true },
      });

      const stats: MachineStats = {
        total: allMachines.length,
        operative: allMachines.filter((m) => m.status === 'OPERATIVE').length,
        maintenance: allMachines.filter((m) => m.status === 'MAINTENANCE').length,
        outOfService: allMachines.filter((m) => m.status === 'OUT_OF_SERVICE').length,
      };

      const response: ApiResponse<{ machines: Machine[]; stats: MachineStats }> = {
        success: true,
        data: {
          machines,
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener máquinas.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Obtener una máquina por su ID
   */
  async getMachineById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const machine = await prisma.machine.findUnique({
        where: { id },
      });

      if (!machine) {
        res.status(404).json({ success: false, error: 'Máquina no encontrada.' });
        return;
      }

      res.status(200).json({ success: true, data: machine });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener máquina.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Registrar una nueva máquina
   */
  async createMachine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, name, type, brand, model, serialNumber, status, designTypes, location, notes } = req.body;

      if (!code || typeof code !== 'string' || !code.trim()) {
        res.status(400).json({ success: false, error: 'El código de la máquina es obligatorio.' });
        return;
      }

      const normalizedCode = code.trim().toUpperCase();

      // Verificar si el código ya existe
      const existing = await prisma.machine.findUnique({
        where: { code: normalizedCode },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: `Ya existe una máquina registrada con el código "${normalizedCode}".`,
        });
        return;
      }

      const validStatuses = ['OPERATIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
      const finalStatus = validStatuses.includes(status) ? status : 'OPERATIVE';

      const newMachine = await prisma.machine.create({
        data: {
          code: normalizedCode,
          name: name && typeof name === 'string' && name.trim() ? name.trim() : normalizedCode,
          type: type && typeof type === 'string' ? type.trim() : 'Costura',
          brand: brand && typeof brand === 'string' ? brand.trim() : null,
          model: model && typeof model === 'string' ? model.trim() : null,
          serialNumber: serialNumber && typeof serialNumber === 'string' ? serialNumber.trim() : null,
          status: finalStatus,
          designTypes: normalizeDesignTypes(designTypes),
          location: location && typeof location === 'string' ? location.trim() : null,
          notes: notes && typeof notes === 'string' ? notes.trim() : null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Máquina registrada exitosamente.',
        data: newMachine,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar máquina.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Actualizar los datos de una máquina
   */
  async updateMachine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { code, name, type, brand, model, serialNumber, status, designTypes, location, notes } = req.body;

      const existingMachine = await prisma.machine.findUnique({
        where: { id },
      });

      if (!existingMachine) {
        res.status(404).json({ success: false, error: 'Máquina no encontrada.' });
        return;
      }

      const dataToUpdate: Prisma.MachineUpdateInput = {};

      if (code !== undefined) {
        const normalizedCode = String(code).trim().toUpperCase();
        if (!normalizedCode) {
          res.status(400).json({ success: false, error: 'El código no puede estar vacío.' });
          return;
        }

        if (normalizedCode !== existingMachine.code) {
          const duplicate = await prisma.machine.findUnique({
            where: { code: normalizedCode },
          });
          if (duplicate && duplicate.id !== id) {
            res.status(409).json({
              success: false,
              error: `El código "${normalizedCode}" ya está en uso por otra máquina.`,
            });
            return;
          }
        }
        dataToUpdate.code = normalizedCode;
      }

      if (name !== undefined) {
        dataToUpdate.name = String(name).trim() || existingMachine.name;
      }

      if (type !== undefined) {
        dataToUpdate.type = String(type).trim() || 'Costura';
      }

      if (brand !== undefined) {
        dataToUpdate.brand = brand ? String(brand).trim() : null;
      }

      if (model !== undefined) {
        dataToUpdate.model = model ? String(model).trim() : null;
      }

      if (serialNumber !== undefined) {
        dataToUpdate.serialNumber = serialNumber ? String(serialNumber).trim() : null;
      }

      if (status !== undefined) {
        const validStatuses = ['OPERATIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
        if (validStatuses.includes(status)) {
          dataToUpdate.status = status;
        }
      }

      if (designTypes !== undefined) {
        dataToUpdate.designTypes = normalizeDesignTypes(designTypes);
      }

      if (location !== undefined) {
        dataToUpdate.location = location ? String(location).trim() : null;
      }

      if (notes !== undefined) {
        dataToUpdate.notes = notes ? String(notes).trim() : null;
      }

      const updatedMachine = await prisma.machine.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: 'Máquina actualizada exitosamente.',
        data: updatedMachine,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar máquina.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Eliminar una máquina
   */
  async deleteMachine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const existingMachine = await prisma.machine.findUnique({
        where: { id },
        include: {
          _count: {
            select: { productionBatches: true },
          },
        },
      });

      if (!existingMachine) {
        res.status(404).json({ success: false, error: 'Máquina no encontrada.' });
        return;
      }

      if (existingMachine._count.productionBatches > 0) {
        res.status(400).json({
          success: false,
          error: `No se puede eliminar la máquina [${existingMachine.code} - ${existingMachine.name}] porque tiene ${existingMachine._count.productionBatches} lote(s) de producción asociado(s). Puede cambiar su estado a "FUERA DE SERVICIO" o "MANTENIMIENTO" en su lugar.`,
        });
        return;
      }

      await prisma.machine.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: `Máquina [${existingMachine.code}] eliminada exitosamente.`,
      });
    } catch (error: unknown) {
      console.error('Error al eliminar máquina:', error);
      const isPrismaFk = (error as { code?: string })?.code === 'P2003';
      const errorMsg = isPrismaFk
        ? 'No se puede eliminar la máquina porque tiene registros vinculados en el sistema.'
        : error instanceof Error ? error.message : 'Error al eliminar máquina.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }
}
