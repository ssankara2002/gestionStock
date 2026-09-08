import { Router } from 'express';
import {
  getAllProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  updateProduitStock,
  getLowStockProduits,
  searchProduits,
  getProduitStatistics,
  getProduitsProchesPeremption,
} from '../Controllers/produit.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireProduitPermissions } from '../middlewares/permissionMiddleware.js';
import upload from '../middlewares/upload.js';

const router = Router();

// Route publique — lecture seule, entrepriseId via query param (?entrepriseId=1)
router.get('/public', getAllProduits);

router.get('/', authenticateToken, getAllProduits);
router.get('/statistics', authenticateToken, requireProduitPermissions.statistics, getProduitStatistics);
router.get('/peremption', authenticateToken, requireProduitPermissions.read, getProduitsProchesPeremption);
router.get('/low-stock', authenticateToken, requireProduitPermissions.read, getLowStockProduits);
router.get('/search', authenticateToken, searchProduits);
router.get('/:id', authenticateToken, getProduitById);

// Utiliser `upload.single('image')` pour parser les requêtes multipart/form-data
// (formulaire avec fichier). Il doit être placé avant le contrôleur.
router.post('/', authenticateToken, requireProduitPermissions.create, upload.single('image'), createProduit);

router.put('/:id', authenticateToken, requireProduitPermissions.update, upload.single('image'), updateProduit);
router.patch('/:id/stock', authenticateToken, requireProduitPermissions.update, updateProduitStock);

router.delete('/:id', authenticateToken, requireProduitPermissions.delete, deleteProduit);

export default router;