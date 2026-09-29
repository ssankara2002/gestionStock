import { Router } from 'express';
import { getIngredientsPourInventaire, ajusterStockIngredients } from '../Controllers/inventaire_matiere_premiere.controller';
import authenticateToken from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/permissionMiddleware';

const router = Router();

router.get('/', authenticateToken, checkPermission('inventaire_ingredient.read'), getIngredientsPourInventaire);
router.post('/ajuster', authenticateToken, checkPermission('inventaire_ingredient.update'), ajusterStockIngredients);

export default router;
