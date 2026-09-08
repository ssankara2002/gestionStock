import { PrismaClient, LieuStock } from '@prisma/client';

const prisma = new PrismaClient();

interface AjustementInput {
  produitId: number;
  quantiteTheorique: number;
  quantitePhysique: number;
  ecart: number;
  commentaire?: string;
}

interface InventaireInput {
  employeId: number;
  lieu: LieuStock;
  commentaire?: string;
  ajustements: AjustementInput[];
  entrepriseId?: number;
}

const ajusterStock = async (data: InventaireInput) => {
  const { employeId, lieu, ajustements } = data;

  if (!ajustements || ajustements.length === 0) {
    throw new Error('Aucun ajustement à effectuer.');
  }

  return prisma.$transaction(async (tx) => {
    const dateInventaire = new Date();

    // 1. Créer la session d'inventaire
    const session = await tx.sessionInventaire.create({
      data: {
        dateDebut: dateInventaire,
        lieu,
        statut: 'EN_COURS',
        commentaire: data.commentaire,
        employeId,
        entrepriseId: data.entrepriseId,
      },
    });

    // 2. Pour chaque ajustement, mettre à jour le stock et enregistrer l'historique
    for (const ajustement of ajustements) {
      if (lieu === 'BOUTIQUE') {
        const stockBoutique = await tx.stockBoutique.findUnique({
          where: { produitId: ajustement.produitId },
          include: { produit: { select: { libelle: true } } },
        });

        if (!stockBoutique) {
          throw new Error(`Aucun stock boutique trouvé pour le produit ID ${ajustement.produitId}.`);
        }

        await tx.stockBoutique.update({
          where: { id: stockBoutique.id },
          data: { quantite: ajustement.quantitePhysique },
        });

        await tx.historiqueInventaire.create({
          data: {
            dateInventaire,
            lieuInventaire: lieu,
            quantiteTheorique: ajustement.quantiteTheorique,
            quantitePhysique: ajustement.quantitePhysique,
            ecart: ajustement.ecart,
            commentaire: ajustement.commentaire || `Inventaire boutique du ${dateInventaire.toLocaleDateString('fr-FR')}`,
            produitId: ajustement.produitId,
            employeId,
            sessionInventaireId: session.id,
            stockBoutiqueId: stockBoutique.id,
          },
        });
      } else {
        const stockMagasin = await tx.stockMagasin.findUnique({
          where: { produitId: ajustement.produitId },
          include: { produit: { select: { libelle: true } } },
        });

        if (!stockMagasin) {
          throw new Error(`Aucun stock magasin trouvé pour le produit ID ${ajustement.produitId}.`);
        }

        await tx.stockMagasin.update({
          where: { id: stockMagasin.id },
          data: { quantite: ajustement.quantitePhysique },
        });

        await tx.historiqueInventaire.create({
          data: {
            dateInventaire,
            lieuInventaire: lieu,
            quantiteTheorique: ajustement.quantiteTheorique,
            quantitePhysique: ajustement.quantitePhysique,
            ecart: ajustement.ecart,
            commentaire: ajustement.commentaire || `Inventaire magasin du ${dateInventaire.toLocaleDateString('fr-FR')}`,
            produitId: ajustement.produitId,
            employeId,
            sessionInventaireId: session.id,
            stockMagasinId: stockMagasin.id,
          },
        });
      }
    }

    // 3. Clôturer la session
    const sessionTerminee = await tx.sessionInventaire.update({
      where: { id: session.id },
      data: { dateFin: new Date(), statut: 'TERMINE' },
      include: { lignes: { include: { produit: true } } },
    });

    return sessionTerminee;
  });
};

const getHistoriqueInventaire = async (filters: {
  produitId?: number;
  employeId?: number;
  lieu?: LieuStock;
  dateDebut?: Date;
  dateFin?: Date;
  entrepriseId?: number;
}) => {
  const where: any = {};

  if (filters.produitId) where.produitId = filters.produitId;
  if (filters.employeId) where.employeId = filters.employeId;
  if (filters.lieu) where.lieuInventaire = filters.lieu;
  if (filters.dateDebut || filters.dateFin) {
    where.dateInventaire = {};
    if (filters.dateDebut) where.dateInventaire.gte = filters.dateDebut;
    if (filters.dateFin) where.dateInventaire.lte = filters.dateFin;
  }
  if (filters.entrepriseId) {
    where.session = { entrepriseId: filters.entrepriseId };
  }

  const result = await prisma.historiqueInventaire.findMany({
    where,
    include: {
      produit: true,
      employe: { include: { user: true } },
      session: true,
      stockMagasin: true,
      stockBoutique: true,
    },
    orderBy: { dateInventaire: 'desc' },
  });
  return result;
};

const getSessions = async (lieu?: LieuStock, entrepriseId?: number) => {
  const where: any = {};
  if (lieu) where.lieu = lieu;
  if (entrepriseId) where.entrepriseId = entrepriseId;
  return prisma.sessionInventaire.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      employe: { include: { user: true } },
      lignes: { include: { produit: true } },
    },
    orderBy: { dateDebut: 'desc' },
  });
};

const getSessionById = async (id: number) => {
  return prisma.sessionInventaire.findUnique({
    where: { id },
    include: {
      employe: { include: { user: true } },
      lignes: {
        include: {
          produit: true,
          stockMagasin: true,
          stockBoutique: true,
        },
      },
    },
  });
};

const getProduitsInventaire = async (lieu?: LieuStock, entrepriseId?: number) => {
  const produitSelect = {
    id: true,
    libelle: true,
    prixDeVenteUnitaire: true,
    prixAchatUnitaire: true,
  };

  const produitWhere = entrepriseId ? { entrepriseId } : {};

  if (lieu === 'BOUTIQUE') {
    return prisma.stockBoutique.findMany({
      where: entrepriseId ? { produit: produitWhere } : undefined,
      include: { produit: { select: produitSelect } },
      orderBy: { produit: { libelle: 'asc' } },
    });
  }

  if (lieu === 'MAGASIN') {
    return prisma.stockMagasin.findMany({
      where: entrepriseId ? { produit: produitWhere } : undefined,
      include: { produit: { select: produitSelect } },
      orderBy: { produit: { libelle: 'asc' } },
    });
  }

  // Sans lieu : retourne tous les produits avec les deux stocks
  return prisma.produit.findMany({
    where: produitWhere,
    select: {
      id: true,
      libelle: true,
      prixDeVenteUnitaire: true,
      prixAchatUnitaire: true,
      stockMagasin: { select: { id: true, quantite: true, seuilAlerte: true } },
      stockBoutique: { select: { id: true, quantite: true, seuilAlerte: true } },
    },
    orderBy: { libelle: 'asc' },
  });
};

const getStatistiquesInventaire = async (lieu?: LieuStock, entrepriseId?: number) => {
  const whereHist: any = {};
  if (lieu) whereHist.lieuInventaire = lieu;
  if (entrepriseId) whereHist.session = { entrepriseId };

  const whereSession: any = {};
  if (lieu) whereSession.lieu = lieu;
  if (entrepriseId) whereSession.entrepriseId = entrepriseId;

  // Résoudre les produitIds pour éviter colonnes ambiguës dans groupBy
  let produitIds: number[] | undefined;
  if (entrepriseId) {
    const ps = await prisma.produit.findMany({ where: { entrepriseId }, select: { id: true } });
    produitIds = ps.map(p => p.id);
  }
  const whereHistGroupBy: any = { ...whereHist };
  if (produitIds) whereHistGroupBy.produitId = { in: produitIds };

  const [totalAjustements, ecartParProduit, sessionsParStatut] = await prisma.$transaction([
    prisma.historiqueInventaire.count({ where: whereHistGroupBy }),
    prisma.historiqueInventaire.groupBy({
      by: ['produitId'],
      where: whereHistGroupBy,
      _sum: { ecart: true },
      _count: { id: true },
      orderBy: { _sum: { ecart: 'desc' } },
    }),
    prisma.sessionInventaire.groupBy({
      by: ['statut'],
      where: whereSession,
      _count: { id: true },
      orderBy: { _count: { statut: 'desc' } },
    }),
  ]);

  const produitsIds = ecartParProduit.map((e) => e.produitId);
  const produits = await prisma.produit.findMany({
    where: { id: { in: produitsIds } },
    select: { id: true, libelle: true },
  });

  return {
    totalAjustements,
    ecartParProduit: ecartParProduit.map((e) => ({
      produit: produits.find((p) => p.id === e.produitId) || null,
      ecartTotal: (e._sum as any)?.ecart || 0,
      nombreInventaires: (e._count as any)?.id || 0,
    })),
    sessionsParStatut: sessionsParStatut.map((s) => ({
      statut: s.statut,
      count: (s._count as any)?.id || 0,
    })),
  };
};

export default {
  ajusterStock,
  getHistoriqueInventaire,
  getSessions,
  getSessionById,
  getProduitsInventaire,
  getStatistiquesInventaire,
};
