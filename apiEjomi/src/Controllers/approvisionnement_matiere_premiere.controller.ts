import { Response } from 'express';
import approvisionnementMatierePremiereService from '../Services/approvisionnement_matiere_premiere.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createApprovisionnementMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fournisseurId, lignes } = req.body;

    // Récupérer l'employeId depuis l'utilisateur connecté
    const userId = req.user?.userId;
    const prismaUser = await prisma.user.findUnique({ where: { id: userId }, include: { employe: true } });
    const employeId = prismaUser?.employe?.id;

    if (!fournisseurId || !lignes || lignes.length === 0) {
      res.status(400).json({ success: false, message: 'Fournisseur et au moins une ligne sont requis.' });
      return;
    }

    if (!employeId) {
      res.status(400).json({ success: false, message: 'Votre compte n\'est pas lié à un employé.' });
      return;
    }

    const newAppro = await approvisionnementMatierePremiereService.create({
      fournisseurId,
      employeId,
      entrepriseId: req.user?.entrepriseId,
      lignes,
    });

    console.log(`[API] Approvisionnement MP #${newAppro.id} créé avec succès.`);
    res.status(201).json({ success: true, message: 'Approvisionnement de matières premières créé avec succès', data: newAppro });
  } catch (error: any) {
    console.error('[API] Erreur lors de la création de l\'approvisionnement de matière première:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const deleteApprovisionnementMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log(`[API] Tentative de suppression de l'approvisionnement MP #${id}`);
    await approvisionnementMatierePremiereService.deleteById(id);
    console.log(`[API] Approvisionnement MP #${id} supprimé avec succès.`);
    res.status(200).json({ success: true, message: 'Approvisionnement supprimé avec succès.' });
  } catch (error: any) {
    console.error(`[API] Erreur lors de la suppression de l'approvisionnement MP #${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const getAllApprovisionnementsMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await approvisionnementMatierePremiereService.getAll(req.query, req.user?.entrepriseId);
    console.log(`[API] Récupération de ${result.data.length} approvisionnements MP sur un total de ${result.pagination.total}.`);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] Erreur lors de la récupération des approvisionnements de matière première:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const getApprovisionnementMatierePremiereById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log(`[API] Recherche de l'approvisionnement MP #${id}`);
    const appro = await approvisionnementMatierePremiereService.getById(id);
    if (!appro) {
      console.warn(`[API] Approvisionnement MP #${id} non trouvé.`);
      res.status(404).json({ success: false, message: 'Approvisionnement non trouvé.' });
      return;
    }
    res.status(200).json({ success: true, data: appro });
  } catch (error: any) {
    console.error(`[API] Erreur lors de la récupération de l'approvisionnement MP #${req.params.id}:`, error);
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const updateApprovisionnementMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;
    console.log(`[API] Tentative de mise à jour de l'approvisionnement MP #${id}`);
    const updatedAppro = await approvisionnementMatierePremiereService.update(id, data);
    console.log(`[API] Approvisionnement MP #${id} mis à jour avec succès.`);
    res.status(200).json({ success: true, message: 'Approvisionnement mis à jour avec succès', data: updatedAppro });
  } catch (error: any) {
    console.error(`[API] Erreur lors de la mise à jour de l'approvisionnement MP #${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};