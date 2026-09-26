import { Router } from 'express';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { getRapportLots } from '../Controllers/lot.controller.js';

const router = Router();

router.use(authenticateToken);
router.get('/rapport', requirePermission('lot_stock.read'), getRapportLots);

export default router;
