import { Request, Response } from 'express';
import transactionService from '../Services/transaction.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getAllTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transactions = await transactionService.getAllTransactions(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des transactions', error: error.message });
  }
};

export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(parseInt(id));

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration de la transaction', error: error.message });
  }
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, libelle, montant, date, commandeId, approvisionnementId, salairePaiementId } = req.body;

    if (!type || !libelle || !montant || !date) {
      res.status(400).json({ success: false, message: 'Les champs type, libelle, montant et date sont obligatoires' });
      return;
    }

    const transactionData = {
      type,
      libelle,
      montant: parseFloat(montant),
      date: new Date(date),
      commandeId: commandeId ? parseInt(commandeId) : undefined,
      approvisionnementId: approvisionnementId ? parseInt(approvisionnementId) : undefined,
      salairePaiementId: salairePaiementId ? parseInt(salairePaiementId) : undefined,
    };

    const transaction = await transactionService.createTransaction(transactionData);

    res.status(201).json({ success: true, message: 'Transaction cr��e avec succ�s', data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la cr�ation de la transaction', error: error.message });
  }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, libelle, montant, date, commandeId, approvisionnementId, salairePaiementId } = req.body;

    const transactionData: any = {};
    if (type) transactionData.type = type;
    if (libelle) transactionData.libelle = libelle;
    if (montant) transactionData.montant = parseFloat(montant);
    if (date) transactionData.date = new Date(date);
    if (commandeId) transactionData.commandeId = parseInt(commandeId);
    if (approvisionnementId) transactionData.approvisionnementId = parseInt(approvisionnementId);
    if (salairePaiementId) transactionData.salairePaiementId = parseInt(salairePaiementId);

    const transaction = await transactionService.updateTransaction(parseInt(id), transactionData);

    res.status(200).json({ success: true, message: 'Transaction mise � jour avec succ�s', data: transaction });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Transaction introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise � jour de la transaction', error: error.message });
    }
  }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await transactionService.deleteTransaction(parseInt(id));

    res.status(200).json({ success: true, message: 'Transaction supprim�e avec succ�s' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Transaction introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la transaction', error: error.message });
    }
  }
};

export const getTransactionsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const transactions = await transactionService.getTransactionsByType(type);

    res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des transactions', error: error.message });
  }
};

export const getTransactionsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Les param�tres startDate et endDate sont obligatoires' });
      return;
    }

    const transactions = await transactionService.getTransactionsByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des transactions', error: error.message });
  }
};

export const getTransactionStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await transactionService.getTransactionStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la r�cup�ration des statistiques', error: error.message });
  }
};