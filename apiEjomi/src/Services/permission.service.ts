import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionCreateData {
  key: string;
  description?: string;
  entrepriseId?: number | null;
}

interface PermissionUpdateData {
  key?: string;
  description?: string;
  entrepriseId?: number | null;
}

const getAllPermissions = async (entrepriseId?: number | null) => {
  const where = entrepriseId === undefined || entrepriseId === null ? { entrepriseId: null } : { entrepriseId };

  return await prisma.permission.findMany({
    where,
    include: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { key: 'asc' }
  });
};

const getPermissionById = async (id: number) => {
  return await prisma.permission.findUnique({
    where: { id },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const createPermission = async (data: PermissionCreateData) => {
  return await prisma.permission.create({
    data: {
      key: data.key,
      description: data.description,
      entrepriseId: data.entrepriseId ?? null,
    },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const updatePermission = async (id: number, data: PermissionUpdateData) => {
  return await prisma.permission.update({
    where: { id },
    data: {
      ...(data.key !== undefined ? { key: data.key } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.entrepriseId !== undefined ? { entrepriseId: data.entrepriseId ?? null } : {}),
    },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const deletePermission = async (id: number) => {
  return await prisma.permission.delete({
    where: { id },
  });
};

export default {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};