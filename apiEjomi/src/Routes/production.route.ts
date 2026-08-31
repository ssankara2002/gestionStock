import { Router } from 'express';
import {
  getAllProductions,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  getProductionsByProduit,
  getProductionsByEmploye,
  getProductionStatistics
} from '../Controllers/production.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireProductionPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les productions
router.get('/', requireProductionPermissions.read, getAllProductions);
router.get('/statistics', requireProductionPermissions.statistics, getProductionStatistics);
router.get('/produit/:produitId', requireProductionPermissions.read, getProductionsByProduit);
router.get('/employe/:employeId', requireProductionPermissions.read, getProductionsByEmploye);
router.get('/:id', requireProductionPermissions.read, getProductionById);

router.post('/', requireProductionPermissions.create, createProduction);

router.put('/:id', requireProductionPermissions.update, updateProduction);

router.delete('/:id', requireProductionPermissions.delete, deleteProduction);

export default router;