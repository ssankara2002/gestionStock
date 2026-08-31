import { Router } from 'express';
import {
  getAllCommandes,
  getCommandeById,
  createCommande,
  updateCommande,
  deleteCommande,
  getCommandesByClient,
  getCommandesByVendeur,
  getCommandeStatistics,
  generateRecuPdf,
  generateFacturePdf,
} from '../Controllers/commande.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireCommandePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les commandes
router.get('/', requireCommandePermissions.read, getAllCommandes);
router.get('/statistics', requireCommandePermissions.statistics, getCommandeStatistics);
router.get('/recu', requireCommandePermissions.read, generateRecuPdf);
router.get('/facture', requireCommandePermissions.read, generateFacturePdf);
router.get('/client/:clientId', requireCommandePermissions.read, getCommandesByClient);
router.get('/vendeur/:vendeurId', requireCommandePermissions.read, getCommandesByVendeur);
router.get('/:id', requireCommandePermissions.read, getCommandeById);

router.post('/', requireCommandePermissions.create, createCommande);

router.put('/:id', requireCommandePermissions.update, updateCommande);

router.delete('/:id', requireCommandePermissions.delete, deleteCommande);

export default router;