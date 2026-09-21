import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllPlats = async (entrepriseId?: number) => {
  return prisma.plat.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    orderBy: { updatedAt: 'desc' },
  });
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
  entrepriseId?: number;
}) => {
  return prisma.plat.create({ data });
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
