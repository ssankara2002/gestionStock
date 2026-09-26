import { Router } from 'express';
import upload from '../middlewares/upload.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { getAllPlats, getPlatById, createPlat, updatePlat, deletePlat } from '../Controllers/plat.controller.js';
import { getRecette, upsertIngredient, deleteIngredient, getCapacite, getCapaciteTousPlats } from '../Controllers/recette.controller.js';
import { getRapportCoutsPlats } from '../Controllers/rapport_plats.controller.js';
import { creerPreparation, getPreparationById, modifierPreparation, supprimerPreparation, getHistorique, getHistoriqueJour } from '../Controllers/preparation.controller.js';

const router = Router();

// Routes statiques EN PREMIER (avant /:id)
router.get('/rapport-couts', authenticateToken, requirePermission('plat.read'), getRapportCoutsPlats);
router.get('/capacite', authenticateToken, requirePermission('plat.read'), getCapaciteTousPlats);
router.get('/preparations/jour', authenticateToken, requirePermission('plat.read'), getHistoriqueJour);
router.get('/preparations/all', authenticateToken, requirePermission('plat.read'), getHistorique);

// CRUD préparations individuelles (statique — avant /:id)
router.get('/preparations/:id', authenticateToken, requirePermission('plat.read'), getPreparationById);
router.put('/preparations/:id', authenticateToken, requirePermission('plat.update'), modifierPreparation);
router.delete('/preparations/:id', authenticateToken, requirePermission('plat.update'), supprimerPreparation);

// CRUD plats
router.get('/', authenticateToken, requirePermission('plat.read'), getAllPlats);
router.post('/', authenticateToken, requirePermission('plat.create'), upload.single('image'), createPlat);

// Routes avec :id
router.get('/:id', authenticateToken, requirePermission('plat.read'), getPlatById);
router.put('/:id', authenticateToken, requirePermission('plat.update'), upload.single('image'), updatePlat);
router.delete('/:id', authenticateToken, requirePermission('plat.delete'), deletePlat);

// Recette
router.get('/:platId/recette', authenticateToken, requirePermission('plat.read'), getRecette);
router.post('/:platId/recette', authenticateToken, requirePermission('plat.update'), upsertIngredient);
router.delete('/:platId/recette/:matierePremiereId', authenticateToken, requirePermission('plat.update'), deleteIngredient);
router.get('/:platId/capacite', authenticateToken, requirePermission('plat.read'), getCapacite);

// Préparations par plat
router.post('/:platId/preparer', authenticateToken, requirePermission('plat.update'), creerPreparation);
router.get('/:platId/preparations', authenticateToken, requirePermission('plat.read'), getHistorique);

export default router;
