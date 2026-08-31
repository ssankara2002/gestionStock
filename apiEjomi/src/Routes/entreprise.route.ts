import { Router } from 'express';
import { getEntrepriseController, updateEntrepriseController } from '../Controllers/entreprise.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:id', getEntrepriseController);
router.put('/:id', authenticateToken, updateEntrepriseController);

export default router;
