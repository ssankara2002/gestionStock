import { Request, Response } from 'express';
import approvisionnementService from '../Services/approvisionnement.service';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';
import { PrismaClient } from '@prisma/client';
import { log } from 'node:console';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getAllApprovisionnements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await approvisionnementService.getAllApprovisionnements(req.query, req.user?.entrepriseId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
console.log(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des approvisionnements', error: error.message });
  }
};

export const getApprovisionnementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const approvisionnement = await approvisionnementService.getApprovisionnementById(parseInt(id));

    if (!approvisionnement) {
      res.status(404).json({ success: false, message: 'Approvisionnement introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: approvisionnement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'approvisionnement", error: error.message });
  }
};

export const createApprovisionnement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fournisseurId, lignes } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
      return;
    }

    // Récupérer l'employé associé à l'utilisateur connecté
    const employe = await prisma.employe.findUnique({
      where: { userId: userId },
    });

    if (!employe) {
      res.status(403).json({ success: false, message: "L'utilisateur connecté n'est pas un employé autorisé." });
      return;
    }

    if (!fournisseurId || !lignes || !Array.isArray(lignes)) {
      res.status(400).json({ success: false, message: 'Les champs fournisseurId et lignes sont obligatoires' });
      return;
    }

    const approvisionnementData = {
      fournisseurId: parseInt(fournisseurId),
      employeId: employe.id,
      entrepriseId: req.user?.entrepriseId || undefined,
      lignes: lignes.map((ligne: any) => ({
        produitId: parseInt(ligne.produitId),
        quantite: parseInt(ligne.quantite),
        prixUnitaire: parseFloat(ligne.prixUnitaire || ligne.montant / ligne.quantite || 0),
        montant: parseFloat(ligne.montant),
        dateFabrication: ligne.dateFabrication ? new Date(ligne.dateFabrication) : undefined,
        datePeremption: ligne.datePeremption ? new Date(ligne.datePeremption) : undefined,
      })),
    };

    console.log('=== CREATE APPRO ===', JSON.stringify(approvisionnementData, null, 2));

    const approvisionnement = await approvisionnementService.createApprovisionnement(approvisionnementData);

    res.status(201).json({ success: true, message: 'Approvisionnement créé avec succès', data: approvisionnement });
  } catch (error: any) {
    console.error('=== ERREUR CREATE APPRO ===');
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.error('meta:', error.meta);
    res.status(500).json({ success: false, message: "Erreur lors de la création de l'approvisionnement", error: error.message });
  }
};

export const updateApprovisionnement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dateApprovisionnement, montant, fournisseurId, employeId, lignes } = req.body;

    const approvisionnementData: any = {};
    if (dateApprovisionnement) approvisionnementData.dateApprovisionnement = new Date(dateApprovisionnement);
    if (montant) approvisionnementData.montant = parseFloat(montant);
    if (fournisseurId) approvisionnementData.fournisseurId = parseInt(fournisseurId);
    if (employeId) approvisionnementData.employeId = parseInt(employeId);

    // Gérer les lignes d'approvisionnement si elles sont fournies
    if (lignes && Array.isArray(lignes)) {
      approvisionnementData.lignes = lignes.map((ligne: any) => ({
        produitId: parseInt(ligne.produitId),
        quantite: parseInt(ligne.quantite),
        prixUnitaire: parseFloat(ligne.prixUnitaire),
        montant: parseFloat(ligne.montant),
        dateFabrication: ligne.dateFabrication ? new Date(ligne.dateFabrication) : undefined,
        datePeremption: ligne.datePeremption ? new Date(ligne.datePeremption) : undefined,
      }));
    }
    const approvisionnement = await approvisionnementService.updateApprovisionnement(parseInt(id), approvisionnementData);

    res.status(200).json({ success: true, message: 'Approvisionnement mis à jour avec succès', data: approvisionnement });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Approvisionnement introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'approvisionnement', error: error.message });
    }
  }
};

export const deleteApprovisionnement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await approvisionnementService.deleteApprovisionnement(parseInt(id));

    res.status(200).json({ success: true, message: 'Approvisionnement supprim� avec succ�s' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Approvisionnement introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'approvisionnement', error: error.message });
    }
  }
};

export const getApprovisionnementsByFournisseur = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fournisseurId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await approvisionnementService.getApprovisionnementsByFournisseur(parseInt(fournisseurId), page, limit);

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des approvisionnements', error: error.message });
  }
};

export const getApprovisionnementsByEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeId } = req.params;
    const approvisionnements = await approvisionnementService.getApprovisionnementsByEmploye(parseInt(employeId));

    res.status(200).json({ success: true, data: approvisionnements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des approvisionnements', error: error.message });
  }
};

export const getApprovisionnementsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Les paramètres startDate et endDate sont obligatoires' });
      return;
    }

    const approvisionnements = await approvisionnementService.getAllApprovisionnements({});

    res.status(200).json({ success: true, data: approvisionnements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des approvisionnements', error: error.message });
  }
};

export const getApprovisionnementStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await approvisionnementService.getApprovisionnementStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};