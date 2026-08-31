import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LigneCommandeCreateData {
  quantiteCommande: number;
  montant: number;
  commandeId: number;
  produitId: number;
}

interface LigneCommandeUpdateData {
  quantiteCommande?: number;
  montant?: number;
  commandeId?: number;
  produitId?: number;
}

const getAllLignesCommande = async () => {
  return await prisma.ligneCommande.findMany({
    include: {
      commande: {
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          vendeur: {
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
      produit: {
        select: {
          id: true,
          libelle: true,
          prixDeVenteUnitaire: true,
        },
      },
    },
    orderBy: { id: 'desc' }
  });
};

const getLigneCommandeById = async (id: number) => {
  return await prisma.ligneCommande.findUnique({
    where: { id },
    include: {
      commande: {
        include: {
          client: true,
          vendeur: {
            include: {
              user: true,
            },
          },
          livraisons: true,
          paiements: true,
        },
      },
      produit: true,
    },
  });
};

const createLigneCommande = async (data: LigneCommandeCreateData) => {
  return await prisma.ligneCommande.create({
    data: {
      quantiteCommande: data.quantiteCommande,
      prixUnitaire: (data.montant ?? 0) / (data.quantiteCommande || 1),
      montant: data.montant ?? 0,
      commandeId: data.commandeId,
      produitId: data.produitId,
    },
    include: {
      commande: {
        include: {
          client: { select: { id: true, nom: true, prenom: true } },
        },
      },
      produit: { select: { id: true, libelle: true } },
    },
  });
};

const updateLigneCommande = async (id: number, data: LigneCommandeUpdateData) => {
  return await prisma.ligneCommande.update({
    where: { id },
    data: {
      quantiteCommande: data.quantiteCommande,
      prixUnitaire: (data.montant ?? 0) / (data.quantiteCommande || 1),
      montant: data.montant ?? 0,
      commandeId: data.commandeId,
      produitId: data.produitId,
    },
    include: {
      commande: {
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
      produit: {
        select: {
          id: true,
          libelle: true,
        },
      },
    },
  });
};

const deleteLigneCommande = async (id: number) => {
  return await prisma.ligneCommande.delete({
    where: { id },
  });
};

const getLignesCommandeByCommande = async (commandeId: number) => {
  return await prisma.ligneCommande.findMany({
    where: { commandeId },
    include: {
      produit: true,
    },
    orderBy: { id: 'asc' }
  });
};

const getLignesCommandeByProduit = async (produitId: number) => {
  return await prisma.ligneCommande.findMany({
    where: { produitId },
    include: {
      commande: {
        include: {
          client: true,
          vendeur: {
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

const getLigneCommandeStatistics = async () => {
  const [total, totalMontant, byProduit, byCommande] = await Promise.all([
    prisma.ligneCommande.count(),
    prisma.ligneCommande.aggregate({
      _sum: {
        montant: true,
        quantiteCommande: true,
      },
    }),
    prisma.ligneCommande.groupBy({
      by: ['produitId'],
      _count: { id: true },
      _sum: {
        montant: true,
        quantiteCommande: true,
      },
    }),
    prisma.ligneCommande.groupBy({
      by: ['commandeId'],
      _count: { id: true },
      _sum: { montant: true },
    }),
  ]);

  return {
    total,
    totalMontant: totalMontant._sum.montant || 0,
    totalQuantite: totalMontant._sum.quantiteCommande || 0,
    byProduit,
    byCommande,
  };
};

export default {
  getAllLignesCommande,
  getLigneCommandeById,
  createLigneCommande,
  updateLigneCommande,
  deleteLigneCommande,
  getLignesCommandeByCommande,
  getLignesCommandeByProduit,
  getLigneCommandeStatistics,
};