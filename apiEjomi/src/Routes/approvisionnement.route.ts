import { Router } from 'express';
import {
  getAllApprovisionnements,
  getApprovisionnementById,
  createApprovisionnement,
  updateApprovisionnement,
  deleteApprovisionnement,
  getApprovisionnementsByFournisseur,
  getApprovisionnementsByEmploye,
  getApprovisionnementsByDateRange,
  getApprovisionnementStatistics
} from '../Controllers/approvisionnement.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireApprovisionnementPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les approvisionnements
router.get('/', requireApprovisionnementPermissions.read, getAllApprovisionnements);
router.get('/statistics', requireApprovisionnementPermissions.read, getApprovisionnementStatistics);
router.get('/fournisseur/:fournisseurId', requireApprovisionnementPermissions.read, getApprovisionnementsByFournisseur);
router.get('/employe/:employeId', requireApprovisionnementPermissions.read, getApprovisionnementsByEmploye);
router.get('/date-range', requireApprovisionnementPermissions.read, getApprovisionnementsByDateRange);
router.get('/:id', requireApprovisionnementPermissions.read, getApprovisionnementById);

router.post('/', requireApprovisionnementPermissions.create, createApprovisionnement);

router.put('/:id', requireApprovisionnementPermissions.update, updateApprovisionnement);

router.delete('/:id', requireApprovisionnementPermissions.delete, deleteApprovisionnement);

export default router;