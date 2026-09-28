import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import avoirService from '../Services/avoir.service.js';

const prisma = new PrismaClient();

export const createAvoir = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Utilisateur non authentifié.' });
      return;
    }

    const employe = await prisma.employe.findUnique({ where: { userId } });
    if (!employe) {
      res.status(403).json({ success: false, message: "L'utilisateur n'est pas un employé autorisé." });
      return;
    }

    const { commandeId, clientId, motif, type, lignes } = req.body;

    if (!commandeId || !clientId || !type || !lignes || lignes.length === 0) {
      res.status(400).json({ success: false, message: 'commandeId, clientId, type et au moins une ligne sont requis.' });
      return;
    }

    if (!['REMBOURSEMENT', 'CREDIT'].includes(type)) {
      res.status(400).json({ success: false, message: "Le type doit être REMBOURSEMENT ou CREDIT." });
      return;
    }

    const entrepriseId = req.user?.entrepriseId;
    const nouvelAvoir = await avoirService.createAvoir({
      commandeId: Number(commandeId),
      clientId: Number(clientId),
      vendeurId: employe.id,
      entrepriseId,
      motif,
      type,
      lignes,
    });

    res.status(201).json({ success: true, message: 'Avoir créé avec succès.', data: nouvelAvoir });
  } catch (error: any) {
    console.error('Erreur création avoir:', error);
    res.status(400).json({ success: false, message: error.message || 'Erreur interne.' });
  }
};

export const getAllAvoirs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId;
    const avoirs = await avoirService.getAllAvoirs(entrepriseId);
    res.status(200).json({ success: true, data: avoirs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne.' });
  }
};

export const getAvoirById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const avoir = await avoirService.getAvoirById(parseInt(id));
    if (!avoir) {
      res.status(404).json({ success: false, message: 'Avoir introuvable.' });
      return;
    }
    res.status(200).json({ success: true, data: avoir });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne.' });
  }
};

export const getAvoirsByCommande = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commandeId } = req.params;
    const avoirs = await avoirService.getAvoirsByCommande(parseInt(commandeId));
    res.status(200).json({ success: true, data: avoirs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne.' });
  }
};

export const deleteAvoir = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await avoirService.deleteAvoir(parseInt(id));
    res.status(200).json({ success: true, message: 'Avoir supprimé.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erreur interne.' });
  }
};

export const generateAvoirPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const avoirId = parseInt(req.query.id as string);
    if (isNaN(avoirId)) {
      res.status(400).json({ success: false, message: 'ID avoir invalide.' });
      return;
    }
    const pdfBuffer = await avoirService.generateAvoirPdf(avoirId);
    if (!pdfBuffer) {
      res.status(404).json({ success: false, message: 'Avoir introuvable.' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=avoir-${avoirId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur génération PDF avoir:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF.' });
  }
};
