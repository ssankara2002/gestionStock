import { Router } from 'express';
import {
  getAllEntreprisesController,
  getEntrepriseController,
  createEntrepriseController,
  updateEntrepriseController,
  deleteEntrepriseController,
} from '../Controllers/entreprise.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getAllEntreprisesController);
router.get('/:id', getEntrepriseController);
router.post('/', authenticateToken, createEntrepriseController);
router.put('/:id', authenticateToken, updateEntrepriseController);
router.delete('/:id', authenticateToken, deleteEntrepriseController);

export default router;
