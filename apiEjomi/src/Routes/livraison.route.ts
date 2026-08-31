import { Router } from 'express';
import {
  getAllLivraisons,
  getLivraisonById,
  createLivraison,
  updateLivraison,
  deleteLivraison,
  getLivraisonsByCommande,
  getLivraisonsByLivreur,
  getLivraisonsByStatut,
  getLivraisonStatistics,
  assignLivreur,
  updateStatut,
} from '../Controllers/livraison.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les livraisons
router.get('/', requirePermission('livraison.read'), getAllLivraisons);
router.get('/statistics', requirePermission('livraison.read'), getLivraisonStatistics);
router.get('/statut/:statut', requirePermission('livraison.read'), getLivraisonsByStatut);
router.get('/commande/:commandeId', requirePermission('livraison.read'), getLivraisonsByCommande);
router.get('/livreur/:livreurId', requirePermission('livraison.read'), getLivraisonsByLivreur);
router.get('/:id', requirePermission('livraison.read'), getLivraisonById);

router.post('/', requirePermission('livraison.create'), createLivraison);

router.put('/:id', requirePermission('livraison.update'), updateLivraison);
router.patch('/:id/assign', requirePermission('livraison.assign'), assignLivreur);
router.patch('/:id/statut', requirePermission('livraison.update'), updateStatut);

router.delete('/:id', requirePermission('livraison.delete'), deleteLivraison);

export default router;
