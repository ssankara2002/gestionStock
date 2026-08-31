import { Router } from 'express';
import {
  getAllMatierePremiereConsommations,
  getMatierePremiereConsommationById,
  createMatierePremiereConsommation,
  updateMatierePremiereConsommation,
  deleteMatierePremiereConsommation,
  getConsommationsByProduction,
  getConsommationsByMatierePremiere,
  getMatierePremiereConsommationStatistics
} from '../Controllers/matiere_premiere_consommation.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireMatierePremierePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les consommations de matières premières
router.get('/', requireMatierePremierePermissions.read, getAllMatierePremiereConsommations);
router.get('/statistics', requireMatierePremierePermissions.read, getMatierePremiereConsommationStatistics);
router.get('/production/:productionId', requireMatierePremierePermissions.read, getConsommationsByProduction);
router.get('/matiere-premiere/:matierePremiereId', requireMatierePremierePermissions.read, getConsommationsByMatierePremiere);
router.get('/:id', requireMatierePremierePermissions.read, getMatierePremiereConsommationById);

router.post('/', requireMatierePremierePermissions.create, createMatierePremiereConsommation);

router.put('/:id', requireMatierePremierePermissions.update, updateMatierePremiereConsommation);

router.delete('/:id', requireMatierePremierePermissions.delete, deleteMatierePremiereConsommation);

export default router;