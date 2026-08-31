import { PrismaClient } from '@prisma/client';
import { sanitizeObject } from '../utils/sanitizer.js';

const prisma = new PrismaClient();

interface ProduitCreateData {
  libelle: string;
  image?: string;
  description?: string;
  prixDeVenteUnitaire: number;
  prixAchatUnitaire: number;
  seuilAlerteMagasin?: number;
  seuilAlerteBoutique?: number;
}

interface ProduitUpdateData {
  libelle?: string;
  image?: string;
  description?: string;
  prixDeVenteUnitaire?: number;
  prixAchatUnitaire?: number;
  seuilAlerteMagasin?: number;
  seuilAlerteBoutique?: number;
}

const getAllProduits = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { entrepriseId } : {};
  return prisma.produit.findMany({
    where,
    include: {
      stockMagasin: true,
      stockBoutique: true,
      lignesCommande: { select: { id: true, quantiteCommande: true, montant: true } },
      lignesApprovisionnement: { select: { id: true, quantite: true, montant: true } },
      productions: { select: { id: true, quantiteFabriquee: true, dateProduction: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const getProduitById = async (id: number) => {
  return prisma.produit.findUnique({
    where: { id },
    include: {
      stockMagasin: true,
      stockBoutique: true,
      lignesCommande: {
        include: {
          commande: {
            include: {
              client: true,
              vendeur: { include: { user: true } },
            },
          },
        },
      },
      lignesApprovisionnement: {
        include: {
          approvisionnement: { include: { fournisseur: true } },
        },
      },
      productions: {
        include: { employe: { include: { user: true } } },
      },
    },
  });
};

const createProduit = async (data: ProduitCreateData & { entrepriseId?: number }) => {
  const prepared = {
    libelle: String(data.libelle || '').replace(/\x00/g, ''),
    image: data.image ? String(data.image).replace(/\x00/g, '') : null,
    description: data.description ? String(data.description).replace(/\x00/g, '') : null,
    prixDeVenteUnitaire: Number(data.prixDeVenteUnitaire) || 0,
    prixAchatUnitaire: Number(data.prixAchatUnitaire) || 0,
    entrepriseId: data.entrepriseId || null,
  };

  const safe = sanitizeObject(prepared) as any;

  // Créer le produit + ses entrées stock magasin et boutique en une transaction
  return prisma.$transaction(async (tx) => {
    const produit = await tx.produit.create({ data: safe });

    await tx.stockMagasin.create({
      data: { produitId: produit.id, quantite: 0, seuilAlerte: Number(data.seuilAlerteMagasin) || 10 },
    });

    await tx.stockBoutique.create({
      data: { produitId: produit.id, quantite: 0, seuilAlerte: Number(data.seuilAlerteBoutique) || 5 },
    });

    return tx.produit.findUnique({
      where: { id: produit.id },
      include: { stockMagasin: true, stockBoutique: true },
    });
  });
};

const updateProduit = async (id: number, data: ProduitUpdateData) => {
  const partial: any = {};
  if (data.libelle !== undefined) partial.libelle = String(data.libelle).replace(/\x00/g, '');
  if (data.image !== undefined) partial.image = data.image !== null ? String(data.image).replace(/\x00/g, '') : null;
  if (data.description !== undefined) partial.description = data.description !== null ? String(data.description).replace(/\x00/g, '') : null;
  if (data.prixDeVenteUnitaire !== undefined) partial.prixDeVenteUnitaire = Number(data.prixDeVenteUnitaire);
  if (data.prixAchatUnitaire !== undefined) partial.prixAchatUnitaire = Number(data.prixAchatUnitaire);

  const safePartial = sanitizeObject(partial) as any;

  const hasStockUpdate = data.seuilAlerteMagasin !== undefined || data.seuilAlerteBoutique !== undefined;

  if (Object.keys(safePartial).length === 0 && !hasStockUpdate) {
    throw new Error('Aucun champ fourni pour la mise à jour.');
  }

  return prisma.$transaction(async (tx) => {
    if (Object.keys(safePartial).length > 0) {
      await tx.produit.update({ where: { id }, data: safePartial });
    }

    if (data.seuilAlerteMagasin !== undefined) {
      await tx.stockMagasin.updateMany({
        where: { produitId: id },
        data: { seuilAlerte: Number(data.seuilAlerteMagasin) },
      });
    }
    if (data.seuilAlerteBoutique !== undefined) {
      await tx.stockBoutique.updateMany({
        where: { produitId: id },
        data: { seuilAlerte: Number(data.seuilAlerteBoutique) },
      });
    }

    return tx.produit.findUnique({
      where: { id },
      include: { stockMagasin: true, stockBoutique: true },
    });
  });
};

const deleteProduit = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    await tx.stockMagasin.deleteMany({ where: { produitId: id } });
    await tx.stockBoutique.deleteMany({ where: { produitId: id } });
    return tx.produit.delete({ where: { id } });
  });
};

const getLowStockProduits = async (seuil = 10) => {
  const [magasin, boutique] = await Promise.all([
    prisma.stockMagasin.findMany({
      where: { quantite: { lte: seuil } },
      include: { produit: true },
      orderBy: { quantite: 'asc' },
    }),
    prisma.stockBoutique.findMany({
      where: { quantite: { lte: seuil } },
      include: { produit: true },
      orderBy: { quantite: 'asc' },
    }),
  ]);
  return { magasin, boutique };
};

const searchProduits = async (query: string) => {
  return prisma.produit.findMany({
    where: {
      OR: [
        { libelle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { stockMagasin: true, stockBoutique: true },
    orderBy: { updatedAt: 'desc' },
  });
};

const getProduitStatistics = async () => {
  const [total, stockMagasinAgg, stockBoutiqueAgg, lowStockMagasin, lowStockBoutique] = await Promise.all([
    prisma.produit.count(),
    prisma.stockMagasin.aggregate({ _sum: { quantite: true } }),
    prisma.stockBoutique.aggregate({ _sum: { quantite: true } }),
    prisma.stockMagasin.count({ where: { quantite: { lte: 10 } } }),
    prisma.stockBoutique.count({ where: { quantite: { lte: 5 } } }),
  ]);

  // Top 5 produits les plus vendus
  const topVentes = await prisma.ligneCommande.groupBy({
    by: ['produitId'],
    _sum: { quantiteCommande: true },
    orderBy: { _sum: { quantiteCommande: 'desc' } },
    take: 5,
  });

  const produitsTop = await prisma.produit.findMany({
    where: { id: { in: topVentes.map((t) => t.produitId) } },
    include: { stockMagasin: true, stockBoutique: true },
  });

  const topProducts = topVentes.map((t) => {
    const produit = produitsTop.find((p) => p.id === t.produitId);
    return {
      id: t.produitId,
      libelle: produit?.libelle || '',
      stockMagasin: produit?.stockMagasin?.quantite ?? 0,
      stockBoutique: produit?.stockBoutique?.quantite ?? 0,
      totalVendu: t._sum.quantiteCommande || 0,
    };
  });

  const [produitsStockFaibleBoutique, produitsStockFaibleMagasin] = await Promise.all([
    prisma.stockBoutique.findMany({
      where: { quantite: { lte: 5 } },
      include: {
        produit: {
          select: {
            id: true, libelle: true, prixDeVenteUnitaire: true,
            stockMagasin: { select: { quantite: true } },
          },
        },
      },
      orderBy: { quantite: 'asc' },
    }),
    prisma.stockMagasin.findMany({
      where: { quantite: { lte: 5 } },
      include: {
        produit: {
          select: {
            id: true, libelle: true, prixDeVenteUnitaire: true,
            stockBoutique: { select: { quantite: true } },
          },
        },
      },
      orderBy: { quantite: 'asc' },
    }),
  ]);

  return {
    total,
    totalStockMagasin: stockMagasinAgg._sum.quantite || 0,
    totalStockBoutique: stockBoutiqueAgg._sum.quantite || 0,
    lowStockMagasin,
    lowStockBoutique,
    topProducts,
    produitsStockFaible: produitsStockFaibleBoutique,
    produitsStockFaibleMagasin,
  };
};

export default {
  getAllProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  getLowStockProduits,
  searchProduits,
  getProduitStatistics,
};
