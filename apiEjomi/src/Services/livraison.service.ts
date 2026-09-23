import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LivraisonCreateData {
  dateLivraison?: Date;
  statut?: string;
  adresse: string;
  commandeId: number;
  livreurId?: number;
}

interface LivraisonUpdateData {
  dateLivraison?: Date;
  statut?: string;
  adresse?: string;
  commandeId?: number;
  livreurId?: number;
}

const getAllLivraisons = async (entrepriseId?: number) => {
  return await prisma.livraison.findMany({
    where: entrepriseId ? { commande: { entrepriseId } } : {},
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
        },
      },
      livreur: {
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
    orderBy: { dateLivraison: 'desc' }
  });
};

const getLivraisonById = async (id: number) => {
  return await prisma.livraison.findUnique({
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
          lignes: {
            include: {
              produit: true,
            },
          },
        },
      },
      livreur: {
        include: {
          user: true,
        },
      },
    },
  });
};

const createLivraison = async (data: LivraisonCreateData) => {
  return await prisma.livraison.create({
    data: {
      dateLivraison: data.dateLivraison || new Date(),
      statut: (data.statut as any) || 'EN_ATTENTE',
      adresse: data.adresse,
      commandeId: data.commandeId,
      livreurId: data.livreurId,
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
      livreur: {
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

const updateLivraison = async (id: number, data: LivraisonUpdateData) => {
  return await prisma.livraison.update({
    where: { id },
    data: {
      dateLivraison: data.dateLivraison,
      statut: data.statut as any,
      adresse: data.adresse,
      commandeId: data.commandeId,
      livreurId: data.livreurId,
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
      livreur: {
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

const deleteLivraison = async (id: number) => {
  return await prisma.livraison.delete({
    where: { id },
  });
};

const getLivraisonsByCommande = async (commandeId: number) => {
  return await prisma.livraison.findMany({
    where: { commandeId },
    include: {
      commande: true,
      livreur: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateLivraison: 'desc' }
  });
};

const getLivraisonsByLivreur = async (livreurId: number) => {
  return await prisma.livraison.findMany({
    where: { livreurId },
    include: {
      commande: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { dateLivraison: 'desc' }
  });
};

const getLivraisonsByStatut = async (statut: string) => {
  return await prisma.livraison.findMany({
    where: { statut: statut as any },
    include: {
      commande: {
        include: {
          client: true,
        },
      },
      livreur: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateLivraison: 'desc' }
  });
};

const getLivraisonStatistics = async (entrepriseId?: number) => {
  let commandeIds: number[] | undefined;
  if (entrepriseId) {
    const cmds = await prisma.commande.findMany({ where: { entrepriseId }, select: { id: true } });
    commandeIds = cmds.map(c => c.id);
  }
  const w = commandeIds ? { commandeId: { in: commandeIds } } : {};

  const [total, byStatut, byLivreur] = await Promise.all([
    prisma.livraison.count({ where: w }),
    prisma.livraison.groupBy({ by: ['statut'], where: w, _count: { id: true } }),
    prisma.livraison.groupBy({ by: ['livreurId'], where: w, _count: { id: true } }),
  ]);

  return { total, byStatut, byLivreur };
};

export default {
  getAllLivraisons,
  getLivraisonById,
  createLivraison,
  updateLivraison,
  deleteLivraison,
  getLivraisonsByCommande,
  getLivraisonsByLivreur,
  getLivraisonsByStatut,
  getLivraisonStatistics,
};