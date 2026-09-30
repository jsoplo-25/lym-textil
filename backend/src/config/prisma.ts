import { PrismaClient, RoleDefinition } from '@prisma/client';

export type { RoleDefinition };

export const prisma = new PrismaClient();
