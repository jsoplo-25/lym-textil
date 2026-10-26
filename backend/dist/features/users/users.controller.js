"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const prisma_1 = require("../../config/prisma");
const password_1 = require("../../shared/utils/password");
function validatePeruDocument(docType, docNumber) {
    const cleanNumber = docNumber.trim();
    if (docType === 'DNI') {
        if (!/^\d{8}$/.test(cleanNumber)) {
            return 'El DNI debe contener exactamente 8 dígitos numéricos.';
        }
    }
    else if (docType === 'RUC') {
        if (!/^\d{11}$/.test(cleanNumber)) {
            return 'El RUC debe contener exactamente 11 dígitos numéricos.';
        }
    }
    else if (docType === 'CE') {
        if (!/^[A-Za-z0-9]{8,12}$/.test(cleanNumber)) {
            return 'El Carné de Extranjería (CE) debe contener entre 8 y 12 caracteres alfanuméricos.';
        }
    }
    else if (docType === 'PASAPORTE') {
        if (!/^[A-Za-z0-9]{6,12}$/.test(cleanNumber)) {
            return 'El Pasaporte debe contener entre 6 y 12 caracteres alfanuméricos.';
        }
    }
    return null;
}
class UsersController {
    async getUsers(req, res) {
        const { q, role, status } = req.query;
        let usersList = [];
        try {
            const whereClause = {};
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
                    { documentNumber: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                    { jobTitle: { contains: q, mode: 'insensitive' } },
                ];
            }
            const dbUsers = await prisma_1.prisma.user.findMany({
                where: whereClause,
                include: { roleDefinition: true },
                orderBy: [{ createdAt: 'desc' }],
            });
            if (dbUsers) {
                usersList = dbUsers.map((u) => ({
                    id: u.id,
                    workerId: u.workerId || undefined,
                    documentType: u.documentType || 'DNI',
                    documentNumber: u.documentNumber || undefined,
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                    roleName: u.roleDefinition?.name || u.role,
                    avatarUrl: u.avatarUrl || undefined,
                    status: u.status || 'ACTIVE',
                    phone: u.phone || undefined,
                    jobTitle: u.jobTitle || u.roleDefinition?.description || undefined,
                    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
                    createdAt: u.createdAt.toISOString(),
                }));
            }
        }
        catch (err) {
            console.error('Error al consultar usuarios en Prisma:', err);
        }
        const response = {
            success: true,
            data: usersList,
        };
        res.status(200).json(response);
    }
    async getUserById(req, res) {
        const id = String(req.params.id);
        try {
            const dbUser = await prisma_1.prisma.user.findUnique({
                where: { id },
                include: { roleDefinition: true },
            });
            if (dbUser) {
                const userObj = {
                    id: dbUser.id,
                    workerId: dbUser.workerId || undefined,
                    documentType: dbUser.documentType || 'DNI',
                    documentNumber: dbUser.documentNumber || undefined,
                    email: dbUser.email,
                    firstName: dbUser.firstName,
                    lastName: dbUser.lastName,
                    role: dbUser.role,
                    roleName: dbUser.roleDefinition?.name || dbUser.role,
                    avatarUrl: dbUser.avatarUrl || undefined,
                    status: dbUser.status || 'ACTIVE',
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
        }
        catch (err) {
            console.error('Error al obtener usuario por id:', err);
        }
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }
    async createUser(req, res) {
        try {
            const { email, password, firstName, lastName, role, documentType, documentNumber, workerId, phone, jobTitle, status, avatarUrl, } = req.body;
            if (!email || !password || !firstName || !lastName || !role) {
                res.status(400).json({
                    success: false,
                    error: 'Faltan campos obligatorios (email, password, firstName, lastName, role).',
                });
                return;
            }
            const cleanEmail = String(email).trim().toLowerCase();
            // Check for existing user in database
            const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: cleanEmail } });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    error: `Ya existe un usuario registrado con el correo ${cleanEmail}.`,
                });
                return;
            }
            // Validar tipo y número de documento (Perú)
            const finalDocType = documentType ? String(documentType).trim().toUpperCase() : 'DNI';
            let finalDocNumber = null;
            if (documentNumber) {
                const cleanDoc = String(documentNumber).trim();
                const docError = validatePeruDocument(finalDocType, cleanDoc);
                if (docError) {
                    res.status(400).json({ success: false, error: docError });
                    return;
                }
                const existingDoc = await prisma_1.prisma.user.findFirst({
                    where: { documentNumber: cleanDoc },
                });
                if (existingDoc) {
                    res.status(400).json({
                        success: false,
                        error: `El número de documento "${cleanDoc}" ya se encuentra registrado para otro usuario.`,
                    });
                    return;
                }
                finalDocNumber = cleanDoc;
            }
            // Validar o generar workerId en segundo plano
            let finalWorkerId = workerId ? String(workerId).trim().toUpperCase() : '';
            if (!finalWorkerId) {
                const count = await prisma_1.prisma.user.count();
                finalWorkerId = `USR-${String(count + 1).padStart(3, '0')}`;
                // Si ya existiera ese USR-XXX generado, buscar uno libre
                let counter = count + 1;
                while (await prisma_1.prisma.user.findUnique({ where: { workerId: finalWorkerId } })) {
                    counter++;
                    finalWorkerId = `USR-${String(counter).padStart(3, '0')}`;
                }
            }
            else {
                const existingWorker = await prisma_1.prisma.user.findUnique({ where: { workerId: finalWorkerId } });
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
            const roleExists = await prisma_1.prisma.roleDefinition.findFirst({
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
            const passwordHash = await (0, password_1.hashPassword)(password);
            // Cargar Cargo desde la descripción de funciones del rol
            const finalJobTitle = (jobTitle && String(jobTitle).trim()) || roleExists.description || null;
            const newUser = await prisma_1.prisma.user.create({
                data: {
                    workerId: finalWorkerId,
                    documentType: finalDocType,
                    documentNumber: finalDocNumber,
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
            const createdUser = {
                id: newUser.id,
                workerId: newUser.workerId || undefined,
                documentType: newUser.documentType || 'DNI',
                documentNumber: newUser.documentNumber || undefined,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                roleName: newUser.roleDefinition?.name || roleExists.name,
                avatarUrl: newUser.avatarUrl || undefined,
                status: newUser.status || 'ACTIVE',
                phone: newUser.phone || undefined,
                jobTitle: newUser.jobTitle || undefined,
                createdAt: newUser.createdAt.toISOString(),
            };
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente.',
                data: createdUser,
            });
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al crear usuario.';
            res.status(400).json({
                success: false,
                error: errorMsg,
            });
        }
    }
    async updateUser(req, res) {
        try {
            const id = String(req.params.id);
            const { email, firstName, lastName, role, documentType, documentNumber, workerId, phone, jobTitle, status, avatarUrl, } = req.body;
            const existingUser = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (!existingUser) {
                res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
                return;
            }
            let validatedRoleCode = undefined;
            if (role) {
                const normalizedRole = String(role).toUpperCase().trim();
                const roleExists = await prisma_1.prisma.roleDefinition.findFirst({
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
            const dataToUpdate = {};
            // Tipo de documento
            const targetDocType = documentType !== undefined
                ? String(documentType).trim().toUpperCase()
                : (existingUser.documentType || 'DNI');
            if (documentType !== undefined) {
                dataToUpdate.documentType = targetDocType;
            }
            // Número de documento
            if (documentNumber !== undefined) {
                const cleanDoc = documentNumber ? String(documentNumber).trim() : null;
                if (cleanDoc) {
                    const docError = validatePeruDocument(targetDocType, cleanDoc);
                    if (docError) {
                        res.status(400).json({ success: false, error: docError });
                        return;
                    }
                    if (cleanDoc !== existingUser.documentNumber) {
                        const duplicate = await prisma_1.prisma.user.findFirst({
                            where: { documentNumber: cleanDoc },
                        });
                        if (duplicate && duplicate.id !== id) {
                            res.status(400).json({
                                success: false,
                                error: `El número de documento "${cleanDoc}" ya se encuentra registrado para otro usuario.`,
                            });
                            return;
                        }
                    }
                }
                dataToUpdate.documentNumber = cleanDoc;
            }
            if (email !== undefined) {
                const cleanEmail = String(email).trim().toLowerCase();
                if (!cleanEmail) {
                    res.status(400).json({ success: false, error: 'El correo electrónico no puede estar vacío.' });
                    return;
                }
                if (cleanEmail !== existingUser.email) {
                    const duplicate = await prisma_1.prisma.user.findUnique({ where: { email: cleanEmail } });
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
                    const duplicate = await prisma_1.prisma.user.findUnique({ where: { workerId: cleanWorkerId } });
                    if (duplicate && duplicate.id !== id) {
                        res.status(400).json({ success: false, error: `El ID de trabajador ${cleanWorkerId} ya está en uso.` });
                        return;
                    }
                }
                dataToUpdate.workerId = cleanWorkerId;
            }
            if (firstName !== undefined)
                dataToUpdate.firstName = String(firstName).trim();
            if (lastName !== undefined)
                dataToUpdate.lastName = String(lastName).trim();
            if (validatedRoleCode) {
                dataToUpdate.role = validatedRoleCode;
            }
            if (phone !== undefined)
                dataToUpdate.phone = phone ? String(phone).trim() : null;
            if (jobTitle !== undefined) {
                dataToUpdate.jobTitle = jobTitle ? String(jobTitle).trim() : null;
            }
            else if (validatedRoleCode) {
                const targetRole = await prisma_1.prisma.roleDefinition.findFirst({ where: { code: validatedRoleCode } });
                if (targetRole?.description) {
                    dataToUpdate.jobTitle = targetRole.description;
                }
            }
            if (status !== undefined)
                dataToUpdate.status = status;
            if (avatarUrl !== undefined)
                dataToUpdate.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
            const updated = await prisma_1.prisma.user.update({
                where: { id },
                data: dataToUpdate,
                include: { roleDefinition: true },
            });
            const updatedUser = {
                id: updated.id,
                workerId: updated.workerId || undefined,
                documentType: updated.documentType || 'DNI',
                documentNumber: updated.documentNumber || undefined,
                email: updated.email,
                firstName: updated.firstName,
                lastName: updated.lastName,
                role: updated.role,
                roleName: updated.roleDefinition?.name || updated.role,
                avatarUrl: updated.avatarUrl || undefined,
                status: updated.status || 'ACTIVE',
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
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al actualizar usuario.';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }
    async deleteUser(req, res) {
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
            const existingUser = await prisma_1.prisma.user.findUnique({
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
            await prisma_1.prisma.user.delete({ where: { id } });
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente de la base de datos.',
            });
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al eliminar usuario.';
            res.status(500).json({ success: false, error: errorMsg });
        }
    }
}
exports.UsersController = UsersController;
