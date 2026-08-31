import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LigneApprovisionnementCreateData {
  quantite: number;
  montant: number;
  produitId: number;
  approvisionnementId: number;
}

interface LigneApprovisionnementUpdateData {
  quantite?: number;
  montant?: number;
  produitId?: number;
  approvisionnementId?: number;
}

const getAllLignesApprovisionnement = async () => {
  return await prisma.ligneApprovisionnement.findMany({
    include: {
      produit: {
        select: {
          id: true,
          libelle: true,
          prixAchatUnitaire: true,
        },
      },
      approvisionnement: {
        include: {
          fournisseur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
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
    orderBy: { id: 'desc' }
  });
};

const getLigneApprovisionnementById = async (id: number) => {
  return await prisma.ligneApprovisionnement.findUnique({
    where: { id },
    include: {
      produit: true,
      approvisionnement: {
        include: {
          fournisseur: true,
          employe: {
            include: {
              user: true,
            },
          },
          transactions: true,
        },
      },
    },
  });
};

const createLigneApprovisionnement = async (data: LigneApprovisionnementCreateData) => {
  return await prisma.ligneApprovisionnement.create({
    data: {
      quantite: data.quantite,
      prixUnitaire: data.montant / (data.quantite || 1),
      montant: data.montant,
      dateFabrication: null,
      datePeremption: null,
      produitId: data.produitId,
      approvisionnementId: data.approvisionnementId,
    },
    include: {
      produit: {
        select: {
          id: true,
          libelle: true,
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
    },
  });
};

const updateLigneApprovisionnement = async (id: number, data: LigneApprovisionnementUpdateData) => {
  return await prisma.ligneApprovisionnement.update({
    where: { id },
    data: {
      quantite: data.quantite,
      montant: data.montant,
      produitId: data.produitId,
      approvisionnementId: data.approvisionnementId,
    },
    include: {
      produit: {
        select: {
          id: true,
          libelle: true,
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
    },
  });
};

const deleteLigneApprovisionnement = async (id: number) => {
  return await prisma.ligneApprovisionnement.delete({
    where: { id },
  });
};

const getLignesApprovisionnementByApprovisionnement = async (approvisionnementId: number) => {
  return await prisma.ligneApprovisionnement.findMany({
    where: { approvisionnementId },
    include: {
      produit: true,
    },
    orderBy: { id: 'asc' }
  });
};

const getLignesApprovisionnementByProduit = async (produitId: number) => {
  return await prisma.ligneApprovisionnement.findMany({
    where: { produitId },
    include: {
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
    },
    orderBy: { id: 'desc' }
  });
};

const getLigneApprovisionnementStatistics = async () => {
  const [total, totalMontant, byProduit, byApprovisionnement] = await Promise.all([
    prisma.ligneApprovisionnement.count(),
    prisma.ligneApprovisionnement.aggregate({
      _sum: {
        montant: true,
        quantite: true,
      },
    }),
    prisma.ligneApprovisionnement.groupBy({
      by: ['produitId'],
      _count: { id: true },
      _sum: {
        montant: true,
        quantite: true,
      },
    }),
    prisma.ligneApprovisionnement.groupBy({
      by: ['approvisionnementId'],
      _count: { id: true },
      _sum: { montant: true },
    }),
  ]);

  return {
    total,
    totalMontant: totalMontant._sum.montant || 0,
    totalQuantite: totalMontant._sum.quantite || 0,
    byProduit,
    byApprovisionnement,
  };
};

export default {
  getAllLignesApprovisionnement,
  getLigneApprovisionnementById,
  createLigneApprovisionnement,
  updateLigneApprovisionnement,
  deleteLigneApprovisionnement,
  getLignesApprovisionnementByApprovisionnement,
  getLignesApprovisionnementByProduit,
  getLigneApprovisionnementStatistics,
};