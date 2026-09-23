import { PrismaClient, Transaction } from '@prisma/client';

const prisma = new PrismaClient();

interface TransactionCreateData {
  type: string;
  libelle: string;
  montant: number;
  date: Date;
  commandeId?: number;
  approvisionnementId?: number;
  salairePaiementId?: number;
}

interface TransactionUpdateData {
  type?: string;
  libelle?: string;
  montant?: number;
  date?: Date;
  commandeId?: number;
  approvisionnementId?: number;
  salairePaiementId?: number;
}

const getAllTransactions = async (entrepriseId?: number) => {
  return await prisma.transaction.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    include: {
      commande: {
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
      approvisionnement: {
        include: {
          fournisseur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
      salairePaiement: {
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
      },
    },
    orderBy: { date: 'desc' }
  });
};

const getTransactionById = async (id: number) => {
  return await prisma.transaction.findUnique({
    where: { id },
    include: {
      commande: {
        include: {
          client: true,
          vendeur: {
            include: {
              user: true,
            },
          },
        },
      },
      approvisionnement: {
        include: {
          fournisseur: true,
          employe: {
            include: {
              user: true,
            },
          },
        },
      },
      salairePaiement: {
        include: {
          employe: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
};

const createTransaction = async (data: TransactionCreateData) => {
  return await prisma.transaction.create({
    data: {
      type: data.type,
      libelle: data.libelle,
      montant: data.montant,
      date: data.date,
      commandeId: data.commandeId,
      approvisionnementId: data.approvisionnementId,
      salairePaiementId: data.salairePaiementId,
    },
    include: {
      commande: true,
      approvisionnement: true,
      salairePaiement: true,
    },
  });
};

const updateTransaction = async (id: number, data: TransactionUpdateData) => {
  return await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      libelle: data.libelle,
      montant: data.montant,
      date: data.date,
      commandeId: data.commandeId,
      approvisionnementId: data.approvisionnementId,
      salairePaiementId: data.salairePaiementId,
    },
    include: {
      commande: true,
      approvisionnement: true,
      salairePaiement: true,
    },
  });
};

const deleteTransaction = async (id: number) => {
  return await prisma.transaction.delete({
    where: { id },
  });
};

const getTransactionsByType = async (type: string) => {
  return await prisma.transaction.findMany({
    where: { type },
    include: {
      commande: true,
      approvisionnement: true,
      salairePaiement: true,
    },
    orderBy: { date: 'desc' }
  });
};

const getTransactionsByDateRange = async (startDate: Date, endDate: Date) => {
  return await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      commande: true,
      approvisionnement: true,
      salairePaiement: true,
    },
    orderBy: { date: 'desc' }
  });
};

const getTransactionStatistics = async (entrepriseId?: number) => {
  const w = entrepriseId ? { entrepriseId } : {};
  const [total, totalEntrees, totalSorties, byType] = await Promise.all([
    prisma.transaction.count({ where: w }),
    prisma.transaction.aggregate({
      where: { ...w, type: 'ENTREE' },
      _sum: { montant: true },
    }),
    prisma.transaction.aggregate({
      where: { ...w, type: 'SORTIE' },
      _sum: { montant: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: w,
      _count: { id: true },
      _sum: { montant: true },
    }),
  ]);

  const balance = (totalEntrees._sum.montant || 0) - (totalSorties._sum.montant || 0);

  return {
    total,
    totalEntrees: totalEntrees._sum.montant || 0,
    totalSorties: totalSorties._sum.montant || 0,
    balance,
    byType,
  };
};

export default {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByType,
  getTransactionsByDateRange,
  getTransactionStatistics,
};