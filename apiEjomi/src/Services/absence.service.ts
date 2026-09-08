import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AbsenceCreateData {
  employeId: number;
  date: Date;
  motif: string;
}

interface AbsenceUpdateData {
  employeId?: number;
  date?: Date;
  motif?: string;
}

const getAllAbsences = async (query: any, entrepriseId?: number) => {
  const { page = 1, limit = 10, searchTerm, employeId, dateDebut, dateFin } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.AbsenceWhereInput = {};

  if (entrepriseId) {
    where.employe = { user: { entrepriseId } };
  }

  if (searchTerm) {
    where.OR = [
      { motif: { contains: searchTerm, mode: 'insensitive' } },
      { employe: { user: { nom: { contains: searchTerm, mode: 'insensitive' } } } },
      { employe: { user: { prenom: { contains: searchTerm, mode: 'insensitive' } } } },
    ];
  }

  if (employeId && employeId !== 'all') {
    where.employeId = Number(employeId);
  }

  if (dateDebut && dateFin) {
    where.date = {
      gte: new Date(dateDebut),
      lte: new Date(dateFin),
    };
  }

  const [absences, total] = await prisma.$transaction([
    prisma.absence.findMany({
      where,
      skip,
      take,
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
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.absence.count({ where }),
  ]);

  return { data: absences, total, page: Number(page), totalPages: Math.ceil(total / take), limit: take };
};

const getAbsenceById = async (id: number) => {
  return await prisma.absence.findUnique({
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

const createAbsence = async (data: AbsenceCreateData) => {
  return await prisma.absence.create({
    data: {
      employeId: data.employeId,
      date: data.date,
      motif: data.motif,
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

const updateAbsence = async (id: number, data: AbsenceUpdateData) => {
  return await prisma.absence.update({
    where: { id },
    data: {
      employeId: data.employeId,
      date: data.date,
      motif: data.motif,
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

const deleteAbsence = async (id: number) => {
  return await prisma.absence.delete({
    where: { id },
  });
};

const getAbsencesByEmploye = async (employeId: number) => {
  return await prisma.absence.findMany({
    where: { employeId },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { date: 'desc' }
  });
};

const getAbsencesByDateRange = async (startDate: Date, endDate: Date) => {
  return await prisma.absence.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { date: 'desc' }
  });
};

const getAbsenceStatistics = async (entrepriseId?: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Résoudre d'abord les employeIds de l'entreprise pour éviter les colonnes ambiguës dans groupBy
  let employeIds: number[] | undefined;
  if (entrepriseId) {
    const employes = await prisma.employe.findMany({
      where: { user: { entrepriseId } },
      select: { id: true },
    });
    employeIds = employes.map(e => e.id);
  }

  const w = employeIds ? { employeId: { in: employeIds } } : {};

  const [total, absencesToday, byMotif] = await Promise.all([
    prisma.absence.count({ where: w }),
    prisma.absence.count({ where: { ...w, date: { gte: today, lt: tomorrow } } }),
    prisma.absence.groupBy({ by: ['motif'], where: w, _count: { id: true } }),
  ]);

  return {
    total,
    absencesToday,
    byMotif,
  };
};

export default {
  getAllAbsences,
  getAbsenceById,
  createAbsence,
  updateAbsence,
  deleteAbsence,
  getAbsencesByEmploye,
  getAbsencesByDateRange,
  getAbsenceStatistics,
};