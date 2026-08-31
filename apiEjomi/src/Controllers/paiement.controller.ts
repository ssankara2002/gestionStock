import { Request, Response } from 'express';
import paiementService from '../Services/paiement.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const getAllPaiements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await paiementService.getAllPaiements();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getAllPaiements', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const getPaiementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await paiementService.getPaiementById(parseInt(id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Paiement introuvable' });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getPaiementById', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const createPaiement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const montant = Number(body.montant ?? body.montantPaye ?? 0);
    const statut = body.statut ?? 'REUSSI'; // By default treat created payments as successful

    const data = await paiementService.createPaiement({
      montant,
      datePaiement: body.datePaiement ? new Date(body.datePaiement) : new Date(),
      modePaiement: body.modePaiement,
      statut,
      commandeId: Number(body.commandeId),
    });
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur createPaiement', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const updatePaiement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await paiementService.updatePaiement(parseInt(id), body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur updatePaiement', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const deletePaiement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await paiementService.deletePaiement(parseInt(id));
    res.status(200).json({ success: true, message: 'Paiement supprimé' });
  } catch (error: any) {
    console.error('Erreur deletePaiement', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const getPaiementsByCommande = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commandeId } = req.params;
    const data = await paiementService.getPaiementsByCommande(parseInt(commandeId));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getPaiementsByCommande', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const getSoldeCommande = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commandeId } = req.params;
    const data = await paiementService.getSoldeByCommande(parseInt(commandeId));
    if (data === null) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getSoldeCommande', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const getOutstandingClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const data = await paiementService.getOutstandingByClient(parseInt(clientId));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getOutstandingClient', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const downloadRecuPaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pdfBuffer = await paiementService.generateRecuPaiementPdf(parseInt(id));

    if (!pdfBuffer) {
      res.status(404).json({ success: false, message: 'Paiement introuvable' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-paiement-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur downloadRecuPaiement', error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }
};

export const getPaiementStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await paiementService.getPaiementStatistics();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erreur getPaiementStatistics', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllPaiements,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement,
  getPaiementsByCommande,
  getSoldeCommande,
  getOutstandingClient,
  downloadRecuPaiement,
  getPaiementStatistics,
};
