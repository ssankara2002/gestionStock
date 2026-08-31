import { Request, Response } from 'express';
import commandeService from '../Services/commande.service';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';

const prisma = new PrismaClient();

export const createCommande = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log("user",req.user?.userId);

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
      return;
    }

    const commandeData = req.body;

    // Récupérer l'employé associé à l'utilisateur connecté
    const employe = await prisma.employe.findUnique({
      where: { userId: userId },
    });

    // Tous les utilisateurs (y compris ADMIN) doivent être employés
    if (!employe) {
      res.status(403).json({ success: false, message: "L'utilisateur connecté n'est pas un employé autorisé." });
      return;
    }

    // Validation simple
    if (!commandeData.clientId || !commandeData.lignes || commandeData.lignes.length === 0) {
      res.status(400).json({ success: false, message: 'Client et au moins une ligne de commande sont requis.' });
      return;
    }

    // Assigner le vendeurId à partir de l'employé authentifié
  const finalCommandeData = { ...commandeData, vendeurId: employe.id };
  // Assurer que montantPaye et modePaiement (si fournis) sont passés au service
  if (commandeData.montantPaye) finalCommandeData.montantPaye = Number(commandeData.montantPaye);
  if (commandeData.modePaiement) finalCommandeData.modePaiement = commandeData.modePaiement;
    const nouvelleCommande = await commandeService.createCommande(finalCommandeData);

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: nouvelleCommande,
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la commande:', error);
    const isMetier = error.message?.includes('Stock') || error.message?.includes('produit') || error.message?.includes('introuvable');
    res.status(isMetier ? 400 : 500).json({
      success: false,
      message: error.message || 'Erreur interne du serveur lors de la création de la commande.',
    });
  }
};

export const getAllCommandes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const entrepriseId = req.user?.entrepriseId;
    const where: any = entrepriseId ? { entrepriseId } : {};

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        skip,
        take,
        where,
        include: {
          vendeur: { include: { user: true } },
          client: true,
          paiements: true,
        },
        orderBy: { dateCommande: 'desc' },
      }),
      prisma.commande.count({ where }),
    ]);

    // Calculer pour chaque commande le total payé et la créance
    const commandesWithPayment = commandes.map((c: any) => {
      const paiements = c.paiements || [];
      const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.montant) || 0), 0);
      const totalAPayer = Number(c.montant || 0);
      const creance = Math.max(0, totalAPayer - totalPaye);
      return { ...c, paymentSummary: { total: totalAPayer, totalPaye, creance }, paiements };
    });

    const result = createPaginationResult(commandesWithPayment, total, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const getCommandeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const commande = await prisma.commande.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendeur: { include: { user: true } },
        client: true,
        lignes: { include: { produit: true } },
        paiements: true,
      },
    });
    if (!commande) {
      res.status(404).json({ success: false, message: 'Commande introuvable' });
      return;
    }
    // Calculer le résumé des paiements
    const paiements = (commande as any).paiements || [];
    const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.montant) || 0), 0);
    const totalAPayer = Number((commande as any).montant || 0);
    const creance = Math.max(0, totalAPayer - totalPaye);

    res.status(200).json({ success: true, data: { ...commande, paymentSummary: { total: totalAPayer, totalPaye, creance }, paiements } });
  } catch (error: any) {
    console.error(`Erreur lors de la récupération de la commande ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const updateCommande = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const commandeData = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
      return;
    }

    // Récupérer l'employé qui effectue la mise à jour
    const employeActuel = await prisma.employe.findUnique({
      where: { userId: userId },
    });

    // Les ADMIN peuvent modifier des commandes même sans être employés
    if (!employeActuel && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: "L'utilisateur effectuant la mise à jour n'est pas un vendeur autorisé." });
      return;
    }

    // Validation simple
    if (!commandeData.clientId || !commandeData.lignes || commandeData.lignes.length === 0) {
      res.status(400).json({ success: false, message: 'Client et au moins une ligne de commande sont requis.' });
      return;
    }
    const commandeMiseAJour = await commandeService.updateCommande(parseInt(id), commandeData);
    res.status(200).json({ success: true, message: 'Commande mise à jour avec succès.', data: commandeMiseAJour });
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour de la commande ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur.', error: error.message });
  }
};

export const deleteCommande = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await commandeService.deleteCommande(parseInt(id));
    res.status(200).json({ success: true, message: 'Commande supprimée avec succès.' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de la commande ${req.params.id}:`, error);
    if (error.code === 'P2025') { // Code d'erreur Prisma pour "enregistrement non trouvé"
      res.status(404).json({ success: false, message: 'Commande introuvable.' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
    }
  }
};

export const getCommandeStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await commandeService.getCommandeStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques des commandes:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const getCommandesByVendeur = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendeurId } = req.params;
    const commandes = await commandeService.getCommandesByVendeur(parseInt(vendeurId));
    // Ajouter résumé des paiements à chaque commande
    const commandesWithPayment = (commandes as any[]).map((c) => {
      const paiements = c.paiements || [];
      const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.montant) || 0), 0);
      const totalAPayer = Number(c.montant || 0);
      const creance = Math.max(0, totalAPayer - totalPaye);
      return { ...c, paymentSummary: { total: totalAPayer, totalPaye, creance }, paiements };
    });

    res.status(200).json({ success: true, data: commandesWithPayment });
  } catch (error: any) {
    console.error(`Erreur lors de la récupération des commandes pour le vendeur ${req.params.vendeurId}:`, error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const getCommandesByClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const commandes = await commandeService.getCommandesByClient(parseInt(clientId));
    const commandesWithPayment = (commandes as any[]).map((c) => {
      const paiements = c.paiements || [];
      const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.montant) || 0), 0);
      const totalAPayer = Number(c.montant || 0);
      const creance = Math.max(0, totalAPayer - totalPaye);
      return { ...c, paymentSummary: { total: totalAPayer, totalPaye, creance }, paiements };
    });

    res.status(200).json({ success: true, data: commandesWithPayment });
  } catch (error: any) {
    console.error(`Erreur lors de la récupération des commandes pour le client ${req.params.clientId}:`, error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const generateFacturePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const commandeId = parseInt(req.query.id as string);
    if (isNaN(commandeId)) {
      res.status(400).json({ success: false, message: "ID de commande invalide." });
      return;
    }
    const pdfBuffer = await commandeService.generateFacturePdf(commandeId);
    if (!pdfBuffer) {
      res.status(404).json({ success: false, message: "Commande introuvable ou impossible à générer." });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${commandeId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur lors de la génération de la facture PDF:', error);
    res.status(500).json({ success: false, message: 'Erreur interne lors de la génération de la facture.', error: error.message });
  }
};

export const generateRecuPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    // L'ID de la commande est passé en tant que paramètre de requête (ex: /recu?id=123)
    const commandeId = parseInt(req.query.id as string);

    if (isNaN(commandeId)) {
      res.status(400).json({ success: false, message: "ID de commande invalide." });
      return;
    }

    const pdfBuffer = await commandeService.generateRecuPdf(commandeId);

    if (!pdfBuffer) {
      res.status(404).json({ success: false, message: "Reçu introuvable ou impossible à générer." });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recu-commande-${commandeId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur lors de la génération du reçu PDF:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur lors de la génération du reçu.', error: error.message });
  }
};