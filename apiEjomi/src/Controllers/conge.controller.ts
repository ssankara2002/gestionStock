import { Request, Response } from 'express';
import congeService from '../Services/conge.service';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getAllConges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conges = await congeService.getAllConges(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: conges });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des congés:", error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

export const getCongeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const conge = await congeService.getCongeById(parseInt(id));

    if (!conge) {
      res.status(404).json({ success: false, message: 'Congé introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: conge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du congé', error: error.message });
  }
};

export const createConge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeId: employeIdFromBody, type, dateDebut, dateFin, statut, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
      return;
    }

    if (!type || !dateDebut || !dateFin || !description) {
      res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires' });
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      res.status(400).json({ success: false, message: 'La date de début ne peut pas être postérieure à la date de fin.' });
      return;
    }

    let resolvedEmployeId: number;

    if (employeIdFromBody) {
      // Gérant créant un congé pour un employé donné
      resolvedEmployeId = parseInt(employeIdFromBody);
    } else {
      // Employé créant son propre congé
      const prisma = new PrismaClient();
      const employe = await prisma.employe.findUnique({ where: { userId } });
      if (!employe) {
        res.status(404).json({ success: false, message: 'Profil employé non trouvé pour cet utilisateur' });
        return;
      }
      resolvedEmployeId = employe.id;
    }

    const congeData = {
      employeId: resolvedEmployeId,
      type,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      description,
      statut: statut || 'EN_ATTENTE',
    };

    const conge = await congeService.createConge(congeData);

    res.status(201).json({ success: true, message: 'Congé créé avec succès', data: conge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création du congé', error: error.message });
  }
};

export const updateConge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeId, type, dateDebut, dateFin, statut, description } = req.body;

    const congeData: any = {};
    if (employeId) congeData.employeId = parseInt(employeId);
    if (type) congeData.type = type;
    if (dateDebut) congeData.dateDebut = new Date(dateDebut);
    if (dateFin) congeData.dateFin = new Date(dateFin);
    if (statut) congeData.statut = statut;
    if (description) congeData.description = description;

    const conge = await congeService.updateConge(parseInt(id), congeData);

    res.status(200).json({ success: true, message: 'Congé mis à jour avec succès', data: conge });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Congé introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du congé', error: error.message });
    }
  }
};

export const deleteConge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await congeService.deleteConge(parseInt(id));

    res.status(200).json({ success: true, message: 'Congé supprimé avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Congé introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression du congé', error: error.message });
    }
  }
};

export const getCongesByEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeId } = req.params;
    const conges = await congeService.getCongesByEmploye(parseInt(employeId));

    res.status(200).json({ success: true, data: conges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

export const getCongesByStatut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statut } = req.params;
    const conges = await congeService.getCongesByStatut(statut);

    res.status(200).json({ success: true, data: conges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

export const approveConge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const conge = await congeService.approveConge(parseInt(id));
    res.status(200).json({ success: true, message: 'Congé approuvé avec succès', data: conge });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Congé introuvable' });
    } else {
      res.status(500).json({ success: false, message: "Erreur lors de l'approbation du congé", error: error.message });
    }
  }
};

export const rejectConge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const conge = await congeService.rejectConge(parseInt(id));
    res.status(200).json({ success: true, message: 'Congé refusé avec succès', data: conge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur lors du refus du congé", error: error.message });
  }
};

export const getCongesByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Les paramètres startDate et endDate sont obligatoires' });
      return;
    }

    const conges = await congeService.getCongesByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({ success: true, data: conges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

export const getCongeStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await congeService.getCongeStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};