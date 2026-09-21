import { Request, Response } from 'express';
import platService from '../Services/plat.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getAllPlats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId
      ?? (req.query.entrepriseId ? parseInt(req.query.entrepriseId as string, 10) : undefined);
    const plats = await platService.getAllPlats(entrepriseId);
    res.status(200).json({ success: true, data: plats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const getPlatById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const plat = await platService.getPlatById(id, req.user?.entrepriseId);
    if (!plat) {
      res.status(404).json({ success: false, message: 'Plat non trouvé' });
      return;
    }
    res.status(200).json({ success: true, data: plat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const createPlat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { libelle, description, prixVenteUnitaire } = req.body;
    const prix = Number(prixVenteUnitaire);
    if (!libelle || !Number.isFinite(prix) || prix < 0) {
      res.status(400).json({ success: false, message: 'Libellé et prix de vente valides requis.' });
      return;
    }
    const plat = await platService.createPlat({
      libelle: String(libelle).trim(),
      description: description || null,
      image: req.file?.filename || null,
      prixVenteUnitaire: prix,
      entrepriseId: req.user?.entrepriseId,
    });
    res.status(201).json({ success: true, data: plat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const updatePlat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const data: Record<string, unknown> = {};
    if (req.body.libelle !== undefined) data.libelle = String(req.body.libelle).trim();
    if (req.body.description !== undefined) data.description = req.body.description || null;
    if (req.body.prixVenteUnitaire !== undefined) {
      const prix = Number(req.body.prixVenteUnitaire);
      if (!Number.isFinite(prix) || prix < 0) {
        res.status(400).json({ success: false, message: 'Prix de vente invalide.' });
        return;
      }
      data.prixVenteUnitaire = prix;
    }
    if (req.file) data.image = req.file.filename;
    const plat = await platService.updatePlat(id, req.user?.entrepriseId, data);
    if (!plat) {
      res.status(404).json({ success: false, message: 'Plat non trouvé' });
      return;
    }
    res.status(200).json({ success: true, data: plat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const deletePlat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const plat = await platService.deletePlat(id, req.user?.entrepriseId);
    if (!plat) {
      res.status(404).json({ success: false, message: 'Plat non trouvé' });
      return;
    }
    res.status(200).json({ success: true, message: 'Plat supprimé avec succès' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};
