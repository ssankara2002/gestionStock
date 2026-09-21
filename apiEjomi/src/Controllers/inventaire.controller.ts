import { Response } from 'express';
import inventaireService from '../Services/inventaire.service.js';
import { LieuStock } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const ajusterStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeId, lieu, commentaire, ajustements } = req.body;

    if (!employeId) {
      res.status(400).json({ success: false, message: "L'ID de l'employé est requis." });
      return;
    }

    if (!lieu || !['MAGASIN', 'BOUTIQUE'].includes(lieu)) {
      res.status(400).json({ success: false, message: "Le lieu est requis (MAGASIN ou BOUTIQUE)." });
      return;
    }

    if (!ajustements || !Array.isArray(ajustements) || ajustements.length === 0) {
      res.status(400).json({ success: false, message: 'Aucun ajustement fourni.' });
      return;
    }

    const result = await inventaireService.ajusterStock({ employeId, lieu: lieu as LieuStock, commentaire, ajustements, entrepriseId: req.user?.entrepriseId });
    res.status(200).json({ success: true, message: 'Inventaire effectué avec succès', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const getHistoriqueInventaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { produitId, employeId, lieu, dateDebut, dateFin } = req.query;
    const historique = await inventaireService.getHistoriqueInventaire({
      produitId: produitId ? parseInt(produitId as string, 10) : undefined,
      employeId: employeId ? parseInt(employeId as string, 10) : undefined,
      lieu: lieu ? (lieu as LieuStock) : undefined,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      entrepriseId: req.user?.entrepriseId,
    });

    res.status(200).json({ success: true, data: historique });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getStatistiquesInventaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lieu } = req.query;
    const stats = await inventaireService.getStatistiquesInventaire(lieu ? (lieu as LieuStock) : undefined, req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getProduitsInventaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lieu } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));

    if (lieu && !['MAGASIN', 'BOUTIQUE'].includes(lieu as string)) {
      res.status(400).json({ success: false, message: "lieu doit être MAGASIN ou BOUTIQUE." });
      return;
    }

    const produits = await inventaireService.getProduitsInventaire(lieu as LieuStock | undefined, req.user?.entrepriseId, page, limit);
    res.status(200).json({ success: true, data: produits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lieu } = req.query;
    const sessions = await inventaireService.getSessions(lieu ? (lieu as LieuStock) : undefined, req.user?.entrepriseId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getSessionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = await inventaireService.getSessionById(id);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session inventaire introuvable.' });
      return;
    }

    res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};
