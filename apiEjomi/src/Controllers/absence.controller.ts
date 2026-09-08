import { Request, Response } from 'express';
import absenceService from '../Services/absence.service';
import { log } from 'node:console';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getAllAbsences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await absenceService.getAllAbsences(req.query, req.user?.entrepriseId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
console.log(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des absences', error: error.message });
  }
};

export const getAbsenceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const absence = await absenceService.getAbsenceById(parseInt(id));

    if (!absence) {
      res.status(404).json({ success: false, message: 'Absence introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: absence });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'absence", error: error.message });
  }
  
};

export const createAbsence = async (req: Request, res: Response): Promise<void> => {
  console.log("createAbsence called with body:", req.body);
  
  try {

    const { employeId, date, motif } = req.body;

    if (!employeId || !date) {
      res.status(400).json({ success: false, message: 'Les champs employeId et date sont obligatoires' });
      return;
    }

    const absenceData = {
      employeId: parseInt(employeId),
      date: new Date(date),
      motif: motif || '',
    };

    const absence = await absenceService.createAbsence(absenceData);

    res.status(201).json({ success: true, message: 'Absence créée avec succès', data: absence });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'absence:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création de l'absence", error: error.message });
  }
};

export const updateAbsence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeId, date, motif } = req.body;

    const absenceData: any = {};
    if (employeId) absenceData.employeId = parseInt(employeId);
    if (date) absenceData.date = new Date(date);
    if (motif) absenceData.motif = motif;

    const absence = await absenceService.updateAbsence(parseInt(id), absenceData);

    res.status(200).json({ success: true, message: 'Absence mise à jour avec succès', data: absence });
  } catch (error: any) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ success: false, message: 'Absence introuvable' });
    } else {
      res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de l'absence", error: error.message });
    }
  }
};

export const deleteAbsence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await absenceService.deleteAbsence(parseInt(id));

    res.status(200).json({ success: true, message: 'Absence supprimée avec succès' });
  } catch (error: any) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ success: false, message: 'Absence introuvable' });
    } else {
      res.status(500).json({ success: false, message: "Erreur lors de la suppression de l'absence", error: error.message });
    }
  }
};

export const getAbsencesByEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeId } = req.params;
    const absences = await absenceService.getAbsencesByEmploye(parseInt(employeId));

    res.status(200).json({ success: true, data: absences });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des absences', error: error.message });
  }
};

export const getAbsencesByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Les paramètres startDate et endDate sont obligatoires' });
      return;
    }

    const absences = await absenceService.getAbsencesByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({ success: true, data: absences });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des absences', error: error.message });
  }
};

export const getAbsenceStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await absenceService.getAbsenceStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};