import { Request, Response } from 'express';
import entrepriseService from '../Services/entreprise.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getAllEntreprisesController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entreprises = await entrepriseService.getAll();
    res.status(200).json({ success: true, data: entreprises });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

export const getEntrepriseController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'ID invalide' }); return; }
    const entreprise = await entrepriseService.getById(id);
    if (!entreprise) { res.status(404).json({ success: false, message: 'Entreprise non trouvée' }); return; }
    res.status(200).json({ success: true, data: entreprise });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'entreprise :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

export const createEntrepriseController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entreprise = typeof req.body.entreprise === 'string' ? JSON.parse(req.body.entreprise) : req.body.entreprise;
    const admin = typeof req.body.admin === 'string' ? JSON.parse(req.body.admin) : req.body.admin;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (entreprise) {
      entreprise.logo = files?.logo?.[0]?.filename || entreprise.logo || null;
      entreprise.heroImage = files?.heroImage?.[0]?.filename || entreprise.heroImage || null;
    }
    if (!entreprise || !admin) {
      res.status(400).json({ success: false, message: 'Données entreprise et admin requises' });
      return;
    }
    const result = await entrepriseService.create(entreprise, admin);
    res.status(201).json({ success: true, message: 'Entreprise créée avec succès', data: result });
  } catch (error: any) {
    const isMetier = error.message?.includes('email') || error.message?.includes('requis') || error.message?.includes('caractères');
    console.error('Erreur lors de la création de l\'entreprise :', error);
    res.status(isMetier ? 400 : 500).json({ success: false, message: error.message || 'Erreur serveur' });
  }
};

export const updateEntrepriseController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'ID invalide' }); return; }
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const isOwnEntreprise = req.user?.entrepriseId === id;
    if (!isSuperAdmin && !isOwnEntreprise) {
      res.status(403).json({ success: false, message: 'Accès refusé' }); return;
    }
    const data = { ...req.body };
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const arrayFields = ['jourouverture', 'heureouverture', 'jourfermeture', 'heurefermeture'];
    for (const field of arrayFields) {
      if (typeof data[field] === 'string') data[field] = JSON.parse(data[field]);
    }
    if (files?.logo?.[0]) data.logo = files.logo[0].filename;
    if (files?.heroImage?.[0]) data.heroImage = files.heroImage[0].filename;
    const updated = await entrepriseService.update(id, data);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

export const deleteEntrepriseController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'ID invalide' }); return; }
    await entrepriseService.deleteEntreprise(id);
    res.status(200).json({ success: true, message: 'Entreprise supprimée avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Entreprise introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
  }
};
