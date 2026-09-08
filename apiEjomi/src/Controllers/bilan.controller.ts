import { Response } from 'express';
import bilanService from '../Services/bilan.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getBilanPeriode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { debut, fin } = req.query;

    if (!debut || !fin) {
      res.status(400).json({ success: false, message: 'Les paramètres debut et fin sont requis.' });
      return;
    }

    const dateDebut = new Date(debut as string);
    const dateFin = new Date(fin as string);
    dateFin.setHours(23, 59, 59, 999);

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      res.status(400).json({ success: false, message: 'Dates invalides.' });
      return;
    }

    if (dateDebut > dateFin) {
      res.status(400).json({ success: false, message: 'La date de début doit être antérieure à la date de fin.' });
      return;
    }

    const bilan = await bilanService.getBilanPeriode(dateDebut, dateFin, req.user?.entrepriseId);
    res.status(200).json({ success: true, data: bilan });
  } catch (error: any) {
    console.error('Erreur getBilanPeriode:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};
