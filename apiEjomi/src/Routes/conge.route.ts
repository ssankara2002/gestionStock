import { Router } from 'express';
import {
  getAllConges,
  getCongeById,
  createConge,
  updateConge,
  deleteConge,
  getCongesByEmploye,
  getCongesByStatut,
  getCongeStatistics,
  approveConge,
  rejectConge
} from '../Controllers/conge.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireCongePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les congés
router.get('/', requireCongePermissions.read, getAllConges);
router.get('/statistics', requireCongePermissions.read, getCongeStatistics);
router.get('/employe/:employeId', requireCongePermissions.read, getCongesByEmploye);
router.get('/statut/:statut', requireCongePermissions.read, getCongesByStatut);
router.get('/:id', requireCongePermissions.read, getCongeById);

router.post('/', requireCongePermissions.create, createConge);

router.put('/:id', requireCongePermissions.update, updateConge);

router.delete('/:id', requireCongePermissions.delete, deleteConge);

// Routes pour approuver/refuser
router.put('/:id/approuver', requireCongePermissions.approve, approveConge);
router.put('/:id/refuser', requireCongePermissions.reject, rejectConge);

export default router;