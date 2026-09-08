import { Router } from 'express';
import { getBilanPeriode } from '../Controllers/bilan.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getBilanPeriode);

export default router;
