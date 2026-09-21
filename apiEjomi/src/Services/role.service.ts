import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface RoleCreateData {
  name: string;
  description?: string;
}

interface RoleUpdateData {
  name?: string;
  description?: string;
}

const getAllRoles = async (entrepriseId?: number | null) => {
  const where = entrepriseId === undefined ? { entrepriseId: null } : { entrepriseId };

  return await prisma.role.findMany({
    where,
    include: {
      permissions: true,
      users: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
    orderBy: { name: 'asc' }
  });
};

const getRoleById = async (id: number) => {
  return await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true,
      users: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
  });
};

const createRole = async (data: RoleCreateData) => {
  return await prisma.role.create({
    data,
    include: {
      permissions: true,
    },
  });
};

const updateRole = async (id: number, data: RoleUpdateData) => {
  return await prisma.role.update({
    where: { id },
    data,
    include: {
      permissions: true,
      users: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
  });
};

const deleteRole = async (id: number) => {
  return await prisma.role.delete({
    where: { id },
  });
};

const assignPermissionsToRole = async (roleId: number, permissionIds: number[]) => {
  return await prisma.role.update({
    where: { id: roleId },
    data: {
      permissions: {
        set: permissionIds.map(id => ({ id })),
      },
    },
    include: {
      permissions: true,
    },
  });
};

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
};