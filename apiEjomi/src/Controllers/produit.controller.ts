import { Request, Response } from 'express';
import produitService from '../Services/produit.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getAllProduits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const produits = await produitService.getAllProduits(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: produits });
  } catch (error: any) {
    console.error('ERREUR getAllProduits:', error.message, error.code, error.meta);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getProduitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const produit = await produitService.getProduitById(id);
    if (produit) {
      res.status(200).json({ success: true, data: produit });
    } else {
      res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const createProduit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      res.status(400).json({ success: false, message: "Aucune donnée reçue. Le corps de la requête est vide." });
      return;
    }

    if (!body.libelle || !body.prixDeVenteUnitaire) {
      res.status(400).json({ success: false, message: 'Les champs libellé et prix de vente sont requis.' });
      return;
    }

    const data = {
      libelle: body.libelle,
      description: body.description || null,
      prixAchatUnitaire: parseInt(body.prixAchatUnitaire || '0', 10),
      prixDeVenteUnitaire: parseFloat(body.prixDeVenteUnitaire),
      image: req.file ? req.file.filename : undefined,
      entrepriseId: req.user?.entrepriseId || undefined,
    };

    if (isNaN(data.prixAchatUnitaire) || isNaN(data.prixDeVenteUnitaire)) {
      res.status(400).json({ success: false, message: 'Les valeurs pour les prix doivent être des nombres valides.' });
      return;
    }

    const produit = await produitService.createProduit(data);
    res.status(201).json({ success: true, data: produit });
  } catch (error: any) {
    console.error("Erreur lors de la création du produit:", error);
    const errorMessage = error.response?.data?.message || error.message || 'Erreur interne du serveur.';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

export const updateProduit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    const data: { [key: string]: any } = {};
    
    // On ne met à jour que les champs fournis
    if (body.libelle) data.libelle = body.libelle;
    if (body.description) data.description = body.description;
    if (body.prixAchatUnitaire !== undefined) data.prixAchatUnitaire = parseInt(body.prixAchatUnitaire, 10);
    if (body.prixDeVenteUnitaire !== undefined) data.prixDeVenteUnitaire = parseFloat(body.prixDeVenteUnitaire);

    if (req.file) {
      data.image = req.file.filename;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'Aucune donnée fournie pour la mise à jour.' });
      return;
    }

    // Valider que les conversions numériques n'ont pas produit de NaN
    if (Object.values(data).some(value => Number.isNaN(value))) {
      res.status(400).json({ success: false, message: 'Les valeurs pour la quantité et les prix doivent être des nombres valides.' });
      return;
    }

    const produit = await produitService.updateProduit(id, data);
    res.status(200).json({ success: true, data: produit });
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour du produit ${req.params.id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'Erreur interne du serveur.';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

export const deleteProduit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await produitService.deleteProduit(id);
    res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const updateProduitStock = async (req: Request, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Utilisez les endpoints stock magasin/boutique.' });
};

// Fonction supprimée car categorie n'existe plus

export const getLowStockProduits = async (req: Request, res: Response): Promise<void> => {
  try {
    const seuil = req.query.seuil ? parseInt(req.query.seuil as string, 10) : 10;
    const produits = await produitService.getLowStockProduits(seuil);
    res.status(200).json({ success: true, data: produits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const searchProduits = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ success: false, message: 'Le paramètre de recherche "q" est requis.' });
      return;
    }
    const produits = await produitService.searchProduits(query);
    res.status(200).json({ success: true, data: produits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getProduitStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await produitService.getProduitStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};