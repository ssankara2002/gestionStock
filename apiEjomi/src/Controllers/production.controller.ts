import { Request, Response } from 'express';
import productionService from '../Services/production.service';

export const getAllProductions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productions = await productionService.getAllProductions();
    res.status(200).json({ success: true, data: productions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des productions', error: error.message });
  }
};

export const getProductionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const production = await productionService.getProductionById(parseInt(id));

    if (!production) {
      res.status(404).json({ success: false, message: 'Production introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: production });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la production', error: error.message });
  }
};

export const createProduction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produitId, quantiteFabriquee, dateProduction, employeId, lot, consommations } = req.body;

    if (!produitId || !quantiteFabriquee || !employeId) {
      res.status(400).json({ success: false, message: 'Les champs produitId, quantiteFabriquee et employeId sont obligatoires' });
      return;
    }

    const productionData = {
      produitId: parseInt(produitId),
      quantiteFabriquee: parseInt(quantiteFabriquee),
      dateProduction: dateProduction ? new Date(dateProduction) : new Date(),
      employeId: parseInt(employeId),
      lot,
      consommations: consommations ? consommations.map((c: any) => ({
        matierePremiereId: parseInt(c.matierePremiereId),
        quantite: parseInt(c.quantite),
      })) : undefined,
    };

    const production = await productionService.createProduction(productionData);

    res.status(201).json({ success: true, message: 'Production créée avec succès', data: production });
  } catch (error: any) {
    if (error.message.includes('Stock insuffisant') || error.message.includes('introuvable')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la production', error: error.message });
    }
  }
};

export const updateProduction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { produitId, quantiteFabriquee, dateProduction, employeId, lot } = req.body;

    const productionData: any = {};
    if (produitId) productionData.produitId = parseInt(produitId);
    if (quantiteFabriquee) productionData.quantiteFabriquee = parseInt(quantiteFabriquee);
    if (dateProduction) productionData.dateProduction = new Date(dateProduction);
    if (employeId) productionData.employeId = parseInt(employeId);
    if (lot) productionData.lot = lot;

    const production = await productionService.updateProduction(parseInt(id), productionData);

    res.status(200).json({ success: true, message: 'Production mise à jour avec succès', data: production });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Production introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la production', error: error.message });
    }
  }
};

export const deleteProduction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await productionService.deleteProduction(parseInt(id));

    res.status(200).json({ success: true, message: 'Production supprimée avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Production introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la production', error: error.message });
    }
  }
};

export const getProductionsByProduit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produitId } = req.params;
    const productions = await productionService.getProductionsByProduit(parseInt(produitId));

    res.status(200).json({ success: true, data: productions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des productions', error: error.message });
  }
};

export const getProductionsByEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeId } = req.params;
    const productions = await productionService.getProductionsByEmploye(parseInt(employeId));

    res.status(200).json({ success: true, data: productions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des productions', error: error.message });
  }
};

export const getProductionStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await productionService.getProductionStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};