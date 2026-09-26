import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// Liste tous les ingrédients avec leur stock actuel
export const getIngredientsPourInventaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const where = req.user?.entrepriseId ? { entrepriseId: req.user.entrepriseId } : {};
    const matieres = await prisma.matierePremiere.findMany({
      where,
      orderBy: { nom: 'asc' },
      select: { id: true, nom: true, categorie: true, quantiteStock: true, unite: true },
    });
    res.status(200).json({ success: true, data: matieres });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ajuste les quantités de plusieurs ingrédients d'un coup
export const ajusterStockIngredients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lignes } = req.body as { lignes: { id: number; quantitePhysique: number }[] };

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ success: false, message: 'Aucune ligne fournie.' });
      return;
    }

    const resultats = await prisma.$transaction(
      lignes.map((ligne) =>
        prisma.matierePremiere.update({
          where: { id: ligne.id },
          data: { quantiteStock: ligne.quantitePhysique },
          select: { id: true, nom: true, quantiteStock: true, unite: true },
        })
      )
    );

    res.status(200).json({ success: true, message: 'Stock mis à jour avec succès.', data: resultats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
