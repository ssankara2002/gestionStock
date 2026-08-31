import { Router } from 'express';
import {
  ajusterStock,
  getHistoriqueInventaire,
  getStatistiquesInventaire,
  getProduitsInventaire,
  getSessions,
  getSessionById,
} from '../Controllers/inventaire.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/produits', requirePermission('produit.read'), getProduitsInventaire);
router.get('/historique', requirePermission('inventaire.read'), getHistoriqueInventaire);
router.get('/statistiques', requirePermission('inventaire.read'), getStatistiquesInventaire);
router.get('/sessions', requirePermission('inventaire.read'), getSessions);
router.get('/sessions/:id', requirePermission('inventaire.read'), getSessionById);
router.post('/ajuster', requirePermission('inventaire.create'), ajusterStock);

export default router;
