import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface RoleCreateData {
  name: string;
  description?: string;
  entrepriseId?: number | null;
}

interface RoleUpdateData {
  name?: string;
  description?: string;
  entrepriseId?: number | null;
}

const getAllRoles = async (entrepriseId?: number | null) => {
  const where = entrepriseId === undefined || entrepriseId === null
    ? { entrepriseId: null, NOT: { name: 'SUPER_ADMIN' } }
    : { entrepriseId, NOT: { name: 'SUPER_ADMIN' } };

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
  const role = await prisma.role.findUnique({
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

  return role?.name === 'SUPER_ADMIN' ? null : role;
};

const createRole = async (data: RoleCreateData) => {
  return await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      entrepriseId: data.entrepriseId ?? null,
    },
    include: {
      permissions: true,
    },
  });
};

const updateRole = async (id: number, data: RoleUpdateData) => {
  const existingRole = await prisma.role.findUnique({ where: { id }, select: { name: true } });
  if (existingRole?.name === 'SUPER_ADMIN' || data.name === 'SUPER_ADMIN') {
    throw Object.assign(new Error('Le rôle SUPER_ADMIN est protégé'), { code: 'ROLE_PROTECTED' });
  }

  return await prisma.role.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.entrepriseId !== undefined ? { entrepriseId: data.entrepriseId ?? null } : {}),
    },
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
  const existingRole = await prisma.role.findUnique({ where: { id }, select: { name: true } });
  if (existingRole?.name === 'SUPER_ADMIN') {
    throw Object.assign(new Error('Le rôle SUPER_ADMIN est protégé'), { code: 'ROLE_PROTECTED' });
  }

  return await prisma.role.delete({
    where: { id },
  });
};

const assignPermissionsToRole = async (roleId: number, permissionIds: number[]) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true, entrepriseId: true },
  });

  if (!role) {
    throw Object.assign(new Error('Rôle introuvable'), { code: 'P2025' });
  }

  const roleWithName = await prisma.role.findUnique({ where: { id: roleId }, select: { name: true } });
  if (roleWithName?.name === 'SUPER_ADMIN') {
    throw Object.assign(new Error('Le rôle SUPER_ADMIN est protégé'), { code: 'ROLE_PROTECTED' });
  }

  const validPermissions = await prisma.permission.findMany({
    where: {
      id: { in: permissionIds },
      ...(role.entrepriseId === null ? { entrepriseId: null } : { entrepriseId: role.entrepriseId }),
    },
    select: { id: true },
  });

  return await prisma.role.update({
    where: { id: roleId },
    data: {
      permissions: {
        set: validPermissions.map(({ id }) => ({ id })),
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