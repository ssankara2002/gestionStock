import { Router } from 'express';
import {
  createAvoir,
  getAllAvoirs,
  getAvoirById,
  getAvoirsByCommande,
  consommerMonnaie,
  recupererGarde,
  rembourserCredit,
  deleteAvoir,
  generateAvoirPdf,
  getBonAvoir,
} from '../Controllers/avoir.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireAvoirPermissions, requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireAvoirPermissions.read, getAllAvoirs);
router.get('/recu', requireAvoirPermissions.export, generateAvoirPdf);
// Bon d'avoir saisi à la caisse lors de l'encaissement
router.get('/bon/:numero', requirePermission(['avoir.read', 'commande.update']), getBonAvoir);
router.get('/commande/:commandeId', requireAvoirPermissions.read, getAvoirsByCommande);
router.get('/:id', requireAvoirPermissions.read, getAvoirById);

router.post('/', requireAvoirPermissions.create, createAvoir);
router.patch('/:id/rembourser', requireAvoirPermissions.create, rembourserCredit);
router.patch('/:id/consommer', requireAvoirPermissions.create, consommerMonnaie);
router.patch('/:id/recuperer', requireAvoirPermissions.create, recupererGarde);

router.delete('/:id', requireAvoirPermissions.delete, deleteAvoir);

export default router;
