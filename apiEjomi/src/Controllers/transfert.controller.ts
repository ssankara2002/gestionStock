import { Response } from 'express';
import transfertService from '../Services/transfert.service.js';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const createTransfert = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employe = await prisma.employe.findUnique({ where: { userId: user.userId } });
    if (!employe) {
      res.status(403).json({ success: false, message: "Seul un employé peut effectuer un transfert." });
      return;
    }

    const { produitId, quantite, sens, motif } = req.body;

    if (!produitId || !quantite || !sens) {
      res.status(400).json({ success: false, message: "produitId, quantite et sens sont requis." });
      return;
    }

    if (!['MAGASIN_VERS_BOUTIQUE', 'BOUTIQUE_VERS_MAGASIN'].includes(sens)) {
      res.status(400).json({ success: false, message: "sens doit être MAGASIN_VERS_BOUTIQUE ou BOUTIQUE_VERS_MAGASIN." });
      return;
    }

    const transfert = await transfertService.createTransfert({
      produitId: parseInt(produitId),
      employeId: employe.id,
      quantite: parseInt(quantite),
      sens,
      motif,
      entrepriseId: req.user?.entrepriseId,
    });

    res.status(201).json({ success: true, message: 'Transfert effectué avec succès', data: transfert });
  } catch (error: any) {
    const isMetier = error.message?.includes('Stock') || error.message?.includes('introuvable');
    res.status(isMetier ? 400 : 500).json({
      success: false,
      message: error.message || 'Erreur lors du transfert.',
    });
  }
};

export const createTransfertBulk = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employe = await prisma.employe.findUnique({ where: { userId: user.userId } });
    if (!employe) {
      res.status(403).json({ success: false, message: "Seul un employé peut effectuer un transfert." });
      return;
    }

    const { lignes, sens, motif } = req.body;

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ success: false, message: "Au moins une ligne de produit est requise." });
      return;
    }
    if (!sens || !['MAGASIN_VERS_BOUTIQUE', 'BOUTIQUE_VERS_MAGASIN'].includes(sens)) {
      res.status(400).json({ success: false, message: "sens doit être MAGASIN_VERS_BOUTIQUE ou BOUTIQUE_VERS_MAGASIN." });
      return;
    }
    for (const ligne of lignes) {
      if (!ligne.produitId || !ligne.quantite || parseInt(ligne.quantite) <= 0) {
        res.status(400).json({ success: false, message: "Chaque ligne doit avoir un produitId et une quantité > 0." });
        return;
      }
    }

    const items = lignes.map((l: any) => ({ produitId: parseInt(l.produitId), quantite: parseInt(l.quantite) }));
    const transferts = await transfertService.createTransfertBulk(items, employe.id, sens, motif, req.user?.entrepriseId);

    res.status(201).json({ success: true, message: `${transferts.length} transfert(s) effectué(s) avec succès`, data: transferts });
  } catch (error: any) {
    const isMetier = error.message?.includes('Stock') || error.message?.includes('introuvable');
    res.status(isMetier ? 400 : 500).json({ success: false, message: error.message || 'Erreur lors du transfert.' });
  }
};

export const getAllTransferts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await transfertService.getAllTransferts(page, limit, req.user?.entrepriseId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getTransfertById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const transfert = await transfertService.getTransfertById(id);
    if (!transfert) {
      res.status(404).json({ success: false, message: 'Transfert introuvable.' });
      return;
    }
    res.status(200).json({ success: true, data: transfert });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};
