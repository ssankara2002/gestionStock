import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TransfertCreateData {
  produitId: number;
  employeId: number;
  quantite: number;
  sens: 'MAGASIN_VERS_BOUTIQUE' | 'BOUTIQUE_VERS_MAGASIN';
  motif?: string;
  entrepriseId?: number;
}

const createTransfert = async (data: TransfertCreateData) => {
  return prisma.$transaction(async (tx) => {
    const stockMagasin = await tx.stockMagasin.findUnique({
      where: { produitId: data.produitId },
      include: { produit: { select: { libelle: true } } },
    });

    const stockBoutique = await tx.stockBoutique.findUnique({
      where: { produitId: data.produitId },
      include: { produit: { select: { libelle: true } } },
    });

    if (!stockMagasin || !stockBoutique) {
      throw new Error(`Stock introuvable pour le produit ID ${data.produitId}.`);
    }

    if (data.sens === 'MAGASIN_VERS_BOUTIQUE') {
      if (stockMagasin.quantite < data.quantite) {
        throw new Error(
          `Stock magasin insuffisant pour "${stockMagasin.produit.libelle}". Disponible: ${stockMagasin.quantite}, Demandé: ${data.quantite}`
        );
      }
      await tx.stockMagasin.update({
        where: { id: stockMagasin.id },
        data: { quantite: { decrement: data.quantite } },
      });
      await tx.stockBoutique.update({
        where: { id: stockBoutique.id },
        data: { quantite: { increment: data.quantite } },
      });
    } else {
      if (stockBoutique.quantite < data.quantite) {
        throw new Error(
          `Stock boutique insuffisant pour "${stockBoutique.produit.libelle}". Disponible: ${stockBoutique.quantite}, Demandé: ${data.quantite}`
        );
      }
      await tx.stockBoutique.update({
        where: { id: stockBoutique.id },
        data: { quantite: { decrement: data.quantite } },
      });
      await tx.stockMagasin.update({
        where: { id: stockMagasin.id },
        data: { quantite: { increment: data.quantite } },
      });
    }

    const transfert = await tx.transfertStock.create({
      data: {
        produitId: data.produitId,
        employeId: data.employeId,
        quantite: data.quantite,
        sens: data.sens,
        motif: data.motif,
        stockMagasinId: stockMagasin.id,
        stockBoutiqueId: stockBoutique.id,
        entrepriseId: data.entrepriseId,
      },
      include: {
        produit: true,
        employe: { include: { user: true } },
        stockMagasin: true,
        stockBoutique: true,
      },
    });

    return transfert;
  });
};

interface TransfertBulkItem {
  produitId: number;
  quantite: number;
}

const createTransfertBulk = async (items: TransfertBulkItem[], employeId: number, sens: 'MAGASIN_VERS_BOUTIQUE' | 'BOUTIQUE_VERS_MAGASIN', motif?: string, entrepriseId?: number) => {
  return prisma.$transaction(async (tx) => {
    const transferts = [];

    for (const item of items) {
      const stockMagasin = await tx.stockMagasin.findUnique({
        where: { produitId: item.produitId },
        include: { produit: { select: { libelle: true } } },
      });
      const stockBoutique = await tx.stockBoutique.findUnique({
        where: { produitId: item.produitId },
        include: { produit: { select: { libelle: true } } },
      });

      if (!stockMagasin || !stockBoutique) {
        throw new Error(`Stock introuvable pour le produit ID ${item.produitId}.`);
      }

      if (sens === 'MAGASIN_VERS_BOUTIQUE') {
        if (stockMagasin.quantite < item.quantite) {
          throw new Error(
            `Stock magasin insuffisant pour "${stockMagasin.produit.libelle}". Disponible: ${stockMagasin.quantite}, Demandé: ${item.quantite}`
          );
        }
        await tx.stockMagasin.update({ where: { id: stockMagasin.id }, data: { quantite: { decrement: item.quantite } } });
        await tx.stockBoutique.update({ where: { id: stockBoutique.id }, data: { quantite: { increment: item.quantite } } });
      } else {
        if (stockBoutique.quantite < item.quantite) {
          throw new Error(
            `Stock boutique insuffisant pour "${stockBoutique.produit.libelle}". Disponible: ${stockBoutique.quantite}, Demandé: ${item.quantite}`
          );
        }
        await tx.stockBoutique.update({ where: { id: stockBoutique.id }, data: { quantite: { decrement: item.quantite } } });
        await tx.stockMagasin.update({ where: { id: stockMagasin.id }, data: { quantite: { increment: item.quantite } } });
      }

      const transfert = await tx.transfertStock.create({
        data: {
          produitId: item.produitId,
          employeId,
          quantite: item.quantite,
          sens,
          motif,
          stockMagasinId: stockMagasin.id,
          stockBoutiqueId: stockBoutique.id,
          entrepriseId,
        },
        include: {
          produit: true,
          employe: { include: { user: true } },
        },
      });

      transferts.push(transfert);
    }

    return transferts;
  });
};

const getAllTransferts = async (page = 1, limit = 20, entrepriseId?: number) => {
  const skip = (page - 1) * limit;
  const where = entrepriseId ? { entrepriseId } : {};
  const [data, total] = await prisma.$transaction([
    prisma.transfertStock.findMany({
      where,
      skip,
      take: limit,
      include: {
        produit: { select: { id: true, libelle: true, image: true } },
        employe: { include: { user: { select: { nom: true, prenom: true } } } },
        stockMagasin: { select: { quantite: true } },
        stockBoutique: { select: { quantite: true } },
      },
      orderBy: { dateTransfert: 'desc' },
    }),
    prisma.transfertStock.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const getTransfertById = async (id: number) => {
  return prisma.transfertStock.findUnique({
    where: { id },
    include: {
      produit: true,
      employe: { include: { user: true } },
      stockMagasin: true,
      stockBoutique: true,
    },
  });
};

export default { createTransfert, createTransfertBulk, getAllTransferts, getTransfertById };
