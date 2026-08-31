import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConsommationData {
  matierePremiereId: number;
  quantite: number;
}

interface ProductionCreateData {
  produitId: number;
  quantiteFabriquee: number;
  dateProduction?: Date;
  employeId: number;
  lot?: string;
  consommations?: ConsommationData[];
}

interface ProductionUpdateData {
  produitId?: number;
  quantiteFabriquee?: number;
  dateProduction?: Date;
  employeId?: number;
  lot?: string;
  consommations?: ConsommationData[];
}

const getAllProductions = async () => {
  return await prisma.production.findMany({
    include: {
      produit: {
        select: {
          id: true,
          libelle: true,
          
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
      consommations: {
        include: {
          matierePremiere: true,
        },
      },
    },
    orderBy: { dateProduction: 'desc' }
  });
};

const getProductionById = async (id: number) => {
  return await prisma.production.findUnique({
    where: { id },
    include: {
      produit: true,
      employe: {
        include: {
          user: true,
        },
      },
      consommations: {
        include: {
          matierePremiere: true,
        },
      },
    },
  });
};

const createProduction = async (data: ProductionCreateData) => {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Create the production
    const production = await tx.production.create({
      data: {
        produitId: data.produitId,
        quantiteFabriquee: data.quantiteFabriquee,
        dateProduction: data.dateProduction || new Date(),
        employeId: data.employeId,
        lot: data.lot,
      },
      include: {
        produit: {
          select: {
            id: true,
            libelle: true,
            
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
    });

    // If there are consommations, create them and update stock
    if (data.consommations && data.consommations.length > 0) {
      for (const consommation of data.consommations) {
        // Check if matiere premiere exists and has enough stock
        const matiere = await tx.matierePremiere.findUnique({
          where: { id: consommation.matierePremiereId },
        });

        if (!matiere) {
          throw new Error(`Matière première avec l'ID ${consommation.matierePremiereId} introuvable`);
        }

        if (matiere.quantiteStock < consommation.quantite) {
          throw new Error(`Stock insuffisant pour ${matiere.nom}. Disponible: ${matiere.quantiteStock}, Requis: ${consommation.quantite}`);
        }

        // Create the consommation record
        await tx.matierePremiereConsommation.create({
          data: {
            productionId: production.id,
            matierePremiereId: consommation.matierePremiereId,
            quantite: consommation.quantite,
          },
        });

        // Update the stock
        await tx.matierePremiere.update({
          where: { id: consommation.matierePremiereId },
          data: {
            quantiteStock: {
              decrement: consommation.quantite,
            },
          },
        });
      }
    }

    // Incrémenter le stock magasin avec la quantité fabriquée
    await tx.stockMagasin.update({
      where: { produitId: data.produitId },
      data: { quantite: { increment: data.quantiteFabriquee } },
    });

    // Return production with consommations
    return await tx.production.findUnique({
      where: { id: production.id },
      include: {
        produit: {
          select: {
            id: true,
            libelle: true,
            
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
        consommations: {
          include: {
            matierePremiere: true,
          },
        },
      },
    });
  });
};

const updateProduction = async (id: number, data: ProductionUpdateData) => {
  return await prisma.production.update({
    where: { id },
    data: {
      produitId: data.produitId,
      quantiteFabriquee: data.quantiteFabriquee,
      dateProduction: data.dateProduction,
      employeId: data.employeId,
      lot: data.lot,
    },
    include: {
      produit: {
        select: {
          id: true,
          libelle: true,
          
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
  });
};

const deleteProduction = async (id: number) => {
  return await prisma.production.delete({
    where: { id },
  });
};

const getProductionsByProduit = async (produitId: number) => {
  return await prisma.production.findMany({
    where: { produitId },
    include: {
      produit: true,
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateProduction: 'desc' }
  });
};

const getProductionsByEmploye = async (employeId: number) => {
  return await prisma.production.findMany({
    where: { employeId },
    include: {
      produit: true,
      employe: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { dateProduction: 'desc' }
  });
};

const getProductionStatistics = async () => {
  const [total, totalQuantite, byProduit, byEmploye] = await Promise.all([
    prisma.production.count(),
    prisma.production.aggregate({
      _sum: { quantiteFabriquee: true },
    }),
    prisma.production.groupBy({
      by: ['produitId'],
      _count: { id: true },
      _sum: { quantiteFabriquee: true },
    }),
    prisma.production.groupBy({
      by: ['employeId'],
      _count: { id: true },
      _sum: { quantiteFabriquee: true },
    }),
  ]);

  return {
    total,
    totalQuantite: totalQuantite._sum.quantiteFabriquee || 0,
    byProduit,
    byEmploye,
  };
};

export default {
  getAllProductions,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  getProductionsByProduit,
  getProductionsByEmploye,
  getProductionStatistics,
};