import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  exportPlatsPdf,
  exportPlatsWord,
  exportProduitsPdf,
  exportProduitsWord,
} from '../Services/export.service.js';

export const exportPlats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const format = (req.query.format as string || 'pdf').toLowerCase();
    const entrepriseId = req.user?.entrepriseId;

    if (format === 'word' || format === 'docx') {
      const buffer = await exportPlatsWord(entrepriseId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=plats-${Date.now()}.docx`);
      res.send(buffer);
    } else {
      const buffer = await exportPlatsPdf(entrepriseId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=plats-${Date.now()}.pdf`);
      res.send(buffer);
    }
  } catch (error: any) {
    console.error('Erreur export plats:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur lors de l\'export.' });
  }
};

export const exportProduits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const format = (req.query.format as string || 'pdf').toLowerCase();
    const entrepriseId = req.user?.entrepriseId;

    if (format === 'word' || format === 'docx') {
      const buffer = await exportProduitsWord(entrepriseId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=produits-${Date.now()}.docx`);
      res.send(buffer);
    } else {
      const buffer = await exportProduitsPdf(entrepriseId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=produits-${Date.now()}.pdf`);
      res.send(buffer);
    }
  } catch (error: any) {
    console.error('Erreur export produits:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur lors de l\'export.' });
  }
};
