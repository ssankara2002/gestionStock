import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatierePremiereConsommationCreateData {
  productionId: number;
  matierePremiereId: number;
  quantite: number;
}

interface MatierePremiereConsommationUpdateData {
  productionId?: number;
  matierePremiereId?: number;
  quantite?: number;
}

const getAllMatierePremiereConsommations = async () => {
  return await prisma.matierePremiereConsommation.findMany({
    include: {
      production: {
        include: {
          produit: {
            select: {
              id: true,
              libelle: true,
            },
          },
          employe: {
            include: {
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                },
              },
            },
          },
        },
      },
      matierePremiere: {
        select: {
          id: true,
          nom: true,
          quantiteStock: true,
          prixAchat: true,
        },
      },
    },
    orderBy: { id: 'desc' }
  });
};

const getMatierePremiereConsommationById = async (id: number) => {
  return await prisma.matierePremiereConsommation.findUnique({
    where: { id },
    include: {
      production: {
        include: {
          produit: true,
          employe: {
            include: {
              user: true,
            },
          },
        },
      },
      matierePremiere: true,
    },
  });
};

const createMatierePremiereConsommation = async (data: MatierePremiereConsommationCreateData) => {
  return await prisma.matierePremiereConsommation.create({
    data: {
      productionId: data.productionId,
      matierePremiereId: data.matierePremiereId,
      quantite: data.quantite,
    },
    include: {
      production: {
        include: {
          produit: {
            select: {
              id: true,
              libelle: true,
            },
          },
        },
      },
      matierePremiere: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
  });
};

const updateMatierePremiereConsommation = async (id: number, data: MatierePremiereConsommationUpdateData) => {
  return await prisma.matierePremiereConsommation.update({
    where: { id },
    data: {
      productionId: data.productionId,
      matierePremiereId: data.matierePremiereId,
      quantite: data.quantite,
    },
    include: {
      production: {
        include: {
          produit: {
            select: {
              id: true,
              libelle: true,
            },
          },
        },
      },
      matierePremiere: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
  });
};

const deleteMatierePremiereConsommation = async (id: number) => {
  return await prisma.matierePremiereConsommation.delete({
    where: { id },
  });
};

const getConsommationsByProduction = async (productionId: number) => {
  return await prisma.matierePremiereConsommation.findMany({
    where: { productionId },
    include: {
      matierePremiere: true,
    },
    orderBy: { id: 'asc' }
  });
};

const getConsommationsByMatierePremiere = async (matierePremiereId: number) => {
  return await prisma.matierePremiereConsommation.findMany({
    where: { matierePremiereId },
    include: {
      production: {
        include: {
          produit: true,
          employe: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: { id: 'desc' }
  });
};

const getMatierePremiereConsommationStatistics = async () => {
  const [total, totalQuantite, byMatierePremiere, byProduction] = await Promise.all([
    prisma.matierePremiereConsommation.count(),
    prisma.matierePremiereConsommation.aggregate({
      _sum: { quantite: true },
    }),
    prisma.matierePremiereConsommation.groupBy({
      by: ['matierePremiereId'],
      _count: { id: true },
      _sum: { quantite: true },
    }),
    prisma.matierePremiereConsommation.groupBy({
      by: ['productionId'],
      _count: { id: true },
      _sum: { quantite: true },
    }),
  ]);

  return {
    total,
    totalQuantite: totalQuantite._sum.quantite || 0,
    byMatierePremiere,
    byProduction,
  };
};

export default {
  getAllMatierePremiereConsommations,
  getMatierePremiereConsommationById,
  createMatierePremiereConsommation,
  updateMatierePremiereConsommation,
  deleteMatierePremiereConsommation,
  getConsommationsByProduction,
  getConsommationsByMatierePremiere,
  getMatierePremiereConsommationStatistics,
};