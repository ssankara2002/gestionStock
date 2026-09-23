import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FournisseurCreateData {
  nom: string;
  email?: string;
  prenom: string;
  adresse: string;
  tel: string;
}

interface FournisseurUpdateData {
  nom?: string;
  email?: string;
  prenom?: string;
  adresse?: string;
  tel?: string;
}

const getAllFournisseurs = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { entrepriseId } : {};
  return await prisma.fournisseur.findMany({
    where,
    include: {
      approvisionnements: {
        select: {
          id: true,
          dateApprovisionnement: true,
          montant: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' }
  });
};

const getFournisseurById = async (id: number) => {
  return await prisma.fournisseur.findUnique({
    where: { id },
    include: {
      approvisionnements: {
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
          lignes: {
            include: {
              produit: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' }
      },
    },
  });
};

const createFournisseur = async (data: FournisseurCreateData & { entrepriseId?: number }) => {
  return await prisma.fournisseur.create({
    data: {
      nom: data.nom,
      email: data.email,
      prenom: data.prenom,
      adresse: data.adresse,
      tel: data.tel,
      entrepriseId: data.entrepriseId || null,
    },
  });
};

const updateFournisseur = async (id: number, data: FournisseurUpdateData) => {
  return await prisma.fournisseur.update({
    where: { id },
    data: {
      nom: data.nom,
      email: data.email,
      prenom: data.prenom,
      adresse: data.adresse,
      tel: data.tel,
    },
  });
};

const deleteFournisseur = async (id: number) => {
  return await prisma.fournisseur.delete({
    where: { id },
  });
};

const searchFournisseurs = async (query: string) => {
  const searchCondition = {
    OR: [
      { nom: { contains: query, mode: 'insensitive' as const } },
      { prenom: { contains: query, mode: 'insensitive' as const } },
      { email: { contains: query, mode: 'insensitive' as const } },
      { adresse: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  return await prisma.fournisseur.findMany({
    where: searchCondition,
    orderBy: { updatedAt: 'desc' }
  });
};

const getFournisseurStatistics = async (entrepriseId?: number) => {
  const w = entrepriseId ? { entrepriseId } : {};

  const [total, totalApprovisionnements, topFournisseurs] = await Promise.all([
    prisma.fournisseur.count({ where: w }),
    prisma.approvisionnement.count({ where: w }),
    prisma.fournisseur.findMany({
      where: w,
      include: { approvisionnements: { where: w, select: { montant: true } } },
    }),
  ]);

  const fournisseurStats = topFournisseurs.map((f: any) => ({
    id: f.id,
    nom: f.nom,
    prenom: f.prenom,
    totalApprovisionnements: f.approvisionnements.length,
    totalMontant: f.approvisionnements.reduce((sum: number, a: any) => sum + a.montant, 0),
  })).sort((a: any, b: any) => b.totalMontant - a.totalMontant).slice(0, 5);

  return { total, totalApprovisionnements, topFournisseurs: fournisseurStats };
};

export default {
  getAllFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  searchFournisseurs,
  getFournisseurStatistics,
};