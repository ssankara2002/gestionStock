import { PrismaClient } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';

const prisma = new PrismaClient();

interface MatierePremiereCreateData {
  nom: string;
  categorie?: string;
  description?: string;
  quantiteStock: number;
  prixAchat: number;
}

interface MatierePremiereUpdateData {
  nom?: string;
  categorie?: string;
  description?: string;
  quantiteStock?: number;
  prixAchat?: number;
}

const getAllMatieresPremieres = async (queryParams: any, entrepriseId?: number) => {
  const { skip, take, page, limit } = getPaginationParams(queryParams);
  const where = entrepriseId ? { entrepriseId } : {};

  const [matieres, total] = await prisma.$transaction([
    prisma.matierePremiere.findMany({
      where,
      skip,
      take,
      include: {
        consommations: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.matierePremiere.count({ where }),
  ]);

  return createPaginationResult(matieres, total, page, limit);
};

const getMatierePremiereById = async (id: number) => {
  return await prisma.matierePremiere.findUnique({
    where: { id },
    include: {
      consommations: {
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
      },
      lignesApprovisionnement: { include: { approvisionnement: { include: { fournisseur: true } } } }
    },
  });
};

const createMatierePremiere = async (data: MatierePremiereCreateData) => {
  return await prisma.matierePremiere.create({
    data: {
      nom: data.nom,
      categorie: data.categorie,
      description: data.description,
      quantiteStock: data.quantiteStock,
      prixAchat: data.prixAchat,
    },
  });
};

const updateMatierePremiere = async (id: number, data: MatierePremiereUpdateData) => {
  return await prisma.matierePremiere.update({
    where: { id },
    data: {
      nom: data.nom,
      categorie: data.categorie,
      description: data.description,
      quantiteStock: data.quantiteStock,
      prixAchat: data.prixAchat,
    },
  });
};

const deleteMatierePremiere = async (id: number) => {
  return await prisma.matierePremiere.delete({
    where: { id },
  });
};

const updateMatierePremiereStock = async (id: number, quantite: number, operation: 'add' | 'subtract') => {
  const matiere = await getMatierePremiereById(id);
  if (!matiere) {
    throw new Error('Mati�re premi�re non trouv�e');
  }

  const newQuantite = operation === 'add'
    ? matiere.quantiteStock + quantite
    : matiere.quantiteStock - quantite;

  if (newQuantite < 0) {
    throw new Error('Stock insuffisant');
  }

  return await prisma.matierePremiere.update({
    where: { id },
    data: { quantiteStock: newQuantite },
  });
};

const getMatieresPremieresLowStock = async (seuil = 10) => {
  return await prisma.matierePremiere.findMany({
    where: {
      quantiteStock: {
        lte: seuil,
      },
    },
    orderBy: { quantiteStock: 'asc' }
  });
};

const searchMatieresPremieres = async (query: string) => {
  const searchCondition = {
    OR: [
      { nom: { contains: query, mode: 'insensitive' as const } },
      { categorie: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  return await prisma.matierePremiere.findMany({
    where: searchCondition,
    orderBy: { nom: 'asc' }
  });
};

const getMatierePremiereStatistics = async (entrepriseId?: number) => {
  const w = entrepriseId ? { entrepriseId } : {};

  const [total, totalStock, lowStock, categories] = await Promise.all([
    prisma.matierePremiere.count({ where: w }),
    prisma.matierePremiere.aggregate({ where: w, _sum: { quantiteStock: true } }),
    prisma.matierePremiere.count({ where: { ...w, quantiteStock: { lte: 10 } } }),
    prisma.matierePremiere.groupBy({ by: ['categorie'], where: w, _count: { id: true }, _sum: { quantiteStock: true } }),
  ]);

  return {
    total,
    totalStock: totalStock._sum.quantiteStock || 0,
    lowStock,
    categories: categories.filter((c: any) => c.categorie),
  };
};

export default {
  getAllMatieresPremieres,
  getMatierePremiereById,
  createMatierePremiere,
  updateMatierePremiere,
  deleteMatierePremiere,
  updateMatierePremiereStock,
  getMatieresPremieresLowStock,
  searchMatieresPremieres,
  getMatierePremiereStatistics,
};