import { PrismaClient, RoleDefinition, Machine, Supplier, ProductionBatch, ProductionRoll, BatchYarn } from '@prisma/client';

export type { RoleDefinition, Machine, Supplier, ProductionBatch, ProductionRoll, BatchYarn };

export const prisma = new PrismaClient();


