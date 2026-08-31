import { Request, Response } from 'express';
import transfertService from '../Services/transfert.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTransfert = async (req: Request, res: Response): Promise<void> => {
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

export const getAllTransferts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await transfertService.getAllTransferts(page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getTransfertById = async (req: Request, res: Response): Promise<void> => {
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
