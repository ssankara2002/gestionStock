import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CongeCreateData {
  employeId: number;
  type: string;
  dateDebut: Date;
  dateFin: Date;
  description: string;
  statut?: string;
}

interface CongeUpdateData {
  employeId?: number;
  type?: string;
  dateDebut?: Date;
  dateFin?: Date;
  statut?: string;
  description?: string;
}

const getAllConges = async () => {
  return await prisma.conge.findMany({
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
    },
    orderBy: { dateDebut: 'desc' }
  });
};

const getCongeById = async (id: number) => {
  return await prisma.conge.findUnique({
    where: { id },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
  });
};

const createConge = async (data: CongeCreateData) => {
  return await prisma.conge.create({
    data: {
      employeId: data.employeId,
      type: data.type,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      description: data.description,
      statut: data.statut || 'en attente',
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

const updateConge = async (id: number, data: CongeUpdateData) => {
  return await prisma.conge.update({
    where: { id },
    data: {
      employeId: data.employeId,
      type: data.type,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      statut: data.statut,
      description: data.description,
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

const deleteConge = async (id: number) => {
  return await prisma.conge.delete({
    where: { id },
  });
};

const getCongesByEmploye = async (employeId: number) => {
  return await prisma.conge.findMany({
    where: { employeId },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateDebut: 'desc' }
  });
};

const getCongesByStatut = async (statut: string) => {
  return await prisma.conge.findMany({
    where: { statut },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateDebut: 'desc' }
  });
};

const approveConge = async (id: number) => {
  return await updateConge(id, { statut: 'APPROUVE' });
};

const rejectConge = async (id: number) => {
  return await updateConge(id, { statut: 'REFUSE' });
};

const getCongesByDateRange = async (startDate: Date, endDate: Date) => {
  return await prisma.conge.findMany({
    where: {
      dateDebut: { gte: startDate },
      dateFin: { lte: endDate },
    },
    include: {
      employe: {
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } },
        },
      },
    },
    orderBy: { dateDebut: 'desc' },
  });
};

const getCongeStatistics = async () => {
  const [total, byStatut, byType, byEmploye] = await Promise.all([
    prisma.conge.count(),
    prisma.conge.groupBy({
      by: ['statut'],
      _count: { id: true },
    }),
    prisma.conge.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    prisma.conge.groupBy({
      by: ['employeId'],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byStatut,
    byType,
    byEmploye,
  };
};

export default {
  getAllConges,
  getCongeById,
  createConge,
  updateConge,
  deleteConge,
  getCongesByEmploye,
  getCongesByStatut,
  getCongesByDateRange,
  approveConge,
  rejectConge,
  getCongeStatistics,
};