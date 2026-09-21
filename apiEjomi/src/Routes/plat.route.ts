import { Router } from 'express';
import upload from '../middlewares/upload.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { getAllPlats, getPlatById, createPlat, updatePlat, deletePlat } from '../Controllers/plat.controller.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('plat.read'), getAllPlats);
router.get('/:id', authenticateToken, requirePermission('plat.read'), getPlatById);
router.post('/', authenticateToken, requirePermission('plat.create'), upload.single('image'), createPlat);
router.put('/:id', authenticateToken, requirePermission('plat.update'), upload.single('image'), updatePlat);
router.delete('/:id', authenticateToken, requirePermission('plat.delete'), deletePlat);

export default router;
