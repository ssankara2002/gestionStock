import { Router } from 'express';
import {
  getAllMatieresPremieres,
  getMatierePremiereById,
  createMatierePremiere,
  updateMatierePremiere,
  deleteMatierePremiere,
  updateMatierePremiereStock,
  getMatieresPremieresLowStock,
  searchMatieresPremieres,
  getMatierePremiereStatistics
} from '../Controllers/matiere_premiere.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireMatierePremierePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les matières premières
router.get('/', requireMatierePremierePermissions.read, getAllMatieresPremieres);
router.get('/statistics', requireMatierePremierePermissions.read, getMatierePremiereStatistics);
router.get('/low-stock', requireMatierePremierePermissions.read, getMatieresPremieresLowStock);
router.get('/search', requireMatierePremierePermissions.read, searchMatieresPremieres);
router.get('/:id', requireMatierePremierePermissions.read, getMatierePremiereById);

router.post('/', requireMatierePremierePermissions.create, createMatierePremiere);

router.put('/:id', requireMatierePremierePermissions.update, updateMatierePremiere);
router.patch('/:id/stock', requireMatierePremierePermissions.update, updateMatierePremiereStock);

router.delete('/:id', requireMatierePremierePermissions.delete, deleteMatierePremiere);

export default router;