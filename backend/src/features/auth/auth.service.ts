import { randomUUID } from 'crypto';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import { UserPayload, UserRole, AuthResult } from '../../shared/types';
import { supabaseAdmin } from '../../config/supabase';
import { prisma } from '../../config/prisma';
import { resetTokenStore } from './reset-token.store';
import { EmailService } from '../../shared/utils/email.service';
import { sessionManager } from './session.manager';


export class AuthService {
  async resolveRoleInfo(roleCodeOrId: string): Promise<{ roleName?: string; permissions: string[] }> {
    try {
      const roleDef = await prisma.roleDefinition.findFirst({
        where: {
          OR: [
            { code: String(roleCodeOrId).trim().toUpperCase() },
            { id: roleCodeOrId },
          ],
        },
      });

      if (roleDef) {
        let perms = Array.isArray(roleDef.permissions) ? [...roleDef.permissions] : [];
        const codeUpper = roleDef.code.toUpperCase();
        const nameUpper = roleDef.name.toUpperCase();

        // Garantizar que el rol específico Asistente Administrativo cuente siempre con facultades de aprobación y consulta
        if (codeUpper === 'ASISTENTE_ADMINISTRATIVO' || nameUpper === 'ASISTENTE ADMINISTRATIVO') {
          const assistantPerms = ['dashboard:view', 'profile:view', 'production:read', 'production:approve'];
          for (const p of assistantPerms) {
            if (!perms.includes(p)) {
              perms.push(p);
            }
          }
        }

        return {
          roleName: roleDef.name,
          permissions: perms,
        };
      }
    } catch (error) {
      console.error('Error al resolver rol desde base de datos:', error);
    }

    return {
      roleName: undefined,
      permissions: [],
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    let userRow: {
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: string;
      avatarUrl?: string | null;
    } | null = null;

    // 1. Try Prisma lookup
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (dbUser) {
        userRow = {
          id: dbUser.id,
          email: dbUser.email,
          passwordHash: dbUser.passwordHash,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          avatarUrl: dbUser.avatarUrl,
        };
      }
    } catch {}

    // 2. Try Supabase Client fallback lookup
    if (!userRow) {
      try {
        const { data: supaUser, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', normalizedEmail)
          .single();

        if (!error && supaUser) {
          userRow = {
            id: supaUser.id,
            email: supaUser.email,
            passwordHash: supaUser.password_hash,
            firstName: supaUser.first_name || '',
            lastName: supaUser.last_name || '',
            role: supaUser.role,
            avatarUrl: supaUser.avatar_url,
          };
        }
      } catch {}
    }

    if (!userRow) {
      throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    // Verify Password against real password hash
    const isValid = await comparePassword(password, userRow.passwordHash);
    if (!isValid) {
      throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    // Resolver nombre descriptivo y matriz de permisos del rol desde la base de datos
    const { roleName, permissions } = await this.resolveRoleInfo(userRow.role);

    // Iniciar sesión única para el usuario y notificar si había otra sesión previa
    const sessionId = randomUUID();
    sessionManager.startSession(userRow.id, sessionId);

    const userPayload: UserPayload = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role as UserRole,
      roleName,
      permissions,
      firstName: userRow.firstName,
      lastName: userRow.lastName,
      avatarUrl: userRow.avatarUrl || undefined,
      sessionId,
    };

    const token = generateToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    return {
      user: userPayload,
      token,
      accessToken: token,
      refreshToken,
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = 'OPERATOR'
  ): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } }).catch(() => null);
    if (existing) {
      throw new Error(`El correo ${normalizedEmail} ya está registrado.`);
    }

    const passwordHash = await hashPassword(password);

    const normalizedRole = role ? String(role).toUpperCase().trim() : 'OPERATOR';
    const roleRecord = await prisma.roleDefinition.findFirst({
      where: {
        OR: [{ code: normalizedRole }, { id: role }],
      },
    }).catch(() => null);

    const finalRole = roleRecord ? roleRecord.code : normalizedRole;

    const count = await prisma.user.count().catch(() => 0);
    let workerId = `USR-${String(count + 1).padStart(3, '0')}`;
    let counter = count + 1;
    while (await prisma.user.findUnique({ where: { workerId } }).catch(() => null)) {
      counter++;
      workerId = `USR-${String(counter).padStart(3, '0')}`;
    }

    const jobTitleFromRole = roleRecord?.description || null;

    let newUser = await prisma.user.create({
      data: {
        workerId,
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: finalRole,
        jobTitle: jobTitleFromRole,
        status: 'ACTIVE',
      },
    }).catch(() => null);

    if (!newUser) {
      const { data: supaUser, error } = await supabaseAdmin
        .from('users')
        .insert([{
          worker_id: workerId,
          email: normalizedEmail,
          password_hash: passwordHash,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: finalRole,
          job_title: jobTitleFromRole,
          status: 'ACTIVE',
        }])
        .select()
        .single();

      if (error || !supaUser) {
        throw new Error('Error al registrar usuario en la base de datos.');
      }

      newUser = {
        id: supaUser.id,
        workerId: supaUser.worker_id || workerId,
        email: supaUser.email,
        passwordHash: supaUser.password_hash,
        firstName: supaUser.first_name,
        lastName: supaUser.last_name,
        role: supaUser.role,
        status: supaUser.status || 'ACTIVE',
        phone: supaUser.phone || null,
        jobTitle: supaUser.job_title || null,
        avatarUrl: supaUser.avatar_url || null,
        lastLoginAt: null,
        createdAt: new Date(supaUser.created_at),
        updatedAt: new Date(supaUser.created_at),
      };
    }

    const sessionId = randomUUID();
    sessionManager.startSession(newUser.id, sessionId);

    const userPayload: UserPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as UserRole,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatarUrl: newUser.avatarUrl || undefined,
      sessionId,
    };

    const token = generateToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    return {
      user: userPayload,
      token,
      accessToken: token,
      refreshToken,
    };
  }

  async refreshSession(oldRefreshToken: string): Promise<AuthResult> {
    return this.refreshToken(oldRefreshToken);
  }

  async refreshToken(oldRefreshToken: string): Promise<AuthResult> {
    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded || !decoded.id) {
      throw new Error('El Refresh Token ha expirado o es inválido.');
    }

    if (decoded.sessionId && !sessionManager.isValidSession(decoded.id, decoded.sessionId)) {
      throw new Error('Tu sesión ha sido iniciada en otro dispositivo o pestaña.');
    }

    let userRow: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      avatarUrl?: string | null;
    } | null = null;

    // 1. Prisma lookup
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (dbUser) {
        userRow = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          avatarUrl: dbUser.avatarUrl,
        };
      }
    } catch {}

    // 2. Supabase lookup
    if (!userRow) {
      try {
        const { data: supaUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.id)
          .single();

        if (supaUser) {
          userRow = {
            id: supaUser.id,
            email: supaUser.email,
            firstName: supaUser.first_name || '',
            lastName: supaUser.last_name || '',
            role: supaUser.role,
            avatarUrl: supaUser.avatar_url,
          };
        }
      } catch {}
    }

    if (!userRow) {
      throw new Error('Usuario de la sesión no encontrado.');
    }

    const { roleName, permissions } = await this.resolveRoleInfo(userRow.role);

    const userPayload: UserPayload = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role as UserRole,
      roleName,
      permissions,
      firstName: userRow.firstName,
      lastName: userRow.lastName,
      avatarUrl: userRow.avatarUrl || undefined,
      sessionId: decoded.sessionId,
    };

    const newAccessToken = generateToken(userPayload);
    const newRefreshToken = generateRefreshToken(userPayload);

    return {
      user: userPayload,
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getProfile(userId: string): Promise<UserPayload> {
    // 1. Prisma lookup
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (dbUser) {
        const { roleName, permissions } = await this.resolveRoleInfo(dbUser.role);

        return {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role as UserRole,
          roleName,
          permissions,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          avatarUrl: dbUser.avatarUrl || undefined,
        };
      }
    } catch {}

    // 2. Supabase fallback
    try {
      const { data: supaUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (supaUser) {
        const { roleName, permissions } = await this.resolveRoleInfo(supaUser.role);

        return {
          id: supaUser.id,
          email: supaUser.email,
          role: supaUser.role as UserRole,
          roleName,
          permissions,
          firstName: supaUser.first_name || '',
          lastName: supaUser.last_name || '',
          avatarUrl: supaUser.avatar_url || undefined,
        };
      }
    } catch {}

    throw new Error('Usuario no encontrado en la base de datos.');
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string; avatarUrl?: string }
  ): Promise<UserPayload> {
    // 1. Prisma update
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.firstName && { firstName: data.firstName.trim() }),
          ...(data.lastName && { lastName: data.lastName.trim() }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
      });
      const { roleName, permissions } = await this.resolveRoleInfo(updated.role);

      return {
        id: updated.id,
        email: updated.email,
        role: updated.role as UserRole,
        roleName,
        permissions,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl || undefined,
      };
    } catch {}

    // 2. Supabase update
    try {
      const { data: supaUpdated, error } = await supabaseAdmin
        .from('users')
        .update({
          ...(data.firstName && { first_name: data.firstName.trim() }),
          ...(data.lastName && { last_name: data.lastName.trim() }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl }),
        })
        .eq('id', userId)
        .select()
        .single();

      if (!error && supaUpdated) {
        const { roleName, permissions } = await this.resolveRoleInfo(supaUpdated.role);

        return {
          id: supaUpdated.id,
          email: supaUpdated.email,
          role: supaUpdated.role as UserRole,
          roleName,
          permissions,
          firstName: supaUpdated.first_name,
          lastName: supaUpdated.last_name,
          avatarUrl: supaUpdated.avatar_url,
        };
      }
    } catch {}

    throw new Error('No se pudo actualizar el perfil del usuario.');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    let userRow: { id: string; passwordHash: string } | null = null;

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) userRow = { id: dbUser.id, passwordHash: dbUser.passwordHash };
    } catch {}

    if (!userRow) {
      try {
        const { data: supaUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (supaUser) userRow = { id: supaUser.id, passwordHash: supaUser.password_hash };
      } catch {}
    }

    if (!userRow) {
      throw new Error('Usuario no encontrado.');
    }

    const isValid = await comparePassword(currentPassword, userRow.passwordHash);
    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    const newHash = await hashPassword(newPassword);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
      return true;
    } catch {}

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);
      if (!error) return true;
    } catch {}

    throw new Error('No se pudo cambiar la contraseña en la base de datos.');
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user
    let userName = '';
    let exists = false;

    try {
      const dbUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (dbUser) {
        exists = true;
        userName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
      }
    } catch {}

    if (!exists) {
      try {
        const { data: supaUser } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('email', normalizedEmail)
          .single();
        if (supaUser) {
          exists = true;
          userName = `${supaUser.first_name || ''} ${supaUser.last_name || ''}`.trim();
        }
      } catch {}
    }

    // Always proceed cleanly to prevent user enumeration
    if (!exists) {
      return true;
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetTokenStore.set(normalizedEmail, code);

    // Send email with OTP code
    await EmailService.sendPasswordResetCode(normalizedEmail, userName, code);

    return true;
  }

  verifyResetCode(email: string, code: string): { valid: boolean; reason?: string } {
    return resetTokenStore.verify(email, code);
  }

  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify code
    const verification = resetTokenStore.verify(normalizedEmail, code);
    if (!verification.valid) {
      throw new Error(verification.reason || 'Código de verificación inválido o expirado.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const newHash = await hashPassword(newPassword);

    let updated = false;

    try {
      const dbUser = await prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash: newHash },
      });
      if (dbUser) updated = true;
    } catch {}

    if (!updated) {
      try {
        const { error } = await supabaseAdmin
          .from('users')
          .update({ password_hash: newHash })
          .eq('email', normalizedEmail);
        if (!error) updated = true;
      } catch {}
    }

    if (!updated) {
      throw new Error('No se pudo actualizar la contraseña. El usuario no fue encontrado.');
    }

    // Clear code after successful reset
    resetTokenStore.delete(normalizedEmail);

    return true;
  }
}
