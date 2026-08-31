import { PrismaClient } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';

const prisma = new PrismaClient();

interface LigneApproInput {
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  dateFabrication?: Date;
  datePeremption?: Date;
}

interface ApprovisionnementCreateData {
  fournisseurId: number;
  employeId: number;
  lignes: LigneApproInput[];
}

interface ApprovisionnementUpdateData {
  fournisseurId?: number;
  employeId?: number;
  lignes?: LigneApproInput[];
}

const getAllApprovisionnements = async (queryParams: any, entrepriseId?: number) => {
  const { skip, take, page, limit } = getPaginationParams(queryParams);
  const whereClause: any = { lignes: { some: { produitId: { not: null } } } };
  if (entrepriseId) whereClause.entrepriseId = entrepriseId;

  const [data, total] = await prisma.$transaction([
    prisma.approvisionnement.findMany({
      skip,
      take,
      where: whereClause,
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { produit: true, stockMagasin: true } },
        transactions: true,
      },
      orderBy: { dateApprovisionnement: 'desc' },
    }),
    prisma.approvisionnement.count({ where: whereClause }),
  ]);

  return createPaginationResult(data, total, page, limit);
};

const getApprovisionnementById = async (id: number) => {
  return prisma.approvisionnement.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      employe: { include: { user: true } },
      lignes: { include: { produit: true, stockMagasin: true } },
      transactions: true,
    },
  });
};

const createApprovisionnement = async (data: ApprovisionnementCreateData & { entrepriseId?: number }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Vérifier que tous les produits et leur stock magasin existent
    for (const ligne of data.lignes) {
      const stockMagasin = await tx.stockMagasin.findUnique({
        where: { produitId: ligne.produitId },
        include: { produit: { select: { libelle: true } } },
      });

      if (!stockMagasin) {
        throw new Error(`Aucun stock magasin trouvé pour le produit ID ${ligne.produitId}.`);
      }
    }

    // 2. Calculer le montant total
    const montantTotal = data.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);

    // 3. Créer l'approvisionnement (lieu MAGASIN par défaut)
    const approvisionnement = await tx.approvisionnement.create({
      data: {
        dateApprovisionnement: new Date(),
        montant: montantTotal,
        lieu: 'MAGASIN',
        fournisseurId: data.fournisseurId,
        employeId: data.employeId,
        entrepriseId: data.entrepriseId || null,
      },
    });

    // 4. Créer les lignes avec lien vers StockMagasin et incrémenter le stock
    for (const ligne of data.lignes) {
      const stockMagasin = await tx.stockMagasin.findUnique({
        where: { produitId: ligne.produitId },
      });

      await tx.ligneApprovisionnement.create({
        data: {
          approvisionnementId: approvisionnement.id,
          produitId: ligne.produitId,
          stockMagasinId: stockMagasin!.id,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montant: ligne.montant,
          dateFabrication: ligne.dateFabrication || null,
          datePeremption: ligne.datePeremption || null,
        },
      });

      await tx.stockMagasin.update({
        where: { id: stockMagasin!.id },
        data: { quantite: { increment: ligne.quantite } },
      });
    }

    return tx.approvisionnement.findUnique({
      where: { id: approvisionnement.id },
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { produit: true, stockMagasin: true } },
      },
    });
  });
};

const updateApprovisionnement = async (id: number, data: ApprovisionnementUpdateData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Récupérer l'ancien approvisionnement
    const ancienAppro = await tx.approvisionnement.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!ancienAppro) {
      throw new Error('Approvisionnement introuvable pour la mise à jour.');
    }

    // 2. Restaurer le stock magasin des anciennes lignes
    for (const ligne of ancienAppro.lignes) {
      if (ligne.stockMagasinId) {
        await tx.stockMagasin.update({
          where: { id: ligne.stockMagasinId },
          data: { quantite: { decrement: ligne.quantite } },
        });
      }
    }

    const updateData: any = {};
    if (data.fournisseurId) updateData.fournisseurId = data.fournisseurId;
    if (data.employeId) updateData.employeId = data.employeId;

    if (data.lignes) {
      // Vérifier que tous les stocks magasin existent
      for (const ligne of data.lignes) {
        const stockMagasin = await tx.stockMagasin.findUnique({
          where: { produitId: ligne.produitId },
          include: { produit: { select: { libelle: true } } },
        });

        if (!stockMagasin) {
          throw new Error(`Aucun stock magasin trouvé pour le produit ID ${ligne.produitId}.`);
        }
      }

      // Supprimer les anciennes lignes
      await tx.ligneApprovisionnement.deleteMany({ where: { approvisionnementId: id } });

      // Recalculer le montant
      updateData.montant = data.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);

      // Mettre à jour l'approvisionnement
      await tx.approvisionnement.update({ where: { id }, data: updateData });

      // Créer les nouvelles lignes et incrémenter le stock magasin
      for (const ligne of data.lignes) {
        const stockMagasin = await tx.stockMagasin.findUnique({
          where: { produitId: ligne.produitId },
        });

        await tx.ligneApprovisionnement.create({
          data: {
            approvisionnementId: id,
            produitId: ligne.produitId,
            stockMagasinId: stockMagasin!.id,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montant: ligne.montant,
            dateFabrication: ligne.dateFabrication || null,
          datePeremption: ligne.datePeremption || null,
          },
        });

        await tx.stockMagasin.update({
          where: { id: stockMagasin!.id },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
    } else {
      await tx.approvisionnement.update({ where: { id }, data: updateData });
    }

    return tx.approvisionnement.findUnique({
      where: { id },
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { produit: true, stockMagasin: true } },
      },
    });
  });
};

const deleteApprovisionnement = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const approvisionnement = await tx.approvisionnement.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!approvisionnement) return null;

    // Restaurer le stock magasin (décrémenter car on annule l'appro)
    for (const ligne of approvisionnement.lignes) {
      if (ligne.stockMagasinId) {
        await tx.stockMagasin.update({
          where: { id: ligne.stockMagasinId },
          data: { quantite: { decrement: ligne.quantite } },
        });
      }
    }

    await tx.transaction.deleteMany({ where: { approvisionnementId: id } });
    await tx.ligneApprovisionnement.deleteMany({ where: { approvisionnementId: id } });

    return tx.approvisionnement.delete({ where: { id } });
  });
};

const getApprovisionnementsByFournisseur = async (fournisseurId: number, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const where = { fournisseurId };
  const [data, total] = await prisma.$transaction([
    prisma.approvisionnement.findMany({
      where,
      skip,
      take: limit,
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { produit: true, stockMagasin: true } },
      },
      orderBy: { dateApprovisionnement: 'desc' },
    }),
    prisma.approvisionnement.count({ where }),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const getApprovisionnementsByEmploye = async (employeId: number, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const where = { employeId };
  const [data, total] = await prisma.$transaction([
    prisma.approvisionnement.findMany({
      where,
      skip,
      take: limit,
      include: {
        fournisseur: true,
        employe: { include: { user: true } },
        lignes: { include: { produit: true, stockMagasin: true } },
      },
      orderBy: { dateApprovisionnement: 'desc' },
    }),
    prisma.approvisionnement.count({ where }),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const getApprovisionnementStatistics = async () => {
  const [total, totalMontant, averageMontant, topFournisseurs, topEmployes] = await Promise.all([
    prisma.approvisionnement.count(),
    prisma.approvisionnement.aggregate({ _sum: { montant: true } }),
    prisma.approvisionnement.aggregate({ _avg: { montant: true } }),
    prisma.approvisionnement.groupBy({
      by: ['fournisseurId'],
      _count: { id: true },
      _sum: { montant: true },
    }),
    prisma.approvisionnement.groupBy({
      by: ['employeId'],
      _count: { id: true },
      _sum: { montant: true },
    }),
  ]);

  return {
    total,
    totalMontant: totalMontant._sum.montant || 0,
    averageMontant: averageMontant._avg.montant || 0,
    topFournisseurs,
    topEmployes,
  };
};

export default {
  getAllApprovisionnements,
  getApprovisionnementById,
  createApprovisionnement,
  updateApprovisionnement,
  deleteApprovisionnement,
  getApprovisionnementsByFournisseur,
  getApprovisionnementsByEmploye,
  getApprovisionnementStatistics,
};
