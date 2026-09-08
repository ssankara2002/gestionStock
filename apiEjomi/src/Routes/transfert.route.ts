import { Router } from 'express';
import { createTransfert, createTransfertBulk, getAllTransferts, getTransfertById } from '../Controllers/transfert.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('transfert.read'), getAllTransferts);
router.get('/:id', requirePermission('transfert.read'), getTransfertById);
router.post('/', requirePermission('transfert.create'), createTransfert);
router.post('/bulk', requirePermission('transfert.create'), createTransfertBulk);

export default router;
