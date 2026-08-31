import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SalairePaiementCreateData {
  employeId: number;
  montant: number;
  datePaiement: Date;
  modePaiement: string;
}

interface SalairePaiementUpdateData {
  employeId?: number;
  montant?: number;
  datePaiement?: Date;
  modePaiement?: string;
}

const getAllSalairePaiements = async () => {
  return await prisma.salairePaiement.findMany({
    include: {
      employe: {
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      },
      transactions: {
        select: {
          id: true,
          type: true,
          libelle: true,
          montant: true,
          date: true,
        },
      },
    },
    orderBy: { datePaiement: 'desc' }
  });
};

const getSalairePaiementById = async (id: number) => {
  return await prisma.salairePaiement.findUnique({
    where: { id },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
      transactions: true,
    },
  });
};

const createSalairePaiement = async (data: SalairePaiementCreateData) => {
  return await prisma.salairePaiement.create({
    data: {
      employeId: data.employeId,
      montant: data.montant,
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
    },
    include: {
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
  });
};

const updateSalairePaiement = async (id: number, data: SalairePaiementUpdateData) => {
  return await prisma.salairePaiement.update({
    where: { id },
    data: {
      employeId: data.employeId,
      montant: data.montant,
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
    },
    include: {
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
  });
};

const deleteSalairePaiement = async (id: number) => {
  return await prisma.salairePaiement.delete({
    where: { id },
  });
};

const getSalairePaiementsByEmploye = async (employeId: number) => {
  return await prisma.salairePaiement.findMany({
    where: { employeId },
    include: {
      transactions: true,
    },
    orderBy: { datePaiement: 'desc' }
  });
};

const getSalairePaiementsByDateRange = async (startDate: Date, endDate: Date) => {
  return await prisma.salairePaiement.findMany({
    where: {
      datePaiement: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { datePaiement: 'desc' }
  });
};

const getSalairePaiementStatistics = async () => {
  const [total, totalMontant, byEmploye, byModePaiement] = await Promise.all([
    prisma.salairePaiement.count(),
    prisma.salairePaiement.aggregate({
      _sum: { montant: true },
    }),
    prisma.salairePaiement.groupBy({
      by: ['employeId'],
      _count: { id: true },
      _sum: { montant: true },
    }),
    prisma.salairePaiement.groupBy({
      by: ['modePaiement'],
      _count: { id: true },
      _sum: { montant: true },
    }),
  ]);

  return {
    total,
    totalMontant: totalMontant._sum.montant || 0,
    byEmploye,
    byModePaiement,
  };
};

export default {
  getAllSalairePaiements,
  getSalairePaiementById,
  createSalairePaiement,
  updateSalairePaiement,
  deleteSalairePaiement,
  getSalairePaiementsByEmploye,
  getSalairePaiementsByDateRange,
  getSalairePaiementStatistics,
};