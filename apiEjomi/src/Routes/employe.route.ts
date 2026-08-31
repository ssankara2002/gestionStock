import { Router } from 'express';
import {
  getAllEmployes,
  getEmployeById,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getEmployeByUserId,
  getEmployeStatistics,
  createEmployeWithUser,
  updateEmployeWithUser,
  getEmployesPublic,
} from '../Controllers/employe.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireEmployePermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Route publique (sans auth) — données minimales pour la page "À propos"
router.get('/public', getEmployesPublic);

// Toutes les routes suivantes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les employés
router.get('/',  requireEmployePermissions.read, getAllEmployes);
// router.get('/statistics', getEmployeStatistics);
// router.get('/user/:userId',  getEmployeByUserId);
// router.get('/:id',  getEmployeById);

// router.post('/',createEmploye);

// router.post('/with-user',createEmployeWithUser);

// router.put('/:id',updateEmploye);

// router.delete('/:id',deleteEmploye);

router.get('/statistics', requireEmployePermissions.statistics, getEmployeStatistics);
router.get('/user/:userId', requireEmployePermissions.read, getEmployeByUserId);
router.get('/:id', requireEmployePermissions.read, getEmployeById);

router.post('/', requireEmployePermissions.create, createEmploye);

router.post('/with-user', requireEmployePermissions.create, createEmployeWithUser);

router.put('/:id/with-user', requireEmployePermissions.update, updateEmployeWithUser);

router.put('/:id', requireEmployePermissions.update, updateEmploye);

router.delete('/:id', requireEmployePermissions.delete, deleteEmploye);

export default router;