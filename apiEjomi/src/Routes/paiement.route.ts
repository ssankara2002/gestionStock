import { Router } from 'express';
import paiementController from '../Controllers/paiement.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePaiementPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

router.get('/', requirePaiementPermissions.read, paiementController.getAllPaiements);
router.get('/statistics', requirePaiementPermissions.statistics, paiementController.getPaiementStatistics);
router.get('/:id', requirePaiementPermissions.read, paiementController.getPaiementById);
router.post('/', requirePaiementPermissions.create, paiementController.createPaiement);
router.put('/:id', requirePaiementPermissions.update, paiementController.updatePaiement);
router.delete('/:id', requirePaiementPermissions.delete, paiementController.deletePaiement);

// Paiements par commande & solde
router.get('/commande/:commandeId', requirePaiementPermissions.read, paiementController.getPaiementsByCommande);
router.get('/commande/:commandeId/solde', requirePaiementPermissions.read, paiementController.getSoldeCommande);

// Encours client
router.get('/client/:clientId/outstanding', requirePaiementPermissions.read, paiementController.getOutstandingClient);

// Télécharger le reçu de paiement en PDF
router.get('/:id/download-recu', requirePaiementPermissions.read, paiementController.downloadRecuPaiement);

export default router;
