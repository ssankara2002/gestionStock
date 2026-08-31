import { Request, Response } from 'express';
import matierePremiereConsommationService from '../Services/matiere_premiere_consommation.service';

export const getAllMatierePremiereConsommations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const consommations = await matierePremiereConsommationService.getAllMatierePremiereConsommations();
    res.status(200).json({ success: true, data: consommations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des consommations', error: error.message });
  }
};

export const getMatierePremiereConsommationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const consommation = await matierePremiereConsommationService.getMatierePremiereConsommationById(parseInt(id));

    if (!consommation) {
      res.status(404).json({ success: false, message: 'Consommation introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: consommation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la consommation', error: error.message });
  }
};

export const createMatierePremiereConsommation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productionId, matierePremiereId, quantite } = req.body;

    if (!productionId || !matierePremiereId || !quantite) {
      res.status(400).json({ success: false, message: 'Les champs productionId, matierePremiereId et quantite sont obligatoires' });
      return;
    }

    const consommationData = {
      productionId: parseInt(productionId),
      matierePremiereId: parseInt(matierePremiereId),
      quantite: parseInt(quantite),
    };

    const consommation = await matierePremiereConsommationService.createMatierePremiereConsommation(consommationData);

    res.status(201).json({ success: true, message: 'Consommation créée avec succès', data: consommation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la consommation', error: error.message });
  }
};

export const updateMatierePremiereConsommation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productionId, matierePremiereId, quantite } = req.body;

    const consommationData: any = {};
    if (productionId) consommationData.productionId = parseInt(productionId);
    if (matierePremiereId) consommationData.matierePremiereId = parseInt(matierePremiereId);
    if (quantite) consommationData.quantite = parseInt(quantite);

    const consommation = await matierePremiereConsommationService.updateMatierePremiereConsommation(parseInt(id), consommationData);

    res.status(200).json({ success: true, message: 'Consommation mise à jour avec succès', data: consommation });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Consommation introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la consommation', error: error.message });
    }
  }
};

export const deleteMatierePremiereConsommation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await matierePremiereConsommationService.deleteMatierePremiereConsommation(parseInt(id));

    res.status(200).json({ success: true, message: 'Consommation supprimée avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Consommation introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la consommation', error: error.message });
    }
  }
};

export const getConsommationsByProduction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productionId } = req.params;
    const consommations = await matierePremiereConsommationService.getConsommationsByProduction(parseInt(productionId));

    res.status(200).json({ success: true, data: consommations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des consommations', error: error.message });
  }
};

export const getConsommationsByMatierePremiere = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matierePremiereId } = req.params;
    const consommations = await matierePremiereConsommationService.getConsommationsByMatierePremiere(parseInt(matierePremiereId));

    res.status(200).json({ success: true, data: consommations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des consommations', error: error.message });
  }
};

export const getMatierePremiereConsommationStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await matierePremiereConsommationService.getMatierePremiereConsommationStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};