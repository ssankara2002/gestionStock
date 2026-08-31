import { PrismaClient } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';

const prisma = new PrismaClient();

interface LigneData {
  matierePremiereId: number;
  quantite: number;
  montant: number;
}

interface ApprovisionnementMatierePremiereCreateData {
  fournisseurId: number;
  employeId: number;
  lignes: LigneData[];
}

interface ApprovisionnementMatierePremiereUpdateData {
  fournisseurId?: number;
  employeId?: number;
  montant?: number;
  lignes?: LigneData[];
}

const create = async (data: ApprovisionnementMatierePremiereCreateData) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Vérifier que toutes les matières premières existent
    for (const ligne of data.lignes) {
      const matiere = await tx.matierePremiere.findUnique({ where: { id: ligne.matierePremiereId } });
      if (!matiere) {
        throw new Error(`La matière première avec l'ID ${ligne.matierePremiereId} n'existe pas.`);
      }
    }

    // 2. Calculer le montant total
    const montantTotal = data.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);

    // 3. Créer l'approvisionnement
    const approvisionnement = await tx.approvisionnement.create({
      data: {
        montant: montantTotal,
        dateApprovisionnement: new Date(), // Utiliser la date actuelle
        fournisseurId: data.fournisseurId,
        employeId: data.employeId,
        lignes: {
          create: data.lignes.map(ligne => ({
            quantite: ligne.quantite,
            prixUnitaire: ligne.montant / (ligne.quantite || 1),
            montant: ligne.montant,
            dateFabrication: null,
            datePeremption: null,
            matierePremiere: {
              connect: { id: ligne.matierePremiereId }
            }
          })),
        },
      },
      include: { lignes: { include: { matierePremiere: true } } },
    });

    // 4. Mettre à jour le stock des matières premières
    for (const ligne of data.lignes) {
      await tx.matierePremiere.update({
        where: { id: ligne.matierePremiereId },
        data: { quantiteStock: { increment: ligne.quantite } },
      });
    }

    return approvisionnement;
  });
};

const getAll = async (queryParams: any) => {
  const { skip, take, page, limit } = getPaginationParams(queryParams);

  // Filtrer pour ne voir que les approvisionnements de matières premières
  const whereClause = { lignes: { some: { matierePremiereId: { not: null } } } };

  const [approvisionnements, total] = await prisma.$transaction([
    prisma.approvisionnement.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { dateApprovisionnement: 'desc' },
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { matierePremiere: true } },
      },
    }),
    prisma.approvisionnement.count({ where: whereClause }),
  ]);

  return createPaginationResult(approvisionnements, total, page, limit);
};

const getById = async (id: number) => {
  return await prisma.approvisionnement.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      employe: { include: { user: true } },
      lignes: { include: { matierePremiere: true } },
    },
  });
};

const update = async (id: number, data: ApprovisionnementMatierePremiereUpdateData) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Récupérer l'ancien approvisionnement pour restaurer le stock
    const ancienApprovisionnement = await tx.approvisionnement.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!ancienApprovisionnement) {
      throw new Error("Approvisionnement introuvable pour la mise à jour.");
    }

    // 2. Restaurer le stock des anciennes lignes
    for (const ligne of ancienApprovisionnement.lignes) {
      if (ligne.matierePremiereId) {
        await tx.matierePremiere.update({
          where: { id: ligne.matierePremiereId },
          data: { quantiteStock: { decrement: ligne.quantite } },
        });
      }
    }

    // 3. Préparer les données de mise à jour
    const updateData: any = {};
    if (data.fournisseurId) updateData.fournisseurId = data.fournisseurId;

    if (data.lignes) {
      // Supprimer les anciennes lignes
      await tx.ligneApprovisionnement.deleteMany({ where: { approvisionnementId: id } });

      // Créer les nouvelles lignes
      updateData.lignes = {
        create: data.lignes.map(ligne => ({
          quantite: ligne.quantite,
          montant: ligne.montant,
          matierePremiere: {
            connect: { id: ligne.matierePremiereId }
          }
        })),
      };

      // Calculer le nouveau montant total et mettre à jour le stock
      updateData.montant = data.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);
      for (const ligne of data.lignes) {
        await tx.matierePremiere.update({
          where: { id: ligne.matierePremiereId },
          data: { quantiteStock: { increment: ligne.quantite } },
        });
      }
    }

    // 5. Mettre à jour l'approvisionnement
    return await tx.approvisionnement.update({
      where: { id },
      data: updateData,
      include: { lignes: { include: { matierePremiere: true } } },
    });
  });
};

const deleteById = async (id: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the supply to be deleted
    const approvisionnement = await tx.approvisionnement.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!approvisionnement) {
      throw new Error("Approvisionnement non trouvé.");
    }

    // 2. Restore the stock for each raw material in the supply
    for (const ligne of approvisionnement.lignes) {
      if (ligne.matierePremiereId) {
        await tx.matierePremiere.update({
          where: { id: ligne.matierePremiereId },
          data: { quantiteStock: { decrement: ligne.quantite } },
        });
      }
    }

    // 3. Delete the supply lines and then the supply itself
    await tx.ligneApprovisionnement.deleteMany({ where: { approvisionnementId: id } });
    return await tx.approvisionnement.delete({ where: { id } });
  });
};

export default {
  create,
  getAll,
  getById,
  update,
  deleteById,
};