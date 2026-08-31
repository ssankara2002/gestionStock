import { Router } from 'express';
import {
  getAllAbsences,
  getAbsenceById,
  createAbsence,
  updateAbsence,
  deleteAbsence,
  getAbsencesByEmploye,
  getAbsencesByDateRange,
  getAbsenceStatistics
} from '../Controllers/absence.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireAbsencePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les absences
router.get('/', requireAbsencePermissions.read, getAllAbsences);
router.get('/statistics', requireAbsencePermissions.statistics, getAbsenceStatistics);
router.get('/employe/:employeId', requireAbsencePermissions.read, getAbsencesByEmploye);
router.get('/date-range', requireAbsencePermissions.read, getAbsencesByDateRange);
router.get('/:id', requireAbsencePermissions.read, getAbsenceById);

router.post('/', requireAbsencePermissions.create, createAbsence);

router.put('/:id', requireAbsencePermissions.update, updateAbsence);

router.delete('/:id', requireAbsencePermissions.delete, deleteAbsence);

export default router;