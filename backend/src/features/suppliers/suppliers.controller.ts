import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';
import { prisma } from '../../config/prisma';

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
  yarnTypes?: string[] | string;
  status?: string;
  notes?: string;
}

export interface UpdateSupplierDTO {
  document?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  yarnTypes?: string[] | string;
  status?: string;
  notes?: string;
}

function normalizeYarnTypes(val: unknown): string[] {
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

export class SuppliersController {
  /**
   * Obtener lista de proveedores con filtros y estadísticas
   */
  async getSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

      const whereClause: Prisma.SupplierWhereInput = {};

      if (status && status !== 'ALL') {
        whereClause.status = status;
      }

      if (q) {
        whereClause.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { document: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { yarnTypes: { has: q } },
        ];
      }

      const [suppliers, total, active, inactive] = await Promise.all([
        prisma.supplier.findMany({
          where: whereClause,
          include: {
            _count: {
              select: { productionBatches: true },
            },
          },
          orderBy: [{ status: 'asc' }, { name: 'asc' }],
        }),
        prisma.supplier.count(),
        prisma.supplier.count({ where: { status: 'ACTIVE' } }),
        prisma.supplier.count({ where: { status: 'INACTIVE' } }),
      ]);

      const stats: SupplierStats = {
        total,
        active,
        inactive,
      };

      res.status(200).json({
        success: true,
        data: {
          suppliers,
          stats,
        },
      });
    } catch (error: unknown) {
      console.error('Error al obtener proveedores:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error interno al consultar proveedores.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Obtener un proveedor por su ID
   */
  async getSupplierById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          productionBatches: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!supplier) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado.' });
        return;
      }

      res.status(200).json({ success: true, data: supplier });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al consultar proveedor.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Crear un nuevo proveedor
   */
  async createSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { document, name, phone, email, address, yarnTypes, status, notes } =
        req.body as CreateSupplierDTO;

      if (!document || !document.trim()) {
        res.status(400).json({ success: false, error: 'El RUC o documento del proveedor es obligatorio.' });
        return;
      }

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: 'La Razón Social o nombre del proveedor es obligatorio.' });
        return;
      }

      const cleanDoc = document.trim().toUpperCase();

      // Verificar unicidad de documento
      const existing = await prisma.supplier.findUnique({
        where: { document: cleanDoc },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: `Ya existe un proveedor registrado con el documento ${cleanDoc} (${existing.name}).`,
        });
        return;
      }

      const newSupplier = await prisma.supplier.create({
        data: {
          document: cleanDoc,
          name: name.trim(),
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim().toLowerCase() : null,
          address: address ? String(address).trim() : null,
          yarnTypes: normalizeYarnTypes(yarnTypes),
          status: status || 'ACTIVE',
          notes: notes ? String(notes).trim() : null,
        },
      });

      res.status(201).json({
        success: true,
        message: `Proveedor [${newSupplier.name}] registrado exitosamente.`,
        data: newSupplier,
      });
    } catch (error: unknown) {
      console.error('Error al crear proveedor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar el proveedor.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Actualizar un proveedor existente
   */
  async updateSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { document, name, phone, email, address, yarnTypes, status, notes } =
        req.body as UpdateSupplierDTO;

      const existingSupplier = await prisma.supplier.findUnique({
        where: { id },
      });

      if (!existingSupplier) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado.' });
        return;
      }

      const dataToUpdate: Prisma.SupplierUpdateInput = {};

      if (document !== undefined) {
        const cleanDoc = document.trim().toUpperCase();
        if (!cleanDoc) {
          res.status(400).json({ success: false, error: 'El RUC o documento no puede quedar vacío.' });
          return;
        }

        if (cleanDoc !== existingSupplier.document) {
          const duplicate = await prisma.supplier.findUnique({
            where: { document: cleanDoc },
          });
          if (duplicate && duplicate.id !== id) {
            res.status(400).json({
              success: false,
              error: `El documento ${cleanDoc} ya está en uso por otro proveedor (${duplicate.name}).`,
            });
            return;
          }
        }
        dataToUpdate.document = cleanDoc;
      }

      if (name !== undefined) {
        if (!name.trim()) {
          res.status(400).json({ success: false, error: 'La Razón Social o nombre no puede quedar vacía.' });
          return;
        }
        dataToUpdate.name = name.trim();

        // Actualizar el nombre desnormalizado en los lotes asociados
        await prisma.productionBatch.updateMany({
          where: { supplierId: id },
          data: { supplierName: name.trim() },
        });
      }

      if (phone !== undefined) dataToUpdate.phone = phone ? String(phone).trim() : null;
      if (email !== undefined) dataToUpdate.email = email ? String(email).trim().toLowerCase() : null;
      if (address !== undefined) dataToUpdate.address = address ? String(address).trim() : null;
      if (yarnTypes !== undefined) dataToUpdate.yarnTypes = normalizeYarnTypes(yarnTypes);
      if (status !== undefined) dataToUpdate.status = status;
      if (notes !== undefined) dataToUpdate.notes = notes ? String(notes).trim() : null;

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: `Proveedor [${updatedSupplier.name}] actualizado exitosamente.`,
        data: updatedSupplier,
      });
    } catch (error: unknown) {
      console.error('Error al actualizar proveedor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar el proveedor.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Eliminar un proveedor
   */
  async deleteSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const existingSupplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: { productionBatches: true },
          },
        },
      });

      if (!existingSupplier) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado.' });
        return;
      }

      if (existingSupplier._count.productionBatches > 0) {
        res.status(400).json({
          success: false,
          error: `No se puede eliminar el proveedor [${existingSupplier.name}] porque tiene ${existingSupplier._count.productionBatches} lote(s) de producción vinculados. Puede cambiar su estado a Inactivo en su lugar.`,
        });
        return;
      }

      await prisma.supplier.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: `Proveedor [${existingSupplier.name}] eliminado exitosamente.`,
      });
    } catch (error: unknown) {
      console.error('Error al eliminar proveedor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar el proveedor.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }
}
