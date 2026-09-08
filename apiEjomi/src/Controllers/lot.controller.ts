import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getRapportLots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId;
    const { produitId } = req.query;

    const where: any = {};
    if (produitId) where.produitId = parseInt(produitId as string);
    if (entrepriseId) {
      where.ligneApprovisionnement = {
        approvisionnement: { entrepriseId },
      };
    }

    const lots = await prisma.lotStock.findMany({
      where,
      include: {
        produit: {
          select: { id: true, libelle: true, prixDeVenteUnitaire: true, entrepriseId: true },
        },
        ligneApprovisionnement: {
          include: {
            approvisionnement: {
              select: { id: true, dateApprovisionnement: true, entrepriseId: true },
            },
            stockMagasin: { select: { quantite: true } },
          },
        },
      },
      orderBy: [{ produitId: 'asc' }, { dateAppro: 'asc' }],
    });

    const result = lots.map((lot) => {
      const quantiteVendue = lot.quantiteInitiale - lot.quantiteRestante;
      const prixVente = lot.produit.prixDeVenteUnitaire;
      const margeUnitaire = prixVente - lot.prixAchat;
      const margeRealisee = quantiteVendue * margeUnitaire;
      const margePotentielle = lot.quantiteRestante * margeUnitaire;
      const margeTotale = lot.quantiteInitiale * margeUnitaire;
      const tauxMarge = lot.prixAchat > 0 ? ((margeUnitaire / lot.prixAchat) * 100) : 0;
      const statut = lot.quantiteRestante === 0 ? 'EPUISE' : lot.quantiteRestante === lot.quantiteInitiale ? 'INTACT' : 'PARTIEL';

      return {
        id: lot.id,
        produit: lot.produit,
        dateAppro: lot.dateAppro,
        approvisionnementId: lot.ligneApprovisionnement.approvisionnement.id,
        prixAchat: lot.prixAchat,
        prixVente,
        margeUnitaire,
        tauxMarge: parseFloat(tauxMarge.toFixed(1)),
        quantiteInitiale: lot.quantiteInitiale,
        quantiteVendue,
        quantiteRestante: lot.quantiteRestante,
        margeRealisee,
        margePotentielle,
        margeTotale,
        statut,
      };
    });

    // Totaux globaux
    const totaux = result.reduce(
      (acc, lot) => ({
        quantiteInitiale: acc.quantiteInitiale + lot.quantiteInitiale,
        quantiteVendue: acc.quantiteVendue + lot.quantiteVendue,
        quantiteRestante: acc.quantiteRestante + lot.quantiteRestante,
        margeRealisee: acc.margeRealisee + lot.margeRealisee,
        margePotentielle: acc.margePotentielle + lot.margePotentielle,
        margeTotale: acc.margeTotale + lot.margeTotale,
      }),
      { quantiteInitiale: 0, quantiteVendue: 0, quantiteRestante: 0, margeRealisee: 0, margePotentielle: 0, margeTotale: 0 }
    );

    res.status(200).json({ success: true, data: result, totaux });
  } catch (error: any) {
    console.error('Erreur rapport lots:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};
