import { Request, Response } from 'express';
import entrepriseService from '../Services/entreprise.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getEntrepriseController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ message: 'ID invalide' }); return; }
    const entreprise = await entrepriseService.getById(id);
    if (!entreprise) { res.status(404).json({ message: 'Entreprise non trouvée' }); return; }
    res.status(200).json({ success: true, data: entreprise });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
};

export const updateEntrepriseController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ message: 'ID invalide' }); return; }
    if (req.user?.entrepriseId !== id && req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Accès refusé' }); return;
    }
    const updated = await entrepriseService.update(id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
};
