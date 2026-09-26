import { Router } from 'express';
import { getIngredientsPourInventaire, ajusterStockIngredients } from '../Controllers/inventaire_matiere_premiere.controller';
import authenticateToken from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/permissionMiddleware';

const router = Router();

router.get('/', authenticateToken, checkPermission('matiere_premiere.read'), getIngredientsPourInventaire);
router.post('/ajuster', authenticateToken, checkPermission('matiere_premiere.update'), ajusterStockIngredients);

export default router;
