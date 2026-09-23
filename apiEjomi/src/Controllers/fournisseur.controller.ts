import { Request, Response } from 'express';
import fournisseurService from '../Services/fournisseur.service';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getAllFournisseurs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const entrepriseId = req.user?.entrepriseId;
    const where: any = entrepriseId ? { entrepriseId } : {};

    const [fournisseurs, total] = await Promise.all([
      prisma.fournisseur.findMany({ where, skip, take, orderBy: { nom: 'asc' } }),
      prisma.fournisseur.count({ where }),
    ]);

    const result = createPaginationResult(fournisseurs, total, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des fournisseurs', error: error.message });
  }
};

export const getFournisseurById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fournisseur = await fournisseurService.getFournisseurById(parseInt(id));

    if (!fournisseur) {
      res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: fournisseur });
  } catch (error: any) {
    console.log(error);
    
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration du fournisseur', error: error.message });
  }
};

export const createFournisseur = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nom, email, prenom, adresse, tel } = req.body;

    if (!nom || !adresse) {
      res.status(400).json({ success: false, message: 'Les champs nom et adresse sont obligatoires' });
      return;
    }

    const fournisseurData = {
      nom, email, prenom, adresse, tel,
      entrepriseId: req.user?.entrepriseId || undefined,
    };

    const fournisseur = await fournisseurService.createFournisseur(fournisseurData);

    res.status(201).json({ success: true, message: 'Fournisseur cr�� avec succ�s', data: fournisseur });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email ou t�l�phone d�j� existant' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la cr�ation du fournisseur', error: error.message });
    }
  }
};

export const updateFournisseur = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nom, email, prenom, adresse, tel } = req.body;

    const fournisseurData: any = {};
    if (nom) fournisseurData.nom = nom;
    if (email) fournisseurData.email = email;
    if (prenom) fournisseurData.prenom = prenom;
    if (adresse) fournisseurData.adresse = adresse;
    if (tel) fournisseurData.tel = tel;

    const fournisseur = await fournisseurService.updateFournisseur(parseInt(id), fournisseurData);

    res.status(200).json({ success: true, message: 'Fournisseur mis � jour avec succ�s', data: fournisseur });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email ou t�l�phone d�j� existant' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise � jour du fournisseur', error: error.message });
    }
  }
};

export const deleteFournisseur = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await fournisseurService.deleteFournisseur(parseInt(id));

    res.status(200).json({ success: true, message: 'Fournisseur supprim� avec succ�s' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression du fournisseur', error: error.message });
    }
  }
};

export const searchFournisseurs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ success: false, message: 'Le param�tre query est obligatoire' });
      return;
    }

    const fournisseurs = await fournisseurService.searchFournisseurs(query as string);

    res.status(200).json({ success: true, data: fournisseurs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche de fournisseurs', error: error.message });
  }
};

export const getFournisseurStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await fournisseurService.getFournisseurStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des statistiques', error: error.message });
  }
};