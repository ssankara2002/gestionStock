import { Response } from 'express';
import matierePremiereService from '../Services/matiere_premiere.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getAllMatieresPremieres = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await matierePremiereService.getAllMatieresPremieres(req.query, req.user?.entrepriseId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des mati�res premi�res', error: error.message });
  }
};

export const getMatierePremiereById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const matiere = await matierePremiereService.getMatierePremiereById(parseInt(id));

    if (!matiere) {
      res.status(404).json({ success: false, message: 'Mati�re premi�re introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: matiere });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration de la mati�re premi�re', error: error.message });
  }
};

export const createMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nom, categorie, description, quantiteStock, prixAchat } = req.body;

    if (!nom || quantiteStock === undefined) {
      res.status(400).json({ success: false, message: 'Les champs nom et quantiteStock sont obligatoires' });
      return;
    }

    const matiereData = {
      nom,
      categorie,
      description,
      quantiteStock: parseInt(quantiteStock),
      prixAchat: parseFloat(prixAchat || '0'),
    };

    const matiere = await matierePremiereService.createMatierePremiere(matiereData);

    res.status(201).json({ success: true, message: 'Mati�re premi�re cr��e avec succ�s', data: matiere });
  } catch (error: any) {
    console.log(error);
    
    res.status(500).json({ success: false, message: 'Erreur lors de la cr�ation de la mati�re premi�re', error: error.message });
  }
};

export const updateMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nom, categorie, description, quantiteStock, prixAchat } = req.body;

    const matiereData: any = {};
    if (nom) matiereData.nom = nom;
    if (categorie) matiereData.categorie = categorie;
    if (description) matiereData.description = description;
    if (quantiteStock !== undefined) matiereData.quantiteStock = parseInt(quantiteStock);
    if (prixAchat !== undefined) matiereData.prixAchat = parseFloat(prixAchat);

    const matiere = await matierePremiereService.updateMatierePremiere(parseInt(id), matiereData);

    res.status(200).json({ success: true, message: 'Mati�re premi�re mise � jour avec succ�s', data: matiere });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Mati�re premi�re introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise � jour de la mati�re premi�re', error: error.message });
    }
  }
};

export const deleteMatierePremiere = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await matierePremiereService.deleteMatierePremiere(parseInt(id));

    res.status(200).json({ success: true, message: 'Mati�re premi�re supprim�e avec succ�s' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Mati�re premi�re introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la mati�re premi�re', error: error.message });
    }
  }
};

export const updateMatierePremiereStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantite, operation } = req.body;

    if (quantite === undefined || !operation || !['add', 'subtract'].includes(operation)) {
      res.status(400).json({ success: false, message: 'Les champs quantite et operation (add/subtract) sont obligatoires' });
      return;
    }

    const matiere = await matierePremiereService.updateMatierePremiereStock(parseInt(id), parseInt(quantite), operation);

    res.status(200).json({ success: true, message: 'Stock mis � jour avec succ�s', data: matiere });
  } catch (error: any) {
    if (error.message === 'Mati�re premi�re non trouv�e') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message === 'Stock insuffisant') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise � jour du stock', error: error.message });
    }
  }
};

export const getMatieresPremieresLowStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { seuil } = req.query;
    const seuilValue = seuil ? parseInt(seuil as string) : 10;

    const matieres = await matierePremiereService.getMatieresPremieresLowStock(seuilValue);

    res.status(200).json({ success: true, data: matieres });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des mati�res premi�res en stock faible', error: error.message });
  }
};

export const searchMatieresPremieres = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ success: false, message: 'Le param�tre query est obligatoire' });
      return;
    }

    const matieres = await matierePremiereService.searchMatieresPremieres(query as string);

    res.status(200).json({ success: true, data: matieres });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche de mati�res premi�res', error: error.message });
  }
};

export const getMatierePremiereStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await matierePremiereService.getMatierePremiereStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des statistiques', error: error.message });
  }
};