import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse, UserRole } from '../../shared/types';
import { supabaseAdmin } from '../../config/supabase';
import { prisma } from '../../config/prisma';
import { hashPassword } from '../../shared/utils/password';

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

interface SupabaseUserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export class UsersController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { q, role } = req.query as { q?: string; role?: string };

    let usersList: ManagedUser[] = [];

    // 1. Try Prisma Primary Query
    try {
      const whereClause: Prisma.UserWhereInput = {};

      if (role && role !== 'ALL') {
        whereClause.role = role;
      }

      if (q) {
        whereClause.OR = [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ];
      }

      const dbUsers = await prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      if (dbUsers) {
        usersList = dbUsers.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as UserRole,
          avatarUrl: u.avatarUrl || undefined,
          status: 'ACTIVE',
          createdAt: u.createdAt.toISOString(),
        }));
      }
    } catch {
      // 2. Supabase Fallback Query if Prisma fails
      try {
        let query = supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name, role, avatar_url, created_at')
          .order('created_at', { ascending: false });

        if (role && role !== 'ALL') {
          query = query.eq('role', role);
        }

        if (q) {
          query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
        }

        const { data: supaUsers, error } = await query;

        if (!error && supaUsers) {
          usersList = (supaUsers as SupabaseUserRow[]).map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name || '',
            lastName: u.last_name || '',
            role: u.role as UserRole,
            avatarUrl: u.avatar_url || undefined,
            status: 'ACTIVE',
            createdAt: u.created_at,
          }));
        }
      } catch {}
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
      const dbUser = await prisma.user.findUnique({ where: { id } });
      if (dbUser) {
        res.status(200).json({
          success: true,
          data: {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role as UserRole,
            avatarUrl: dbUser.avatarUrl || undefined,
            status: 'ACTIVE',
            createdAt: dbUser.createdAt.toISOString(),
          },
        });
        return;
      }
    } catch {}

    try {
      const { data: supaUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (supaUser) {
        const row = supaUser as SupabaseUserRow;
        res.status(200).json({
          success: true,
          data: {
            id: row.id,
            email: row.email,
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            role: row.role as UserRole,
            avatarUrl: row.avatar_url || undefined,
            status: 'ACTIVE',
            createdAt: row.created_at,
          },
        });
        return;
      }
    } catch {}

    res.status(404).json({ success: false, error: 'Usuario no encontrado en la base de datos.' });
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, avatarUrl } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({
          success: false,
          error: 'Email, contraseña, nombres, apellidos y rol son requeridos.',
        });
        return;
      }

      // Check for existing user in database
      const existingUser = await prisma.user.findUnique({ where: { email } }).catch(() => null);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: `Ya existe un usuario registrado con el correo ${email}.`,
        });
        return;
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
          error: `El rol [${role}] no existe en la tabla de Roles. Crea primero el rol o utiliza uno existente.`,
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      let createdUser: ManagedUser | null = null;

      // 1. Try Prisma
      try {
        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: roleExists.code,
            avatarUrl,
          },
        });
        createdUser = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role as UserRole,
          avatarUrl: newUser.avatarUrl || undefined,
          status: 'ACTIVE',
          createdAt: newUser.createdAt.toISOString(),
        };
      } catch {
        // 2. Try Supabase fallback
        const { data: supaUser, error } = await supabaseAdmin
          .from('users')
          .insert([
            {
              email,
              password_hash: passwordHash,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              role,
              avatar_url: avatarUrl,
            },
          ])
          .select()
          .single();

        if (!error && supaUser) {
          const row = supaUser as SupabaseUserRow;
          createdUser = {
            id: row.id,
            email: row.email,
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            role: row.role as UserRole,
            avatarUrl: row.avatar_url || undefined,
            status: 'ACTIVE',
            createdAt: row.created_at,
          };
        }
      }

      if (!createdUser) {
        res.status(500).json({
          success: false,
          error: 'No se pudo guardar el usuario en la base de datos.',
        });
        return;
      }

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
      const { email, firstName, lastName, role, avatarUrl, status } = req.body;

      let updatedUser: ManagedUser | null = null;

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

      // 1. Try Prisma
      try {
        const updated = await prisma.user.update({
          where: { id },
          data: {
            ...(email && { email: email.trim() }),
            ...(firstName && { firstName: firstName.trim() }),
            ...(lastName && { lastName: lastName.trim() }),
            ...(validatedRoleCode && { role: validatedRoleCode }),
            ...(avatarUrl !== undefined && { avatarUrl }),
          },
        });
        updatedUser = {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role as UserRole,
          avatarUrl: updated.avatarUrl || undefined,
          status: status || 'ACTIVE',
          createdAt: updated.createdAt.toISOString(),
        };
      } catch {
        // 2. Try Supabase fallback
        const { data: supaUpdated, error } = await supabaseAdmin
          .from('users')
          .update({
            ...(email && { email: email.trim() }),
            ...(firstName && { first_name: firstName.trim() }),
            ...(lastName && { last_name: lastName.trim() }),
            ...(role && { role }),
            ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && supaUpdated) {
          const row = supaUpdated as SupabaseUserRow;
          updatedUser = {
            id: row.id,
            email: row.email,
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            role: row.role as UserRole,
            avatarUrl: row.avatar_url || undefined,
            status: status || 'ACTIVE',
            createdAt: row.created_at,
          };
        }
      }

      if (!updatedUser) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado para actualizar.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente.',
        data: updatedUser,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar usuario.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
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

      let deleted = false;

      // Try Prisma
      try {
        await prisma.user.delete({ where: { id } });
        deleted = true;
      } catch {}

      // Try Supabase
      if (!deleted) {
        try {
          const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
          if (!error) deleted = true;
        } catch {}
      }

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'El usuario no existe o ya fue eliminado.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente de la base de datos.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar usuario.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }
}
