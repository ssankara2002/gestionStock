import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserCreateData {
  nom: string;
  email?: string;
  prenom: string;
  adresse: string;
  tel: string;
  password?: string;
  roleId?: number;
  entrepriseId?: number;
}

interface UserUpdateData {
  nom?: string;
  email?: string;
  prenom?: string;
  adresse?: string;
  tel?: string;
  password?: string;
  roleId?: number;
}

const getAllUsers = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { entrepriseId } : {};
  return await prisma.user.findMany({
    where,
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' }
  });
};

const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
      employe: {
        include: {
          absences: true,
          conges: true,
          paiements: true,
        },
      },
      commandes: {
        include: {
          lignes: {
            include: {
              produit: true,
            },
          },
          livraisons: true,
          paiements: true,
        },
      },
    },
  });
};

const createUser = async (data: UserCreateData) => {
  return await prisma.user.create({
    data: {
      nom: data.nom,
      email: data.email,
      prenom: data.prenom,
      adresse: data.adresse,
      tel: data.tel,
      password: data.password,
      roleId: data.roleId,
      entrepriseId: data.entrepriseId,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
};

const updateUser = async (id: number, data: UserUpdateData) => {
  return await prisma.user.update({
    where: { id },
    data: {
      nom: data.nom,
      email: data.email,
      prenom: data.prenom,
      adresse: data.adresse,
      tel: data.tel,
      password: data.password,
      roleId: data.roleId,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
};

const deleteUser = async (id: number) => {
  return await prisma.user.delete({
    where: { id },
  });
};

const getUsersByRole = async (roleId: number) => {
  return await prisma.user.findMany({
    where: { roleId },
    include: {
      role: true,
      employe: true,
    },
    orderBy: { updatedAt: 'desc' }
  });
};

const searchUsers = async (query: string) => {
  const searchCondition = {
    OR: [
      { nom: { contains: query, mode: 'insensitive' as const } },
      { prenom: { contains: query, mode: 'insensitive' as const } },
      { email: { contains: query, mode: 'insensitive' as const } },
      { adresse: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  return await prisma.user.findMany({
    where: searchCondition,
    include: {
      role: true,
    },
    orderBy: { updatedAt: 'desc' }
  });
};

const getUserStatistics = async () => {
  const [total, byRole, employes, clients] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['roleId'],
      _count: { id: true },
    }),
    prisma.employe.count(),
    prisma.user.count({
      where: { employe: null },
    }),
  ]);

  return {
    total,
    byRole,
    employes,
    clients,
  };
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  searchUsers,
  getUserStatistics,
};