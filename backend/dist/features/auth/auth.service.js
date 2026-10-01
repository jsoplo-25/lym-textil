"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt_1 = require("../../shared/utils/jwt");
const password_1 = require("../../shared/utils/password");
const supabase_1 = require("../../config/supabase");
const prisma_1 = require("../../config/prisma");
class AuthService {
    async login(email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        let userRow = null;
        // 1. Try Prisma lookup
        try {
            const dbUser = await prisma_1.prisma.user.findUnique({
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
        }
        catch { }
        // 2. Try Supabase Client fallback lookup
        if (!userRow) {
            try {
                const { data: supaUser, error } = await supabase_1.supabaseAdmin
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
            }
            catch { }
        }
        if (!userRow) {
            throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
        }
        // Verify Password against real password hash
        const isValid = await (0, password_1.comparePassword)(password, userRow.passwordHash);
        if (!isValid) {
            throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
        }
        const userPayload = {
            id: userRow.id,
            email: userRow.email,
            role: userRow.role,
            firstName: userRow.firstName,
            lastName: userRow.lastName,
            avatarUrl: userRow.avatarUrl || undefined,
        };
        const token = (0, jwt_1.generateToken)(userPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(userPayload);
        return {
            user: userPayload,
            token,
            accessToken: token,
            refreshToken,
        };
    }
    async register(email, password, firstName, lastName, role = 'OPERATOR') {
        const normalizedEmail = email.toLowerCase().trim();
        // Check if user already exists
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } }).catch(() => null);
        if (existing) {
            throw new Error(`El correo ${normalizedEmail} ya está registrado.`);
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const normalizedRole = role ? String(role).toUpperCase().trim() : 'OPERATOR';
        const roleRecord = await prisma_1.prisma.roleDefinition.findFirst({
            where: {
                OR: [{ code: normalizedRole }, { id: role }],
            },
        }).catch(() => null);
        const finalRole = roleRecord ? roleRecord.code : normalizedRole;
        let newUser = await prisma_1.prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role: finalRole,
            },
        }).catch(() => null);
        if (!newUser) {
            const { data: supaUser, error } = await supabase_1.supabaseAdmin
                .from('users')
                .insert([{
                    email: normalizedEmail,
                    password_hash: passwordHash,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: finalRole,
                }])
                .select()
                .single();
            if (error || !supaUser) {
                throw new Error('Error al registrar usuario en la base de datos.');
            }
            newUser = {
                id: supaUser.id,
                email: supaUser.email,
                passwordHash: supaUser.password_hash,
                firstName: supaUser.first_name,
                lastName: supaUser.last_name,
                role: supaUser.role,
                avatarUrl: supaUser.avatar_url,
                createdAt: new Date(supaUser.created_at),
                updatedAt: new Date(supaUser.created_at),
            };
        }
        const userPayload = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            avatarUrl: newUser.avatarUrl || undefined,
        };
        const token = (0, jwt_1.generateToken)(userPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(userPayload);
        return {
            user: userPayload,
            token,
            accessToken: token,
            refreshToken,
        };
    }
    async refreshSession(oldRefreshToken) {
        return this.refreshToken(oldRefreshToken);
    }
    async refreshToken(oldRefreshToken) {
        const decoded = (0, jwt_1.verifyRefreshToken)(oldRefreshToken);
        if (!decoded || !decoded.id) {
            throw new Error('El Refresh Token ha expirado o es inválido.');
        }
        let userRow = null;
        // 1. Prisma lookup
        try {
            const dbUser = await prisma_1.prisma.user.findUnique({
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
        }
        catch { }
        // 2. Supabase lookup
        if (!userRow) {
            try {
                const { data: supaUser } = await supabase_1.supabaseAdmin
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
            }
            catch { }
        }
        if (!userRow) {
            throw new Error('Usuario de la sesión no encontrado.');
        }
        const userPayload = {
            id: userRow.id,
            email: userRow.email,
            role: userRow.role,
            firstName: userRow.firstName,
            lastName: userRow.lastName,
            avatarUrl: userRow.avatarUrl || undefined,
        };
        const newAccessToken = (0, jwt_1.generateToken)(userPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(userPayload);
        return {
            user: userPayload,
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    async updateProfile(userId, data) {
        // 1. Prisma update
        try {
            const updated = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(data.firstName && { firstName: data.firstName.trim() }),
                    ...(data.lastName && { lastName: data.lastName.trim() }),
                    ...(data.email && { email: data.email.toLowerCase().trim() }),
                    ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
                },
            });
            return {
                id: updated.id,
                email: updated.email,
                role: updated.role,
                firstName: updated.firstName,
                lastName: updated.lastName,
                avatarUrl: updated.avatarUrl || undefined,
            };
        }
        catch { }
        // 2. Supabase update
        try {
            const { data: supaUpdated, error } = await supabase_1.supabaseAdmin
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
                return {
                    id: supaUpdated.id,
                    email: supaUpdated.email,
                    role: supaUpdated.role,
                    firstName: supaUpdated.first_name,
                    lastName: supaUpdated.last_name,
                    avatarUrl: supaUpdated.avatar_url,
                };
            }
        }
        catch { }
        throw new Error('No se pudo actualizar el perfil del usuario.');
    }
    async changePassword(userId, currentPassword, newPassword) {
        let userRow = null;
        try {
            const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            if (dbUser)
                userRow = { id: dbUser.id, passwordHash: dbUser.passwordHash };
        }
        catch { }
        if (!userRow) {
            try {
                const { data: supaUser } = await supabase_1.supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                if (supaUser)
                    userRow = { id: supaUser.id, passwordHash: supaUser.password_hash };
            }
            catch { }
        }
        if (!userRow) {
            throw new Error('Usuario no encontrado.');
        }
        const isValid = await (0, password_1.comparePassword)(currentPassword, userRow.passwordHash);
        if (!isValid) {
            throw new Error('La contraseña actual es incorrecta.');
        }
        const newHash = await (0, password_1.hashPassword)(newPassword);
        try {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newHash },
            });
            return true;
        }
        catch { }
        try {
            const { error } = await supabase_1.supabaseAdmin
                .from('users')
                .update({ password_hash: newHash })
                .eq('id', userId);
            if (!error)
                return true;
        }
        catch { }
        throw new Error('No se pudo cambiar la contraseña en la base de datos.');
    }
}
exports.AuthService = AuthService;
