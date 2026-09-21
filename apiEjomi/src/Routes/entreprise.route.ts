import { Router } from 'express';
import {
  getAllEntreprisesController,
  getEntrepriseController,
  createEntrepriseController,
  updateEntrepriseController,
  deleteEntrepriseController,
} from '../Controllers/entreprise.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import upload from '../middlewares/upload.js';

const router = Router();

router.get('/', authenticateToken, getAllEntreprisesController);
router.get('/:id', getEntrepriseController);
router.post('/', authenticateToken, requirePermission('entreprise.create'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
]), createEntrepriseController);
router.put('/:id', authenticateToken, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
]), updateEntrepriseController);
router.delete('/:id', authenticateToken, deleteEntrepriseController);

export default router;
