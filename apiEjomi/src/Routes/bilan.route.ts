import { Router } from 'express';
import { getBilanPeriode } from '../Controllers/bilan.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('bilan.read'), getBilanPeriode);

export default router;
