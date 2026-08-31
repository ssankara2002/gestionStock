import { Router } from 'express';
import {
  getAllFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  searchFournisseurs,
  getFournisseurStatistics
} from '../Controllers/fournisseur.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireFournisseurPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les fournisseurs
router.get('/', requireFournisseurPermissions.read, getAllFournisseurs);
router.get('/statistics', requireFournisseurPermissions.read, getFournisseurStatistics);
router.get('/search', requireFournisseurPermissions.read, searchFournisseurs);
router.get('/:id', requireFournisseurPermissions.read, getFournisseurById);

router.post('/', requireFournisseurPermissions.create, createFournisseur);

router.put('/:id', requireFournisseurPermissions.update, updateFournisseur);

router.delete('/:id', requireFournisseurPermissions.delete, deleteFournisseur);

export default router;