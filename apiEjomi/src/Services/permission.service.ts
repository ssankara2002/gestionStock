import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionCreateData {
  key: string;
  description?: string;
}

interface PermissionUpdateData {
  key?: string;
  description?: string;
}

const getAllPermissions = async () => {
  return await prisma.permission.findMany({
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
    data,
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
    data,
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