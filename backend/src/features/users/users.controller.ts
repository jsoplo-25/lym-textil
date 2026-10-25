import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse, UserRole } from '../../shared/types';
import { prisma } from '../../config/prisma';
import { hashPassword } from '../../shared/utils/password';

export interface ManagedUser {
  id: string;
  workerId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleName?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone?: string;
  jobTitle?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export class UsersController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { q, role, status } = req.query as { q?: string; role?: string; status?: string };

    let usersList: ManagedUser[] = [];

    try {
      const whereClause: Prisma.UserWhereInput = {};

      if (role && role !== 'ALL') {
        whereClause.role = role;
      }

      if (status && status !== 'ALL') {
        whereClause.status = status;
      }

      if (q) {
        whereClause.OR = [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { workerId: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { jobTitle: { contains: q, mode: 'insensitive' } },
        ];
      }

      const dbUsers = await prisma.user.findMany({
        where: whereClause,
        include: { roleDefinition: true },
        orderBy: [{ workerId: 'asc' }, { createdAt: 'desc' }],
      });

      if (dbUsers) {
        usersList = dbUsers.map((u) => ({
          id: u.id,
          workerId: u.workerId,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as UserRole,
          roleName: u.roleDefinition?.name || u.role,
          avatarUrl: u.avatarUrl || undefined,
          status: (u.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
          phone: u.phone || undefined,
          jobTitle: u.jobTitle || u.roleDefinition?.description || undefined,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
          createdAt: u.createdAt.toISOString(),
        }));
      }
    } catch (err: unknown) {
      console.error('Error al consultar usuarios en Prisma:', err);
    }

    const response: ApiResponse<ManagedUser[]> = {
      success: true,
      data: usersList,
    };
    res.status(200).json(response);
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id },
        include: { roleDefinition: true },
      });
      if (dbUser) {
        const userObj: ManagedUser = {
          id: dbUser.id,
          workerId: dbUser.workerId,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role as UserRole,
          roleName: dbUser.roleDefinition?.name || dbUser.role,
          avatarUrl: dbUser.avatarUrl || undefined,
          status: (dbUser.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
          phone: dbUser.phone || undefined,
          jobTitle: dbUser.jobTitle || dbUser.roleDefinition?.description || undefined,
          lastLoginAt: dbUser.lastLoginAt ? dbUser.lastLoginAt.toISOString() : undefined,
          createdAt: dbUser.createdAt.toISOString(),
        };

        res.status(200).json({
          success: true,
          data: userObj,
        });
        return;
      }
    } catch (err: unknown) {
      console.error('Error al obtener usuario por id:', err);
    }

    res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, workerId, phone, jobTitle, status, avatarUrl } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({
          success: false,
          error: 'Faltan campos obligatorios (email, password, firstName, lastName, role).',
        });
        return;
      }

      const cleanEmail = String(email).trim().toLowerCase();

      // Check for existing user in database
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: `Ya existe un usuario registrado con el correo ${cleanEmail}.`,
        });
        return;
      }

      // Validar o generar workerId
      let finalWorkerId = workerId ? String(workerId).trim().toUpperCase() : '';
      if (!finalWorkerId) {
        const count = await prisma.user.count();
        finalWorkerId = `USR-${String(count + 1).padStart(3, '0')}`;
        // Si ya existiera ese USR-XXX generado, buscar uno libre
        let counter = count + 1;
        while (await prisma.user.findUnique({ where: { workerId: finalWorkerId } })) {
          counter++;
          finalWorkerId = `USR-${String(counter).padStart(3, '0')}`;
        }
      } else {
        const existingWorker = await prisma.user.findUnique({ where: { workerId: finalWorkerId } });
        if (existingWorker) {
          res.status(400).json({
            success: false,
            error: `El ID de trabajador "${finalWorkerId}" ya está asignado a otro usuario.`,
          });
          return;
        }
      }

      // Validar que el rol exista en la base de datos (tabla roles)
      const normalizedRole = String(role).toUpperCase().trim();
      const roleExists = await prisma.roleDefinition.findFirst({
        where: {
          OR: [{ code: normalizedRole }, { id: role }],
        },
      });

      if (!roleExists) {
        res.status(400).json({
          success: false,
          error: `El rol [${role}] no existe en la tabla de Roles.`,
        });
        return;
      }

      const passwordHash = await hashPassword(password);

      // Cargar Cargo desde la descripción de funciones del rol
      const finalJobTitle = (jobTitle && String(jobTitle).trim()) || roleExists.description || null;

      const newUser = await prisma.user.create({
        data: {
          workerId: finalWorkerId,
          email: cleanEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: roleExists.code,
          phone: phone ? String(phone).trim() : null,
          jobTitle: finalJobTitle,
          status: status || 'ACTIVE',
          avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        },
        include: { roleDefinition: true },
      });

      const createdUser: ManagedUser = {
        id: newUser.id,
        workerId: newUser.workerId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role as UserRole,
        roleName: newUser.roleDefinition?.name || roleExists.name,
        avatarUrl: newUser.avatarUrl || undefined,
        status: (newUser.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
        phone: newUser.phone || undefined,
        jobTitle: newUser.jobTitle || undefined,
        createdAt: newUser.createdAt.toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente.',
        data: createdUser,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear usuario.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { email, firstName, lastName, role, workerId, phone, jobTitle, status, avatarUrl } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        return;
      }

      let validatedRoleCode: string | undefined = undefined;
      if (role) {
        const normalizedRole = String(role).toUpperCase().trim();
        const roleExists = await prisma.roleDefinition.findFirst({
          where: {
            OR: [{ code: normalizedRole }, { id: role }],
          },
        });
        if (!roleExists) {
          res.status(400).json({
            success: false,
            error: `El rol [${role}] no existe en la tabla de Roles.`,
          });
          return;
        }
        validatedRoleCode = roleExists.code;
      }

      const dataToUpdate: Prisma.UserUncheckedUpdateInput = {};

      if (email !== undefined) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (!cleanEmail) {
          res.status(400).json({ success: false, error: 'El correo electrónico no puede estar vacío.' });
          return;
        }
        if (cleanEmail !== existingUser.email) {
          const duplicate = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (duplicate && duplicate.id !== id) {
            res.status(400).json({ success: false, error: `El correo ${cleanEmail} ya está en uso.` });
            return;
          }
        }
        dataToUpdate.email = cleanEmail;
      }

      if (workerId !== undefined) {
        const cleanWorkerId = String(workerId).trim().toUpperCase();
        if (!cleanWorkerId) {
          res.status(400).json({ success: false, error: 'El ID de trabajador no puede estar vacío.' });
          return;
        }
        if (cleanWorkerId !== existingUser.workerId) {
          const duplicate = await prisma.user.findUnique({ where: { workerId: cleanWorkerId } });
          if (duplicate && duplicate.id !== id) {
            res.status(400).json({ success: false, error: `El ID de trabajador ${cleanWorkerId} ya está en uso.` });
            return;
          }
        }
        dataToUpdate.workerId = cleanWorkerId;
      }

      if (firstName !== undefined) dataToUpdate.firstName = String(firstName).trim();
      if (lastName !== undefined) dataToUpdate.lastName = String(lastName).trim();
      if (validatedRoleCode) {
        dataToUpdate.role = validatedRoleCode;
      }
      if (phone !== undefined) dataToUpdate.phone = phone ? String(phone).trim() : null;
      if (jobTitle !== undefined) {
        dataToUpdate.jobTitle = jobTitle ? String(jobTitle).trim() : null;
      } else if (validatedRoleCode) {
        const targetRole = await prisma.roleDefinition.findFirst({ where: { code: validatedRoleCode } });
        if (targetRole?.description) {
          dataToUpdate.jobTitle = targetRole.description;
        }
      }
      if (status !== undefined) dataToUpdate.status = status;
      if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;

      const updated = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: { roleDefinition: true },
      });

      const updatedUser: ManagedUser = {
        id: updated.id,
        workerId: updated.workerId,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role as UserRole,
        roleName: updated.roleDefinition?.name || updated.role,
        avatarUrl: updated.avatarUrl || undefined,
        status: (updated.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
        phone: updated.phone || undefined,
        jobTitle: updated.jobTitle || undefined,
        lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : undefined,
        createdAt: updated.createdAt.toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente.',
        data: updatedUser,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar usuario.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      // Prevent self-deletion
      if (req.user?.id === id) {
        res.status(400).json({
          success: false,
          error: 'No puedes eliminar tu propia cuenta de usuario activo.',
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              startedRolls: true,
              endedRolls: true,
            },
          },
        },
      });

      if (!existingUser) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        return;
      }

      const totalRolls = (existingUser._count?.startedRolls || 0) + (existingUser._count?.endedRolls || 0);
      if (totalRolls > 0) {
        res.status(400).json({
          success: false,
          error: `No se puede eliminar el usuario [${existingUser.firstName} ${existingUser.lastName}] porque tiene ${totalRolls} rollos vinculados como operario. Puede cambiar su estado a "Inactivo" o "Suspendido" en su lugar.`,
        });
        return;
      }

      await prisma.user.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente de la base de datos.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar usuario.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }
}
