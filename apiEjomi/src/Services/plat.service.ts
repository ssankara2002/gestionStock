import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllPlats = async (entrepriseId?: number, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await prisma.$transaction([
    prisma.plat.findMany({
      where: entrepriseId ? { entrepriseId } : {},
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.plat.count({
      where: entrepriseId ? { entrepriseId } : {},
    }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getPlatById = async (id: number, entrepriseId?: number) => {
  return prisma.plat.findFirst({
    where: { id, ...(entrepriseId ? { entrepriseId } : {}) },
  });
};

const createPlat = async (data: {
  libelle: string;
  description?: string | null;
  image?: string | null;
  prixVenteUnitaire: number;
  categorie?: string;
  entrepriseId?: number;
}) => {
  return prisma.plat.create({ data: { ...data, categorie: (data.categorie as any) || 'REPAS' } });
};

const updatePlat = async (id: number, entrepriseId: number | undefined, data: Record<string, unknown>) => {
  const existing = await getPlatById(id, entrepriseId);
  if (!existing) return null;
  return prisma.plat.update({ where: { id }, data });
};

const deletePlat = async (id: number, entrepriseId?: number) => {
  const existing = await getPlatById(id, entrepriseId);
  if (!existing) return null;
  return prisma.plat.delete({ where: { id } });
};

export default { getAllPlats, getPlatById, createPlat, updatePlat, deletePlat };
