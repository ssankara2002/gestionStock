import { Request, Response } from 'express';
import contactService from '../Services/contact.service.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

/**
 * Créer un nouveau message de contact (accessible sans authentification)
 */
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, email, sujet, message } = req.body;

    if (!nom || !email || !sujet || !message) {
      res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis (nom, email, sujet, message)',
      });
      return;
    }

    const contact = await contactService.createContact({ nom, email, sujet, message });

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur interne du serveur.',
    });
  }
};

/**
 * Récupérer tous les messages de contact (admin uniquement)
 */
export const getAllContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const entrepriseId = req.user?.entrepriseId;

    const result = await contactService.getAllContacts(page, limit, entrepriseId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
    });
  }
};

/**
 * Récupérer un message de contact par ID
 */
export const getContactById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const contact = await contactService.getContactById(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Message de contact non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
    });
  }
};

/**
 * Mettre à jour un message de contact (marquer comme lu, traité, etc.)
 */
export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { statut, reponse } = req.body;

    const contact = await contactService.updateContact(id, { statut, reponse });

    res.status(200).json({
      success: true,
      message: 'Message mis à jour avec succès',
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur interne du serveur.',
    });
  }
};

/**
 * Supprimer un message de contact
 */
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await contactService.deleteContact(id);

    res.status(200).json({
      success: true,
      message: 'Message supprimé avec succès',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
    });
  }
};

/**
 * Récupérer les statistiques des contacts
 */
export const getContactStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await contactService.getContactStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
    });
  }
};

/**
 * Récupérer les contacts par statut
 */
export const getContactsByStatut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statut } = req.params;

    if (!['NON_LU', 'LU', 'TRAITE', 'ARCHIVE'].includes(statut)) {
      res.status(400).json({
        success: false,
        message: 'Statut invalide',
      });
      return;
    }

    const contacts = await contactService.getContactsByStatut(statut as any);

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
    });
  }
};
