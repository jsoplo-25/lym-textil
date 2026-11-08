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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RUC_PREFIXES = ['10', '15', '17', '20'];

/** Normaliza un celular peruano: quita separadores y prefijo +51. */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '').replace(/^\+?51(?=9\d{8}$)/, '');
}

/** Devuelve un mensaje de error si el RUC es inválido; null si es válido. */
function validateDocument(doc: string): string | null {
  if (!/^\d+$/.test(doc)) return 'El RUC solo puede contener números.';
  if (doc.length !== 11) return 'El RUC debe tener exactamente 11 dígitos.';
  if (!RUC_PREFIXES.includes(doc.slice(0, 2))) return 'El RUC debe empezar con 10, 15, 17 o 20.';
  return null;
}

function validateName(name: string): string | null {
  if (name.length < 3) return 'El nombre del proveedor debe tener al menos 3 caracteres.';
  if (name.length > 100) return 'El nombre no puede superar los 100 caracteres.';
  return null;
}

function validatePhone(phone: string): string | null {
  if (!/^\+?[\d\s\-().]+$/.test(phone) || !/^9\d{8}$/.test(normalizePhone(phone))) {
    return 'El teléfono debe ser un celular válido de 9 dígitos que empiece con 9.';
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (email.length > 100) return 'El correo no puede superar los 100 caracteres.';
  if (!EMAIL_REGEX.test(email)) return 'El formato del correo electrónico es inválido.';
  return null;
}

/** Valida largos de campos de texto libre. */
function validateFreeText(address?: unknown, yarnTypes?: unknown, notes?: unknown): string | null {
  if (typeof address === 'string' && address.trim().length > 200) return 'La dirección no puede superar los 200 caracteres.';
  const yarn = Array.isArray(yarnTypes) ? yarnTypes.join(', ') : typeof yarnTypes === 'string' ? yarnTypes : '';
  if (yarn.trim().length > 200) return 'Los tipos de hilado no pueden superar los 200 caracteres.';
  if (typeof notes === 'string' && notes.trim().length > 500) return 'Las notas no pueden superar los 500 caracteres.';
  return null;
}

function validateStatus(status: unknown): string | null {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') return 'El estado del proveedor debe ser ACTIVE o INACTIVE.';
  return null;
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
      const cleanName = name.trim();

      const createError =
        validateDocument(cleanDoc) ||
        validateName(cleanName) ||
        (phone && String(phone).trim() ? validatePhone(String(phone).trim()) : null) ||
        (email && String(email).trim() ? validateEmail(String(email).trim().toLowerCase()) : null) ||
        validateFreeText(address, yarnTypes, notes) ||
        (status !== undefined ? validateStatus(status) : null);
      if (createError) {
        res.status(400).json({ success: false, error: createError });
        return;
      }

      // Verificar unicidad de documento
      const existing = await prisma.supplier.findUnique({
        where: { document: cleanDoc },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: `Ya existe un proveedor registrado con el documento ${cleanDoc} (${existing.name}).`,
        });
        return;
      }

      // Verificar unicidad de Razón Social / Nombre
      const existingName = await prisma.supplier.findFirst({
        where: { name: { equals: cleanName, mode: 'insensitive' } },
      });

      if (existingName) {
        res.status(409).json({
          success: false,
          error: `Ya existe un proveedor registrado con la Razón Social "${cleanName}".`,
        });
        return;
      }

      const newSupplier = await prisma.supplier.create({
        data: {
          document: cleanDoc,
          name: name.trim(),
          phone: phone && String(phone).trim() ? normalizePhone(String(phone).trim()) : null,
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
        const docError = validateDocument(cleanDoc);
        if (docError) {
          res.status(400).json({ success: false, error: docError });
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
        const cleanName = name.trim();
        if (!cleanName) {
          res.status(400).json({ success: false, error: 'La Razón Social o nombre no puede quedar vacía.' });
          return;
        }
        const nameError = validateName(cleanName);
        if (nameError) {
          res.status(400).json({ success: false, error: nameError });
          return;
        }

        if (cleanName.toLowerCase() !== existingSupplier.name.toLowerCase()) {
          const duplicateName = await prisma.supplier.findFirst({
            where: {
              name: { equals: cleanName, mode: 'insensitive' },
              id: { not: id },
            },
          });
          if (duplicateName) {
            res.status(409).json({
              success: false,
              error: `La Razón Social "${cleanName}" ya está registrada por otro proveedor.`,
            });
            return;
          }
        }

        dataToUpdate.name = cleanName;
      }

      if (phone !== undefined) {
        const cleanPhone = phone ? String(phone).trim() : '';
        if (cleanPhone) {
          const phoneError = validatePhone(cleanPhone);
          if (phoneError) {
            res.status(400).json({ success: false, error: phoneError });
            return;
          }
        }
        dataToUpdate.phone = cleanPhone ? normalizePhone(cleanPhone) : null;
      }
      if (email !== undefined) {
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const emailError = cleanEmail ? validateEmail(cleanEmail) : null;
        if (emailError) {
          res.status(400).json({ success: false, error: emailError });
          return;
        }
        dataToUpdate.email = cleanEmail;
      }
      const textError =
        validateFreeText(address, yarnTypes, notes) || (status !== undefined ? validateStatus(status) : null);
      if (textError) {
        res.status(400).json({ success: false, error: textError });
        return;
      }
      if (address !== undefined) dataToUpdate.address = address ? String(address).trim() : null;
      if (yarnTypes !== undefined) dataToUpdate.yarnTypes = normalizeYarnTypes(yarnTypes);
      if (status !== undefined) dataToUpdate.status = status;
      if (notes !== undefined) dataToUpdate.notes = notes ? String(notes).trim() : null;

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: dataToUpdate,
      });

      // Actualizar el nombre desnormalizado en los lotes asociados (tras validar y guardar)
      if (typeof dataToUpdate.name === 'string') {
        await prisma.productionBatch.updateMany({
          where: { supplierId: id },
          data: { supplierName: dataToUpdate.name },
        });
      }

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
