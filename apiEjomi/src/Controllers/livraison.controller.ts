import { Request, Response } from 'express';
import livraisonService from '../Services/livraison.service.js';

export const getAllLivraisons = async (req: Request, res: Response): Promise<void> => {
  try {
    const livraisons = await livraisonService.getAllLivraisons();
    res.status(200).json({ success: true, data: livraisons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getLivraisonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const livraison = await livraisonService.getLivraisonById(id);

    if (!livraison) {
      res.status(404).json({ success: false, message: 'Livraison non trouvée' });
      return;
    }

    res.status(200).json({ success: true, data: livraison });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const createLivraison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateLivraison, statut, adresse, commandeId, livreurId } = req.body;

    if (!adresse || !commandeId) {
      res.status(400).json({
        success: false,
        message: 'L\'adresse et l\'ID de la commande sont requis',
      });
      return;
    }

    const livraison = await livraisonService.createLivraison({
      dateLivraison,
      statut,
      adresse,
      commandeId,
      livreurId,
    });

    res.status(201).json({ success: true, data: livraison });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const updateLivraison = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { dateLivraison, statut, adresse, commandeId, livreurId } = req.body;

    const livraison = await livraisonService.updateLivraison(id, {
      dateLivraison,
      statut,
      adresse,
      commandeId,
      livreurId,
    });

    res.status(200).json({ success: true, data: livraison });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const deleteLivraison = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await livraisonService.deleteLivraison(id);
    res.status(200).json({ success: true, message: 'Livraison supprimée avec succès' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getLivraisonsByCommande = async (req: Request, res: Response): Promise<void> => {
  try {
    const commandeId = parseInt(req.params.commandeId, 10);
    const livraisons = await livraisonService.getLivraisonsByCommande(commandeId);
    res.status(200).json({ success: true, data: livraisons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getLivraisonsByLivreur = async (req: Request, res: Response): Promise<void> => {
  try {
    const livreurId = parseInt(req.params.livreurId, 10);
    const livraisons = await livraisonService.getLivraisonsByLivreur(livreurId);
    res.status(200).json({ success: true, data: livraisons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getLivraisonsByStatut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statut } = req.params;

    if (!['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ECHEC'].includes(statut)) {
      res.status(400).json({ success: false, message: 'Statut invalide' });
      return;
    }

    const livraisons = await livraisonService.getLivraisonsByStatut(statut);
    res.status(200).json({ success: true, data: livraisons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getLivraisonStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await livraisonService.getLivraisonStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const assignLivreur = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { livreurId } = req.body;

    if (!livreurId) {
      res.status(400).json({ success: false, message: 'L\'ID du livreur est requis' });
      return;
    }

    const livraison = await livraisonService.updateLivraison(id, {
      livreurId,
      statut: 'EN_COURS',
    });

    res.status(200).json({
      success: true,
      message: 'Livreur assigné avec succès',
      data: livraison,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};

export const updateStatut = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { statut } = req.body;

    if (!statut || !['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ECHEC'].includes(statut)) {
      res.status(400).json({ success: false, message: 'Statut invalide' });
      return;
    }

    const livraison = await livraisonService.updateLivraison(id, { statut });

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: livraison,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.' });
  }
};
