import { PrismaClient } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';

const prisma = new PrismaClient();

interface MatierePremiereCreateData {
  nom: string;
  categorie?: string;
  description?: string;
  quantiteStock: number;
  unite?: string;
  prixAchat: number;
  entrepriseId?: number;
}

interface MatierePremiereUpdateData {
  nom?: string;
  categorie?: string;
  description?: string;
  quantiteStock?: number;
  unite?: string;
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
      orderBy: { id: 'desc' },
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
      unite: data.unite || 'unité',
      prixAchat: data.prixAchat,
      ...(data.entrepriseId ? { entrepriseId: data.entrepriseId } : {}),
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
      unite: data.unite,
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

  // Tableau de bord : valeur du stock, ingrédients les plus bas, achats et consommation du mois
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [matieres, achatsMois, preparationsMois] = await Promise.all([
    prisma.matierePremiere.findMany({
      where: w,
      select: { id: true, nom: true, quantiteStock: true, unite: true, prixAchat: true },
    }),
    prisma.ligneApprovisionnement.aggregate({
      where: {
        matierePremiereId: { not: null },
        approvisionnement: { dateApprovisionnement: { gte: debutMois }, ...(entrepriseId ? { entrepriseId } : {}) },
      },
      _sum: { montant: true },
    }),
    prisma.preparationPlat.findMany({
      where: { datePreparation: { gte: debutMois }, ...(entrepriseId ? { plat: { entrepriseId } } : {}) },
      select: { lignes: { select: { quantiteUtilisee: true, matierePremiere: { select: { prixAchat: true } } } } },
    }),
  ]);

  const valeurStock = matieres.reduce((s, m) => s + Math.max(0, m.quantiteStock) * (m.prixAchat || 0), 0);
  const coutConsommeMois = preparationsMois.reduce(
    (s, p) => s + p.lignes.reduce((t, l) => t + l.quantiteUtilisee * (l.matierePremiere?.prixAchat || 0), 0),
    0,
  );
  const plusBas = [...matieres]
    .filter((m) => m.quantiteStock <= 10)
    .sort((a, b) => a.quantiteStock - b.quantiteStock)
    .slice(0, 5)
    .map((m) => ({ id: m.id, nom: m.nom, quantiteStock: m.quantiteStock, unite: m.unite }));

  return {
    total,
    totalStock: totalStock._sum.quantiteStock || 0,
    lowStock,
    categories: categories.filter((c: any) => c.categorie),
    valeurStock: Math.round(valeurStock),
    enRupture: matieres.filter((m) => m.quantiteStock <= 0).length,
    achatsMois: achatsMois._sum.montant || 0,
    coutConsommeMois: Math.round(coutConsommeMois),
    plusBas,
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